import React, { useEffect, useRef, useState } from 'react';

import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { updateTimestamp } from '../stores/configSlice';
import { RootState } from '../stores/redux';
import imagePaths from '../utils/hands-paths.json';

// 允许接受的键盘输入按键
const keyboardKeys = [
    'backspace', 'delete', 'tab', 'up', 'down', 'right', 'left',
    'pageup', 'pagedown', 'command', 'alt', 'control', 'shift', 'space',
    'numpad_0', 'numpad_1', 'numpad_2', 'numpad_3', 'numpad_4',
    'numpad_5', 'numpad_6', 'numpad_7', 'numpad_8', 'numpad_9',
    'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12',
];

// 全局设置的特定操作
const controlKeys = [
    'mouse_click (right)',
    'audio_vol_down', 'audio_vol_up', 'audio_pause',
    'audio_mute', 'audio_prev', 'audio_next'
];

// 方向键映射
const directionKeyMap: { [key: string]: string } = {
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'ArrowLeft': 'left',
    'ArrowRight': 'right'
};

// 将 Shift + 符号映射回数字
const shiftNumKeyMap: { [key: string]: string } = {
    '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0'
};

const SettingModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { software } = useParams();
    const dispatch = useDispatch();
    const appConfigs: AppConfig[] = useSelector((state: RootState) => state.config.apps);

    // 快捷键输入
    const inputRef = useRef(null);
    const [keyCombination, setKeyCombination] = useState('');
    // 清空输入
    const [clearOnNextKey, setClearOnNextKey] = useState(false);
    // 异常提醒
    const [inputError, setInputError] = useState('');
    // 下拉清单
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    // 手势绑定
    const [hands, setHands] = useState({ left: '', right: '' });

    // 下拉菜单开关
    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

    // 输入框激活
    function handleInputClick() {
        if (isDropdownOpen) { setIsDropdownOpen(false); }
        if (inputError) { setInputError('') }
    };

    // 下拉菜单选择操作
    function selectKeyFromDropdown(key: string) {
        setKeyCombination(key);
        toggleDropdown();
    };

    // 手势选择
    function handleHandSelect(handType: 'left' | 'right', gestureName: string) {
        setInputError('');
        setHands(prevHands => ({
            ...prevHands,
            [handType]: prevHands[handType] === gestureName ? '' : gestureName
        }));
    }

    // 提取图片文件名中对应的手势（去除 Left/Right 后缀）
    function extractGestureName(gestureName: string) {
        const nameParts = gestureName.split('_');
        nameParts.pop();
        return nameParts.join('_');
    }

    // 确认添加
    async function handleConfirmApply() {
        // 检查输入是否为空
        if (!keyCombination) {
            setInputError('Input cannot be empty');
            return;
        }
        if (hands.left === '' && hands.right === '') {
            setInputError('Choose at least one gesture');
            return;
        }

        // 检查是否有重复的手势绑定
        const isDuplicateGesture = checkDuplicateSetting()
        if (isDuplicateGesture) {
            setInputError('Setting already exists');
            return;
        }

        const applySuccess = await window.configApi.updateShortcutConfig(software!, keyCombination, hands.left, hands.right)
        if (applySuccess) {
            dispatch(updateTimestamp());
        }

        onClose();
    }

    // 在当前软件下查询是否有重复的配置 (支持不同手势对应相同的快捷键，但拒绝使用相同的手势)
    function checkDuplicateSetting(): boolean {
        const currentConfig: AppConfig | undefined = appConfigs.find(appConfig => appConfig.name === software);
        if (currentConfig) {
            const shortcuts = currentConfig.shortcut;
            for (const [shortcut, [left, right]] of Object.entries(shortcuts)) {
                if (shortcut === keyCombination || (left === hands.left && right === hands.right)) {
                    return true;
                }
            }
        }

        return false;
    }

    // 支持的键盘输入
    function isValidKey(key: string): boolean {
        // 检查 key 是否是单个字母
        if (key.length === 1 && key.match(/[a-z]/i)) {
            return true;
        }

        return keyboardKeys.includes(key.toLowerCase());
    };

    // 处理键盘输入
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (document.activeElement !== inputRef.current) return;
            event.preventDefault();

            if (inputError) { setInputError(''); }
            if (clearOnNextKey) {
                setKeyCombination('');
                setClearOnNextKey(false);
            }

            let keyToAdd = event.key;
            // 映射为 robotjs 识别的格式
            // 1. 符号转为对应数字
            if (event.shiftKey && shiftNumKeyMap[keyToAdd as keyof typeof shiftNumKeyMap]) {
                keyToAdd = shiftNumKeyMap[keyToAdd as keyof typeof shiftNumKeyMap];
            }
            // 2. 方向键
            if (directionKeyMap[keyToAdd]) {
                keyToAdd = directionKeyMap[keyToAdd];
            }
            // 3. 数字键添加 'numpad_' 前缀
            if (!isNaN(Number(keyToAdd)) && keyToAdd.trim() !== '') {
                keyToAdd = 'numpad_' + keyToAdd;
            }
            // 4. 处理特殊键，如空格键
            if (keyToAdd === ' ') { keyToAdd = 'space'; }
            // 处理完如果仍不匹配，则拒绝
            if (!isValidKey(keyToAdd)) {
                return;
            }

            setKeyCombination(prevCombination => {
                let keys = prevCombination ? prevCombination.split('+') : [];

                if (!keys.includes(keyToAdd.toLowerCase())) {
                    keys.push(keyToAdd.toLowerCase());
                }
                // 最多支持三个键连续输入
                if (keys.length > 3) {
                    keys = keys.slice(-3);
                }
                return keys.join(keys.length > 1 ? '+' : '');
            });
        };

        function handleKeyUp() {
            if (document.activeElement === inputRef.current) {
                setClearOnNextKey(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [clearOnNextKey, inputError]);


    const placeholderText = software === "Global" ? "Input your shortcut or select a operation" : "Input your shortcut";
    return (
        <div className="fixed inset-0 flex items-center justify-center">
            {/* 半透明遮罩 */}
            <div className="fixed inset-0 bg-black opacity-50"></div>

            <div className="bg-white p-8 rounded-lg shadow-2xl relative max-w-3xl w-full">
                {/* 关闭按钮 */}
                <div className='mb-6'>
                    <button onClick={() => onClose()} className="absolute top-4 right-24 text-gray-500 hover:text-yellow-900 focus:outline-none">
                        Cancel
                    </button>
                    <button onClick={handleConfirmApply} className="absolute top-4 right-4 text-gray-500 hover:text-teal-500 focus:outline-none">
                        Apply
                    </button>
                </div>

                {/* 绑定操控事件 */}
                <div className="flex items-center space-x-2 relative">
                    {/* 快捷键输入 */}
                    <input
                        type="text"
                        value={keyCombination}
                        readOnly
                        className={`{flex-grow w-full border-2 border-gray-400 rounded-lg ${software === "Global" ? 'pl-12' : 'pl-4'} px-12 py-2 placeholder:font-normal placeholder:text-gray-400 text-teal-500 focus:ring-emerald-500 focus:ring-2 focus:border-transparent ml-2 mr-2 font-bold}`}
                        ref={inputRef}
                        autoFocus
                        placeholder={placeholderText}
                        onClick={handleInputClick}
                    />
                    {/* 错误信息提示 */}
                    {inputError && <span className="text-sm font-semibold text-red-500 absolute right-12">{inputError}</span>}
                    {/* 清空输入 */}
                    <span className="absolute right-4 cursor-pointer rounded-full w-5 h-5 p-1 bg-red-200 hover:bg-red-300 shadow-md"
                        onClick={() => { setKeyCombination(''); setInputError('') }}>
                        <XMarkIcon />
                    </span>

                    {/* 下拉框（只开放给全局设置） */}
                    {software === "Global" && (
                        <>
                            <span className="absolute left-4 cursor-pointer rounded-full w-5 h-5 p-1 bg-green-200 hover:bg-green-300 shadow-md"
                                onClick={() => { toggleDropdown() }}>
                                <ChevronDownIcon />
                            </span>
                            {isDropdownOpen && (
                                <div className="absolute top-[50px] rounded-md shadow-lg bg-white z-10">
                                    <div className="py-1">
                                        {controlKeys.map(key => (
                                            <a
                                                key={key}
                                                onClick={() => selectKeyFromDropdown(key)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                            >
                                                {key}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* 左手手势 */}
                <p className="text-xl font-semibold text-center mt-8 text-teal-600">Left Hand</p>
                <div className="flex flex-wrap justify-center gap-10">
                    {imagePaths.left.map((img, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <img src={`./images/hands/${img}.png`} className="w-24 h-24 object-cover" />
                            <input
                                type="checkbox"
                                name="leftHandGesture"
                                checked={hands.left === extractGestureName(imagePaths.left[index])}
                                onChange={() => handleHandSelect('left', extractGestureName(imagePaths.left[index]))}
                                className="form-radio h-5 w-5 checked:bg-teal-500 text-teal-500 focus:ring-transparent"
                            />
                        </div>
                    ))}
                </div>
                {/* 右手手势 */}
                <p className="text-xl font-semibold text-center mt-8 text-teal-600">Right Hand</p>
                <div className="flex flex-wrap justify-center gap-10">
                    {imagePaths.right.map((img, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <img src={`./images/hands/${img}.png`} className="w-24 h-24 object-cover" />
                            <input
                                type="checkbox"
                                alt={img}
                                name="rightHandGesture"
                                checked={hands.right === extractGestureName(imagePaths.right[index])}
                                onChange={() => handleHandSelect('right', extractGestureName(imagePaths.right[index]))}
                                className="form-radio h-5 w-5 checked:bg-teal-500 text-teal-500 focus:ring-transparent"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
};

export default SettingModal;