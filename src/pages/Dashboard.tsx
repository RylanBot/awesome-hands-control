import { PlusIcon } from "@heroicons/react/24/solid";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../components/Sidebar";
import SoftwareCard from "../components/SoftwareCard";
import { setConfig } from "../utils/configSlice";
import { RootState } from "../utils/store";

const Dashboard: React.FC = () => {

    const dispatch = useDispatch();

    const appsConfig = useSelector((state: RootState) => state.config.apps);


    // 读取配置中的软件列表
    useEffect(() => {
        window.coreApi.initialConfig((config) => {
            dispatch(setConfig(config));
        });
    }, [dispatch]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddSoftwareClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex h-screen bg-gray-200">
            {/* 侧边栏 */}
            <Sidebar />

            {/* 软件列表 */}
            <div className="flex-grow p-4 mt-8 mb-4">
                <div className="flex flex-wrap gap-10 ml-32">

                    {appsConfig && Object.keys(appsConfig).map((appName) => (
                        <SoftwareCard key={appName} icon={appsConfig[appName].icon} name={appName} />
                    ))}


                    {/* 新增软件 */}
                    <div
                        className="bg-white border rounded-lg shadow-md w-48 h-48 flex flex-col items-center justify-center relative cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={handleAddSoftwareClick} >
                        <PlusIcon className="h-12 w-12 text-teal-500" />
                        <span className="text-md font-bold text-gray-700 mt-3">Add Software</span>
                    </div>
                </div>
            </div>

            {/* 文件输入 */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".exe"
            />
        </div>
    );
}

export default Dashboard;
