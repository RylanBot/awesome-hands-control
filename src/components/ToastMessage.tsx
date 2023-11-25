import React, { useEffect, useState } from 'react';

interface MessageProps {
    message: string;
}

const ToastMessage: React.FC<MessageProps> = ({ message }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);

        const timer = setTimeout(() => {
            setVisible(false);
        }, 3000);

        return () => {
            clearTimeout(timer);
        };
    }, [message]);

    // 实现渐隐效果
    const toastClasses = visible
        ? "opacity-100"
        : "opacity-0";

    return (
        <div
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 translate-x-2.75rem bg-red-500 text-white py-2 px-4 rounded shadow-xl transition-opacity duration-300 ${toastClasses}`}
            style={{ transform: "translateX(-50%) translateX(2.75rem)" }}
        >
            {message}
        </div>
    );
};

export default ToastMessage;
