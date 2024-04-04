import { BrowserWindow } from 'electron';
import path from 'node:path';

import { VITE_DEV_SERVER_URL, iconSuffix } from '../../common/constants/environment';

class MainWindow {
    private window: BrowserWindow | null = null;

    constructor() {
        this.createWindow();
    }

    private createWindow(): void {
        this.window = new BrowserWindow({
            icon: path.join(process.env.VITE_PUBLIC!, `/images/icons/MainWindow.${iconSuffix}`),
            webPreferences: {
                preload: path.join(__dirname, 'preload.mjs'),
                nodeIntegration: false,
                contextIsolation: true,
                backgroundThrottling: false
            },
            autoHideMenuBar: true,
            frame: false,
            width: 850,
            height: 600,
            resizable: false
        });

        if (VITE_DEV_SERVER_URL) {
            this.window.loadURL(`${VITE_DEV_SERVER_URL}#/main`);
        } else {
            this.window.loadFile(path.join(process.env.DIST!, 'index.html'))
        }

        this.window.on('ready-to-show', () => {
            this.window?.webContents.send('identifyWindow', 'main');
        });
    }

    getWindow(): BrowserWindow | null {
        return this.window;
    }
}

export default MainWindow;