import { useState } from "react";

import { useSelector } from "react-redux";
import { RootState } from "@/stores/redux";

import { AppConfig } from "@/utils/types";

import { GlobalSoftwareCard, SoftwareCard } from "@/components/SoftwareCard";
import Sidebar from "@/components/Sidebar";
import SoftwareModal from "@/components/SoftwareModal";

import { PlusIcon } from "@heroicons/react/24/solid";

const Dashboard: React.FC = () => {
    const appsConfigs: AppConfig[] = useSelector((state: RootState) => state.config.apps);
    const [isModalOpen, setModalOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-200">
            {/* 侧边栏 */}
            <Sidebar />

            {/* 软件列表 */}
            <div className="flex-grow p-4 mt-8 mb-4">
                <div className="flex flex-wrap gap-10 ml-32">

                    {/* 全局鼠标操作 */}
                    <GlobalSoftwareCard />

                    {/* 用户自定义 */}
                    {appsConfigs.map((appConfig, index) => {
                        if (appConfig.name === "Global") return;

                        return (
                            <SoftwareCard
                                key={index}
                                icon={appConfig.icon}
                                name={appConfig.name}
                            />
                        );
                    })}

                    <div
                        className="bg-white border rounded-lg shadow-md w-48 h-48 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => setModalOpen(true)}
                    >
                        <PlusIcon className="h-12 w-12 text-teal-500" />
                        <span className="text-md font-bold text-gray-700 mt-3">Add Software</span>
                    </div>

                    {isModalOpen && <SoftwareModal onClose={() => setModalOpen(false)} />}
                </div>
            </div>
        </div >
    );
}

export default Dashboard;
