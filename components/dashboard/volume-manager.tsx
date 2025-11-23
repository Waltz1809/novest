"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    createVolume,
    updateVolume,
    deleteVolume,
    deleteChapter,
    reslugNovel
} from "@/actions/chapter";
import {
    Loader2,
    Plus,
    Edit,
    Trash2,
    ChevronDown,
    ChevronRight,
    FileText,
    MoreVertical,
    RefreshCw
} from "lucide-react";
import Link from "next/link";

interface Chapter {
    id: number;
    title: string;
    slug: string;
    order: number;
    isLocked: boolean;
    price: number;
    createdAt?: Date | string;
}

interface Volume {
    id: number;
    title: string;
    order: number;
    chapters: Chapter[];
}

interface VolumeManagerProps {
    novelId: number;
    volumes: Volume[];
}

export default function VolumeManager({ novelId, volumes }: VolumeManagerProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [expandedVolumes, setExpandedVolumes] = useState<number[]>(volumes.map(v => v.id));
    const [editingVolume, setEditingVolume] = useState<{ id: number; title: string; order: number } | null>(null);
    const [isCreatingVolume, setIsCreatingVolume] = useState(false);

    // New Volume State
    const [newVolumeTitle, setNewVolumeTitle] = useState("");
    const [newVolumeOrder, setNewVolumeOrder] = useState("");

    const toggleVolume = (volumeId: number) => {
        setExpandedVolumes(prev =>
            prev.includes(volumeId)
                ? prev.filter(id => id !== volumeId)
                : [...prev, volumeId]
        );
    };

    const handleCreateVolume = () => {
        if (!newVolumeTitle || !newVolumeOrder) return;

        startTransition(async () => {
            const result = await createVolume({
                title: newVolumeTitle,
                order: parseInt(newVolumeOrder),
                novelId
            });

            if (result.error) {
                alert(result.error);
            } else {
                setIsCreatingVolume(false);
                setNewVolumeTitle("");
                setNewVolumeOrder("");
                router.refresh();
            }
        });
    };

    const handleUpdateVolume = () => {
        if (!editingVolume) return;

        startTransition(async () => {
            const result = await updateVolume(editingVolume.id, {
                title: editingVolume.title,
                order: editingVolume.order
            });

            if (result.error) {
                alert(result.error);
            } else {
                setEditingVolume(null);
                router.refresh();
            }
        });
    };

    const handleDeleteVolume = (volumeId: number) => {
        if (!confirm("Bạn có chắc chắn muốn xóa tập này? Tất cả chương trong tập sẽ bị xóa!")) return;

        startTransition(async () => {
            const result = await deleteVolume(volumeId);
            if (result.error) {
                alert(result.error);
            } else {
                router.refresh();
            }
        });
    };

    const handleDeleteChapter = (chapterId: number) => {
        if (!confirm("Bạn có chắc chắn muốn xóa chương này?")) return;

        startTransition(async () => {
            try {
                await deleteChapter(chapterId);
                router.refresh();
            } catch (error) {
                alert("Có lỗi xảy ra khi xóa chương");
            }
        });
    };

    const handleReslug = () => {
        if (!confirm("Hành động này sẽ cập nhật lại toàn bộ URL của các chương theo định dạng chuẩn. Bạn có chắc chắn không?")) return;

        startTransition(async () => {
            const result = await reslugNovel(novelId);
            if (result.error) {
                alert(result.error);
            } else {
                alert("Cập nhật slug thành công!");
                router.refresh();
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Danh sách tập & chương</h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleReslug}
                        disabled={isPending}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
                        Cập nhật Slug
                    </button>
                    <button
                        onClick={() => setIsCreatingVolume(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm tập mới
                    </button>
                </div>
            </div>

            {isCreatingVolume && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Tạo tập mới</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="md:col-span-2">
                            <input
                                type="text"
                                placeholder="Tên tập (Ví dụ: Tập 1 - Khởi đầu)"
                                value={newVolumeTitle}
                                onChange={(e) => setNewVolumeTitle(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <input
                                type="number"
                                placeholder="Số thứ tự"
                                value={newVolumeOrder}
                                onChange={(e) => setNewVolumeOrder(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsCreatingVolume(false)}
                            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleCreateVolume}
                            disabled={isPending || !newVolumeTitle || !newVolumeOrder}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                        >
                            {isPending ? "Đang tạo..." : "Tạo tập"}
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {volumes.map((volume) => (
                    <div key={volume.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                        {/* Volume Header */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-100">
                            <div className="flex items-center gap-3 flex-1">
                                <button
                                    onClick={() => toggleVolume(volume.id)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    {expandedVolumes.includes(volume.id) ? (
                                        <ChevronDown className="w-5 h-5" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5" />
                                    )}
                                </button>

                                {editingVolume?.id === volume.id ? (
                                    <div className="flex items-center gap-2 flex-1">
                                        <input
                                            value={editingVolume.title}
                                            onChange={(e) => setEditingVolume({ ...editingVolume, title: e.target.value })}
                                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                        />
                                        <input
                                            type="number"
                                            value={editingVolume.order}
                                            onChange={(e) => setEditingVolume({ ...editingVolume, order: parseInt(e.target.value) })}
                                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                                        />
                                        <button onClick={handleUpdateVolume} className="text-green-600 hover:text-green-700">
                                            <SaveIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setEditingVolume(null)} className="text-gray-500 hover:text-gray-700">
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900">{volume.title}</span>
                                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                                            Vol {volume.order}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            ({volume.chapters.length} chương)
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setEditingVolume({ id: volume.id, title: volume.title, order: volume.order })}
                                    className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                    title="Chỉnh sửa tập"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteVolume(volume.id)}
                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Xóa tập"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Chapters List */}
                        {expandedVolumes.includes(volume.id) && (
                            <div className="divide-y divide-gray-100">
                                {volume.chapters.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 text-sm">
                                        Chưa có chương nào trong tập này.
                                    </div>
                                ) : (
                                    volume.chapters.map((chapter) => (
                                        <div key={chapter.id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            Chương {chapter.order}: {chapter.title}
                                                        </span>
                                                        {chapter.isLocked && (
                                                            <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-200">
                                                                VIP
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                                        {chapter.createdAt && (
                                                            <>
                                                                <span>{new Date(chapter.createdAt).toLocaleDateString("vi-VN")}</span>
                                                                <span>•</span>
                                                            </>
                                                        )}
                                                        <span className="font-mono">{chapter.slug}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link
                                                    href={`/dashboard/novels/${novelId}/chapters/${chapter.id}/edit`}
                                                    className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                    title="Chỉnh sửa chương"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteChapter(chapter.id)}
                                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Xóa chương"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function SaveIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
    )
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
    )
}
