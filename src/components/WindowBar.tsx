

import { BarsArrowDownIcon, BarsArrowUpIcon, MinusIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';


// 主窗口
const MainWindowBar: React.FC = () => {
    const windowName = 'main'

    return (
        <div className="header-drag flex justify-end items-center px-4 py-1 fixed top-0 left-0 right-0 z-50">

            {/* 最小化到任务栏 */}
            <button
                className="btn-no-drag mr-5"
                onClick={() => window.windowApi.minimizeToTaskbar(windowName)}
            >
                <MinusIcon className='h-5 w-5 text-emerald-800' />
            </button>

            {/* 关闭窗口 */}
            <button
                className="btn-no-drag"
                onClick={() => window.windowApi.close(windowName)}
            >
                <XMarkIcon className='h-5 w-5 text-emerald-800' />
            </button>
        </div>
    );
}

// 摄像机窗口
const CameraWindowBar: React.FC = () => {
    const windowName = 'camera'

    const [isInCorner, setIsInCorner] = useState<boolean>(false)

    const handleButtonClick = () => {
        if (isInCorner) {
            window.windowApi.resetCameraWindow();
            setIsInCorner(false);
        } else {
            window.windowApi.minimizeToCorner();
            setIsInCorner(true);
        }
    };

    return (
        <div className="bg-teal-500 header-drag flex justify-end items-center px-4 py-1 fixed top-0 left-0 right-0 z-50">

            {/* 置顶移到角落 */}
            <button
                className="btn-no-drag mr-5"
                onClick={handleButtonClick}
            >
                {isInCorner ? (
                    <BarsArrowUpIcon className='h-5 w-5 text-white' />
                ) : (
                    <BarsArrowDownIcon className='h-5 w-5 text-white' />
                )}
            </button>

            {/* 最小化后相机仍然开着，但窗口的代码不再被调用，无法识别 */}
            <button
                className="btn-no-drag mr-5"
                // onClick={() => window.windowApi.minimizeToTray()}
                onClick={() => window.windowApi.minimizeToTaskbar(windowName)}
            >
                <MinusIcon className='h-5 w-5 text-white' />
            </button>

            {/* 关闭窗口 */}
            <button
                className="btn-no-drag"
                onClick={() => window.windowApi.close(windowName)}
            >
                <XMarkIcon className='h-5 w-5 text-white' />
            </button>
        </div>
    );
}

export { CameraWindowBar, MainWindowBar };

