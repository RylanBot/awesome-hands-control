

declare global {
    // 主进程的相关接口
    interface Window {
        windowApi: WindowApi
        configApi: configApi
        controlApi: ControlApi
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

interface configApi {
    initialConfig: () => AppConfig[];
    updateAppConfig: (appName: string) => boolean;
    deleteAppConfig: (appName: string) => boolean;
    updateShortcutConfig: (appName: string, shortcut: string, leftHand: string, rightHand: string) => boolean;
    deleteShortcutConfig: (appName: string, shortcut: string) => boolean;
}

interface ControlApi {
    transmitProcess: (callback: (result: string) => void) => any;
    triggerShortcut: (shortcut: string) => void;
}

export { };