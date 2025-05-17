/// <reference types="vite-plugin-electron/electron-env" />

import { AppConfig, Shortcut } from '../../types/config'

declare namespace NodeJS {
  interface ProcessEnv {
    DIST: string
    VITE_PUBLIC: string
  }
}

declare global {
  interface Window {
    ipcRenderer: import('electron').IpcRenderer
    /*  对应 preload 的 api Key  */
    windowApi: WindowApi
    configApi: ConfigApi
    controlApi: ControlApi
  }

  interface Navigator {
    keyboard: {
      getLayoutMap: () => Map<string, string>;
    };
  }
}

interface WindowApi {
  close: (windowName: string) => void;
  minimizeToTaskbar: (windowName: string) => void;
  openCamera: () => void;
  minimizeToCorner: () => void;
  resetCameraWindow: () => void
  identifyWindow: (callback: (windowName: string) => void) => void;
  openExternalLink: (url: string) => void;
}

interface ConfigApi {
  initialConfig: () => Promise<AppConfig[]>;
  updateAppConfig: (appName: string, base64Icon: string) => Promise<boolean>
  deleteAppConfig: (appName: string) => Promise<boolean>;
  updateShortcutConfig: (appName: string, shortcut: Shortcut) => Promise<boolean>;
  deleteShortcutConfig: (appName: string, shortcut: Shortcut) => Promise<boolean>;
  toggleShortcutConfig: (appName: string, shortcut: Shortcut) => Promise<boolean>;
  getBase64Icon: (appPath: string) => Promise<string>
  getProjectVersion: () => Promise<string>;
}

interface ControlApi {
  transmitProcess: (callback: (processName: string) => void) => void;
  triggerShortcut: (shortcut: string) => void;
  triggerMouse: (deltaCoordinates: { x: number, y: number }, isLeftHand: boolean) => void
}

export { }
