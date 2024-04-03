/* 主进程文件，负责与操作系统的交互。*/

import { app, BrowserWindow, ipcMain, screen, shell, Tray } from 'electron';
import log from 'electron-log/main';
import ElectronStore from "electron-store";

import { readFileSync } from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import robot, { keys } from '@hurdlegroup/robotjs';
import activeWindow from "active-win";

import { AppConfig, AppConfigV1, Shortcut } from '@/utils/types';

globalThis.__filename = fileURLToPath(import.meta.url)
globalThis.__dirname = dirname(__filename)

// 指向 dist-electron
process.env.DIST = path.join(__dirname, '../dist')
// 指向 public
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

process.on('uncaughtException', (error) => {
  log.error('uncaughtException: ', error);
});

let taskBarIconSuffix: string;
if (process.platform === 'darwin') {
  // macOS
  taskBarIconSuffix = 'icns'
} else {
  // Windows
  taskBarIconSuffix = 'ico'
}

// BrowserWindow 用于创建和管理应用的窗口 
let mainWindow: BrowserWindow | null;
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createMainWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC!, `/images/icons/MainWindow.${taskBarIconSuffix}`),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
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
    mainWindow.loadURL(`${VITE_DEV_SERVER_URL}#/main`);
  } else {
    mainWindow.loadFile(path.join(process.env.DIST!, 'index.html'))
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow!.webContents.send('identifyWindow', 'main');
  })
}

// 新增一个自定义窗口
let cameraWindow: BrowserWindow | null
// let isTransparent = false;
const monitorIntervalId: NodeJS.Timeout | null = null;
function createCameraWindow() {
  cameraWindow = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC! as string, `./images/icons/CameraWindow.${taskBarIconSuffix}`),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    frame: false,
    width: 850,
    height: 600,
    skipTaskbar: true, // 不在任务栏显示
    resizable: false,
  });

  if (VITE_DEV_SERVER_URL) {
    cameraWindow.loadURL(`${VITE_DEV_SERVER_URL}#/camera`);
  } else {
    cameraWindow.loadFile(path.join(process.env.DIST!, 'index.html'))
  }

  cameraWindow.setAlwaysOnTop(true);
  createCameraTray();

  // 网页（所有的资源）加载完成后触发
  // cameraWindow.webContents.on('did-finish-load', () => {
  // })

  // 窗口渲染的内容已经可见但还没有显示给用户之前 (通常在 did-finish-load 之后触发)
  cameraWindow.on('ready-to-show', () => {
    cameraWindow!.webContents.send('identifyWindow', 'camera');
    runWindowMonitor();
  })

  cameraWindow.on('closed', () => {
    if (monitorIntervalId) {
      clearInterval(monitorIntervalId);
    }
    cameraWindow = null;
    if (cameraTray) {
      cameraTray.destroy();
      cameraTray = null;
    }
  });
}

