/**
 * @deprecated v1.0.x 的配置文件格式
 */
export type AppConfigV0 = {
    name: string;
    icon: string;
    shortcut: {
        [shortcutName: string]: [string, string];
    };
}

export type Shortcut = {
    keyCombination: string;
    gestureLeft?: string;
    gestureRight?: string;
    enabled: boolean;
    removable: boolean;
}

export type AppConfig = {
    name: string;
    icon: string;
    shortcuts: Shortcut[];
}