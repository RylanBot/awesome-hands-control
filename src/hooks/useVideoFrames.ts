import React, { useEffect, useRef, useState } from "react";

type VideoEventListenerMap = {
    [EventName in keyof HTMLMediaElementEventMap]?: EventListener;
};

/**
 * 允许开发者在每个视频帧被渲染到屏幕时执行特定的回调函数
 * 确保处理操作与视频播放同步
 * @see https://web.dev/requestvideoframecallback-rvfc/
 */
const useVideoFrames = (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    frameCallback = (_: number) => { }
): [HTMLVideoElement | null, React.RefCallback<HTMLVideoElement>] => {

    const [video, setVideo] = useState<HTMLVideoElement | null>(null);
    const callbackRef = useRef(frameCallback);
    callbackRef.current = frameCallback;

    useEffect(() => {
        if (!video) return;

        let frameId: number | null;
        let requestFrame = requestAnimationFrame; // 处理视频的兼容方法
        let cancelFrame = cancelAnimationFrame;

        if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {
            const vid = video as HTMLVideoElement & {
                requestVideoFrameCallback: typeof requestAnimationFrame;
                cancelVideoFrameCallback: typeof cancelAnimationFrame;
            };
            requestFrame = vid.requestVideoFrameCallback.bind(vid);
            cancelFrame = vid.cancelVideoFrameCallback.bind(vid);
        }

        const callbackFrame = () => {
            const videoTime = video.currentTime;
            callbackRef.current(videoTime);
            frameId = requestFrame(callbackFrame);
        };

        const eventListeners: VideoEventListenerMap = {
            loadeddata() {
                requestAnimationFrame(() => callbackRef.current(video.currentTime));
            },
            play() {
                frameId = requestFrame(callbackFrame);
            },
            pause() {
                cancelFrame(frameId ?? 0);
                frameId = null;
            },
            timeupdate() {
                if (!frameId) {
                    requestAnimationFrame(() => callbackRef.current(video.currentTime));
                }
            },
        };

        Object.keys(eventListeners).forEach((eventName) => {
            const eventListener = eventListeners[eventName as keyof HTMLMediaElementEventMap];
            if (eventListener != null) {
                video.addEventListener(eventName, eventListener);
            }
        });

        return () => {
            cancelFrame(frameId ?? 0);

            Object.keys(eventListeners).forEach((eventName) => {
                const eventListener =
                    eventListeners[eventName as keyof HTMLMediaElementEventMap];
                if (eventListener != null) {
                    video.removeEventListener(eventName, eventListener);
                }
            });
        };
    }, [video]);

    return [video, setVideo];
};

export default useVideoFrames;