let cameraTray: Tray | null;
function createCameraTray() {
  const trayIcon = path.join(process.env.VITE_PUBLIC! as string, `./images/icons/CameraTray.png`);
  cameraTray = new Tray(trayIcon);
  cameraTray.setToolTip('Awesome Hands');

  cameraTray.on('click', () => {
    // if (cameraWindow && isTransparent) {
    //   cameraWindow.setOpacity(1.0);
    //   cameraWindow.setSkipTaskbar(false);
    //   cameraTray!.destroy();
    //   cameraTray = null;
    // }
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
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
});

// 🔊 这是整个 electron 项目的生命周期，不单指某个窗口
app.whenReady().then(async () => {
  try {
    await loadInitialConfig();
    createMainWindow()
  } catch (error) {
    log.error("initialConfig: ", error);
  }
});

const store = new ElectronStore({
  name: 'awesome-hands-config',
  fileExtension: 'json',
});

let localConfigs: AppConfig[] = [];
async function loadInitialConfig() {
  const DEFAULT_SHORTCUTS = [
    {
      keyCombination: "Mouse Scroll",
      gestureLeft: "Pointing_Up",
      gestureRight: "",
      enabled: true,
      removable: false,
    },
    {
      keyCombination: "Mouse Cursor",
      gestureLeft: "NOTE",
      gestureRight: "Pointing_Up",
      enabled: true,
      removable: false,
    }
  ];

  const DEFAULT_CONFIG: AppConfig[] = [
    {
      name: 'Global',
      icon: "",
      shortcuts: DEFAULT_SHORTCUTS,
      version: 2
    }
  ];

  localConfigs = convertConfigFormat(store.get('apps') as AppConfig[] | AppConfigV1[]);

  if (localConfigs.length === 0) {
    localConfigs = DEFAULT_CONFIG;
    store.set('apps', localConfigs);
    return;
  }

  const globalConfigIndex = localConfigs.findIndex(config => config.name === 'Global');
  if (globalConfigIndex !== -1) {
    const globalConfig = localConfigs[globalConfigIndex];
    DEFAULT_SHORTCUTS.forEach(defaultShortcut => {
      if (!globalConfig.shortcuts.some(shortcut => shortcut.keyCombination === defaultShortcut.keyCombination)) {
        globalConfig.shortcuts.unshift(defaultShortcut);
      }
    });
    localConfigs[globalConfigIndex] = globalConfig;
  } else {
    localConfigs.unshift({
      name: 'Global',
      icon: "",
      shortcuts: DEFAULT_SHORTCUTS,
      version: 2,
    });
  }
  store.set('apps', localConfigs);
}

function convertConfigFormat(config: AppConfig[] | AppConfigV1[]): AppConfig[] {
  const resConfig: AppConfig[] = [];
  config.forEach((el) => {
    if ('version' in el) {
      resConfig.push(el as AppConfig);
    } else {
      const shortcuts: Shortcut[] = [];
      for (const key in el.shortcut) {
        if (key in el.shortcut) {
          const [gestureLeft, gestureRight] = el.shortcut[key];
          shortcuts.push({
            keyCombination: key,
            gestureLeft,
            gestureRight,
            enabled: true,
            removable: true
          });
        }
      }
      if (shortcuts.length) {
        resConfig.push({
          name: el.name,
          icon: el.icon,
          shortcuts,
          version: 2
        });
      }
    }
  })
  return resConfig;
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
    cameraTray?.destroy();
  }
});

ipcMain.on('minimizeToTaskbar', (_, windowName) => {
  if (windowName === 'main') {
    mainWindow?.minimize();
  }

  /*  electron中如果一个 Window 被设置为隐藏或者最小化后
      那么这个它人认为该窗口应该就不需要过多的占用 CPU 资源, 导致相机无法正常读取 
      相机的最小化实际是利用样式将其变透明, 而不是真正隐藏
      （但 macOS 透明化后会阻挡在其它窗口前面，导致无法点击） */
  // if (windowName === 'camera' && cameraWindow && !cameraTray) {
  //   createCameraTray();
  //   cameraWindow.setOpacity(0.0);
  //   cameraWindow.setSkipTaskbar(true);
  //   isTransparent = true;
  // }
});

// >> 主窗口
// 开启摄像头
ipcMain.on('openCamera', () => {
  if (cameraWindow && !cameraWindow.isDestroyed()) {
    cameraWindow.focus();
    return;
  }

  createCameraWindow();
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
      cameraWindow.setAlwaysOnTop(true);
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
      cameraWindow.setAlwaysOnTop(false);
    }
  } catch (error) {
    log.error('resetCameraWindow: ', error);
  }
});

// 读取初始化配置
ipcMain.handle('initialConfig', async () => {
  return localConfigs;
});

