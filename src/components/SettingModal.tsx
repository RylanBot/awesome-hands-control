import React, { useEffect, useRef, useState } from 'react';

import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { AppConfig, updateTimestamp } from '../stores/configSlice';
import { RootState } from '../types/redux';
import imagePaths from '../utils/hands-paths.json';

// 键盘直接输入
const keyboardKeys = [
    'backspace', 'delete', 'tab', 'up', 'down', 'right', 'left',
    'pageup', 'pagedown', 'command', 'alt', 'control', 'shift', 'space',
    'numpad_0', 'numpad_1', 'numpad_2', 'numpad_3', 'numpad_4',
    'numpad_5', 'numpad_6', 'numpad_7', 'numpad_8', 'numpad_9',
    'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12',
];

// 特定事件
const controlKeys = [
    'audio_vol_down', 'audio_vol_up', 'audio_pause',
    // 'audio_play', 'audio_stop', 'printscreen', 
    'audio_mute', 'audio_prev', 'audio_next',
    'Mouse Click', 'Mouse Double Click'
];

// 鼠标子选项
const mouseOptions = [
    'left', 'right', 'middle',
];

const SettingModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {

    const { software } = useParams();
    const dispatch = useDispatch();
    const appConfigs: AppConfig[] = useSelector((state: RootState) => state.config.apps);

    const [_, setKeysPressed] = useState(new Set<string>());
    const [keyCombination, setKeyCombination] = useState('');
    const [clearOnNextKey, setClearOnNextKey] = useState(false);
    const inputRef = useRef(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMouseOption, setIsMouseOption] = useState(false);
    const [selectedControlKey, setSelectedControlKey] = useState('');

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
    const toggleMouseOption = () => setIsMouseOption(!isMouseOption);

    // 从下拉菜单选择
    function selectKeyFromDropdown(key: string) {
        if (key === 'Mouse Click' || key === 'Mouse Double Click') {
            toggleMouseOption()
            setSelectedControlKey(key);
        } else {
            setKeyCombination(key);
            toggleDropdown();
        }
    };

    // 添加鼠标子选项
    function handleMouseOptionSelect(option: string) {
        setKeyCombination(`${selectedControlKey} (${option})`);
        setSelectedControlKey('');
        toggleMouseOption();
        toggleDropdown();
    }

    function handleInputClick() {
        if (isDropdownOpen) {
            setIsDropdownOpen(false);
        }
        if (isMouseOption) {
            setIsMouseOption(false);
        }
    };

    // 手势绑定
    const [selectedLeftHandIndex, setSelectedLeftHandIndex] = useState<number>();
    const [selectedRightHandIndex, setSelectedRightHandIndex] = useState<number>();
    const [selectedLeftHandName, setSelectedLeftHandName] = useState<string>("");
    const [selectedRightHandName, setSelectedRightHandName] = useState<string>("");

    // 提取图片文件名中对应的手势（去除 Left/Right 后缀）
    function extractGestureName(gestureName: string) {
        const nameParts = gestureName.split('_');
        nameParts.pop();
        return nameParts.join('_');
    }

    // 左手手势选择
    function handleLeftHandSelect(gestureIndex: number) {
        setInputError('');
        if (selectedLeftHandIndex === gestureIndex) {
            setSelectedLeftHandIndex(undefined)  // 再次点击变为取消选择
            setSelectedLeftHandName("")
        } else {
            setSelectedLeftHandIndex(gestureIndex)
            const gestureName = extractGestureName(imagePaths.left[gestureIndex])!;
            setSelectedLeftHandName(gestureName);
        }
    };

    // 右手手势选择
    function handleRightHandSelect(gestureIndex: number) {
        setInputError('');
        if (selectedRightHandIndex === gestureIndex) {
            setSelectedRightHandIndex(undefined)
            setSelectedRightHandName("");
        } else {
            setSelectedRightHandIndex(gestureIndex)
            const gestureName = extractGestureName(imagePaths.left[gestureIndex])!;
            setSelectedRightHandName(gestureName);
        }
    };

    const [inputError, setInputError] = useState('');
    // 确认添加
    async function handleConfirmApply() {
        // 检查输入是否为空
        if (!keyCombination) {
            setInputError('Input cannot be empty');
            return;
        }
        if (selectedLeftHandName === '' && selectedRightHandName === '') {
            setInputError('Choose at least one gesture');
            return;
        }

        // 检查是否有重复的手势绑定
        const isDuplicateGesture = checkDuplicateSetting()
        if (isDuplicateGesture) {
            setInputError('Setting already exists');
            return;
        }

        const applySuccess = await window.configApi.updateShortcutConfig(software!, keyCombination, selectedLeftHandName, selectedRightHandName)
        if (applySuccess) {
            dispatch(updateTimestamp());
        }

        onClose();
    }

    // 在当前软件下查询是否有重复的配置
    // 支持不同手势对应相同的快捷键，但拒绝使用相同的手势
    function checkDuplicateSetting(): boolean {
        const currentConfig: AppConfig | undefined = appConfigs.find(appConfig => appConfig.name === software);
        if (currentConfig) {
            const shortcuts = currentConfig.shortcut;
            for (const [shortcut, [left, right]] of Object.entries(shortcuts)) {
                if (shortcut === keyCombination || (left === selectedLeftHandName && right === selectedRightHandName)) {
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

    // 处理键盘输入绑定快捷键
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (document.activeElement === inputRef.current) {
                event.preventDefault();

                if (inputError) {
                    setInputError('');
                }

                if (clearOnNextKey) {
                    setKeysPressed(new Set());
                    setKeyCombination('');
                    setClearOnNextKey(false);
                }

                let keyToAdd = event.key;

                // 将 Shift + 数字键的符号映射回数字
                const shiftNumKeyMap: { [key: string]: string } = {
                    '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0'
                };
                if (event.shiftKey && shiftNumKeyMap[keyToAdd as keyof typeof shiftNumKeyMap]) {
                    keyToAdd = shiftNumKeyMap[keyToAdd as keyof typeof shiftNumKeyMap];
                }

                // 将方向键转换为 robotjs 能识别的格式
                const directionKeyMap: { [key: string]: string } = {
                    'ArrowUp': 'up',
                    'ArrowDown': 'down',
                    'ArrowLeft': 'left',
                    'ArrowRight': 'right'
                };
                if (directionKeyMap[keyToAdd]) {
                    keyToAdd = directionKeyMap[keyToAdd];
                }

                // 如果是数字键，添加 'numpad_' 前缀
                if (!isNaN(Number(keyToAdd)) && keyToAdd.trim() !== '') {
                    keyToAdd = 'numpad_' + keyToAdd;
                }

                // 处理特殊键，如空格键
                if (keyToAdd === ' ') {
                    keyToAdd = 'space';
                }

                if (!isValidKey(keyToAdd)) {
                    return;
                }

                setKeysPressed(prevKeys => {
                    const newKeys = new Set(prevKeys);
                    if (newKeys.size < 3) {
                        newKeys.add(keyToAdd.toLowerCase());
                        setKeyCombination(Array.from(newKeys).join('+'));
                    }
                    return newKeys;
                });
            }
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
                    <button onClick={() => onClose()} className="absolute top-4 right-24 text-gray-500 hover:text-yellow-500 focus:outline-none">
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

                    {/* 下拉框 */}
                    {software === "Global" && (
                        <>
                            <span className="absolute left-4 cursor-pointer rounded-full w-5 h-5 p-1 bg-green-200 hover:bg-green-300 shadow-md"
                                onClick={() => {
                                    toggleDropdown();
                                    if (isMouseOption) { toggleMouseOption() }
                                }}>
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
                            {/* 鼠标子选项 */}
                            {isMouseOption && (
                                <div className="absolute left-[168px] top-[230px] rounded-md shadow-lg bg-white z-10">
                                    <div className="py-1">
                                        {mouseOptions.map(option => (
                                            <a
                                                key={option}
                                                onClick={() => handleMouseOptionSelect(option)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                            >
                                                {option}
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
                                checked={selectedLeftHandIndex === index}
                                onChange={() => handleLeftHandSelect(index)}
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
                                checked={selectedRightHandIndex === index}
                                onChange={() => handleRightHandSelect(index)}
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