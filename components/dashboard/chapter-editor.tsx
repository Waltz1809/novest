"use client";

import { useState, useEffect } from "react";
import ChapterEditor from "@/components/editor/chapter-editor";
import { Save, Loader2 } from "lucide-react";

interface Volume {
    id: number;
    title: string;
    order: number;
}

interface ChapterEditorWrapperProps {
    chapterId: number | "new";
    novelId: number;
    volumeId: number;
    volumes: Volume[];
}

export default function ChapterEditorWrapper({ chapterId, novelId, volumeId, volumes }: ChapterEditorWrapperProps) {
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const [chapterOrder, setChapterOrder] = useState(1);

    const currentVolume = volumes.find(v => v.id === volumeId);
    const slug = `volume-${currentVolume?.order || 1}-chapter-${chapterOrder}`;

    // Load chapter content if editing existing chapter
    useEffect(() => {
        if (chapterId === "new") {
            setIsLoading(false);
            setContent("");
            setTitle("");
            // Get next chapter number for this volume
            fetch(`/api/volumes/${volumeId}/next-chapter-number`)
                .then(res => res.json())
                .then(data => setChapterOrder(data.nextOrder))
                .catch(() => setChapterOrder(1));
        } else {
            fetch(`/api/chapters/${chapterId}`)
                .then((res) => res.json())
                .then((data) => {
                    setContent(data.content || "");
                    setTitle(data.title || "");
                    setChapterOrder(data.order);
                    setIsLoading(false);
                })
                .catch((error) => {
                    console.error("Failed to load chapter:", error);
                    setIsLoading(false);
                });
        }
    }, [chapterId, volumeId]);

    const handleSave = async () => {
        setIsSaving(true);

        try {
            const url = chapterId === "new" ? "/api/chapters" : `/api/chapters/${chapterId}`;
            const method = chapterId === "new" ? "POST" : "PATCH";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    content,
                    novelId,
                    volumeId: chapterId === "new" ? volumeId : undefined,
                }),
            });

            if (!response.ok) throw new Error("Failed to save");

            setIsSaving(false);
            setShowSaved(true);
            setTimeout(() => setShowSaved(false), 3000);

            // Reload page if new chapter to update sidebar
            if (chapterId === "new") {
                window.location.reload();
            }
        } catch (error) {
            console.error("Failed to save chapter:", error);
            setIsSaving(false);
            alert("Lỗi khi lưu chương");
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-[#020617]">
                <Loader2 className="w-8 h-8 text-[#F59E0B] animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#020617]">
            {/* Header */}
            <div className="border-b border-white/10 p-6">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-sm text-[#9CA3AF] uppercase tracking-wide mb-1">
                                {chapterId === "new" ? "Chương mới" : "Chỉnh sửa chương"}
                            </h2>
                            <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
                                <span>Tập {currentVolume?.order}: {currentVolume?.title}</span>
                                <span>•</span>
                                <span className="font-mono text-[#34D399]">{slug}</span>
                            </div>
                        </div>
                        {showSaved && (
                            <div className="flex items-center gap-2 text-[#34D399]">
                                <Save className="w-4 h-4" />
                                <span className="text-sm">Đã lưu</span>
                            </div>
                        )}
                    </div>

                    {/* Title Input */}
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Tiêu đề chương..."
                        className="w-full text-3xl font-bold text-white bg-transparent border-none outline-none placeholder:text-white/30 mb-4"
                    />

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !title.trim()}
                        className={`px-6 py-2 font-bold rounded-lg transition-all flex items-center gap-2 ${isSaving || !title.trim()
                                ? "bg-[#9CA3AF]/20 text-[#9CA3AF] cursor-not-allowed"
                                : "bg-[#F59E0B] text-[#0B0C10] hover:bg-[#FBBF24] glow-amber cursor-pointer"
                            }`}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Lưu chương
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-5xl mx-auto">
                    <ChapterEditor
                        content={content}
                        onChange={setContent}
                        placeholder="Bắt đầu viết nội dung chương..."
                    />
                </div>
            </div>
        </div>
    );
}
