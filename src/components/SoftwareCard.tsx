import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { updateTimestamp } from '@/stores/configSlice';
import { useDispatch } from 'react-redux';

import { TrashIcon } from '@heroicons/react/24/solid';

interface SoftwareCardProps {
    icon: string;
    name: string;
}

const SoftwareCard: React.FC<SoftwareCardProps> = ({ icon, name }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    function handleDeleteClick() {
        setShowDeleteConfirm(true);
    }

    function handleCancelDelete() {
        setShowDeleteConfirm(false);
    }

    async function handleConfirmDelete() {
        await window.configApi.deleteAppConfig(name);
        dispatch(updateTimestamp());
        setShowDeleteConfirm(false);
    }

    return (
        <div className="bg-white border rounded-lg shadow-md w-48 h-48 flex flex-col items-center justify-center">

            {/* 删除按钮 */}
            <button onClick={handleDeleteClick}>
                <TrashIcon className="h-6 w-6 text-gray-500 hover:text-red-500 fixed top-16 ml-14" />
            </button>
            {/* 删除确认对话框 */}
            {showDeleteConfirm && (
                <div className="absolute top-12 w-48 bg-white p-4 border border-gray-200 rounded-lg shadow-lg text-xs font-bold">
                    <div className="flex justify-center">
                        <button onClick={handleConfirmDelete}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg mr-2 hover:bg-red-600"
                        >
                            Delete
                        </button>
                        <button onClick={handleCancelDelete}
                            className="bg-slate-100 text-zinc-800 px-4 py-2 rounded-lg hover:bg-slate-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col items-center mt-4">
                {/* 软件图标 */}
                <img
                    src={`data:image/x-icon;base64,${icon}`}
                    onClick={() => { navigate(`setting/${name}`); }}
                    className="w-14 h-14 cursor-pointer hover:cursor-pointer"
                />

                {/* 软件名字 */}
                <span className="text-md font-bold text-gray-700 mt-3 w-32 truncate text-center">{name}</span>
            </div>

        </div>
    );
}

const GlobalSoftwareCard: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-white border rounded-lg shadow-md w-48 h-48 flex flex-col items-center justify-center">

            <div className="flex flex-col items-center mt-4">
                <img
                    src={"./images/icons/GlobalSetting.png"}
                    onClick={() => { navigate("setting/Global"); }}
                    className="w-14 h-14 cursor-pointer hover:cursor-pointer"
                />
                <span className="text-md font-bold text-gray-700 mt-3">Global Setting</span>
            </div>

        </div>
    );
}

export { GlobalSoftwareCard, SoftwareCard };
