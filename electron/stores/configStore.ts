import log from 'electron-log/main';
import ElectronStore from "electron-store";

import { DEFAULT_CONFIG, DEFAULT_SHORTCUTS } from "@common/constants/config";
import type { AppConfig, AppConfigV0, Shortcut } from "@common/types/config";

let localConfig: AppConfig[] = [];

const LOCAL_APPS_KEY = 'apps';

const configStore = new ElectronStore({
    name: 'awesome-hands-config',
    fileExtension: 'json',
});

export function getLocalConfig() {
    return localConfig;
}

export async function loadInitialConfig() {
    /**
     * 适配 v1.0.x 之前的配置文件格式
     */
    const convertConfigFormat = (config: AppConfig[] | AppConfigV0[]): AppConfig[] => {
        const resConfig: AppConfig[] = [];
        config.forEach((el) => {
            if ('shortcuts' in el) {
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
                        shortcuts
                    });
                }
            }
        })
        return resConfig;
    }

    const config = configStore.get(LOCAL_APPS_KEY);
    if (!config) {
        localConfig = DEFAULT_CONFIG;
        configStore.set(LOCAL_APPS_KEY, localConfig);
    } else {
        localConfig = convertConfigFormat(config as AppConfig[] | AppConfigV0[]);
    }

    const globalIndex = localConfig.findIndex(config => config.name === 'Global');
    const globalConfig = localConfig[globalIndex];
    DEFAULT_SHORTCUTS.reverse().forEach(defaultShortcut => {
        if (!globalConfig.shortcuts.some(shortcut => shortcut.keyCombination === defaultShortcut.keyCombination)) {
            globalConfig.shortcuts.unshift(defaultShortcut);
        }
    });
    localConfig[globalIndex] = globalConfig;

    configStore.set(LOCAL_APPS_KEY, localConfig);
}

export function updateAppConfig(appName: string, base64Icon: string) {
    const newApp: AppConfig = {
        name: appName,
        icon: base64Icon,
        shortcuts: []
    };
    try {
        localConfig.push(newApp);
        configStore.set(LOCAL_APPS_KEY, localConfig);
    } catch (error) {
        log.error(error)
    }
}

export function deleteAppConfig(appName: string) {
    const appIndex = localConfig.findIndex((appConfig) => appConfig.name === appName);
    if (appIndex !== -1) {
        localConfig.splice(appIndex, 1);
        configStore.set(LOCAL_APPS_KEY, localConfig);
    }
}

export function updateShortcutConfig(appName: string, shortcut: Shortcut) {
    const appIndex = localConfig.findIndex((appConfig) => appConfig.name === appName);
    if (appIndex !== -1) {
        const appConfig = localConfig[appIndex];
        appConfig.shortcuts.push(shortcut)
        localConfig[appIndex] = appConfig;
        configStore.set(LOCAL_APPS_KEY, localConfig);
    }
}

function isTargetShortcut(a: Shortcut, b: Shortcut) {
    return a.keyCombination === b.keyCombination &&
        a.gestureLeft === b.gestureLeft &&
        a.gestureRight === b.gestureRight
}

export function deleteShortcutConfig(appName: string, shortcut: Shortcut) {
    const appIndex = localConfig.findIndex((appConfig) => appConfig.name === appName);
    if (appIndex !== -1) {
        const appConfig = localConfig[appIndex];
        appConfig.shortcuts = appConfig.shortcuts.filter((s) =>
            !isTargetShortcut(s, shortcut)
        );
        localConfig[appIndex] = appConfig;
        configStore.set(LOCAL_APPS_KEY, localConfig);
    }
}

export function toggleShortcutConfig(appName: string, shortcut: Shortcut) {
    const appIndex = localConfig.findIndex((appConfig) => appConfig.name === appName);
    if (appIndex !== -1) {
        const appConfig = localConfig[appIndex];
        const updatedShortcut = { ...shortcut, enabled: !shortcut.enabled };

        appConfig.shortcuts = appConfig.shortcuts.map((el) =>
            isTargetShortcut(el, shortcut) ? updatedShortcut : el
        );

        localConfig[appIndex] = appConfig;
        configStore.set(LOCAL_APPS_KEY, localConfig);
        return true;
    }
    return false;
}