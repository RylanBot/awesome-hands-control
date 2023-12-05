import { Camera } from '@mediapipe/camera_utils';
import { FilesetResolver, GestureRecognizer, GestureRecognizerResult, Landmark } from '@mediapipe/tasks-vision';
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Webcam from 'react-webcam';
import Loading from '../components/Loading';
import { RootState } from '../stores/redux';

const GestureRecognition: React.FC = () => {
    // 模型加载状态
    const [isModelLoaded, setIsModelLoaded] = useState(false);

    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    /* transferControlToOffscreen() 方法只能对每个 canvas 元素调用一次
    一旦控制权转移给了 OffscreenCanvas，原来的 canvas 元素就不再可用了
    Cannot transfer control from a canvas for more than one time */
    const transferredRef = useRef(false);
    const workerRef = useRef<Worker>();

    // ✨ 两个窗口的 redux 不是同一个实例，更新配置后需要重启摄像机
    const appConfigs: AppConfig[] = useSelector((state: RootState) => state.config.apps);

    // 左右手对应姿势
    const [detectedGestures, setDetectedGestures] = useState({ left: "", right: "" });
    const setGesture = (isLeftHand: boolean, text: string) => {
        setDetectedGestures(prev => ({
            ...prev,
            [isLeftHand ? 'left' : 'right']: text,
        }));
    };

    const currentProcessRef = useRef<string>("");
    const lastTriggerRef = useRef({ shortcut: '', timestamp: 0 });
    const lastFingerTipRef = useRef<{ x: number, y: number, timestamp: number } | null>(null);

    // 离屏渲染
    useEffect(() => {
        if (canvasRef.current && !transferredRef.current) {
            const offscreen = canvasRef.current.transferControlToOffscreen();
            workerRef.current = new Worker(new URL('../utils/CanvasWorker.ts', import.meta.url));
            workerRef.current.postMessage({ canvas: offscreen }, [offscreen]);
            transferredRef.current = true;
        }
    }, []);

    // 读取手势识别模型 👋
    useEffect(() => {
        async function fetchData() {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

            const gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "./models/gesture_recognizer.task",
                },
                runningMode: 'IMAGE',
                numHands: 2,
            });

            if (webcamRef.current) {
                const video = webcamRef.current.video!;
                const camera = new Camera(video, {
                    onFrame: async () => {
                        const result = await gestureRecognizer.recognize(video);
                        // console.log(result);        
                        onResult(result)
                    }
                });

                camera.start();
            }
        }
        fetchData();
    }, []);

    // 获取当前活跃窗口对应的进程
    useEffect(() => {
        window.controlApi.transmitProcess((processName: string) => {
            // 删除换行符
            currentProcessRef.current = processName.replace(/\r\n$/, '');;
        });
    }, []);

    // 触发对应快捷键
    useEffect(() => {
        const currentShortcut = findShortcut();
        const now = Date.now();
        if (currentShortcut && (now - lastTriggerRef.current.timestamp > 1000 || lastTriggerRef.current.shortcut !== currentShortcut)) {
            window.controlApi.triggerShortcut(currentShortcut);
            lastTriggerRef.current = { shortcut: currentShortcut, timestamp: now };
        }
    }, [detectedGestures]);

    function onResult(result: GestureRecognizerResult) {
        if (!isModelLoaded) {
            setIsModelLoaded(true);
        }

        // （一）发送数据给 worker
        workerRef.current?.postMessage({ gestureData: result });

        const { landmarks, handedness, gestures } = result;

        setDetectedGestures({ left: "", right: "" });

        gestures.forEach((gesture, index) => {
            // (二) 显示识别的手势
            const isLeftHand = handedness[index] && handedness[index][0].categoryName === "Left";
            const { categoryName } = gesture[0];
            const displayText = categoryName === 'None' ? "" : categoryName;
            setGesture(isLeftHand, displayText);

            // （三）单独处理指定手势
            if (gesture[0].categoryName == 'Pointing_Up') {
                processPointingUp(landmarks[index], isLeftHand)
            }
        });
    }

    function findShortcut() {
        const currentProcess: string = currentProcessRef.current;

        const findShortcutInConfig = (config: AppConfig) => {
            const shortcuts = config.shortcut;
            for (const shortcutName in shortcuts) {
                if (shortcuts.hasOwnProperty(shortcutName)) {
                    const shortcut = shortcuts[shortcutName];
                    if (shortcut[0] === detectedGestures.left && shortcut[1] === detectedGestures.right) {
                        return shortcutName;
                    }
                }
            }
            return null;
        };

        // 优先当前所在进程是否绑定了操作
        const currentConfig: AppConfig | undefined = appConfigs.find(appConfig => appConfig.name === currentProcess);
        if (currentConfig) {
            return findShortcutInConfig(currentConfig);
        }

        // 没有再在寻找全局设置里寻找
        const globalConfig: AppConfig | undefined = appConfigs.find(appConfig => appConfig.name === 'Global');
        if (globalConfig) {
            return findShortcutInConfig(globalConfig);
        }

        return null;
    }

    function processPointingUp(handLandmarks: Landmark[], isLeftHand: boolean) {
        const fingerTip = {
            x: handLandmarks[8].x,
            y: handLandmarks[8].y,
        }

        const now = Date.now();
        const timeThreshold = 1000;

        // 不再使用 PointingUp 则重置，避免鼠标乱跳
        if (lastFingerTipRef.current && (now - lastFingerTipRef.current.timestamp > timeThreshold)) {
            lastFingerTipRef.current = null;
        }

        if (lastFingerTipRef.current) {
            const deltaX = fingerTip.x - lastFingerTipRef.current.x;
            const deltaY = fingerTip.y - lastFingerTipRef.current.y;

            const debounceThreshold = 0.005;
            // 放大倍数，比如 0.02 使其相当于移动 100px
            const scaleFactor = 5000;

            if (Math.abs(deltaX) > debounceThreshold || Math.abs(deltaY) > debounceThreshold) {
                let deltaCoordinates = {
                    // （镜像）向右 x 变小，需要添加负号
                    x: - deltaX * scaleFactor,
                    // 向上 y 变小
                    y: deltaY * scaleFactor,
                };

                window.controlApi.triggerMouse(deltaCoordinates, isLeftHand);
            }
            lastFingerTipRef.current = { x: fingerTip.x, y: fingerTip.y, timestamp: now };
        } else {
            lastFingerTipRef.current = { x: fingerTip.x, y: fingerTip.y, timestamp: now };
        }
    }

    return (
        <>
            {!isModelLoaded && <Loading />}

            <div className="relative flex justify-center items-center h-screen w-screen">
                <Webcam ref={webcamRef}
                    className="absolute"
                    style={{
                        transform: "scaleX(-1)", // 前置摄像头镜像
                        width: '100%',
                        height: '100%',
                        objectFit: "fill" // 解决全屏填充的关键
                    }}
                />
                <canvas ref={canvasRef}
                    width={850}
                    height={600}
                    className="absolute"
                    style={{
                        transform: "scaleX(-1)",
                        width: '100%',
                        height: '100%'
                    }}
                />
            </div>

            {/* 输出的识别手势标签 */}
            <div className='absolute top-0 w-screen px-4 py-2 mt-8'>
                {detectedGestures.left && (
                    <div className="float-left bg-slate-500 text-white px-3 py-2 rounded-lg shadow-lg">
                        {detectedGestures.left}
                    </div>
                )}

                {detectedGestures.right && (
                    <div className="float-right bg-slate-500 text-white px-3 py-2 rounded-lg shadow-lg">
                        {detectedGestures.right}
                    </div>
                )}
            </div>
        </>

    );
};

export default GestureRecognition;