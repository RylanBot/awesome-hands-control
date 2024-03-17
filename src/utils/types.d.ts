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
    version: number;
}