import { TrashIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { updateTimestamp } from "../stores/configSlice";

interface SettingCardProp {
    shortcut: string;
    leftHand?: string;
    rightHand?: string;
    /*  是否渲染修改按钮（主要针对全局设置）
        不显式为一个属性传递值时，默认是 undefined  */
    disable?: boolean;
}

const SettingCard: React.FC<SettingCardProp> = ({ shortcut, leftHand, rightHand, disable }) => {

    const { software } = useParams();
    const dispatch = useDispatch();

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    function toggleDeleteConfirm() {
        setShowDeleteConfirm(!showDeleteConfirm);
    };
    async function handleConfirmDelete() {
        const deleteSuccess = await window.configApi.deleteShortcutConfig(software!, shortcut);
        if (deleteSuccess) {
            dispatch(updateTimestamp());
            setShowDeleteConfirm(false);
        }
    };

    return (
        <>
            <div className="flex flex-col p-6 pb-3 bg-white rounded-lg shadow-md w-[calc(50%-1rem)] relative">
                <div className="h-12 bg-teal-500 text-white text-center rounded-lg mb-2 font-bold flex flex-col justify-center items-center">
                    {!showDeleteConfirm ?
                        <>
                            {/* 快捷键 */}
                            <span>{shortcut}</span>
                            {/* 删除按钮 */}
                            {!disable ? (
                                <div className="absolute top-9 right-10">
                                    <button onClick={toggleDeleteConfirm}>
                                        <TrashIcon className="h-6 w-6 text-zinc-50 hover:text-zinc-800" />
                                    </button>
                                </div>
                            ) : <></>}

                        </> :
                        <>
                            {/* 确认删除 */}
                            <div className="flex font-bold text-xs">
                                <button onClick={handleConfirmDelete}
                                    className="bg-red-500 text-white px-4 py-2 rounded-lg mr-2 hover:bg-red-600"
                                >
                                    Delete
                                </button>
                                <button onClick={toggleDeleteConfirm}
                                    className="bg-slate-100 text-zinc-800 px-4 py-2 rounded-lg hover:bg-slate-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>}
                </div>

                <div className="flex justify-center items-center">
                    {/* 对应手势 */}
                    <div className="flex items-center p-2">
                        {leftHand ? (
                            <img src={`/images/hands/${leftHand}_Left.png`} className="w-32 h-32 object-cover mr-2" />
                        ) : (
                            <div className="w-32 h-32 border-dashed border-2 border-teal-600 mr-1" />
                        )}

                        {rightHand ? (
                            <img src={`/images/hands/${rightHand}_Right.png`} className="w-32 h-32 object-cover ml-1" />
                        ) : (
                            <div className="w-32 h-32 border-dashed border-2 border-teal-600 ml-2" />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default SettingCard;
