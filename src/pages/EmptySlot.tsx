/*  打包后相机窗口一直无法加载，HashRouter解析失败，
    因此监听来自主进程的信息，判断当前是哪个窗口在加载
    然后再进行重定向（缺点：页面会有一瞬间的空白） */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const EmptySlot: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.windowApi.identifyWindow((windowName: string) => {
            if (windowName === 'main') {
                navigate('/main');
            } else if (windowName === 'camera') {
                navigate('/camera');
            }
        });
    }, [navigate]);

    return null;
}

export default EmptySlot;