/* 主进程文件，负责与操作系统的交互。 */

import { app, BrowserWindow, ipcMain, screen, Tray } from 'electron';
import path from 'node:path';

// 指向 dist-electron
process.env.DIST = path.join(__dirname, '../dist')
// 指向 public
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

// BrowserWindow 用于创建和管理应用的窗口 
let mainWindow: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createMainWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC!, '/images/icons/MainWindow.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // 是否在渲染进程中启用 Node.js 集成，即 *.tsx 能直接访问系统接口
      contextIsolation: true // 是否为 Electron 的 API 和页面的 JS 上下文提供隔离的环境
    },
    autoHideMenuBar: true, // 隐藏默认菜单栏
    frame: false, // 隐藏默认的窗口标题栏
    width: 850,
    height: 600,
    resizable: false
  })


  if (VITE_DEV_SERVER_URL) {
    // main前面不用添加斜杠/，或者vite.config那边replace的时候不用，否则路由会匹配错误
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    mainWindow.loadFile(path.join(process.env.DIST!, 'index.html'))
  }


  // Test active push message to Renderer-process.
  // mainWindow.webContents.on('did-finish-load', () => {
  //   mainWindow?.webContents.send('main-process-message', (new Date).toLocaleString())
  //   // 初始化配置
  //   initialConfig();
  // })

  mainWindow.on('ready-to-show', () => {
  })

}

// 新增一个自定义窗口
let cameraWindow: BrowserWindow | null
function createCameraWindow() {
  cameraWindow = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC! as string, '/images/icons/CameraWindow.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true,
    frame: false,
    width: 850,
    height: 600,
    skipTaskbar: true, // 不在任务栏显示
    resizable: false,
  });

  if (VITE_DEV_SERVER_URL) {
    // camera前面不用添加斜杠/，否则路由会匹配错误
    cameraWindow.loadURL(`${VITE_DEV_SERVER_URL}camera`);
  } else {
    // win.loadFile('dist/index.html')
    // 打包的时候估计要调整
    cameraWindow.loadFile(path.join(process.env.DIST!, 'index.html'))
  }

  // cameraWindow.webContents.on('did-finish-load', () => {
  //   runWindowMonitor();
  // })

  cameraWindow.on('ready-to-show', () => {
    runWindowMonitor();
  })


  cameraWindow.on('closed', () => {
    stopWindowMonitor();
    cameraWindow = null;
    if (tray) {
      tray.destroy();
      tray = null;
    }
  });
}

let tray: Tray | null
function createCameraTray() {
  const trayIcon = path.join(process.env.VITE_PUBLIC! as string, '/images/icons/camera.png');
  tray = new Tray(trayIcon);

  tray.setToolTip('Awesome Hands');

  tray.on('click', () => {
    if (cameraWindow) {
      if (!cameraWindow.isVisible()) {
        cameraWindow.show();
      }
      cameraWindow.focus();
      cameraWindow.setAlwaysOnTop(true);
      setTimeout(() => {
        cameraWindow?.setAlwaysOnTop(false);
      }, 300);
    }
  });
}


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    mainWindow = null
    cameraWindow = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})

app.whenReady().then(createMainWindow)

// ----------  以上是基本框架，以下是添加的具体功能 ----------

// 类似后端的 Service 层

// 关闭窗口
ipcMain.on('close', (event, windowName) => {
  if (windowName === 'main') {
    app.quit();
    mainWindow = null
    cameraWindow = null
  }

  if (windowName === 'camera' && cameraWindow) {
    cameraWindow.close();
    cameraWindow = null;
    tray?.destroy();
  }
});

// >> 主窗口
// 开启摄像头
ipcMain.on('openCamera', () => {
  if (cameraWindow && !cameraWindow.isDestroyed()) {
    cameraWindow.focus();
    cameraWindow.setAlwaysOnTop(true);
    setTimeout(() => {
      cameraWindow?.setAlwaysOnTop(false);
    }, 300);
    return;
  }

  createCameraWindow();
  createCameraTray();
});

ipcMain.on('minimizeToTaskbar', () => {
  mainWindow?.minimize();
});

// >> 摄像机窗口
ipcMain.on('minimizeToTray', () => {
  cameraWindow?.hide();
});

ipcMain.on('minimizeToCorner', () => {
  if (cameraWindow) {
    // 置顶
    cameraWindow.setAlwaysOnTop(true, 'normal')

    const width = 280;
    const height = 200;

    // 获取鼠标当前的位置
    const cursorPoint = screen.getCursorScreenPoint();
    // 获取包含鼠标当前位置的显示器
    const display = screen.getDisplayNearestPoint(cursorPoint);

    // 把窗口缩小移到角落
    const x = display.bounds.x + (display.bounds.width - width);
    const y = display.bounds.y + (display.bounds.height - height);

    cameraWindow.setBounds({ x: x, y: y, width: width, height: height });

  }

});

