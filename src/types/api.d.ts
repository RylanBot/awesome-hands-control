/* 对应 preload 暴露给渲染层的接口 */

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
    minimizeToTaskbar: (windowName: string) => void;
    // 主窗口
    openCamera: () => void;
    // 摄像机窗口
    minimizeToTray: () => void;
    minimizeToCorner: () => void;
    resetCameraWindow: () => void
    // 判断窗口
    identifyWindow: (callback: (windowName: string) => void) => any;
    // 打开外部链接
    openExternalLink: (url: string) => void;
}

interface configApi {
    initialConfig: () => AppConfig[];
    updateAppConfig: (appName: string, base64Icon: string) => boolean;
    deleteAppConfig: (appName: string) => boolean;
    updateShortcutConfig: (appName: string, shortcut: string, leftHand: string, rightHand: string) => boolean;
    deleteShortcutConfig: (appName: string, shortcut: string) => boolean;
    getBase64Icon: (appPath: string) => string
}

interface ControlApi {
    transmitProcess: (callback: (result: string) => void) => any;
    triggerShortcut: (shortcut: string) => void;
    triggerMouse: (deltaCoordinates: { x: number, y: number }, isLeftHand: boolean) => void
}

export { };
