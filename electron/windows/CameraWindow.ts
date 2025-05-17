import { BrowserWindow, Tray } from 'electron';
import { activeWindow } from 'get-windows';
import path from 'node:path';

import { VITE_DEV_SERVER_URL, iconSuffix } from '@common/constants/environment';

class CameraWindow {
    private window: BrowserWindow | null = null;
    private tray: Tray | null = null;

    private monitorIntervalId: NodeJS.Timeout | null = null;

    constructor() {
        this.createWindow();
    }

    private createWindow(): void {
        this.window = new BrowserWindow({
            icon: path.join(process.env.VITE_PUBLIC! as string, `./images/icons/CameraWindow.${iconSuffix}`),
            webPreferences: {
                preload: path.join(__dirname, 'preload.mjs'),
                nodeIntegration: false,
                contextIsolation: true,
            },
            autoHideMenuBar: true,
            frame: false,
            width: 850,
            height: 600,
            skipTaskbar: true,
            resizable: false,
        });

        if (VITE_DEV_SERVER_URL) {
            this.window.loadURL(`${VITE_DEV_SERVER_URL}#/camera`);
        } else {
            this.window.loadFile(path.join(process.env.DIST!, 'index.html'))
        }

        this.window.setAlwaysOnTop(true);
        this.createTray();

        this.window.on('ready-to-show', () => {
            this.window?.webContents.send('identifyWindow', 'camera');
            this.monitorIntervalId = this.runWindowMonitor();
        })

        this.window.on('closed', () => {
            if (this.monitorIntervalId) {
                clearInterval(this.monitorIntervalId);
            }
            this.window = null;
            if (this.tray) {
                this.tray.destroy();
                this.tray = null;
            }
        });
    }

    private createTray(): void {
        const trayIcon = path.join(process.env.VITE_PUBLIC! as string, `./images/icons/CameraTray.png`);
        this.tray = new Tray(trayIcon);
        this.tray.setToolTip('Awesome Hands');
    }

    private runWindowMonitor(): NodeJS.Timeout {
        let lastProcessName = "";
        const intervalId = setInterval(async () => {
            try {
                if (!this.window || this.window.isDestroyed()) {
                    clearInterval(intervalId);
                    return;
                }

                const windowInfo = await activeWindow();
                if (!windowInfo || !windowInfo.owner) return;

                const processName = windowInfo.owner.name;
                if (processName !== lastProcessName) {
                    // 只有在进程名称改变时才发送
                    this.window.webContents.send('transmitProcess', processName);
                    lastProcessName = processName;
                }
            } catch (error) {
                // log.error('runWindowMonitor', error);
            }
        }, 1000);

        return intervalId;
    }

    getWindow(): BrowserWindow | null {
        return this.window;
    }

    getTray(): Tray | null {
        return this.tray;
    }
}

export default CameraWindow;