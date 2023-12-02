import { AppConfig } from './../src/stores/configSlice';
/* 主进程文件，负责与操作系统的交互。 */

import { BrowserWindow, Menu, Tray, app, ipcMain, screen, shell } from 'electron';
import { promises } from 'node:fs';
import path from 'node:path';

const fs = require('fs');
const Store = require('electron-store');
const log = require('electron-log');
const activeWin = require('active-win');
const icon = require('file-icon-extractor');

// 指向 dist-electron
process.env.DIST = path.join(__dirname, '../dist')
// 指向 public
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

process.on('uncaughtException', (error) => {
  log.error('uncaughtException: ', error);
});

// BrowserWindow 用于创建和管理应用的窗口 
let mainWindow: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createMainWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC!, '/images/icons/MainWindow.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // 是否在渲染进程中启用 Node.js 集成，即 *.tsx 能直接访问系统接口
      contextIsolation: true, // 是否为 Electron 的 API 和页面的 JS 上下文提供隔离的环境
      backgroundThrottling: false // 确保窗口最小化或隐藏后依旧能正常活动
    },
    autoHideMenuBar: true, // 隐藏默认菜单栏
    frame: false, // 隐藏默认的窗口标题栏
    width: 850,
    height: 600,
    resizable: false
  })


  if (VITE_DEV_SERVER_URL) {
    // main前面不用添加斜杠/，或者vite.config那边replace的时候不用，否则路由会匹配错误
    mainWindow.loadURL(`${VITE_DEV_SERVER_URL}#/main`);
    // mainWindow.loadURL(`${VITE_DEV_SERVER_URL}#/`);
  } else {
    // win.loadFile('dist/index.html')
    mainWindow.loadFile(path.join(process.env.DIST!, 'index.html'))
  }


  // Test active push message to Renderer-process.
  // mainWindow.webContents.on('did-finish-load', () => {
  //   mainWindow?.webContents.send('main-process-message', (new Date).toLocaleString())
  // })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.webContents.send('identifyWindow', 'main');
  })

}

// 新增一个自定义窗口
let cameraWindow: BrowserWindow | null
let isTransparent = false;
function createCameraWindow() {
  cameraWindow = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC! as string, './images/icons/CameraWindow.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    frame: false,
    width: 850,
    height: 600,
    // skipTaskbar: true, // 不在任务栏显示
    resizable: false,
  });

  // 永远置顶，除非手动最小化or关闭
  cameraWindow.setAlwaysOnTop(true);

  if (VITE_DEV_SERVER_URL) {
    // camera前面不用添加斜杠/，否则路由会匹配错误
    cameraWindow.loadURL(`${VITE_DEV_SERVER_URL}#/camera`);
  } else {
    // win.loadFile('dist/index.html')
    // cameraWindow.loadFile(path.join(process.env.DIST!, 'index.html/camera'))
    cameraWindow.loadFile(path.join(process.env.DIST!, 'index.html'))
  }

  // 网页（所有的资源）加载完成后触发
  // cameraWindow.webContents.on('did-finish-load', () => {
  // })

  // 窗口渲染的内容已经可见但还没有显示给用户之前 (通常在 did-finish-load 之后触发)
  cameraWindow.on('ready-to-show', () => {
    cameraWindow!.webContents.send('identifyWindow', 'camera');
    runWindowMonitor();
  })

  cameraWindow.on('closed', () => {
    // stopWindowMonitor();
    cameraWindow = null;
    if (tray) {
      tray.destroy();
      tray = null;
    }
  });

}


