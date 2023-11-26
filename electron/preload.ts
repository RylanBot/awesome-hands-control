/*  预加载脚本，为了安全考虑，
    Electron 建议不要直接在渲染进程中（如页面的 JS 中）使用 Electron API。
    但在某些情况下，你可能需要在渲染进程中使用一些 Electron 的功能。
    此时，preload.js 作为一个中间者或桥梁，可以在此脚本中安全地暴露某些功能给渲染进程。*/

const { contextBridge, ipcRenderer } = require('electron');

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', withPrototype(ipcRenderer))

// `exposeInMainWorld` can't detect attributes and methods of `prototype`, manually patching it.
function withPrototype(obj: Record<string, any>) {
  const protos = Object.getPrototypeOf(obj)

  for (const [key, value] of Object.entries(protos)) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) continue

    if (typeof value === 'function') {
      // Some native APIs, like `NodeJS.EventEmitter['on']`, don't work in the Renderer process. Wrapping them into a function.
      obj[key] = function (...args: any) {
        return value.call(obj, ...args)
      }
    } else {
      obj[key] = value
    }
  }
  return obj
}

// --------- Preload scripts loading ---------
function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise(resolve => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(e => e === child)) {
      parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(e => e === child)) {
      parent.removeChild(child)
    }
  },
}

// 刚启动应用时的 loading 组件
/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const className = `loaders-css__square-spin`
  const styleContent = `
    @keyframes square-spin {
      25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
      50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
      75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
      100% { transform: perspective(100px) rotateX(0) rotateY(0); }
    }
    .${className} > div {
      animation-fill-mode: both;
      width: 50px;
      height: 50px;
      background: #fff;
      animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
    }
    .app-loading-wrap {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #282c34;
      z-index: 9;
    }
        `
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = 'app-loading-wrap'
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = ev => {
  ev.data.payload === 'removeLoading' && removeLoading()
}

// ????
// setTimeout(removeLoading, 4999)

// ----------  以上是基本框架，以下是添加的具体功能 ----------

// 类似后端的 Controller 层（ 暴露给渲染层的 API）
// (send) 发送消息到主进程；(on) 监听从主进程发来的消息

contextBridge.exposeInMainWorld('windowApi', {
  close: (windowName) => ipcRenderer.send('close', windowName),
  // 主窗口
  openCamera: () => ipcRenderer.send('openCamera'),
  minimizeToTaskbar: (windowName) => ipcRenderer.send('minimizeToTaskbar', windowName),
  // 摄像机窗口
  minimizeToTray: () => ipcRenderer.send('minimizeToTray'),
  minimizeToCorner: () => ipcRenderer.send('minimizeToCorner'),
  resetCameraWindow: () => ipcRenderer.send('resetCameraWindow'),
});


contextBridge.exposeInMainWorld('configApi', {
  initialConfig: async () => {
    return ipcRenderer.invoke('initialConfig')
  },
  updateAppConfig: async (appPath) => {
    return ipcRenderer.invoke('updateAppConfig', appPath);
  },
  deleteAppConfig: async (appName) => {
    return ipcRenderer.invoke('deleteAppConfig', appName);
  },
  updateShortcutConfig: async (appName, shortcut, leftHand, rightHand) => {
    return ipcRenderer.invoke('updateShortcutConfig', appName, shortcut, leftHand, rightHand);
  },
  deleteShortcutConfig: async (appName, shortcut) => {
    return ipcRenderer.invoke('deleteShortcutConfig', appName, shortcut);
  }
});


contextBridge.exposeInMainWorld('controlApi', {
  transmitProcess: (callback) => ipcRenderer.on('transmitProcess', (event, processName) => {
    const decoder = new TextDecoder('utf-8');
    const processNameString = decoder.decode(processName);
    callback(processNameString)
  }
  ),
  triggerShortcut: (shortcut: string) => { ipcRenderer.send('triggerShortcut', shortcut); },
  triggerMouse: (delta, isLeftHand) => { ipcRenderer.send('triggerMouse', delta, isLeftHand); },
});



