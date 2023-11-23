import { PlusIcon } from "@heroicons/react/24/solid";
import { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../components/Sidebar";
import { GlobalSoftwareCard, SoftwareCard } from "../components/SoftwareCard";
import useFetchConfig from "../hooks/useFetchConfig";
import { AppConfig, updateTimestamp } from "../stores/configSlice";
import { RootState } from "../stores/store";

interface ExeFile extends File {
    path: string;
}

const Dashboard: React.FC = () => {
    const dispatch = useDispatch();

    useFetchConfig(); // 使用自定义钩子获取配置
    const appsConfigs: AppConfig[] = useSelector((state: RootState) => state.config.apps);

    const fileInputRef = useRef<HTMLInputElement>(null);
    function handleAddSoftwareClick() {
        fileInputRef.current?.click();
    };

    async function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
        const selectedFile = event.target.files?.[0] as ExeFile | undefined;

        if (selectedFile && selectedFile.path) {
            // 判断选择的软件是否已添加
            const updateSuccess = await window.configApi.updateAppConfig(selectedFile.path);
            if (updateSuccess) {
                dispatch(updateTimestamp());
            } else {
                //... todo 软件重复添加弹窗
            }
        }
    };

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
                    {appsConfigs.map((appConfig, index) => (
                        <SoftwareCard
                            key={index}
                            icon={appConfig.icon}
                            name={appConfig.name}
                        />
                    ))}

                    {/* 新增软件 */}
                    < div
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
                onChange={handleFileInputChange}
            />
        </div >
    );
}

export default Dashboard;
