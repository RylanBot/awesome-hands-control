import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Webcam from 'react-webcam';

import { FilesetResolver, GestureRecognizer, GestureRecognizerResult, Landmark } from '@mediapipe/tasks-vision';

import type { AppConfig, Shortcut } from '@common/types/config';

import useVideoFrames from "@/hooks/useVideoFrames";
import { RootState } from '@/stores/redux';

import { Loading } from '@/components';

interface HandGestureData {
    handLandmarks: Landmark[];
    isLeftHand: boolean;
}

const GestureRecognition: React.FC = () => {
    const appConfigs: AppConfig[] = useSelector((state: RootState) => state.config.apps);

    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [gestureRecognizer, setGestureRecognizer] = useState<GestureRecognizer | null>(null);

    const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedCameraDevice, setSelectedCameraDevice] = useState<MediaDeviceInfo | null>(null);
    const [webcamTempCanvas, setWebcamTempCanvas] = useState<HTMLCanvasElement | null>(null);
    const [webcamTempCanvasContext, setWebcamTempCanvasContext] = useState<CanvasRenderingContext2D | null>(null);

    const [detectedGestures, setDetectedGestures] = useState({ left: "", right: "" });
    const setGesture = (isLeftHand: boolean, text: string) => {
        setDetectedGestures(prev => ({
            ...prev,
            [isLeftHand ? 'left' : 'right']: text,
        }));
    };

    const webcamRef = useRef<Webcam | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const currentProcessRef = useRef<string>("");
    const lastTriggerRef = useRef({ shortcut: '', timestamp: 0 });
    const lastFingerTipRef = useRef<{ x: number, y: number, timestamp: number } | null>(null);

    /*  transferControlToOffscreen() 方法只能对每个 canvas 元素调用一次
        一旦控制权转移给了 OffscreenCanvas，原来的 canvas 元素就不再可用了
        Cannot transfer control from a canvas for more than one time */
    const transferredRef = useRef(false);
    const workerRef = useRef<Worker>();

    // 离屏渲染
    useEffect(() => {
        if (canvasRef.current && !transferredRef.current) {
            const offscreen = canvasRef.current.transferControlToOffscreen();
            workerRef.current = new Worker(new URL('../helpers/CanvasWorker.ts', import.meta.url));
            workerRef.current.postMessage({ canvas: offscreen }, [offscreen]);
            transferredRef.current = true;
        }

        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const cameras = devices.filter(device => device.kind === 'videoinput');
                setCameraDevices(cameras);
                setSelectedCameraDevice(cameras[0]);
            }).catch(error => {
                console.error(error);
            });

        (async function fetchData() {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );
            setGestureRecognizer(await GestureRecognizer.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "./models/gesture_recognizer.task",
                },
                runningMode: 'IMAGE',
                numHands: 2,
            }));
        })();

        const tempCanvas = document.createElement("canvas");
        const tempContext = tempCanvas.getContext("2d") as CanvasRenderingContext2D;
        setWebcamTempCanvas(tempCanvas);
        setWebcamTempCanvasContext(tempContext);
    }, []);

    // 获取当前活跃窗口对应的进程
    useEffect(() => {
        window.controlApi.transmitProcess((processName: string) => {
            // 删除换行符
            currentProcessRef.current = processName.replace(/\r\n$/, '');
        });
    }, []);

    const [video, setVideo] = useVideoFrames(async () => {
        if (!video || !video.videoWidth || !video.videoHeight || !webcamTempCanvasContext || !webcamTempCanvas || !gestureRecognizer) return;

        if (webcamTempCanvas.width !== video.videoWidth || webcamTempCanvas.height !== video.videoHeight) {
            webcamTempCanvas.width = video.videoWidth;
            webcamTempCanvas.height = video.videoHeight;
        }
        // hack to get virtual cams processed by gestureRecognizer
        webcamTempCanvasContext.drawImage(video, 0, 0, webcamTempCanvas.width, webcamTempCanvas.height);
        const result = gestureRecognizer.recognize(webcamTempCanvas);
        onResult(result)
    })

    // 触发对应快捷键
    useEffect(() => {
        function findShortcut(): Shortcut | undefined {
            const currentProcess: string = currentProcessRef.current;

            const findShortcutInConfig = (config: AppConfig) => {
                const shortcuts = config.shortcuts;
                return shortcuts.find((shortcut) => shortcut.enabled && shortcut.gestureLeft === detectedGestures.left && shortcut.gestureRight === detectedGestures.right);
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
            return;
        }

        const currentShortcut = findShortcut();
        const now = Date.now();
        if (currentShortcut && (now - lastTriggerRef.current.timestamp > 1000 || lastTriggerRef.current.shortcut !== currentShortcut.keyCombination)) {
            window.controlApi.triggerShortcut(currentShortcut.keyCombination);
            lastTriggerRef.current = { shortcut: currentShortcut.keyCombination, timestamp: now };
        }
    }, [detectedGestures, appConfigs]);

    function onResult(result: GestureRecognizerResult) {
        if (!isModelLoaded) {
            setIsModelLoaded(true);
        }

        // 发送数据给 worker
        workerRef.current?.postMessage({ gestureData: result });

        const { landmarks, handedness, gestures } = result;
        setDetectedGestures({ left: "", right: "" });
        const pointingUpHands: HandGestureData[] = [];

        gestures.forEach((gesture, index) => {
            // 显示识别的手势
            const isLeftHand = handedness[index] && handedness[index][0].categoryName === "Left";
            const { categoryName } = gesture[0];
            const displayText = categoryName === 'None' ? "" : categoryName;
            setGesture(isLeftHand, displayText);

            // 单独处理指定手势
            if (gesture[0].categoryName === 'Pointing_Up') {
                if (appConfigs.find(el => el.shortcuts.find(shortcut => {
                    return shortcut.enabled && (isLeftHand ? shortcut.gestureLeft : shortcut.gestureRight) === 'Pointing_Up';
                })))
                    pointingUpHands.push({ handLandmarks: landmarks[index], isLeftHand });
            }
        });

        // 只有一只手是 PointingUp 时才触发操作，避免两根手指冲突
        if (pointingUpHands.length === 1) {
            const pointingUpHand = pointingUpHands[0];
            processPointingUp(pointingUpHand.handLandmarks, pointingUpHand.isLeftHand);
        }
    }

    function processPointingUp(handLandmarks: Landmark[], isLeftHand: boolean) {
        const fingerTip = {
            x: handLandmarks[8].x,
            y: handLandmarks[8].y,
        }

        const now = Date.now();
        const timeThreshold = 1000;

        // 不再使用 PointingUp 时则重置，避免鼠标乱跳
        if (lastFingerTipRef.current && (now - lastFingerTipRef.current.timestamp > timeThreshold)) {
            lastFingerTipRef.current = null;
        }

        if (lastFingerTipRef.current) {
            const deltaX = fingerTip.x - lastFingerTipRef.current.x;
            const deltaY = fingerTip.y - lastFingerTipRef.current.y;

            const debounceThreshold = 0.005;
            // 放大倍数，比如 0.02 使其相当于移动 100px
            const scaleFactor = 4000;

            if (Math.abs(deltaX) > debounceThreshold || Math.abs(deltaY) > debounceThreshold) {
                const deltaCoordinates = {
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

    function handleCameraChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const target = event.target.value;
        const targetCamera = cameraDevices.find((camera) => camera.deviceId === target) ?? null;
        setSelectedCameraDevice(targetCamera)
    }

    return (
        <>
            {!isModelLoaded && <Loading />}

            {/* 摄像机 */}
            <div className="relative flex justify-center items-center h-screen w-screen">
                {selectedCameraDevice && (
                    <Webcam
                        ref={webcamRef}
                        className="absolute"
                        style={{
                            transform: "scaleX(-1)", // 前置摄像头镜像
                            width: '100%',
                            height: '100%',
                            objectFit: "fill" // 解决全屏填充的关键
                        }}
                        videoConstraints={{ deviceId: selectedCameraDevice.deviceId }}
                        onUserMedia={() => {
                            setVideo(webcamRef.current!.video)
                        }}
                    />
                )}
                <canvas
                    ref={canvasRef}
                    className="absolute"
                    style={{
                        transform: "scaleX(-1)",
                        width: '100%',
                        height: '100%'
                    }}
                    width={850}
                    height={600}
                />
            </div>

            {/* 输出的识别手势标签 */}
            <div className="absolute top-0 w-screen px-4 py-2 mt-8">
                {detectedGestures.left && (
                    <div key="left" className="float-left bg-slate-500 text-white px-3 py-2 rounded-lg shadow-lg">
                        {detectedGestures.left}
                    </div>
                )}
                {detectedGestures.right && (
                    <div key="right" className="float-right bg-slate-500 text-white px-3 py-2 rounded-lg shadow-lg">
                        {detectedGestures.right}
                    </div>
                )}
            </div>

            {/* 相机切换选项 */}
            <div className="absolute bottom-0 w-screen px-4 py-2 mt-8 select-wrapper">
                <form className="max-w-sm mx-auto">
                    <select
                        className="text-center bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-teal-500 focus:border-teal-500 block w-full p-2.5"
                        value={selectedCameraDevice?.deviceId}
                        onChange={handleCameraChange}
                    >
                        {cameraDevices.map((camera) =>
                            <option value={camera.deviceId} key={camera.deviceId}>
                                {camera.label}
                            </option>
                        )}
                    </select>
                </form>
            </div>
        </>
    );
};

export default GestureRecognition;