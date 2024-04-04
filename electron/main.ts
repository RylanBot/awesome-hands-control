import { app, BrowserWindow, ipcMain, screen, shell } from 'electron';
import log from 'electron-log/main';

import { readFileSync } from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { triggerMouse, triggerShortcut } from './helpers/RobotService';
import ConfigStore, { deleteAppConfig, deleteShortcutConfig, loadInitialConfig, toggleShortcutConfig, updateAppConfig, updateShortcutConfig } from './stores/configStore';

import CameraWindow from './windows/CameraWindow';
import MainWindow from './windows/MainWindow';

import { Shortcut } from '../common/types/config';

global.__filename = fileURLToPath(import.meta.url)
global.__dirname = dirname(__filename)

process.env.DIST = path.join(__dirname, '../dist'); // 指向 dist-electron
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

process.on('uncaughtException', (error) => {
  log.error('uncaughtException', error);
});

let mainWindow: MainWindow | null = null;
let cameraWindow: CameraWindow | null = null;

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    mainWindow?.getWindow()?.destroy();
    cameraWindow?.getWindow()?.destroy();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = new MainWindow();
  }
});

app.whenReady().then(async () => {
  try {
    await loadInitialConfig();
    mainWindow = new MainWindow();
  } catch (error) {
    log.error("initialConfig", error);
  }
});

/* -------------------------------------------------- */

// 关闭窗口
ipcMain.on('close', (_, windowName) => {
  if (windowName === 'main') {
    app.quit();
    mainWindow?.getWindow()?.close();
    cameraWindow?.getWindow()?.close();
  }

  if (windowName === 'camera') {
    cameraWindow?.getWindow()?.close();
    cameraWindow?.getTray()?.destroy();
  }
});

// 最小化到任务栏
ipcMain.on('minimizeToTaskbar', (_, windowName) => {
  if (windowName === 'main') {
    mainWindow?.getWindow()?.minimize();
  }
});

// 开启摄像头
ipcMain.on('openCamera', () => {
  if (!cameraWindow?.getWindow()) {
    cameraWindow = new CameraWindow();
  } else {
    cameraWindow?.getWindow()?.focus();
  }
});

// 最小化到角落
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

      cameraWindow?.getWindow()?.setBounds({ x: x, y: y, width: width, height: height });
      cameraWindow?.getWindow()?.setAlwaysOnTop(true);
    }
  } catch (error) {
    log.error('minimizeToCorner', error);
  }
});

// 恢复相机窗口的位置
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

      cameraWindow?.getWindow()?.setBounds({ x: x, y: y, width: width, height: height });
      cameraWindow?.getWindow()?.setAlwaysOnTop(false);
    }
  } catch (error) {
    log.error('resetCameraWindow: ', error);
  }
});

// 读取初始化配置
ipcMain.handle('initialConfig', async () => {
  return ConfigStore();
});

// 添加软件
ipcMain.handle('updateAppConfig', async (_, appName: string, base64Icon: string) => {
  updateAppConfig(appName, base64Icon);
});

// 删除软件
ipcMain.handle('deleteAppConfig', async (_, appName) => {
  deleteAppConfig(appName)
});

// 添加软件绑定的快捷键
ipcMain.handle('updateShortcutConfig', async (_, appName: string, shortcut: Shortcut) => {
  updateShortcutConfig(appName, shortcut);
});

// 删除快捷键
ipcMain.handle('deleteShortcutConfig', async (_, appName, keyCombination: string) => {
  deleteShortcutConfig(appName, keyCombination);
});

// 禁用快捷键
ipcMain.handle('toggleShortcutConfig', async (_, appName: string, shortcut: Shortcut) => {
  toggleShortcutConfig(appName, shortcut)
});

// 模拟键盘输入
ipcMain.on('triggerShortcut', (_, keyCombination: string) => {
  triggerShortcut(keyCombination);
});

// 处理鼠标移动
ipcMain.on('triggerMouse', (_, delta: { x: number, y: number }, isLeftHand) => {
  triggerMouse(delta, isLeftHand);
});

// 打开外部链接
ipcMain.on('openExternalLink', (_, url) => {
  shell.openExternal(url);
});

// 提取软件的 icon
ipcMain.handle('getBase64Icon', async (_, appPath) => {
  try {
    const icon = await app.getFileIcon(appPath, { size: "large" });
    return icon.toPNG().toString("base64");
  } catch (err) {
    log.error("getIconBase64: ", err);
  }
});

// 读取项目版本
ipcMain.handle('getProjectVersion', () => {
  const appPath = app.getAppPath();
  const packageJsonPath = path.join(appPath, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
});