// 添加软件
ipcMain.handle('updateAppConfig', async (_, appName: string, base64Icon: string) => {
  const newApp: AppConfig = {
    name: appName,
    icon: base64Icon,
    shortcuts: [],
    version: 2
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
ipcMain.handle('updateShortcutConfig', async (_, appName: string, shortcut: Shortcut) => {
  const index = localConfigs.findIndex((appConfig) => appConfig.name === appName);
  if (index !== -1) {
    const appConfig = localConfigs[index];
    appConfig.shortcuts.push(shortcut)
    localConfigs[index] = appConfig;
    store.set('apps', localConfigs);
    return true;
  }
});

// 删除快捷键
ipcMain.handle('deleteShortcutConfig', async (_, appName, keyCombination: string) => {
  const index = localConfigs.findIndex((appConfig) => appConfig.name === appName);
  if (index !== -1) {
    const appConfig = localConfigs[index];
    appConfig.shortcuts = appConfig.shortcuts.filter((shortcut) => shortcut.keyCombination !== keyCombination);
    localConfigs[index] = appConfig;
    store.set('apps', localConfigs);
    return true;
  }
});

// 禁用快捷键
ipcMain.handle('toggleShortcutConfig', async (_, appName: string, shortcut: Shortcut) => {
  const index = localConfigs.findIndex((appConfig) => appConfig.name === appName);
  if (index !== -1) {
    const appConfig = localConfigs[index];
    shortcut.enabled = !shortcut.enabled;
    appConfig.shortcuts = appConfig.shortcuts.map((el) => el.keyCombination === shortcut.keyCombination ? shortcut : el);
    localConfigs[index] = appConfig;
    store.set('apps', localConfigs);
    return true;
  }
});

// 模拟键盘输入
ipcMain.on('triggerShortcut', (_, keyCombination: string) => {
  const SPECIAL_SHORTCUTS = new Map<string, () => void>([
    ["mouse_click (right)", () => robot.mouseClick('right', false)],
    ["Mouse Scroll", () => { }],
    ["Mouse Cursor", () => { }],
  ])
  try {
    const shortcutCallback = SPECIAL_SHORTCUTS.get(keyCombination);
    if (shortcutCallback) {
      shortcutCallback();
      return;
    }
    // 处理键盘快捷键
    const keys = keyCombination.split('+') as keys[];
    const validModifiers = ['alt', 'right_alt', 'command', 'control', 'left_control', 'right_control', 'shift', 'right_shift', 'win'];
    const modifiers = keys.filter((key: string) => validModifiers.includes(key));
    const nonModifierKeys = keys.filter((key: string) => !validModifiers.includes(key));
    nonModifierKeys.forEach((key: keys, index: number) => {
      robot.keyToggle(key, 'down', modifiers);
      if (index === nonModifierKeys.length - 1) {
        nonModifierKeys.forEach((key: keys) => robot.keyToggle(key, 'up', modifiers));
      }
    });
  } catch (error) {
    log.error("triggerShortcut", error);
  }
});

// 处理鼠标移动
ipcMain.on('triggerMouse', (_, delta: { x: number, y: number }, isLeftHand) => {
  try {
    if (isLeftHand) {
      // 左手触发滚轮
      robot.scrollMouse(delta.x / 2, delta.y / 2);
    } else {
      // 右手触发鼠标光标
      processMouseCursor(delta)
    }
  } catch (error) {
    log.error("triggerMouse", error);
  }
});

let lastMousePosition = { x: 0, y: 0 };
let clickTimer: NodeJS.Timeout | null = null;
let doubleClickTimer: NodeJS.Timeout | null = null;
function processMouseCursor(delta: { x: number, y: number }) {
  const mouse = robot.getMousePos();
  robot.moveMouseSmooth(mouse.x + delta.x, mouse.y + delta.y, 1);

  // 如果鼠标位置变化，则重置定时器
  if (lastMousePosition.x !== mouse.x || lastMousePosition.y !== mouse.y) {
    lastMousePosition = { x: mouse.x, y: mouse.y };
    resetTimers();
  }

  // 停留两秒触发左单击
  if (!clickTimer) {
    clickTimer = setTimeout(() => {
      robot.mouseClick('left', false);
      resetTimers();
    }, 2000);
  }

  // 停留四秒触发左双击
  if (!doubleClickTimer) {
    doubleClickTimer = setTimeout(() => {
      robot.mouseClick('left', true);
      resetTimers();
    }, 4000);
  }
}
function resetTimers() {
  if (clickTimer) {
    clearTimeout(clickTimer);
    clickTimer = null;
  }
  if (doubleClickTimer) {
    clearTimeout(doubleClickTimer);
    doubleClickTimer = null;
  }
}

// 打开外部链接
ipcMain.on('openExternalLink', (_, url) => {
  shell.openExternal(url);
});

/**
 * 进程判断 
 */
function runWindowMonitor() {
  let lastProcessName = "";
  const intervalId = setInterval(async () => {
    try {
      if (!cameraWindow || cameraWindow.isDestroyed()) {
        clearInterval(intervalId);
        return;
      }

      const windowInfo = await activeWindow();
      if (!windowInfo || !windowInfo.owner) return;

      const processName = windowInfo.owner.name;
      if (processName !== lastProcessName) {
        // 只有在进程名称改变时才发送
        cameraWindow.webContents.send('transmitProcess', processName);
        lastProcessName = processName;
      }
    } catch (error) {
      log.error('runWindowMonitor: ', error);
    }
  }, 1000);

  return intervalId;
}

// 提取软件的 icon
ipcMain.handle('getBase64Icon', async (_, appPath) => {
  try {
    const icon = await app.getFileIcon(appPath, { size: "large" });
    return icon.toPNG().toString("base64");
  } catch (err) {
    log.error("getIconBase64: ", err);
  }
});

ipcMain.handle('getProjectVersion', () => {
  const appPath = app.getAppPath();
  const packageJsonPath = path.join(appPath, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
});