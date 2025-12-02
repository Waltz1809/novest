"use client";

import { useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import ChapterEditor from "@/components/editor/chapter-editor";

interface InlineChapterFormProps {
    novelId: number;
    volumeId: number;
    initialData?: {
        id: number;
        title: string;
        content: string;
        price: number;
    };
    onCancel: () => void;
    onSuccess: () => void;
}

export default function InlineChapterForm({
    novelId,
    volumeId,
    initialData,
    onCancel,
    onSuccess,
}: InlineChapterFormProps) {
    const [title, setTitle] = useState(initialData?.title || "");
    const [content, setContent] = useState(initialData?.content || "");
    const [price, setPrice] = useState(initialData?.price || 0);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!title.trim()) return;

        setIsSaving(true);
        try {
            const url = initialData
                ? `/api/chapters/${initialData.id}`
                : "/api/chapters";

            const method = initialData ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    content,
                    novelId,
                    volumeId,
                    price,
                }),
            });

            if (!response.ok) throw new Error("Failed to save chapter");

            onSuccess();
        } catch (error) {
            console.error("Failed to save chapter:", error);
            alert("Lỗi khi lưu chương");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-[#0B0C10] border border-[#34D399]/20 rounded-lg p-4 mt-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">
                    {initialData ? "Chỉnh sửa chương" : "Thêm chương mới"}
                </h3>
                <button
                    onClick={onCancel}
                    className="text-[#9CA3AF] hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-4">
                {/* Title & Price */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs text-[#9CA3AF] mb-1">Tiêu đề chương</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ví dụ: Chương 1: Mở đầu"
                            className="w-full bg-[#1E293B] border border-[#34D399]/20 rounded-lg px-3 py-2 text-white placeholder:text-[#9CA3AF]/50 focus:outline-none focus:border-[#F59E0B]"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-[#9CA3AF] mb-1">Giá (Xu)</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                            min="0"
                            className="w-full bg-[#1E293B] border border-[#34D399]/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F59E0B]"
                        />
                    </div>
                </div>

                {/* Editor */}
                <div>
                    <label className="block text-xs text-[#9CA3AF] mb-1">Nội dung</label>
                    <div className="h-[400px] border border-[#34D399]/20 rounded-lg overflow-hidden">
                        <ChapterEditor
                            content={content}
                            onChange={setContent}
                            placeholder="Nhập nội dung chương..."
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={onCancel}
                        className="p-2 text-[#9CA3AF] hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        disabled={isSaving}
                        title="Hủy bỏ"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !title.trim()}
                        className={`
                            px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm
                            ${isSaving || !title.trim()
                                ? "bg-[#34D399]/20 text-[#34D399]/50 cursor-not-allowed"
                                : "bg-[#F59E0B] text-[#0B0C10] hover:bg-[#FBBF24] glow-amber"
                            }
                        `}
                        title={initialData ? "Cập nhật" : "Lưu chương"}
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        <span className="hidden md:inline">{initialData ? "Cập nhật" : "Lưu"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
