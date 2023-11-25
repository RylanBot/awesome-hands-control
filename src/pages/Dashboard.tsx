import { PlusIcon } from "@heroicons/react/24/solid";
import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../components/Sidebar";
import { GlobalSoftwareCard, SoftwareCard } from "../components/SoftwareCard";
import ToastMessage from "../components/ToastMessage";
import { AppConfig, updateTimestamp } from "../stores/configSlice";
import { RootState } from "../types/redux";

interface ExeFile extends File {
    path: string;
}

const Dashboard: React.FC = () => {
    const dispatch = useDispatch();
    const appsConfigs: AppConfig[] = useSelector((state: RootState) => state.config.apps);

    const fileInputRef = useRef<HTMLInputElement>(null);
    function handleAddSoftwareClick() {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        fileInputRef.current?.click();
    };

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
        const selectedFile = event.target.files?.[0] as ExeFile | undefined

        if (selectedFile && selectedFile.path) {
            // 判断软件是否重复添加
            if (checkDuplicateApp(selectedFile.path)) {
                setShowToast(false);
                setTimeout(() => {
                    setToastMessage('Software already added');
                    setShowToast(true);
                    // 置延时为 0 可将代码的执行推迟到当前栈中其他代码完成后
                    // 类似于 Vue 的 nextTick
                }, 0);
                return;
            }

            setLoading(true);
            const updateSuccess = await window.configApi.updateAppConfig(selectedFile.path);
            setLoading(false);

            if (updateSuccess) {
                dispatch(updateTimestamp());
            }
        }
    }

    function checkDuplicateApp(filePath: string): boolean {
        const regex = /[^\\]+(?=\.exe$)/i;
        const match = filePath.match(regex);
        const exeName = match ? match[0] : null;

        if (exeName) {
            return appsConfigs.some(app => app.name === exeName);
        }

        return false
    }

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
                        {!loading ?
                            <>
                                <PlusIcon className="h-12 w-12 text-teal-500" />
                                <span className="text-md font-bold text-gray-700 mt-3">Add Software</span>
                                {/* 文件输入 */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".exe"
                                    onChange={handleFileInputChange}
                                />
                            </> :
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mt-2"></div>}
                    </div>
                </div>
            </div>



            {/* 消息提示 */}
            {showToast && <ToastMessage message={toastMessage} />}
        </div >
    );
}

export default Dashboard;
