import robot, { keys } from '@hurdlegroup/robotjs';
import log from 'electron-log/main';

let lastMousePosition = { x: 0, y: 0 };
let clickTimer: NodeJS.Timeout | null = null;
let doubleClickTimer: NodeJS.Timeout | null = null;

export function triggerShortcut(keyCombination: string) {
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
        log.error('triggerShortcut', error);
    }
}

export function triggerMouse(delta: { x: number, y: number }, isLeftHand: boolean) {
    const processCursor = (delta: { x: number, y: number }) => {
        const mouse = robot.getMousePos();
        robot.moveMouseSmooth(mouse.x + delta.x, mouse.y + delta.y, 1);

        const resetTimers = () => {
            if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
            if (doubleClickTimer) { clearTimeout(doubleClickTimer); doubleClickTimer = null; }
        }

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

    try {
        if (isLeftHand) {
            // 左手触发滚轮
            robot.scrollMouse(delta.x / 2, delta.y / 2);
        } else {
            // 右手触发鼠标光标
            processCursor(delta)
        }
    } catch (error) {
        log.error("triggerMouse", error);
    }
}