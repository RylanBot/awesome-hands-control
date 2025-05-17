import robot, { Keys } from '@hurdlegroup/robotjs';
import log from 'electron-log/main';

import { MOUSE_CLICK_RIGHT, MOUSE_CURSOR, MOUSE_SCROLL } from '@common/constants/config';

const VALID_MODIFIERS = ['alt', 'right_alt', 'command', 'control', 'left_control', 'right_control', 'shift', 'right_shift', 'win'];

const SPECIAL_SHORTCUTS = new Map<string, () => void>([
    [MOUSE_CLICK_RIGHT, () => robot.mouseClick('right', false)],
    [MOUSE_SCROLL, () => { }],
    [MOUSE_CURSOR, () => { }],
])

export function triggerShortcut(keyCombination: string) {
    try {
        const shortcutCallback = SPECIAL_SHORTCUTS.get(keyCombination);
        if (shortcutCallback) {
            shortcutCallback();
            return;
        }
        const keys = keyCombination.split('+') as Keys[];

        // 修饰键
        const modifiers = keys.filter((key) => VALID_MODIFIERS.includes(key));
        // 非修饰键
        const nonModifierKeys = keys.filter((key) => !VALID_MODIFIERS.includes(key));

        // 如果只有一个键且没有修饰符
        if (nonModifierKeys.length === 1 && modifiers.length === 0) {
            robot.keyTap(nonModifierKeys[0]);
            return;
        }

        // 否则模拟组合键
        nonModifierKeys.forEach((key, index) => {
            robot.keyToggle(key, 'down', modifiers);
            if (index === nonModifierKeys.length - 1) {
                nonModifierKeys.forEach((key) => robot.keyToggle(key, 'up', modifiers));
            }
        });
    } catch (error) {
        log.error('triggerShortcut', error);
    }
}

export const triggerMouse = (() => {
    let lastMousePosition = { x: 0, y: 0 };
    let clickTimer: NodeJS.Timeout | null = null;
    let doubleClickTimer: NodeJS.Timeout | null = null;

    const resetTimers = () => {
        if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
        if (doubleClickTimer) { clearTimeout(doubleClickTimer); doubleClickTimer = null; }
    };

    return (delta: { x: number, y: number }, isLeftHand: boolean) => {
        try {
            if (isLeftHand) {
                robot.scrollMouse(delta.x / 2, delta.y / 2);
            } else {
                const mouse = robot.getMousePos();
                robot.moveMouseSmooth(mouse.x + delta.x, mouse.y + delta.y, 1);

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
        } catch (error) {
            log.error("triggerMouse", error);
        }
    };
})();