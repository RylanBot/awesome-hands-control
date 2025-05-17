import { useRef, useState } from 'react';

import type { AppConfig } from '@common/types/config';

import { updateTimestamp } from '@/stores/configSlice';
import { RootState } from '@/stores/redux';
import { useDispatch, useSelector } from 'react-redux';

import { PhotoIcon } from '@heroicons/react/24/solid';
import ToastMessage from './ToastMessage';

interface InputFile extends File {
    path: string;
}

const SoftwareModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const dispatch = useDispatch();
    const appsConfigs: AppConfig[] = useSelector((state: RootState) => state.config.apps);

    const [loading, setLoading] = useState(false);

    const [appName, setAppName] = useState('');
    const [base64Icon, setBase64Icon] = useState('');

    const [showToast, setShowToast] = useState(false);
    const [message, setMessage] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    function displayToast(msg: string) {
        setMessage(msg);
        setShowToast(true);
    }

    function handleAddSoftwareClick() {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        fileInputRef.current?.click();
    }

    async function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] as InputFile | undefined
        if (file) {
            // 获取文件扩展名
            const fileExtension = file.name.split('.').pop()?.toLowerCase();

            if (fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png') {
                // 如果是图片类型，进行转换
                const reader = new FileReader();
                reader.onload = function (e) {
                    if (typeof e.target?.result === 'string') {
                        // 移除前缀 data:*/*;base64, 
                        const base64String = e.target.result.split(',')[1];
                        setBase64Icon(base64String)
                    }
                };
                reader.readAsDataURL(file);
            } else {
                // 如果是软件类型，则调用 API 提取 icon
                setLoading(true)
                const icon = await window.configApi.getBase64Icon(file.path)
                setBase64Icon(icon)
                setLoading(false)
            }
        }
    }

    async function handleSubmit() {
        // 不能为空
        if (!appName.trim()) {
            displayToast("Input cannot be empty");
            return;
        }
        // 检查重复
        if (appsConfigs.some(app => app.name === appName)) {
            displayToast("Software already exists");
            return
        }
        await window.configApi.updateAppConfig(appName, base64Icon);
        dispatch(updateTimestamp());
        onClose();
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50">
            <div className="fixed bg-white p-6 rounded-lg shadow-lg w-1/3 ml-24">
                <div className="flex items-center gap-4">
                    <span className='text-gray-700 px-2 ml-2 italic font-mono'>Software Icon</span>
                    <button onClick={handleAddSoftwareClick} className="w-24 h-24 rounded flex items-center border-dashed border-2 border-teal-500">
                        {loading ?
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500 m-8"></div>
                            :
                            <>
                                {base64Icon ?
                                    <img src={`data:image/x-icon;base64,${base64Icon}`}
                                        className="w-24 h-24 p-4" />
                                    :
                                    <PhotoIcon className="w-24 h-24 text-teal-500 p-8" />}
                            </>
                        }
                    </button>
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    accept=".jpg, .jpeg, .png, .exe"
                    className="hidden"
                />

                <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="Software process name"
                    className="w-full mt-8 rounded-lg focus:ring-emerald-500 focus:ring-2 focus:border-transparent px-4 py-2 italic font-mono"
                />

                <div className="flex justify-end mt-8 space-x-2">
                    <button onClick={() => onClose()} className="text-sm bg-gray-200 hover:bg-gray-300 rounded py-2 px-4">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="text-sm bg-teal-500 hover:bg-teal-600 rounded py-2 px-4 text-white">
                        Apply
                    </button>
                </div>

                {showToast && <ToastMessage message={message} onClose={() => setShowToast(false)} />}
            </div>
        </div>
    );
}

export default SoftwareModal;