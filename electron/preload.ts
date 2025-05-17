import { contextBridge, ipcRenderer } from 'electron'

import type { Shortcut } from '@common/types/config'

contextBridge.exposeInMainWorld('ipcRenderer', withPrototype(ipcRenderer))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withPrototype(obj: Record<string, any>) {
  const protos = Object.getPrototypeOf(obj)

  for (const [key, value] of Object.entries(protos)) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) continue
    if (typeof value === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      obj[key] = function (...args: any) {
        return value.call(obj, ...args)
      }
    } else {
      obj[key] = value
    }
  }
  return obj
}

/* -------------------------------------------------- */

contextBridge.exposeInMainWorld('windowApi', {
  close: (windowName: string) => ipcRenderer.send('close', windowName),
  openCamera: () => ipcRenderer.send('openCamera'),
  minimizeToTaskbar: (windowName: string) => ipcRenderer.send('minimizeToTaskbar', windowName),
  minimizeToCorner: () => ipcRenderer.send('minimizeToCorner'),
  resetCameraWindow: () => ipcRenderer.send('resetCameraWindow'),
  identifyWindow: (callback: (windowName: string) => void) => ipcRenderer.on('identifyWindow', (_, windowName) => { callback(windowName) }),
  openExternalLink: (url: string) => ipcRenderer.send('openExternalLink', url),
});

contextBridge.exposeInMainWorld('configApi', {
  initialConfig: async () => { return ipcRenderer.invoke('initialConfig'); },
  updateAppConfig: async (appPath: string, base64Icon: string) => { return ipcRenderer.invoke('updateAppConfig', appPath, base64Icon); },
  deleteAppConfig: async (appName: string) => { return ipcRenderer.invoke('deleteAppConfig', appName); },
  updateShortcutConfig: async (appName: string, shortcut: Shortcut) => { return ipcRenderer.invoke('updateShortcutConfig', appName, shortcut); },
  deleteShortcutConfig: async (appName: string, shortcut: Shortcut) => { return ipcRenderer.invoke('deleteShortcutConfig', appName, shortcut); },
  toggleShortcutConfig: async (appName: string, shortcut: Shortcut) => { return ipcRenderer.invoke('toggleShortcutConfig', appName, shortcut); },
  getBase64Icon: async (appPath: string) => { return ipcRenderer.invoke('getBase64Icon', appPath); },
  getProjectVersion: () => { return ipcRenderer.invoke('getProjectVersion'); }
});

contextBridge.exposeInMainWorld('controlApi', {
  transmitProcess: (callback: (processName: string) => void) => ipcRenderer.on('transmitProcess', (_, processName) => { callback(processName) }),
  triggerShortcut: (shortcut: string) => { ipcRenderer.send('triggerShortcut', shortcut); },
  triggerMouse: (deltaCoordinates: { x: number, y: number }, isLeftHand: string) => { ipcRenderer.send('triggerMouse', deltaCoordinates, isLeftHand); },
});