import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/solid';

import type { AppConfig } from '@common/types/config';

import { RootState } from '@/stores/redux';

import { SettingCard, SettingModal } from '@/components';

const SettingPage: React.FC = () => {
    const { software } = useParams(); // 变量名必须和路由配置里一样

    const navigate = useNavigate();
    const [isModalOpen, setModalOpen] = useState(false);

    const UserSetting: React.FC = () => {
        const appConfigs: AppConfig[] = useSelector((state: RootState) => state.config.apps);
        const currentConfig = appConfigs.find(appConfig => appConfig.name === software);

        if (currentConfig) {
            const shortcutData = currentConfig.shortcuts;
            return (
                <>
                    {shortcutData && shortcutData.length > 0
                        && shortcutData.map((shortcut, index) => (
                            <SettingCard
                                key={index}
                                shortcut={shortcut}
                            />
                        ))}
                </>
            );
        }

    }

    return (
        <>
            <div className='bg-gray-200 min-h-screen'>
                {/* 返回按钮 */}
                <button
                    className="fixed top-4 left-4 rounded-full w-9 h-9 p-1 bg-gray-100 hover:bg-gray-300 shadow-md"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeftIcon />
                </button>

                {/* 软件名 */}
                <p className="text-3xl font-bold text-center text-teal-600 pt-5">
                    {software}
                </p>

                <div className="flex flex-wrap justify-start gap-8 max-w-6xl p-12 pt-6">
                    <UserSetting />
                </div>

                {/* 添加新手势按钮 */}
                <button
                    className="fixed bottom-4 right-4 rounded-full w-12 h-12 p-2 bg-teal-400 text-white hover:bg-teal-600 shadow-md"
                    onClick={() => setModalOpen(true)}
                >
                    <PlusIcon />
                </button>
                {isModalOpen && <SettingModal onClose={() => setModalOpen(false)} />}
            </div>
        </>
    );
};

export default SettingPage;