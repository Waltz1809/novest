"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Edit, ImageIcon, ChevronDown, X } from "lucide-react";
import { updateNovel, updateNovelCoverUrl } from "@/app/actions/novel";
import { UploadButton } from "@/lib/uploadthing";

interface Genre {
    id: number;
    name: string;
    slug: string;
}

interface NovelInfoEditorProps {
    novel: {
        id: number;
        title: string;
        author: string;
        description: string | null;
        status: string;
        coverImage: string | null;
        genres: Genre[];
    };
}

export default function NovelInfoEditor({ novel }: NovelInfoEditorProps) {
    const [formData, setFormData] = useState({
        title: novel.title,
        author: novel.author,
        description: novel.description || "",
        status: novel.status,
    });

    const [isSaving, setIsSaving] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const [coverPreview, setCoverPreview] = useState<string | null>(novel.coverImage);
    const [showUploadButton, setShowUploadButton] = useState(false);

    const hasChanges =
        formData.title !== novel.title ||
        formData.author !== novel.author ||
        formData.description !== (novel.description || "") ||
        formData.status !== novel.status;

    const handleSave = async () => {
        setIsSaving(true);

        try {
            await updateNovel(novel.id, formData);
            setIsSaving(false);
            setShowSaved(true);
            setTimeout(() => setShowSaved(false), 3000);
        } catch (error) {
            console.error("Failed to save:", error);
            setIsSaving(false);
            alert("Lỗi khi lưu thay đổi");
        }
    };

    const handleCoverUploadComplete = async (res: any) => {
        if (res && res[0]) {
            const newCoverUrl = res[0].url;
            setCoverPreview(newCoverUrl);

            try {
                await updateNovelCoverUrl(novel.id, newCoverUrl);
                setShowSaved(true);
                setTimeout(() => setShowSaved(false), 3000);
                setShowUploadButton(false);
            } catch (error) {
                console.error("Failed to update cover URL:", error);
                alert("Lỗi khi cập nhật ảnh bìa");
            }
        }
    };

    const handleRemoveCover = async () => {
        try {
            await updateNovelCoverUrl(novel.id, "");
            setCoverPreview(null);
            setShowSaved(true);
            setTimeout(() => setShowSaved(false), 3000);
        } catch (error) {
            console.error("Failed to remove cover:", error);
            alert("Lỗi khi xóa ảnh bìa");
        }
    };

    return (
        <div className="h-full overflow-y-auto bg-[#020617] p-8">
            <div className="max-w-5xl mx-auto">
                <div className="text-sm text-[#9CA3AF] mb-4">
                    Dashboard &gt; {novel.title}
                </div>

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <span className="text-[#F59E0B] font-medium">[ Thông tin / Cài đặt ]</span>
                    </div>
                    {showSaved && (
                        <div className="flex items-center gap-2 text-[#34D399]">
                            <Check className="w-4 h-4" />
                            <span className="text-sm">Đã lưu</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-8">
                    <div className="col-span-2 space-y-6">
                        <div>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full text-5xl font-serif font-bold text-[#F59E0B] bg-transparent border-none outline-none placeholder:text-[#F59E0B]/30 leading-tight"
                                style={{ fontFamily: "'Merriweather', serif", lineHeight: "1.2" }}
                                placeholder="TÊN TRUYỆN"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-[#9CA3AF] uppercase mb-2 block tracking-wide">Tác giả</label>
                            <input
                                type="text"
                                value={formData.author}
                                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg bg-[#0f172a] border border-white/10 text-gray-100 placeholder:text-gray-500 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 outline-none transition-all"
                                placeholder="Tác giả"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-[#9CA3AF] uppercase mb-2 block tracking-wide">Tóm tắt</label>
                            <textarea
                                rows={4}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg bg-[#0f172a] border border-white/10 text-gray-100 placeholder:text-gray-500 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 outline-none transition-all resize-none"
                                placeholder="Tóm tắt"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-[#9CA3AF] uppercase mb-2 block tracking-wide">Trạng thái</label>
                            <div className="relative">
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full pl-4 pr-12 py-3.5 rounded-lg bg-[#0f172a] border-2 border-[#F59E0B]/30 text-gray-100 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="ONGOING" className="bg-[#0f172a] text-white">Đang tiến hành</option>
                                    <option value="COMPLETED" className="bg-[#0f172a] text-white">Hoàn thành</option>
                                    <option value="HIATUS" className="bg-[#0f172a] text-white">Tạm dừng</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F59E0B] pointer-events-none" />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleSave}
                                disabled={!hasChanges || isSaving}
                                className={`px-6 py-3 font-bold rounded-lg transition-all ${hasChanges && !isSaving ? "bg-[#F59E0B] text-[#0B0C10] hover:bg-[#FBBF24] glow-amber cursor-pointer" : "bg-[#9CA3AF]/20 text-[#9CA3AF] cursor-not-allowed"}`}
                            >
                                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                            </button>
                        </div>
                    </div>

                    <div className="col-span-1">
                        <div className="sticky top-8">
                            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#0f172a] border border-white/10 group">
                                {coverPreview ? (
                                    <>
                                        <Image src={coverPreview} alt={novel.title} fill className="object-cover" sizes="300px" />
                                        <button
                                            onClick={handleRemoveCover}
                                            className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                            type="button"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-[#9CA3AF]">
                                        <ImageIcon className="w-12 h-12" />
                                    </div>
                                )}

                                {!showUploadButton && (
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => setShowUploadButton(true)}
                                            className="px-4 py-2 bg-[#F59E0B] text-[#0B0C10] font-bold rounded-lg flex items-center gap-2 hover:bg-[#FBBF24] transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Đổi ảnh bìa
                                        </button>
                                    </div>
                                )}

                                {showUploadButton && (
                                    <div className="absolute inset-0 bg-[#0f172a]/95 flex flex-col items-center justify-center p-4 gap-3">
                                        <UploadButton
                                            endpoint="imageUploader"
                                            onClientUploadComplete={handleCoverUploadComplete}
                                            onUploadError={(error: Error) => {
                                                alert(`Lỗi upload: ${error.message}`);
                                            }}
                                        />
                                        <button
                                            onClick={() => setShowUploadButton(false)}
                                            className="text-xs text-[#9CA3AF] hover:text-white transition-colors"
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-[#9CA3AF] mt-2 text-center uppercase tracking-wide">{novel.title}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
