

declare global {
    // 主进程的相关接口
    interface Window {
        windowApi: WindowApi
        coreApi: CoreApi
    }
}
interface WindowApi {
    close: (windowName: string) => void;
    // 主窗口
    openCamera: () => void;
    minimizeToTaskbar: () => void;
    // 摄像机窗口
    minimizeToTray: () => void;
    minimizeToCorner: () => void;
    resetCameraWindow: () => void
}

interface CoreApi {
    initialConfig: (callback: (result: any) => void) => any; // Json?
    transmitProcess: (callback: (result: any) => void) => any; // String
    triggerShortcut: (windowName: string) => void;
}

export { };