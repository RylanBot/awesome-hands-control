import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/solid';

import { updateTimestamp } from '@/stores/configSlice';
import { RootState } from '@/stores/redux';
import { useDispatch, useSelector } from 'react-redux';

import { normalizeKeyCode } from "@/helpers/KeyboardUtils";

import { HAND_IMG_PATHS, MOUSE_CLICK_RIGHT } from '@common/constants/config';
import type { AppConfig, Shortcut } from '@common/types/config';

/**
 * 全局设置的特定操作
 */
const controlKeys = [
    MOUSE_CLICK_RIGHT,
    'audio_vol_down', 'audio_vol_up', 'audio_pause',
    'audio_mute', 'audio_prev', 'audio_next'
];

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

    // 下拉菜单选择操作
    function selectKeyFromDropdown(key: string) {
        setKeyCombination(key);
        toggleDropdown();
    }

    // 输入框激活
    function handleInputClick() {
        if (isDropdownOpen) { setIsDropdownOpen(false); }
        if (inputError) { setInputError('') }
    }

    // 手势选择
    function handleHandSelect(handType: 'left' | 'right', gestureName: string) {
        setInputError('');
        setHands(prevHands => ({
            ...prevHands,
            [handType]: prevHands[handType] === gestureName ? '' : gestureName
        }));
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

        const shortcut: Shortcut = {
            keyCombination,
            enabled: true,
            gestureLeft: hands.left,
            gestureRight: hands.right,
            removable: true
        }

        await window.configApi.updateShortcutConfig(software!, shortcut);
        dispatch(updateTimestamp());
        onClose();
    }

    /**
     * 提取图片文件名中对应的手势
     *（去除 Left/Right 后缀）
     */
    function extractGestureName(gestureName: string) {
        const nameParts = gestureName.split('_');
        nameParts.pop();
        return nameParts.join('_');
    }

    /**
     * 在当前软件下查询是否有重复的配置 
     * (支持不同手势对应相同的快捷键，但拒绝使用相同的手势)
     */
    function checkDuplicateSetting(): boolean {
        const currentConfig: AppConfig | undefined = appConfigs.find(appConfig => appConfig.name === software);
        if (currentConfig) {
            const shortcuts = currentConfig.shortcuts;
            for (const shortcut of shortcuts) {
                if (shortcut.gestureLeft === hands.left && shortcut.gestureRight === hands.right) {
                    return true;
                }
            }
        }
        return false;
    }

    // 处理键盘输入
    useEffect(() => {
        const handleKeyDown = async (event: KeyboardEvent) => {
            if (document.activeElement !== inputRef.current) return;
            event.preventDefault();

            if (inputError) {
                setInputError('');
            }
            if (clearOnNextKey) {
                setKeyCombination('');
                setClearOnNextKey(false);
            }

            const keyToAdd = await normalizeKeyCode(event.code);
            console.log('keyToAdd', event.code, keyToAdd);

            setKeyCombination(prevCombination => {
                let keys = prevCombination ? prevCombination.split('+') : [];

                if (!keys.includes(keyToAdd)) {
                    keys.push(keyToAdd);
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
        }

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
                    {HAND_IMG_PATHS.left.map((img, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <img src={`./images/hands/${img}.png`} className="w-24 h-24 object-cover" />
                            <input
                                type="checkbox"
                                name="leftHandGesture"
                                checked={hands.left === extractGestureName(HAND_IMG_PATHS.left[index])}
                                onChange={() => handleHandSelect('left', extractGestureName(HAND_IMG_PATHS.left[index]))}
                                className="form-radio h-5 w-5 checked:bg-teal-500 text-teal-500 focus:ring-transparent"
                            />
                        </div>
                    ))}
                </div>
                {/* 右手手势 */}
                <p className="text-xl font-semibold text-center mt-8 text-teal-600">Right Hand</p>
                <div className="flex flex-wrap justify-center gap-10">
                    {HAND_IMG_PATHS.right.map((img, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <img src={`./images/hands/${img}.png`} className="w-24 h-24 object-cover" />
                            <input
                                type="checkbox"
                                alt={img}
                                name="rightHandGesture"
                                checked={hands.right === extractGestureName(HAND_IMG_PATHS.right[index])}
                                onChange={() => handleHandSelect('right', extractGestureName(HAND_IMG_PATHS.right[index]))}
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