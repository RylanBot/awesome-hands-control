import { BookOpenIcon, CameraIcon } from "@heroicons/react/24/solid";


const Sidebar: React.FC = () => {
    return (
        <div className="w-30 fixed top-0 left-0 h-full bg-teal-500 flex flex-col items-center justify-between p-4">

            <img src="/images/icons/sidebar.png" className="w-16 h-16 rounded-full bg-white p-2"/>

            <button
                onClick={() => window.windowApi.openCamera()}
                className="text-white hover:text-teal-900 p-2">
                <CameraIcon className="w-12 h-12" />
            </button>

            <button className="text-white hover:text-teal-800 p-2">
                <BookOpenIcon className="w-10 h-10" />
            </button>
        </div>
    );
}

export default Sidebar;
