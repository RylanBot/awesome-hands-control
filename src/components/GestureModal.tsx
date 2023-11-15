import React from 'react';

// 放在 public 下无法读取？
import imagePaths from '../utils/hands-paths.json';

interface GestureModalProps {
    isVisible: boolean;
    onClose: () => void;
}

export const GestureModal: React.FC<GestureModalProps> = ({ isVisible, onClose }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            {/* 半透明遮罩 */}
            <div className="fixed inset-0  Ct-0 bg-black opacity-50"></div>

            <div className="bg-white p-8 rounded-lg shadow-2xl relative max-w-3xl w-full">
                {/* 关闭按钮 */}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none">
                    &times;
                </button>

                {/* 左手手势 */}
                <h1 className="text-2xl font-semibold mb-4 text-center">Left Hand</h1>
                <div className="flex flex-wrap justify-center gap-4 mb-8 items-center">
                    {imagePaths.left.map((img, index) => (
                        <img key={index} src={img} alt={`Gesture ${index}`} className="w-24 h-24 object-cover" />
                    ))}
                </div>

                {/* 右手手势 */}
                <h1 className="text-2xl font-semibold mb-4 text-center">Right Hand</h1>
                <div className="flex flex-wrap justify-center gap-4 items-center">
                    {imagePaths.right.map((img, index) => (
                        <img key={index} src={img} alt={`Gesture ${index}`} className="w-24 h-24 object-cover" />
                    ))}
                </div>
            </div>
        </div>
    );
}
