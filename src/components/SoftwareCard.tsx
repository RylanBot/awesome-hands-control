import { TrashIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';

interface SoftwareCardProps {
    icon: string;
    name: string;
}

const SoftwareCard: React.FC<SoftwareCardProps> = ({ icon, name }) => {
   
    const navigate = useNavigate();

    return (
        <div className="bg-white border rounded-lg shadow-md w-48 h-48 flex flex-col items-center justify-center relative">

            {/* 删除按钮 */}
            <button>
                <TrashIcon className="h-6 w-6 text-gray-500 hover:text-red-500 absolute top-2 right-2" />
            </button>

            <div className="flex flex-col items-center mt-4">
                {/* 软件图标 */}
                <img
                    src={`data:image/svg+xml;base64,${icon}`}
                    onClick={() => { navigate(`setting/${name}`); }}
                    className="w-14 h-14 cursor-pointer hover:cursor-pointer"
                />

                {/* 软件名字 */}
                <span className="text-md font-bold text-gray-700 mt-3">{name}</span>
            </div>

        </div>
    );
}

const GlobalSoftwareCard: React.FC = () => {

    const navigate = useNavigate();

    return (
        <div className="bg-white border rounded-lg shadow-md w-48 h-48 flex flex-col items-center justify-center relative">

            <div className="flex flex-col items-center mt-4">
                <img
                    src={"/images/icons/GlobalSetting.png"}
                    onClick={() => { navigate("setting/Global"); }}
                    className="w-14 h-14 cursor-pointer hover:cursor-pointer"
                />
                <span className="text-md font-bold text-gray-700 mt-3">Global Setting</span>
            </div>

        </div>
    );
}

export { GlobalSoftwareCard, SoftwareCard };

