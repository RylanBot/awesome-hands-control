import React, { useEffect, useRef, useState } from 'react';

import { XMarkIcon } from '@heroicons/react/24/solid';
import imagePaths from '../utils/hands-paths.json';

interface SettingModalProps {
    isVisible: boolean;
    onClose: () => void;
}

const SettingModal: React.FC<SettingModalProps> = ({ isVisible, onClose }) => {

    const [keysPressed, setKeysPressed] = useState(new Set<string>());
    const [keyCombination, setKeyCombination] = useState('');
    const [clearOnNextKey, setClearOnNextKey] = useState(false);
    const inputRef = useRef(null);

    const handleConfirmEdit = () => {
        setKeyCombination(''); // 清空
    };

    // 退出编辑模式保持原有设置
    const handleCancelEdit = () => {
        setKeyCombination('');
    };

    const [selectedLeftHandGesture, setSelectedLeftHandGesture] = useState<number>();
    const [selectedRightHandGesture, setSelectedRightHandGesture] = useState<number>();

    // 左手手势选择
    const handleLeftHandGestureSelect = (gesture: number) => {
        setSelectedLeftHandGesture(selectedLeftHandGesture === gesture ? undefined : gesture);
    };

    // 右手手势选择
    const handleRightHandGestureSelect = (gesture: number) => {
        setSelectedRightHandGesture(selectedRightHandGesture === gesture ? undefined : gesture);
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {

            if (document.activeElement === inputRef.current) {

                event.preventDefault(); // 防止触发游览器内置的快捷键（如 ctrl+shift+i 打开控制台

                if (clearOnNextKey) {
                    setKeysPressed(new Set());
                    setKeyCombination('');
                    setClearOnNextKey(false);
                }

                setKeysPressed(prevKeys => {
                    // 按键数量不超过三
                    const newKeys = new Set(prevKeys);
                    if (newKeys.size < 3) {
                        newKeys.add(event.key);
                        setKeyCombination(Array.from(newKeys).join('+'));
                    }
                    return newKeys;
                });
            }
        };

        const handleKeyUp = () => {
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
    }, [clearOnNextKey]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center">
            {/* 半透明遮罩 */}
            <div className="fixed inset-0 bg-black opacity-50"></div>

            <div className="bg-white p-8 rounded-lg shadow-2xl relative max-w-3xl w-full">
                {/* 关闭按钮 */}
                <div className='mb-6'>
                    <button onClick={onClose} className="absolute top-4 right-24 text-gray-500 hover:text-yellow-500 focus:outline-none">
                        Cancel
                    </button>
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-teal-500 focus:outline-none">
                        Apply
                    </button>
                </div>

                {/* 快捷键输入 */}
                <div className="flex items-center space-x-2 relative">
                    <input
                        type="text"
                        value={keyCombination}
                        readOnly
                        className="flex-grow border-2 border-gray-400 rounded-lg px-5 py-2 placeholder:font-normal placeholder:text-gray-400 text-teal-500 focus:ring-emerald-500 focus:ring-2 focus:border-transparent ml-2 mr-2 font-bold"
                        ref={inputRef}
                        autoFocus
                        placeholder='Input your shortcut'
                    />
                    <span className="absolute right-4 cursor-pointer rounded-full w-5 h-5 p-1 bg-red-200 hover:bg-red-300 shadow-md" onClick={handleCancelEdit}>
                        <XMarkIcon />
                    </span>
                </div>

                {/* 左手手势 */}
                <p className="text-xl font-semibold text-center mt-8 text-teal-600">Left Hand</p>
                <div className="flex flex-wrap justify-center gap-10">
                    {imagePaths.left.map((img, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <img src={img} className="w-24 h-24 object-cover" />
                            <input
                                type="checkbox"
                                name="leftHandGesture"
                                checked={selectedLeftHandGesture === index}
                                onChange={() => handleLeftHandGestureSelect(index)}
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
                            <img src={img} className="w-24 h-24 object-cover" />
                            <input
                                type="checkbox"
                                name="rightHandGesture"
                                checked={selectedRightHandGesture === index}
                                onChange={() => handleRightHandGestureSelect(index)}
                                className="form-radio h-5 w-5 checked:bg-teal-500 text-teal-500 focus:ring-transparent"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SettingModal;