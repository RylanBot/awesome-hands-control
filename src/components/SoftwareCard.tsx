import { TrashIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface SoftwareCardProps {
    icon: string;
    name: string;
}

const SoftwareCard: React.FC<SoftwareCardProps> = ({ icon, name }) => {
    const [isSwitchedOn, setSwitchedOn] = useState(false);

    return (
        <div className="bg-white border rounded-lg shadow-md w-48 h-48 flex flex-col items-center justify-center relative">

            {/* 删除按钮 */}
            <button>
                <TrashIcon className="h-6 w-6 text-gray-500 hover:text-red-500 absolute top-2 right-2" />
            </button>

            <div className="flex flex-col items-center mt-4">
                {/* 软件图标 */}
                <Link to="setting">
                    <img src={`data:image/svg+xml;base64,${icon}`} className="w-12 h-12" />
                </Link>

                {/* 软件名字 */}
                <span className="text-md font-bold text-gray-700 mt-3">{name}</span>

                {/* 开关 */}
                <button
                    onClick={() => setSwitchedOn(!isSwitchedOn)}
                    className={`relative w-12 h-6 mt-3 rounded-full overflow-hidden transition-colors duration-200 ${isSwitchedOn ? 'bg-teal-500' : 'bg-gray-400'} shadow-sm hover:shadow-md`}
                >
                    <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${isSwitchedOn ? 'translate-x-6' : 'translate-x-0'}`}
                    ></span>
                </button>
            </div>

        </div>
    );
}

export default SoftwareCard;
