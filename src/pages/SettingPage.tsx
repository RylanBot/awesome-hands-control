import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { GestureModal } from '../components/GestureModal';

import { ArrowSmallLeftIcon, PlusIcon } from '@heroicons/react/24/solid';

// 修改的时候，摄像机不能开？
const SettingModal: React.FC = () => {
    const navigate = useNavigate();

    const [showLeftList, setShowLeftList] = useState(false);
    const [showRightList, setShowRightList] = useState(false);
    const [isModalVisible, setModalVisible] = useState(false);

    const toggleList = (fromRight: boolean) => {
        if (fromRight) {
            setShowRightList(prev => !prev);
        } else {
            setShowLeftList(prev => !prev);
        }
    }

    return (
        <>
            <div className='bg-gray-200 min-h-screen'>
                {/* 返回按钮 */}
                <button
                    onClick={() => navigate(-1)}
                    className="fixed top-4 left-4 rounded-full w-8 h-8 bg-gray-200 hover:bg-gray-300 shadow-md"
                >
                    <ArrowSmallLeftIcon />
                </button>

                {/* 添加新手势按钮 */}
                <button
                    onClick={() => setModalVisible(true)}
                    className="fixed bottom-4 right-4 rounded-full w-10 h-10 bg-green-400 text-white hover:bg-green-500 shadow-md"
                >
                    <PlusIcon />
                </button>


                {/* 已绑定的手势卡片 */}
                <div className="flex flex-col items-center space-y-4 py-16 px-12"> {/* Added padding-top here */}
                    <div className="flex w-full justify-between space-x-8 max-w-4xl ">
                        {/* 左手 */}
                        <div className="flex flex-col p-6 space-y-4 bg-white rounded-lg shadow-md w-1/2">
                            <h3 className="text-xl font-semibold text-left">Left Hand</h3>
                            <div className="flex items-center space-x-4">
                                <img src={"images/hands/left-fist.png"} alt="Left Fist Gesture" className="w-32 h-32 object-cover" />
                                <button
                                    onClick={() => toggleList(false)}
                                    className="px-4 py-2 bg-teal-500 text-white rounded-lg shadow-md hover:bg-teal-600 focus:outline-none focus:bg-teal-600"
                                >
                                    Ctrl+P
                                </button>
                            </div>
                        </div>

                        {/* 右手 */}
                        <div className="flex flex-col p-6 space-y-4 bg-white rounded-lg shadow-md w-1/2">
                            <h3 className="text-xl font-semibold text-right">Right Hand</h3>
                            <div className="flex items-center space-x-4 justify-end">
                                <button
                                    onClick={() => toggleList(true)}
                                    className="px-4 py-2 bg-teal-500 text-white rounded-lg shadow-md hover:bg-teal-600 focus:outline-none focus:bg-teal-600"
                                >
                                    Ctrl+P
                                </button>
                                <img src={"images/hands/right-fist.png"} alt="Right Fist Gesture" className="w-32 h-32 object-cover" />
                            </div>
                        </div>
                    </div>
                </div>


                <GestureModal isVisible={isModalVisible} onClose={() => setModalVisible(false)} />


                {/* 可选的快捷键列表 */}
                {showLeftList && (
                    <div className="absolute top-0 h-screen w-64 bg-white shadow-xl p-6 overflow-y-auto transition-transform duration-300 left-0 transform"
                        style={{ transform: showLeftList ? 'translateX(0)' : 'translateX(-100%)' }}>
                        <h2 className="text-xl font-semibold mb-4">Shortcut</h2>
                        <label className="flex items-center">
                            <input type="radio" name="shortcut" className="mr-3" />
                        Page Up
                        </label>
                        <label className="flex items-center">
                            <input type="radio" name="shortcut" className="mr-3" />
                            Ctrl+B
                        </label>
               
                    </div>
                )}

                {/* Right List */}
                {showRightList && (
                    <div className="absolute top-0 h-screen w-64 bg-white shadow-xl p-6 overflow-y-auto transition-transform duration-300 right-0 transform"
                        style={{ transform: showRightList ? 'translateX(0)' : 'translateX(100%)' }}>
                        <h2 className="text-xl font-semibold mb-4">Shortcut</h2>
                        <label className="flex items-center">
                            <input type="radio" name="shortcut" className="mr-3" />
                            Ctrl+A
                        </label>
                        <label className="flex items-center">
                            <input type="radio" name="shortcut" className="mr-3" />
                            Ctrl+B
                        </label>
                    </div>
                )}
            </div>
        </>
    );
}


export default SettingModal;