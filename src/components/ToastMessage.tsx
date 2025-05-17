import { useEffect } from 'react';

interface MessageProps {
    message: string;
    onClose: () => void;
}

const ToastMessage: React.FC<MessageProps> = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 1500);

        return () => {
            clearTimeout(timer);
        };
    }, [onClose]);

    return (
        <div className="fixed top-8 ml-3 bg-red-500 text-white py-2 px-4 rounded shadow-xl transition-opacity duration-300">
            {message}
        </div>
    );
};

export default ToastMessage;