"use client";

import { useState } from "react";
import { Loader2, Save, X, FileText, Calendar, Send } from "lucide-react";
import ChapterEditor from "@/components/editor/chapter-editor";

interface InlineChapterFormProps {
    novelId: number;
    volumeId: number;
    novelApprovalStatus?: string; // To disable draft for pending novels
    initialData?: {
        id: number;
        title: string;
        content: string;
        isDraft?: boolean;
        publishAt?: string | null;
    };
    onCancel: () => void;
    onSuccess: () => void;
}

export default function InlineChapterForm({
    novelId,
    volumeId,
    novelApprovalStatus = "APPROVED",
    initialData,
    onCancel,
    onSuccess,
}: InlineChapterFormProps) {
    const [title, setTitle] = useState(initialData?.title || "");
    const [content, setContent] = useState(initialData?.content || "");
    const [isDraft, setIsDraft] = useState(initialData?.isDraft ?? false);
    const [publishAt, setPublishAt] = useState(initialData?.publishAt || "");
    const [isSaving, setIsSaving] = useState(false);

    // Pending novels can't have drafts - all chapters publish immediately when approved
    const canToggleDraft = novelApprovalStatus === "APPROVED";

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
                    isDraft: canToggleDraft ? isDraft : false,
                    publishAt: isDraft && publishAt ? new Date(publishAt).toISOString() : null,
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

    // Get minimum date for schedule (now + 1 hour)
    const minScheduleDate = () => {
        const now = new Date();
        now.setHours(now.getHours() + 1);
        return now.toISOString().slice(0, 16);
    };

    return (
        <div className="bg-[#0B0C10] border border-amber-500/20 rounded-lg p-4 mt-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-white font-bold">
                        {initialData ? "Chỉnh sửa chương" : "Thêm chương mới"}
                    </h3>
                </div>
                <button
                    onClick={onCancel}
                    className="text-[#9CA3AF] hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-4">
                {/* Title */}
                <div>
                    <label className="block text-xs text-[#9CA3AF] mb-1">Tiêu đề chương</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ví dụ: Chương 1: Mở đầu"
                        className="w-full bg-[#1E293B] border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-[#9CA3AF]/50 focus:outline-none focus:border-[#F59E0B]"
                        autoFocus
                    />
                </div>

                {/* Editor */}
                <div>
                    <label className="block text-xs text-[#9CA3AF] mb-1">Nội dung</label>
                    <div className="h-[400px] border border-white/10 rounded-lg overflow-hidden">
                        <ChapterEditor
                            content={content}
                            onChange={setContent}
                            placeholder="Nhập nội dung chương..."
                        />
                    </div>
                </div>

                {/* Draft Toggle - Only for approved novels */}
                {canToggleDraft && (
                    <div className="bg-[#1E293B]/50 rounded-xl p-4 border border-white/5 space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={isDraft}
                                    onChange={(e) => {
                                        setIsDraft(e.target.checked);
                                        if (!e.target.checked) setPublishAt("");
                                    }}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-[#374151] peer-focus:outline-none rounded-full peer peer-checked:bg-amber-500 transition-colors"></div>
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">
                                    Lưu làm bản nháp
                                </span>
                                <p className="text-xs text-[#9CA3AF]">
                                    {isDraft
                                        ? "Chương sẽ không hiển thị cho độc giả cho đến khi xuất bản"
                                        : "Chương sẽ xuất bản ngay lập tức"
                                    }
                                </p>
                            </div>
                        </label>

                        {/* Schedule picker - Only show when draft is checked */}
                        {isDraft && (
                            <div className="pl-14 animate-in slide-in-from-top-2">
                                <label className="block text-xs text-[#9CA3AF] mb-2">
                                    <Calendar className="w-3.5 h-3.5 inline mr-1" />
                                    Lên lịch xuất bản (tùy chọn)
                                </label>
                                <input
                                    type="datetime-local"
                                    value={publishAt}
                                    onChange={(e) => setPublishAt(e.target.value)}
                                    min={minScheduleDate()}
                                    className="w-full md:w-auto bg-[#0B0C10] border border-amber-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                                />
                                {publishAt && (
                                    <p className="text-xs text-amber-400 mt-2">
                                        📅 Sẽ tự động xuất bản vào {new Date(publishAt).toLocaleString("vi-VN")}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Info for pending novels */}
                {!canToggleDraft && (
                    <p className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                        ℹ️ Truyện đang chờ duyệt. Chương sẽ xuất bản ngay khi truyện được phê duyệt.
                    </p>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-[#9CA3AF] hover:text-white hover:bg-white/10 rounded-lg transition-all text-sm"
                        disabled={isSaving}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !title.trim()}
                        className={`
                            px-5 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition-all
                            ${isSaving || !title.trim()
                                ? "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                                : isDraft
                                    ? "bg-amber-500 text-[#0B0C10] hover:bg-amber-400"
                                    : "bg-emerald-600 text-white hover:bg-emerald-500"
                            }
                        `}
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isDraft ? (
                            <FileText className="w-4 h-4" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        {initialData
                            ? "Cập nhật"
                            : isDraft
                                ? "Lưu nháp"
                                : "Xuất bản"
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}


