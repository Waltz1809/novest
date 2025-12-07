"use client";

import { useState, useEffect } from "react";
import ChapterEditor from "@/components/editor/chapter-editor";
import { Save, Loader2, History, AlertTriangle, RotateCcw, X } from "lucide-react";

interface Volume {
    id: number;
    title: string;
    order: number;
}

interface ChapterVersion {
    id: number;
    title: string;
    wordCount: number;
    createdAt: string;
    expiresAt: string;
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
    const [isDraft, setIsDraft] = useState(true);

    // Version history state
    const [versions, setVersions] = useState<ChapterVersion[]>([]);
    const [showVersions, setShowVersions] = useState(false);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [revertingVersion, setRevertingVersion] = useState<number | null>(null);

    // Published chapter warning state
    const [showPublishedWarning, setShowPublishedWarning] = useState(false);
    const [hasSeenWarning, setHasSeenWarning] = useState(false);

    const currentVolume = volumes.find(v => v.id === volumeId);

    // Load chapter content if editing existing chapter
    useEffect(() => {
        if (chapterId === "new") {
            setIsLoading(false);
            setContent("");
            setTitle("");
            setIsDraft(true);
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
                    setIsDraft(data.isDraft ?? true);
                    setIsLoading(false);

                    // Show warning for published chapters
                    if (!data.isDraft) {
                        setShowPublishedWarning(true);
                    }
                })
                .catch((error) => {
                    console.error("Failed to load chapter:", error);
                    setIsLoading(false);
                });
        }
    }, [chapterId, volumeId]);

    // Load version history
    const loadVersions = async () => {
        if (chapterId === "new") return;

        setLoadingVersions(true);
        try {
            const res = await fetch(`/api/chapters/${chapterId}/versions`);
            const data = await res.json();
            if (data.versions) {
                setVersions(data.versions);
            }
        } catch (error) {
            console.error("Failed to load versions:", error);
        }
        setLoadingVersions(false);
    };

    const toggleVersions = () => {
        if (!showVersions && versions.length === 0) {
            loadVersions();
        }
        setShowVersions(!showVersions);
    };

    const handleRevert = async (versionId: number) => {
        if (!confirm("Bạn có chắc muốn khôi phục phiên bản này? Phiên bản hiện tại sẽ được lưu vào lịch sử.")) {
            return;
        }

        setRevertingVersion(versionId);
        try {
            const res = await fetch(`/api/chapters/${chapterId}/revert`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ versionId }),
            });

            if (!res.ok) throw new Error("Failed to revert");

            // Reload chapter content
            const chapterRes = await fetch(`/api/chapters/${chapterId}`);
            const data = await chapterRes.json();
            setContent(data.content || "");
            setTitle(data.title || "");

            // Reload versions
            await loadVersions();

            alert("Đã khôi phục phiên bản thành công!");
        } catch (error) {
            console.error("Failed to revert:", error);
            alert("Lỗi khi khôi phục phiên bản");
        }
        setRevertingVersion(null);
    };

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

    const dismissWarning = () => {
        setShowPublishedWarning(false);
        setHasSeenWarning(true);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatExpiry = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) return "Hết hạn";
        if (diffDays === 1) return "Còn 1 ngày";
        return `Còn ${diffDays} ngày`;
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
            {/* Published Chapter Warning Modal */}
            {showPublishedWarning && !hasSeenWarning && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1E293B] rounded-xl max-w-md w-full p-6 border border-amber-500/30">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-amber-500/20 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-amber-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-2">
                                    Chương đã xuất bản
                                </h3>
                                <p className="text-[#9CA3AF] text-sm mb-4">
                                    Chương này đã được xuất bản và người đọc có thể đang xem.
                                    Mọi thay đổi sẽ được lưu vào lịch sử phiên bản trong 7 ngày để có thể khôi phục nếu cần.
                                </p>
                                <button
                                    onClick={dismissWarning}
                                    className="w-full px-4 py-2 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-400 transition-colors"
                                >
                                    Tôi hiểu, tiếp tục chỉnh sửa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="border-b border-white/10 p-6">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-sm text-[#9CA3AF] uppercase tracking-wide mb-1">
                                {chapterId === "new" ? "Chương mới" : "Chỉnh sửa chương"}
                            </h2>
                            <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
                                <span>{currentVolume?.title}</span>
                                {!isDraft && (
                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">
                                        Đã xuất bản
                                    </span>
                                )}
                                {isDraft && (
                                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                                        Bản nháp
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {showSaved && (
                                <div className="flex items-center gap-2 text-[#34D399]">
                                    <Save className="w-4 h-4" />
                                    <span className="text-sm">Đã lưu</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Title Input */}
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Tiêu đề chương..."
                        className="w-full text-3xl font-bold text-white bg-transparent border-none outline-none placeholder:text-white/30 mb-4"
                    />

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !title.trim()}
                            className={`px-6 py-2 font-bold rounded-lg transition-all flex items-center gap-2 ${isSaving || !title.trim()
                                ? "bg-[#9CA3AF]/20 text-[#9CA3AF] cursor-not-allowed"
                                : "bg-[#F59E0B] text-[#0B0C10] hover:bg-[#FBBF24] cursor-pointer"
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

                        {/* Version History Button */}
                        {chapterId !== "new" && (
                            <div className="relative">
                                <button
                                    onClick={toggleVersions}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-[#9CA3AF] hover:text-white rounded-lg transition-all flex items-center gap-2"
                                >
                                    <History className="w-4 h-4" />
                                    <span className="hidden sm:inline">Lịch sử</span>
                                </button>

                                {/* Version History Dropdown */}
                                {showVersions && (
                                    <div className="absolute right-0 top-full mt-2 w-80 bg-[#1E293B] rounded-xl border border-white/10 shadow-xl z-40">
                                        <div className="p-3 border-b border-white/10 flex items-center justify-between">
                                            <span className="font-medium text-white">Lịch sử phiên bản</span>
                                            <button
                                                onClick={() => setShowVersions(false)}
                                                className="p-1 hover:bg-white/10 rounded text-[#9CA3AF]"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            {loadingVersions ? (
                                                <div className="p-4 flex justify-center">
                                                    <Loader2 className="w-5 h-5 animate-spin text-[#9CA3AF]" />
                                                </div>
                                            ) : versions.length === 0 ? (
                                                <div className="p-4 text-center text-[#9CA3AF] text-sm">
                                                    Chưa có phiên bản nào được lưu
                                                </div>
                                            ) : (
                                                <div className="p-2">
                                                    {versions.map((version) => (
                                                        <div
                                                            key={version.id}
                                                            className="p-3 hover:bg-white/5 rounded-lg transition-colors"
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm text-white truncate">
                                                                        {version.title}
                                                                    </p>
                                                                    <p className="text-xs text-[#9CA3AF] mt-1">
                                                                        {formatDate(version.createdAt)} • {version.wordCount.toLocaleString()} từ
                                                                    </p>
                                                                    <p className="text-xs text-amber-400/80 mt-0.5">
                                                                        {formatExpiry(version.expiresAt)}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleRevert(version.id)}
                                                                    disabled={revertingVersion === version.id}
                                                                    className="shrink-0 p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors disabled:opacity-50"
                                                                    title="Khôi phục phiên bản này"
                                                                >
                                                                    {revertingVersion === version.id ? (
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                    ) : (
                                                                        <RotateCcw className="w-4 h-4" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2 border-t border-white/10">
                                            <p className="text-xs text-[#9CA3AF] text-center">
                                                Phiên bản được lưu tự động khi chỉnh sửa và hết hạn sau 7 ngày
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
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
