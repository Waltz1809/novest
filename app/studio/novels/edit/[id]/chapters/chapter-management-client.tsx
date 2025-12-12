"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronRight, Edit2, Plus, FileText } from "lucide-react";
import InlineChapterForm from "@/components/studio/inline-chapter-form";

interface Chapter {
    id: number;
    title: string;
    order: number;
    createdAt: Date;
    content: string;
    price: number;
    isDraft?: boolean;
    publishAt?: Date | null;
}

interface Volume {
    id: number;
    title: string;
    order: number;
    chapters: Chapter[];
}

interface Novel {
    id: number;
    title: string;
    slug: string;
    approvalStatus: string;
    volumes: Volume[];
}

interface ChapterManagementClientProps {
    novel: Novel;
    initialEditChapterId?: number; // Auto-open chapter editor from query param
}

export default function ChapterManagementClient({ novel, initialEditChapterId }: ChapterManagementClientProps) {
    const router = useRouter();
    const [expandedVolumes, setExpandedVolumes] = useState<Set<number>>(new Set());
    const [addingChapterToVolume, setAddingChapterToVolume] = useState<number | null>(null);
    const [editingChapterId, setEditingChapterId] = useState<number | null>(null);

    // Auto-expand volume and open editor if initialEditChapterId is provided
    useEffect(() => {
        if (initialEditChapterId) {
            // Find which volume contains this chapter
            for (const volume of novel.volumes) {
                const foundChapter = volume.chapters.find(ch => ch.id === initialEditChapterId);
                if (foundChapter) {
                    // Expand the volume and open editor
                    setExpandedVolumes(new Set([volume.id]));
                    setEditingChapterId(initialEditChapterId);
                    break;
                }
            }
        }
    }, [initialEditChapterId, novel.volumes]);

    const toggleVolume = (volumeId: number) => {
        const newExpanded = new Set(expandedVolumes);
        if (newExpanded.has(volumeId)) {
            newExpanded.delete(volumeId);
        } else {
            newExpanded.add(volumeId);
        }
        setExpandedVolumes(newExpanded);
    };

    const handleCreateNewVolume = async () => {
        const title = window.prompt("Nhập tên tập mới:", `Tập ${novel.volumes.length + 1}`);
        if (!title) return;

        try {
            const response = await fetch("/api/volumes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    novelId: novel.id,
                    title: title
                }),
            });

            if (!response.ok) throw new Error("Failed to create volume");
            router.refresh();
        } catch (error) {
            console.error("Failed to create volume:", error);
            alert("Lỗi khi tạo tập mới");
        }
    };

    const handleRenameVolume = async (e: React.MouseEvent, volume: Volume) => {
        e.stopPropagation();
        const newTitle = window.prompt("Đổi tên tập:", volume.title);
        if (newTitle && newTitle !== volume.title) {
            try {
                const response = await fetch(`/api/volumes/${volume.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: newTitle }),
                });

                if (!response.ok) throw new Error("Failed to rename volume");
                router.refresh();
            } catch (error) {
                console.error("Failed to rename volume:", error);
                alert("Lỗi khi đổi tên tập");
            }
        }
    };

    const handleChapterSuccess = () => {
        setAddingChapterToVolume(null);
        setEditingChapterId(null);
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-[#0B0C10] pb-20">
            <div className="w-full px-4 py-2 space-y-4">
                {/* Tabs */}
                <div className="flex items-center gap-4 border-b border-[#34D399]/20 mb-6">
                    <Link
                        href={`/studio/novels/edit/${novel.id}`}
                        className="py-3 px-4 font-bold text-sm transition-all relative text-[#9CA3AF] hover:text-white"
                    >
                        Thông tin
                    </Link>
                    <div className="py-3 px-4 font-bold text-sm transition-all relative text-[#34D399]">
                        Danh sách tập & Chương
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#F59E0B] glow-amber"></span>
                    </div>
                </div>

                {/* Content */}
                <section className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-3">
                        {novel.volumes.map((volume) => {
                            const isExpanded = expandedVolumes.has(volume.id);
                            const isAddingChapter = addingChapterToVolume === volume.id;

                            return (
                                <div
                                    key={volume.id}
                                    className="bg-[#1E293B]/50 border border-[#34D399]/20 rounded-xl overflow-hidden transition-all duration-200">
                                    {/* Volume Header */}
                                    <div
                                        onClick={() => toggleVolume(volume.id)}
                                        className={`
                                            p-4 flex items-center justify-between cursor-pointer hover:bg-[#1E293B] transition-colors
                                            ${isExpanded ? "bg-[#1E293B] border-b border-[#34D399]/10" : ""}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                                    {volume.title}
                                                    <button
                                                        onClick={(e) => handleRenameVolume(e, volume)}
                                                        className="p-1 text-[#9CA3AF] hover:text-[#F59E0B] transition-colors"
                                                        title="Đổi tên tập"
                                                    >
                                                        <Edit2 className="w-3 h-3" />
                                                    </button>
                                                </h3>
                                                <p className="text-xs text-[#9CA3AF]">
                                                    {volume.chapters.length} chương
                                                </p>
                                            </div>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronDown className="w-5 h-5 text-[#F59E0B]" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-[#9CA3AF]" />
                                        )}
                                    </div>

                                    {/* Volume Content (Chapters) */}
                                    {isExpanded && (
                                        <div className="p-4 bg-[#0B0C10]/30">
                                            {/* Chapter List */}
                                            <div className="space-y-2 mb-4">
                                                {volume.chapters.length === 0 ? (
                                                    <div className="text-center py-8 text-[#9CA3AF] italic">
                                                        Chưa có chương nào. Hãy thêm chương mới!
                                                    </div>
                                                ) : (
                                                    volume.chapters.map((chapter) => {
                                                        if (editingChapterId === chapter.id) {
                                                            return (
                                                                <InlineChapterForm
                                                                    key={chapter.id}
                                                                    novelId={novel.id}
                                                                    volumeId={volume.id}
                                                                    novelApprovalStatus={novel.approvalStatus}
                                                                    initialData={{
                                                                        ...chapter,
                                                                        publishAt: chapter.publishAt?.toISOString() ?? null,
                                                                    }}
                                                                    onCancel={() => setEditingChapterId(null)}
                                                                    onSuccess={handleChapterSuccess}
                                                                />
                                                            );
                                                        }

                                                        return (
                                                            <div
                                                                key={chapter.id}
                                                                className="flex items-center justify-between p-3 bg-[#1E293B] rounded-lg border border-[#34D399]/10 hover:border-[#34D399]/30 transition-colors group"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-[#0B0C10] rounded-md text-[#34D399]">
                                                                        <FileText className="w-4 h-4" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium text-white group-hover:text-[#F59E0B] transition-colors">
                                                                            {chapter.title}
                                                                        </div>
                                                                        <div className="text-xs text-[#9CA3AF] flex items-center gap-2">
                                                                            <span>Cập nhật: {new Date(chapter.createdAt).toLocaleDateString("vi-VN")}</span>
                                                                            {chapter.price > 0 && (
                                                                                <span className="text-[#F59E0B] font-bold">
                                                                                    • {chapter.price} Xu
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Actions */}
                                                                <button
                                                                    onClick={() => setEditingChapterId(chapter.id)}
                                                                    className="p-2 text-[#9CA3AF] hover:text-[#F59E0B] transition-colors opacity-0 group-hover:opacity-100"
                                                                    title="Chỉnh sửa chương"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>

                                            {/* Add Chapter Area */}
                                            {isAddingChapter ? (
                                                <InlineChapterForm
                                                    novelId={novel.id}
                                                    volumeId={volume.id}
                                                    novelApprovalStatus={novel.approvalStatus}
                                                    onCancel={() => setAddingChapterToVolume(null)}
                                                    onSuccess={handleChapterSuccess}
                                                />
                                            ) : (
                                                <button
                                                    onClick={() => setAddingChapterToVolume(volume.id)}
                                                    className="w-full py-3 border-2 border-dashed border-[#34D399]/20 rounded-lg text-[#34D399] font-bold hover:bg-[#34D399]/10 hover:border-[#34D399]/50 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                    Thêm chương mới
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Create Volume Button */}
                        <button
                            onClick={handleCreateNewVolume}
                            className="w-full py-4 bg-[#1E293B] hover:bg-[#2D3748] text-[#9CA3AF] hover:text-white font-bold rounded-xl border-2 border-dashed border-[#34D399]/20 hover:border-[#F59E0B] transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Tạo tập mới
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
