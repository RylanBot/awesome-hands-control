/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    DIST: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
declare global {
  interface Window {
    ipcRenderer: import('electron').IpcRenderer
    // 对应 preload 的 api Key
    windowApi: WindowApi
    configApi: configApi
    controlApi: ControlApi
  }
  type AppConfig = {
    name: string;
    icon: string;
    shortcut: {
      [shortcutName: string]: [string, string];
    };
  }
}

interface WindowApi {
  close: (windowName: string) => void;
  minimizeToTaskbar: (windowName: string) => void;
  openCamera: () => void;
  minimizeToTray: () => void;
  minimizeToCorner: () => void;
  resetCameraWindow: () => void
  identifyWindow: (callback: (windowName: string) => void) => void;
  openExternalLink: (url: string) => void;
}

interface configApi {
  initialConfig: () => Promise<AppConfig[]>;
  updateAppConfig: (appName: string, base64Icon: string) => Promise<boolean>
  deleteAppConfig: (appName: string) => Promise<boolean>;
  updateShortcutConfig: (appName: string, shortcut: string, leftHand: string, rightHand: string) => Promise<boolean>;
  deleteShortcutConfig: (appName: string, shortcut: string) => Promise<boolean>;
  getBase64Icon: (appPath: string) => Promise<string>
  getProjectVersion: () => Promise<string>;
}

interface ControlApi {
  transmitProcess: (callback: (processName: string) => void) => void;
  triggerShortcut: (shortcut: string) => void;
  triggerMouse: (deltaCoordinates: { x: number, y: number }, isLeftHand: boolean) => void
}

export { };