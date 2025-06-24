import { useState } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";

import { TrashIcon } from "@heroicons/react/24/solid";

import type { Shortcut } from "@common/types/config";

import { updateTimestamp } from "@/stores/configSlice";

interface SettingCardProp {
    shortcut: Shortcut;
}

const SettingCard: React.FC<SettingCardProp> = ({ shortcut }) => {
    const { software } = useParams();
    const dispatch = useDispatch();

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    async function toggleShortcut() {
        await window.configApi.toggleShortcutConfig(software!, shortcut);
        dispatch(updateTimestamp());
    }

    function toggleDeleteConfirm() {
        setShowDeleteConfirm(!showDeleteConfirm);
    }

    async function handleConfirmDelete() {
        await window.configApi.deleteShortcutConfig(software!, shortcut);
        dispatch(updateTimestamp());
        setShowDeleteConfirm(false);
    }

    return (
        <>
            <div className="flex flex-col p-6 pb-1 bg-white rounded-lg shadow-md w-[calc(50%-1rem)] relative">
                <div
                    className={`h-12 text-white text-center rounded-lg mb-2 font-bold flex flex-col justify-center items-center ${shortcut.removable ?
                        "bg-teal-500" : "bg-green-500"
                        }`}
                >
                    {!showDeleteConfirm ? (
                        <>
                            {/* 快捷键 */}
                            <span>{shortcut.keyCombination}</span>
                            {/* 禁用按钮 */}
                            <label className="absolute top-9 left-10 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={shortcut.enabled}
                                    onChange={toggleShortcut}
                                />
                                <div className="relative w-11 h-6 bg-gray-200 rounded-full peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-200"></div>
                            </label>
                            {/* 删除按钮 */}
                            {shortcut.removable && (
                                <div className="absolute top-9 right-10">
                                    <button onClick={toggleDeleteConfirm}>
                                        <TrashIcon className="h-6 w-6 text-zinc-50 hover:text-zinc-800" />
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* 确认删除 */}
                            <div className="flex font-bold text-xs">
                                <button
                                    className="bg-red-500 text-white px-4 py-2 rounded-lg mr-2 hover:bg-red-600"
                                    onClick={handleConfirmDelete}
                                >
                                    Delete
                                </button>
                                <button
                                    className="bg-slate-100 text-zinc-800 px-4 py-2 rounded-lg hover:bg-slate-200"
                                    onClick={toggleDeleteConfirm}
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex justify-center items-center">
                    {/* 对应手势 */}
                    <div className="flex items-center p-2">
                        {shortcut.gestureLeft ? (
                            <img
                                className="w-32 h-32 object-cover mr-2"
                                src={`./images/hands/${shortcut.gestureLeft}_Left.png`}
                            />
                        ) : (
                            <div className="w-24 h-24 border-dashed border-2 border-teal-600 mr-8" />
                        )}

                        {shortcut.gestureRight ? (
                            <img
                                className="w-32 h-32 object-cover ml-1"
                                src={`./images/hands/${shortcut.gestureRight}_Right.png`}
                            />
                        ) : (
                            <div className="w-24 h-24 border-dashed border-2 border-teal-600 ml-8" />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default SettingCard;
