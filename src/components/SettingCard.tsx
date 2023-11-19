import { Cog6ToothIcon, TrashIcon } from "@heroicons/react/24/solid";

interface SettingCardProp {
    shortcut: string;
    leftHand?: string;
    rightHand?: string;
    /*  是否渲染修改按钮（主要针对全局设置）
        不显式为一个属性传递值时，默认是 undefined  */
    disable?: boolean;
}

const SettingCard: React.FC<SettingCardProp> = ({ shortcut, leftHand, rightHand, disable }) => {
    return (
        <>
            <div className="flex flex-col p-6 pb-3 bg-white rounded-lg shadow-md w-[calc(50%-1rem)]">
                {/* 快捷键 */}
                <div className="flex-grow py-2 bg-teal-500 text-white text-center rounded-lg mb-2 font-bold">
                    {shortcut}
                </div>

                <div className="flex justify-between items-center">
                    {/* 对应手势 */}
                    <div className="flex items-center p-2">
                        {leftHand ? (
                            <img src={`/images/hands/${leftHand}_Left.png`} className="w-32 h-32 object-cover mr-1" />
                        ) : (
                            <div className="w-32 h-32 border-dashed border-2 border-teal-600 mr-1" />
                        )}

                        {rightHand ? (
                            <img src={`/images/hands/${rightHand}_Right.png`} className="w-32 h-32 object-cover ml-1" />
                        ) : (
                            <div className="w-32 h-32 border-dashed border-2 border-teal-600 ml-1" />
                        )}
                    </div>

                    {/* 修改按钮 */}
                    {!disable ? (
                        <div className="flex flex-col space-y-4 mr-2">
                            <button>
                                <Cog6ToothIcon className="h-6 w-6 text-gray-500 hover:text-green-500" />
                            </button>
                            <button>
                                <TrashIcon className="h-6 w-6 text-gray-500 hover:text-red-500" />
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </>
    );
};

export default SettingCard;  