ipcMain.on('resetCameraWindow', () => {
  if (cameraWindow) {
    cameraWindow.setAlwaysOnTop(false);

    const width = 850;
    const height = 600;

    const cursorPoint = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursorPoint);

    // 把窗口恢复居中放大
    // 直接调用内置 center() 方法时，多个显示器时，无法准确判断
    const x = display.bounds.x + ((display.bounds.width - width) / 2);
    const y = display.bounds.y + ((display.bounds.height - height) / 2);

    cameraWindow.setBounds({ x: x, y: y, width: width, height: height });
  }
});

const Store = require('electron-store');
const store = new Store({
  name: 'awesome-hands-config',
  fileExtension: 'json',
});
const localConfigs = store.get('apps');

// 获取软件的图标
async function getIconBase64(exePath) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.env.VITE_PUBLIC!, '/scripts/getSoftwareIcon.ps1');
    const command = `powershell.exe -Command "${scriptPath} -exePath '${exePath}'"`;
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }
      console.log(stderr);
      resolve(stdout.trim());
    });
  });
}

// 读取初始化配置
ipcMain.handle('initialConfig', async (_, windowName) => {
  const fs = require('fs');
  if (!fs.existsSync(store.path)) {
    const defaultConfig = []
    try {
      store.set('apps', defaultConfig);
      return defaultConfig;
    } catch (err) {
      console.error(err);
    }
  } else {
    return localConfigs;
  }
})

// 添加软件
ipcMain.handle('updateAppConfig', async (_, appPath) => {
  // 获取不包含路径和扩展名的文件名
  const appName = path.parse(appPath).name;

  try {
    const iconBase64 = await getIconBase64(appPath);
    const newApp = {
      name: appName,
      icon: iconBase64,
      shortcut: {}
    };
    localConfigs.push(newApp);
    store.set('apps', localConfigs);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
});

// 删除软件
ipcMain.handle('deleteAppConfig', async (_, appName) => {
  const index = localConfigs.findIndex((appConfig) => appConfig.name === appName);
  if (index !== -1) {
    localConfigs.splice(index, 1);
    store.set('apps', localConfigs);
    return true;
  }
});

// 添加软件绑定的快捷键
ipcMain.handle('updateShortcutConfig', async (_, appName, shortcut, leftHand, rightHand) => {
  const index = localConfigs.findIndex((appConfig) => appConfig.name === appName);
  if (index !== -1) {
    const appConfig = localConfigs[index];
    appConfig.shortcut[shortcut] = [leftHand, rightHand];
    localConfigs[index] = appConfig;
    store.set('apps', localConfigs);
    return true;
  }
})

// 删除快捷键
ipcMain.handle('deleteShortcutConfig', async (_, appName, shortcut) => {
  const index = localConfigs.findIndex((appConfig) => appConfig.name === appName);
  if (index !== -1) {
    const appConfig = localConfigs[index];
    if (appConfig.shortcut.hasOwnProperty(shortcut)) {
      delete appConfig.shortcut[shortcut];
      store.set('apps', localConfigs);
      return true;
    }
  }
})

// 模拟键盘输入
const robot = require('robotjs');
ipcMain.on('triggerShortcut', (_, shortcut) => {
  const keys = shortcut.split('+');
  const keyToTap = keys.pop();
  const modifiers = keys;
  if (keyToTap) {
    robot.keyTap(keyToTap, modifiers);
  }
});

// exec 通过启动一个 shell 执行命令；spawn 启动一个新进程，在 node 环境直接执行一个命令
const { exec, spawn } = require('child_process');
// 进程判断
let windowMonitor;
function runWindowMonitor() {
  if (VITE_DEV_SERVER_URL) {
    const pathToMonitor = path.join(process.env.VITE_PUBLIC!, 'WindowMonitor/WindowMonitor.exe');
    windowMonitor = spawn(pathToMonitor);

    windowMonitor.stdout.on('data', (processName) => {
      if (cameraWindow && !cameraWindow.isDestroyed()) {
        cameraWindow.webContents.send('transmitProcess', processName);
      }
    });
    windowMonitor.on('error', (err) => {
      console.error(`${err}`);
    });
  } else {
    // ... 待补充
  }
}

function stopWindowMonitor() {
  if (windowMonitor) {
    windowMonitor.kill('SIGINT');
    windowMonitor = null;
  }
}