import { useEffect, useState } from "react";

import { BookOpenIcon, CameraIcon, XMarkIcon } from "@heroicons/react/24/solid";

const IntroCard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [version, setVersion] = useState("")

    useEffect(() => {
        const fetchLatestVersion = async () => {
            const latestVersion = await window.configApi.getProjectVersion();
            setVersion(latestVersion);
        };
        fetchLatestVersion();
    }, []);

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-10">
            <div className="bg-white p-6 rounded-lg shadow-xl relative ml-16"
            >
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
                    <XMarkIcon className="h-5 w-5" />
                </button>
                <p className="text-lg font-bold text-teal-800 mt-4 mb-8 italic font-mono">
                    Version: {version}
                </p>
                <div className="flex justify-end items-center">
                    <img src="./images/icons/GitHub.png" className="w-5 h-5 mr-2" />
                    <p onClick={() => window.windowApi.openExternalLink("https://github.com/RylanBot/awesome-hands-control")}
                        className="text-teal-500 cursor-pointer underline">
                        Visit code repository for tutorials
                    </p>
                </div>
            </div>
        </div>
    );
};

const Sidebar: React.FC = () => {
    const [showCard, setShowCard] = useState(false);
    const handleCardOpen = () => setShowCard(true);
    const handleCardClose = () => setShowCard(false);

    return (
        <div className="w-30 fixed top-0 left-0 h-full bg-teal-500 flex flex-col items-center justify-between p-4">
            <img className="w-16" src="./images/icons/AwesomeTitle.png" />

            <button
                onClick={() => window.windowApi.openCamera()}
                className="text-white hover:text-teal-900 p-2">
                <CameraIcon className="w-12 h-12" />
            </button>

            <button onClick={handleCardOpen} className="text-white hover:text-teal-800 p-2">
                <BookOpenIcon className="w-10 h-10" />
            </button>

            {showCard && <IntroCard onClose={handleCardClose} />}
        </div>
    );
}

export default Sidebar;
