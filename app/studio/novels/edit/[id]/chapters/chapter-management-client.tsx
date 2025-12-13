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
        <div className="min-h-screen pb-20">
            <div className="w-full px-4 py-2 space-y-4">
                {/* Tabs */}
                <div className="flex items-center gap-4 border-b border-gray-200 mb-6">
                    <Link
                        href={`/studio/novels/edit/${novel.id}`}
                        className="py-3 px-4 font-bold text-sm transition-all relative text-muted-foreground hover:text-foreground"
                    >
                        Thông tin
                    </Link>
                    <div className="py-3 px-4 font-bold text-sm transition-all relative text-primary">
                        Danh sách tập & Chương
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></span>
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
                                    className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-200 shadow-sm">
                                    {/* Volume Header */}
                                    <div
                                        onClick={() => toggleVolume(volume.id)}
                                        className={`
                                            p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors
                                            ${isExpanded ? "bg-gray-50 border-b border-gray-100" : ""}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                                                    {volume.title}
                                                    <button
                                                        onClick={(e) => handleRenameVolume(e, volume)}
                                                        className="p-1 text-muted-foreground hover:text-primary transition-colors"
                                                        title="Đổi tên tập"
                                                    >
                                                        <Edit2 className="w-3 h-3" />
                                                    </button>
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {volume.chapters.length} chương
                                                </p>
                                            </div>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronDown className="w-5 h-5 text-primary" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                        )}
                                    </div>

                                    {/* Volume Content (Chapters) */}
                                    {isExpanded && (
                                        <div className="p-4 bg-gray-50">
                                            {/* Chapter List */}
                                            <div className="space-y-2 mb-4">
                                                {volume.chapters.length === 0 ? (
                                                    <div className="text-center py-8 text-muted-foreground italic">
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
                                                                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-primary/30 transition-colors group"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-gray-100 rounded-md text-emerald-600">
                                                                        <FileText className="w-4 h-4" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                                                                            {chapter.title}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                                            <span>Cập nhật: {new Date(chapter.createdAt).toLocaleDateString("vi-VN")}</span>
                                                                            {chapter.price > 0 && (
                                                                                <span className="text-primary font-bold">
                                                                                    • {chapter.price} Xu
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Actions */}
                                                                <button
                                                                    onClick={() => setEditingChapterId(chapter.id)}
                                                                    className="p-2 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
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
                                                    className="w-full py-3 border-2 border-dashed border-emerald-300 rounded-lg text-emerald-600 font-bold hover:bg-emerald-50 hover:border-emerald-400 transition-all flex items-center justify-center gap-2"
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
                            className="w-full py-4 bg-white hover:bg-gray-50 text-muted-foreground hover:text-foreground font-bold rounded-xl border-2 border-dashed border-gray-300 hover:border-primary transition-all flex items-center justify-center gap-2 shadow-sm"
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