let tray: Tray | null
function createCameraTray() {
  const trayIcon = path.join(process.env.VITE_PUBLIC! as string, './images/icons/CameraWindow.ico');
  tray = new Tray(trayIcon);

  tray.setToolTip('Awesome Hands');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Close Camera',
      click: function () {
        cameraWindow!.close()
        cameraWindow = null
        tray!.destroy();
        tray = null;
      }
    }
  ]);
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (cameraWindow && isTransparent) {
      cameraWindow.setOpacity(1.0);
      cameraWindow.setSkipTaskbar(false);
      isTransparent = false;
      tray!.destroy();
      tray = null;
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

// 🔊 这是整个 electron 项目的生命周期，不单指某个窗口
app.whenReady().then(async () => {
  try {
    const initialConfig = await loadInitialConfig();
    // global 关键字引用主进程的全局命名空间
    global.config = initialConfig;
    createMainWindow()
  } catch (error) {
    log.error("initialConfig: ", error);
  }
}
)

const store = new Store({
  name: 'awesome-hands-config',
  fileExtension: 'json',
});

let localConfigs: AppConfig[] = [];
async function loadInitialConfig() {
  if (!fs.existsSync(store.path)) {
    const defaultConfig: AppConfig[] = [
      {
        name: 'Global',
        icon: "",
        shortcut: {}
      }
    ];
    store.set('apps', defaultConfig);
    localConfigs = defaultConfig;
  } else {
    localConfigs = store.get('apps') || []; // 确保总是返回数组
  }
  return localConfigs;
}
// ----------  以上是基本框架，以下是添加的具体功能 ----------

// 类似后端的 Service 层

// 关闭窗口
ipcMain.on('close', (_, windowName) => {
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

ipcMain.on('minimizeToTaskbar', (_, windowName) => {
  if (windowName === 'main') {
    mainWindow?.minimize();
  }

  if (windowName === 'camera' && cameraWindow) {
    // cameraWindow.minimize();

    /*  electron中如果一个 Window 被设置为隐藏或者最小化后
        那么这个它人认为该窗口应该就不需要过多的占用 CPU 资源, 导致相机无法正常读取 
        相机的最小化实际是利用样式将其变透明, 而不是真正隐藏 */
    // cameraWindow.setOpacity(0.0);
    createCameraTray();
    cameraWindow.setOpacity(0.0);
    cameraWindow.setSkipTaskbar(true);
    isTransparent = true;
  }
});

// >> 主窗口
// 开启摄像头
ipcMain.on('openCamera', () => {
  if (cameraWindow && !cameraWindow.isDestroyed()) {
    cameraWindow.focus();
    return;
  }

  createCameraWindow();
  // createCameraTray();
});

// >> 摄像机窗口
ipcMain.on('minimizeToTray', () => {
  cameraWindow?.hide();
});

ipcMain.on('minimizeToCorner', () => {
  try {
    if (cameraWindow) {
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
  } catch (error) {
    log.error('minimizeToCorner: ', error);
  }
});


ipcMain.on('resetCameraWindow', () => {
  try {
    if (cameraWindow) {
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
  } catch (error) {
    log.error('resetCameraWindow: ', error);
  }
});

// 获取软件的图标
async function getIconBase64(exePath) {
  const cachePath = app.getPath('temp');

  const regex = /([^\\]+)\.exe$/i;
  const matches = exePath.match(regex);
  const exeName = matches[1];
  const iconPath = path.join(cachePath, `${exeName}.png`);

  try {
    icon.extract(exePath, cachePath);
    while (!fs.existsSync(iconPath)) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    // 转换为 base64
    const iconData = fs.readFileSync(iconPath);
    const iconBase64 = iconData.toString('base64');
    // 删除缓存图标
    fs.unlinkSync(iconPath);
    return iconBase64;
  } catch (err) {
    throw err;
  }
}

// 读取初始化配置
ipcMain.handle('initialConfig', async () => {
  return global.config;
})

// 添加软件
ipcMain.handle('updateAppConfig', async (_, appName, base64Icon) => {
  const newApp: AppConfig = {
    name: appName,
    icon: base64Icon,
    shortcut: {}
  };
  try {
    localConfigs.push(newApp);
    store.set('apps', localConfigs);
    return true;
  } catch (error) {
    log.error(error)
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
// import robot from 'robotjs'

ipcMain.on('triggerShortcut', (_, shortcut) => {
  try {
    // 检测是否为鼠标操作  
    if (shortcut.includes('Mouse Click') || shortcut.includes('Mouse Double Click')) {
      const mouseButtonMatch = shortcut.match(/\(([^)]+)\)/);
      const mouseButton = mouseButtonMatch[1]
      const isDoubleClick = shortcut.includes('Mouse Double Click');
      robot.mouseClick(mouseButton, isDoubleClick);
    } else {
      // 处理键盘快捷键
      const keys = shortcut.split('+');
      const validModifiers = ['alt', 'command', 'control', 'shift', 'win'];
      const modifiers = keys.filter(key => validModifiers.includes(key));
      const nonModifierKeys = keys.filter(key => !validModifiers.includes(key));
      nonModifierKeys.forEach((key, index) => {
        robot.keyToggle(key, 'down', modifiers);
        if (index === nonModifierKeys.length - 1) {
          nonModifierKeys.forEach(key => robot.keyToggle(key, 'up', modifiers));
        }
      });
    }
  } catch (error) {
    log.error("triggerShortcut", error);
  }
});

//处理鼠标移动
ipcMain.on('triggerMouse', (_, delta, isLeftHand) => {
  let mouse = robot.getMousePos();
  // console.log("Mouse is at x:" + mouse.x + " y:" + mouse.y);

  if (isLeftHand) {
    // 左手触发滚轮
    // win10 没反应（官方还没修复，则暂时弃用）
    // robot.scrollMouse(delta.x, delta.y);
    // setTimeout(function () {
    //   robot.scrollMouse(delta.x, delta.y);
    // }, 2000);
  } else {
    // 右手触发鼠标光标
    robot.moveMouse(mouse.x + delta.x, mouse.y + delta.y);
  }

})


// 打开外部链接
ipcMain.on('openExternalLink', (_, url) => {
  shell.openExternal(url);
})

// 进程判断
function runWindowMonitor() {
  let lastProcessName = null;

  setInterval(async () => {
    try {
      const windowInfo = await activeWin();
      const processName = windowInfo.owner.name;

      // 只有在进程名称改变时才发送
      if (processName !== lastProcessName) {
        if (cameraWindow && !cameraWindow.isDestroyed()) {
          cameraWindow.webContents.send('transmitProcess', processName);
        }
        lastProcessName = processName;
      }
    } catch (error) {
      log.error('runWindowMonitor: ', error);
    }
  }, 1000);
}

// 提取软件的 icon
ipcMain.handle('getBase64Icon', async (_, appPath) => {

  let regex, matches, appName;
  if (appPath.endsWith('.EXE') || appPath.endsWith('.exe')) {
    // Windows 路径处理
    regex = /([^\\]+)\.(EXE|exe)$/i;
    matches = appPath.match(regex);
  } else if (appPath.endsWith('.app') || appPath.endsWith('.APP')) {
    // MacOS 路径处理
    regex = /([^\/]+)\.(APP|app)$/i;
    matches = appPath.match(regex);
  } else {
    return null;
  }

  if (matches && matches[1]) {
    appName = matches[1];
  }

  const cachePath = app.getPath('temp');
  const iconPath = path.join(cachePath, `${appName}.png`);
  try {
    await icon.extract(appPath, cachePath);

    const maxWaitTime = 3000; // 最大等待时间
    const waitInterval = 500;  // 每次检查的间隔时间
    let waitedTime = 0;
    while (waitedTime < maxWaitTime) {
      try {
        // 确定文件是否生成
        await promises.access(iconPath);
        break;
      } catch {
        await new Promise(resolve => setTimeout(resolve, waitInterval));
        waitedTime += waitInterval;
      }
    }
    if (waitedTime >= maxWaitTime) {
      log.error("getIconBase64: Icon generation timeout");
    }

    // 转换为 base64
    const iconData = await promises.readFile(iconPath);
    const iconBase64 = iconData.toString('base64');
    // 删除缓存图标
    await promises.unlink(iconPath);
    return iconBase64;
  } catch (err) {
    log.error("getIconBase64: ", err);
  }
});

ipcMain.handle('getProjectVersion', () => {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  return (packageJson.version)
})