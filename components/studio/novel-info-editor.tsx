"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { updateNovel } from "@/actions/novel";
import { getGenres } from "@/actions/search";
import ImageUpload from "@/components/novel/image-upload";
import GenreSelector from "@/components/novel/genre-selector";
import GroupSelector from "@/components/novel/group-selector";
import CustomDropdown from "@/components/ui/custom-dropdown";

interface Genre {
    id: number;
    name: string;
    slug: string;
}

interface NovelInfoEditorProps {
    novel: {
        id: number;
        title: string;
        slug: string;
        author: string;
        artist?: string | null;
        description: string | null;
        status: string;
        coverImage: string | null;
        alternativeTitles: string | null;
        genres: Genre[];
        isR18?: boolean;
        isLicensedDrop?: boolean;
        translationGroupId?: string | null;
    };
    groups: { id: string; name: string }[];
}

export default function NovelInfoEditor({ novel, groups }: NovelInfoEditorProps) {
    const [formData, setFormData] = useState({
        title: novel.title,
        author: novel.author,
        artist: novel.artist || "",
        description: novel.description || "",
        status: novel.status,
        isR18: novel.isR18 ?? false,
        isLicensedDrop: novel.isLicensedDrop ?? false,
    });
    const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>(
        novel.genres.map(g => g.id)
    );
    const [allGenres, setAllGenres] = useState<Genre[]>([]);

    const [isSaving, setIsSaving] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const [coverPreview, setCoverPreview] = useState<string | null>(novel.coverImage);

    // Fetch all genres on mount
    useEffect(() => {
        getGenres().then(setAllGenres);
    }, []);

    const hasChanges =
        formData.title !== novel.title ||
        formData.author !== novel.author ||
        formData.artist !== (novel.artist || "") ||
        formData.description !== (novel.description || "") ||
        formData.status !== novel.status ||
        formData.isR18 !== (novel.isR18 ?? false) ||
        formData.isLicensedDrop !== (novel.isLicensedDrop ?? false) ||
        coverPreview !== novel.coverImage ||
        JSON.stringify(selectedGenreIds.sort()) !== JSON.stringify(novel.genres.map(g => g.id).sort());

    const handleSave = async () => {
        setIsSaving(true);

        try {
            await updateNovel(novel.id, {
                ...formData,
                slug: novel.slug,
                coverImage: coverPreview || "",
                alternativeTitles: novel.alternativeTitles || "",
                genreIds: selectedGenreIds,
            });
            setIsSaving(false);
            setShowSaved(true);
            setTimeout(() => setShowSaved(false), 3000);
        } catch (error) {
            console.error("Failed to save:", error);
            setIsSaving(false);
            alert("Lỗi khi lưu thay đổi");
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] p-4 md:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">
                            Dashboard &gt; {novel.title}
                        </p>
                        <span className="text-[#F59E0B] font-medium text-sm">[ Chỉnh sửa thông tin ]</span>
                    </div>
                    {showSaved && (
                        <div className="flex items-center gap-2 text-emerald-400 animate-in fade-in duration-300">
                            <Check className="w-4 h-4" />
                            <span className="text-sm font-medium">Đã lưu thành công!</span>
                        </div>
                    )}
                </div>

                {/* Main Grid: 2 columns on lg, 1 column on mobile */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT COLUMN - Main Form (2/3 width on desktop) */}
                    <div className="lg:col-span-2 space-y-6 order-2 lg:order-none">

                        {/* Card: Basic Info */}
                        <section className="bg-[#0f172a]/50 border border-white/5 rounded-xl p-5 md:p-6 space-y-5">
                            <h2 className="text-xs uppercase tracking-widest text-gray-500 font-semibold flex items-center gap-2">
                                <span className="w-1 h-4 bg-[#F59E0B] rounded-full"></span>
                                Thông tin cơ bản
                            </h2>

                            {/* Title - Large and prominent */}
                            <div>
                                <label className="text-xs text-gray-400 uppercase mb-2 block tracking-wide">
                                    Tên truyện
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    onBlur={(e) => {
                                        const titleCased = e.target.value
                                            .split(' ')
                                            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                            .join(' ');
                                        setFormData({ ...formData, title: titleCased });
                                    }}
                                    className="w-full text-2xl md:text-3xl font-serif font-bold text-[#F59E0B] bg-transparent border-b-2 border-[#F59E0B]/20 focus:border-[#F59E0B] pb-2 outline-none placeholder:text-[#F59E0B]/30 transition-colors"
                                    style={{ fontFamily: "'Merriweather', serif" }}
                                    placeholder="Nhập tên truyện..."
                                />
                            </div>

                            {/* Author & Artist - 2 columns on md+ */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase mb-2 block tracking-wide">
                                        Tác giả <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.author}
                                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg bg-[#0B0C10] border border-white/10 text-gray-100 placeholder:text-gray-600 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30 outline-none transition-all"
                                        placeholder="Tên tác giả"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase mb-2 block tracking-wide">
                                        Họa sĩ <span className="text-gray-600 normal-case">(không bắt buộc)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.artist}
                                        onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg bg-[#0B0C10] border border-white/10 text-gray-100 placeholder:text-gray-600 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30 outline-none transition-all"
                                        placeholder="Tên họa sĩ minh họa"
                                    />
                                </div>
                            </div>

                            {/* Summary */}
                            <div>
                                <label className="text-xs text-gray-400 uppercase mb-2 block tracking-wide">
                                    Tóm tắt nội dung
                                </label>
                                <textarea
                                    rows={5}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-[#0B0C10] border border-white/10 text-gray-100 placeholder:text-gray-600 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30 outline-none transition-all resize-none leading-relaxed"
                                    placeholder="Mô tả ngắn gọn về nội dung truyện..."
                                />
                            </div>
                        </section>

                        {/* Card: Classification */}
                        <section className="bg-[#0f172a]/50 border border-white/5 rounded-xl p-5 md:p-6 space-y-5">
                            <h2 className="text-xs uppercase tracking-widest text-gray-500 font-semibold flex items-center gap-2">
                                <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                                Phân loại
                            </h2>

                            {/* Genres */}
                            <div>
                                <label className="text-xs text-gray-400 uppercase mb-2 block tracking-wide">
                                    Thể loại
                                </label>
                                <GenreSelector
                                    genres={allGenres}
                                    selectedValues={selectedGenreIds}
                                    onChange={setSelectedGenreIds}
                                />
                            </div>

                            {/* Translation Group */}
                            <GroupSelector
                                novelId={novel.id}
                                currentGroupId={novel.translationGroupId || null}
                                groups={groups}
                            />
                        </section>
                    </div>

                    {/* RIGHT COLUMN - Sidebar (1/3 width on desktop) */}
                    {/* On mobile: uses contents to allow children to participate in grid ordering */}
                    <div className="lg:col-span-1 contents lg:block lg:space-y-6">

                        {/* Card: Cover Image - Shows first on mobile */}
                        <section className="bg-[#0f172a]/50 border border-white/5 rounded-xl p-5 md:p-6 order-1 lg:order-none mb-6">
                            <h2 className="text-xs uppercase tracking-widest text-gray-500 font-semibold flex items-center gap-2 mb-4">
                                <span className="w-1 h-4 bg-sky-500 rounded-full"></span>
                                Ảnh bìa
                            </h2>
                            <ImageUpload
                                value={coverPreview || ""}
                                onChange={setCoverPreview}
                                disabled={isSaving}
                            />
                            <p className="text-xs text-gray-500 mt-3 text-center truncate">
                                {novel.title}
                            </p>
                        </section>

                        {/* Card: Settings - Shows after main form on mobile */}
                        <section className="bg-[#0f172a]/50 border border-white/5 rounded-xl p-5 md:p-6 space-y-5 order-3 lg:order-none mb-6">
                            <h2 className="text-xs uppercase tracking-widest text-gray-500 font-semibold flex items-center gap-2">
                                <span className="w-1 h-4 bg-violet-500 rounded-full"></span>
                                Cài đặt
                            </h2>

                            {/* Status Dropdown */}
                            <div>
                                <label className="text-xs text-gray-400 uppercase mb-2 block tracking-wide">
                                    Trạng thái
                                </label>
                                <CustomDropdown
                                    options={[
                                        { value: "ONGOING", label: "Đang tiến hành" },
                                        { value: "COMPLETED", label: "Hoàn thành" },
                                        { value: "HIATUS", label: "Tạm dừng" },
                                    ]}
                                    value={formData.status}
                                    onChange={(status) => setFormData({ ...formData, status })}
                                />
                            </div>

                            {/* Checkboxes */}
                            <div className="space-y-3 pt-2">
                                <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-lg bg-[#0B0C10]/50 border border-white/5 hover:border-red-500/20 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.isR18}
                                        onChange={(e) => setFormData({ ...formData, isR18: e.target.checked })}
                                        className="w-5 h-5 mt-0.5 rounded border-2 border-red-500/50 bg-transparent text-red-500 focus:ring-red-500/30 focus:ring-2 cursor-pointer accent-red-500"
                                    />
                                    <div>
                                        <span className="text-sm text-gray-200 group-hover:text-white transition-colors font-medium">
                                            Nội dung 18+
                                        </span>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Chỉ hiển thị với người dùng đủ 18 tuổi
                                        </p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-lg bg-[#0B0C10]/50 border border-white/5 hover:border-amber-500/20 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.isLicensedDrop}
                                        onChange={(e) => setFormData({ ...formData, isLicensedDrop: e.target.checked })}
                                        className="w-5 h-5 mt-0.5 rounded border-2 border-amber-500/50 bg-transparent text-amber-500 focus:ring-amber-500/30 focus:ring-2 cursor-pointer accent-amber-500"
                                    />
                                    <div>
                                        <span className="text-sm text-gray-200 group-hover:text-white transition-colors font-medium">
                                            Bản quyền đã drop
                                        </span>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Chặn đặt chương VIP
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </section>

                        {/* Save Button - Shows last on mobile */}
                        <div className="lg:sticky lg:top-6 order-4 lg:order-none">
                            <button
                                onClick={handleSave}
                                disabled={!hasChanges || isSaving}
                                className={`w-full py-3.5 font-bold rounded-xl transition-all text-center ${hasChanges && !isSaving
                                    ? "bg-linear-to-r from-[#F59E0B] to-amber-500 text-[#0B0C10] hover:from-[#FBBF24] hover:to-amber-400 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-[0.98]"
                                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
                                    }`}
                            >
                                {isSaving ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Đang lưu...
                                    </span>
                                ) : (
                                    "Lưu thay đổi"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
