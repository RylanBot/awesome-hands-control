export const HAND_IMG_PATHS: { left: string[]; right: string[] } = {
    left: [
        "Closed_Fist_Left",
        "Open_Palm_Left",
        "Thumb_Down_Left",
        "Thumb_Up_Left",
        "Victory_Left"
    ],
    right: [
        "Closed_Fist_Right",
        "Open_Palm_Right",
        "Thumb_Down_Right",
        "Thumb_Up_Right",
        "Victory_Right"
    ]
};

export const DEFAULT_SHORTCUTS = [
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

export const DEFAULT_CONFIG = [
    {
        name: 'Global',
        icon: "",
        shortcuts: DEFAULT_SHORTCUTS,
    }
];