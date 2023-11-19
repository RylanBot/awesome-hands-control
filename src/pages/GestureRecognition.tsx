
import { Camera } from '@mediapipe/camera_utils';
import { Category, FilesetResolver, GestureRecognizer, GestureRecognizerResult, Landmark } from '@mediapipe/tasks-vision';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Webcam from 'react-webcam';
import Loading from "../components/Loading";
import { setConfig } from '../utils/configSlice';
import { RootState } from '../utils/store';

const GestureRecognition: React.FC = () => {

    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const dispatch = useDispatch();

    // 两个窗口的redux实例不同（？ 
    const apps = useSelector((state: RootState) => state.config.apps);

    useEffect(() => {
        window.coreApi.initialConfig((config) => {
            dispatch(setConfig(config));
        });
    }, [dispatch]); // 指定当依赖依赖发生变化时才执行 useEffect 中的代码


    // 模型加载状态
    const [isModelLoaded, setIsModelLoaded] = useState(false);

    // 左右手对应姿势
    const [gestures, setGestures] = useState({ left: "", right: "" });
    const setGesture = (isLeftHand: boolean, text: string) => {
        setGestures(prev => ({
            ...prev,
            [isLeftHand ? 'left' : 'right']: text,
        }));
    };


    // 核心步骤：读取模型 👋
    useEffect(() => {
        async function fetchData() {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

            const gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "/models/gesture_recognizer.task",
                },
                runningMode: 'IMAGE',
                numHands: 2,
            });

            if (webcamRef.current) {
                const video = webcamRef.current.video!;
                const camera = new Camera(video, {
                    onFrame: async () => {
                        onResult(await gestureRecognizer.recognize(video));
                    }
                });

                camera.start();
            }
        }

        fetchData();
    }, []);

    // 调整 canvas 尺寸适配屏幕
    useEffect(() => {
        const resizeCanvas = () => {
            const video = webcamRef.current?.video;

            if (canvasRef.current && video && video.readyState >= 2) {
                const canvasElement = canvasRef.current;

                // 更新 canvas 的绘图缓冲区大小
                canvasElement.width = window.innerWidth;
                canvasElement.height = window.innerHeight;
            }
        };

        window.addEventListener('resize', resizeCanvas);

        const videoElement = webcamRef.current?.video;
        if (videoElement) {
            videoElement.addEventListener('loadedmetadata', resizeCanvas);
        }

        resizeCanvas(); // 在首次加载时调用

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (videoElement) {
                videoElement.removeEventListener('loadedmetadata', resizeCanvas);
            }
        };
    }, []);

    const currentProcessRef = useRef<string>("");
    useEffect(() => {
        window.coreApi.transmitProcess((processName: string) => {
            currentProcessRef.current = processName;
        });
    }, []);

    // 触发对应快捷键
    const lastTriggerRef = useRef({ shortcut: '', timestamp: 0 });
    useEffect(() => {
        const currentShortcut = findShortcut();
        const now = Date.now();
        // 防抖
        if (currentShortcut && (now - lastTriggerRef.current.timestamp > 1000 || lastTriggerRef.current.shortcut !== currentShortcut)) {
            window.coreApi.triggerShortcut(currentShortcut);
            lastTriggerRef.current = { shortcut: currentShortcut, timestamp: now };
        }
    }, [gestures]); 


    const onResult = (result: GestureRecognizerResult) => {
        // console.log(result);

        if (!isModelLoaded) {
            setIsModelLoaded(true);
        }

        if (webcamRef.current && webcamRef.current.video && canvasRef.current) {
            const canvasElement = canvasRef.current;
            const canvasCtx = canvasElement.getContext("2d");

            // 清除之前的绘制
            canvasCtx?.clearRect(0, 0, canvasElement.width, canvasElement.height);

            const { gestures: detectedGestures, handedness } = result;
            setGestures({ left: "", right: "" });

            detectedGestures.forEach((gesture, index) => {
                const isLeftHand = handedness[index] && handedness[index][0].categoryName === "Left";

                if (canvasCtx) {
                    drawHand(result.landmarks[index], canvasCtx, isLeftHand)
                };

                displayGesture(gesture[0], isLeftHand);

            });
        };

    };

    const drawHand = (handLandmarks: Landmark[], canvasCtx: CanvasRenderingContext2D, isLeftHand: boolean) => {

        const fingerConnections = [
            [0, 1, 2, 3, 4], // 大拇指
            [0, 5, 6, 7, 8], // 食指
            [9, 10, 11, 12], // 中指
            [13, 14, 15, 16], // 无名指
            [0, 17, 18, 19, 20], // 小指
        ];

        // 定义左手和右手的不同样式
        const handColors = {
            left: {
                point: "#b4ea3e",
                line: "#54e856",
            },
            right: {
                point: "#57e6ff",
                line: "#06ffe2",
            },
        };

        canvasCtx.fillStyle = handColors[isLeftHand ? "left" : "right"].point;
        canvasCtx.strokeStyle = handColors[isLeftHand ? "left" : "right"].line;
        canvasCtx.lineWidth = 3;

        // 遍历手指连接关系并绘制点和线
        fingerConnections.forEach((finger) => {
            finger.forEach((pointIdx, idx, arr) => {
                const currentPoint = handLandmarks[pointIdx];
                const x = currentPoint.x * canvasCtx.canvas.width;
                const y = currentPoint.y * canvasCtx.canvas.height;

                // 绘制点
                canvasCtx.beginPath();
                canvasCtx.arc(x, y, 3, 0, 2 * Math.PI); // 使用 pointSize 作为半径
                canvasCtx.fill();

                // 绘制连接线
                if (idx < arr.length - 1) {
                    const nextPoint = handLandmarks[arr[idx + 1]];
                    const nextX = nextPoint.x * canvasCtx.canvas.width;
                    const nextY = nextPoint.y * canvasCtx.canvas.height;
                    canvasCtx.beginPath();
                    canvasCtx.moveTo(x, y);
                    canvasCtx.lineTo(nextX, nextY);
                    canvasCtx.stroke();
                }
            });
        });

        // 单独处理以下点（形成手掌轮廓）
        const jointIndices = [5, 9, 13, 17];

        jointIndices.forEach((jointIdx, idx) => {
            const currentJoint = handLandmarks[jointIdx];
            const x = currentJoint.x * canvasCtx.canvas.width;
            const y = currentJoint.y * canvasCtx.canvas.height;

            // 绘制连接线
            if (idx < jointIndices.length - 1) {
                const nextJoint = handLandmarks[jointIndices[idx + 1]];
                const nextX = nextJoint.x * canvasCtx.canvas.width;
                const nextY = nextJoint.y * canvasCtx.canvas.height;
                canvasCtx.beginPath();
                canvasCtx.moveTo(x, y);
                canvasCtx.lineTo(nextX, nextY);
                canvasCtx.stroke();
            }
        });


    };

    const displayGesture = (gesture: Category, isLeftHand: boolean) => {
        // const { score, categoryName } = gesture;
        const { categoryName } = gesture;
        // const displayText = categoryName === 'None' ? "" : `${categoryName} (${(score * 100).toFixed(1)}%)`;
        const displayText = categoryName === 'None' ? "" : categoryName;
        setGesture(isLeftHand, displayText);

    };

    const findShortcut = () => {

        const currentProcess = currentProcessRef.current.replace(/\r\n$/, '');;
        const appData = apps[currentProcess];

        if (appData) {
            const shortcuts = appData.shortcut;

            for (const shortcutName in shortcuts) {
                if (shortcuts.hasOwnProperty(shortcutName)) {
                    const shortcut = shortcuts[shortcutName];
                    if (shortcut[0] === gestures.left && shortcut[1] === gestures.right) {
                        return shortcutName;
                    }
                }
            }
        }

        return null;
    };

    return (
        <>
            {isModelLoaded ? null : <Loading />}

            {/* 相机部分 */}
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
                {gestures.left && (
                    <div className="float-left bg-slate-500 text-white px-3 py-2 rounded-lg shadow-lg">
                        {gestures.left}
                    </div>
                )}

                {gestures.right && (
                    <div className="float-right bg-slate-500 text-white px-3 py-2 rounded-lg shadow-lg">
                        {gestures.right}
                    </div>
                )}
            </div>
        </>
    );

}

export default GestureRecognition;

