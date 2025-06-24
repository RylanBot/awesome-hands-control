const KEYS_MAPPINGS = new Map<string, string>(
        [
                ["NumLock", "numpad_lock"],
                ["Numpad0", "numpad_0"],
                ["Numpad1", "numpad_1"],
                ["Numpad2", "numpad_2"],
                ["Numpad3", "numpad_3"],
                ["Numpad4", "numpad_4"],
                ["Numpad5", "numpad_5"],
                ["Numpad6", "numpad_6"],
                ["Numpad7", "numpad_7"],
                ["Numpad8", "numpad_8"],
                ["Numpad9", "numpad_9"],
                ["NumpadSubtract", "numpad_-"],
                ["NumpadAdd", "numpad_+"],
                ["NumpadMultiply", "numpad_*"],
                ["NumpadDivide", "numpad_/"],
                ["NumpadDecimal", "numpad_."],
                ["AltLeft", "alt"],
                ["ControlLeft", "left_control"],
                ["MetaLeft", "command"],
                ["ShiftLeft", "shift"],
                ["AltRight", "right_alt"],
                ["ControlRight", "right_control"],
                ["MetaRight", "command"],
                ["ShiftRight", "right_shift"],
                ["ArrowUp", "up"],
                ["ArrowDown", "down"],
                ["ArrowLeft", "left"],
                ["ArrowRight", "right"],
        ]
)

/**
 * 将键盘输入转换为 `robotjs` 能识别的格式
 */
export async function normalizeKeyCode(keyCode: string) {
        const keyboardLayoutMap = await navigator.keyboard.getLayoutMap();
        const correspondingKey = keyboardLayoutMap.get(keyCode);
        if (correspondingKey) {
                return correspondingKey.replaceAll(/^Key|^Digit/g, "").toLowerCase();
        }
        if (KEYS_MAPPINGS.has(keyCode)) {
                return KEYS_MAPPINGS.get(keyCode) as string;
        } else {
                return keyCode.toLowerCase();
        }
}