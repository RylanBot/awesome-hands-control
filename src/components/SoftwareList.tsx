import  { useEffect, useState } from "react";

/** 
 * 展示电脑已安装的软件
 * @deprecated temporarily
 */
export const SoftwareList: React.FC = () => {
    const [softwareData, setSoftwareData] = useState<any>(null);  // 定义软件数据的状态

    useEffect(() => {
        // 向 preload 请求软件列表
        window.powershellApi.getSoftwareList();

        const handleSoftwareInfo = (result: any) => {
            setSoftwareData(result);
        };
        window.powershellApi.onSoftwareList(handleSoftwareInfo);

        return () => { };

    }, []);

    return (
        <>
            {softwareData && softwareData.map((software: any, index: number) => (
                <div key={index}>
                    <p>{software.name}</p>
                    <img src={software.icon} alt="Software Icon" />
                </div>
            ))}
        </>
    );
}
