"use client";

import { useState, useEffect, useTransition } from "react";
import RichTextEditor from "@/components/editor/rich-text-editor";
import { Save, BookOpen, DollarSign, Lock, Loader2, Hash, Link as LinkIcon, Type } from "lucide-react";
import { getNovels, getVolumes, createChapter } from "@/actions/chapter";
import { useRouter } from "next/navigation";

interface Novel {
    id: number;
    title: string;
}

interface Volume {
    id: number;
    title: string;
    order: number;
}

export default function WriteChapterPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Data
    const [novels, setNovels] = useState<Novel[]>([]);
    const [volumes, setVolumes] = useState<Volume[]>([]);

    // Form State
    const [content, setContent] = useState("");
    const [chapterNumber, setChapterNumber] = useState("");
    const [chapterName, setChapterName] = useState("");
    const [novelId, setNovelId] = useState("");
    const [volumeId, setVolumeId] = useState("");
    const [price, setPrice] = useState(0);
    const [isLocked, setIsLocked] = useState(false);

    // Derived State
    const slug = (() => {
        if (!volumeId || !chapterNumber) return "";
        const selectedVolume = volumes.find(v => v.id === parseInt(volumeId));
        if (!selectedVolume) return "";
        return `vol-${selectedVolume.order}-chap-${chapterNumber}`;
    })();

    // Fetch Novels on Mount
    useEffect(() => {
        getNovels().then(setNovels);
    }, []);

    // Fetch Volumes when Novel changes
    useEffect(() => {
        if (novelId) {
            getVolumes(parseInt(novelId)).then(setVolumes);
            setVolumeId(""); // Reset volume
        } else {
            setVolumes([]);
        }
    }, [novelId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!novelId || !volumeId || !chapterNumber || !chapterName || !content) {
            alert("Vui lòng điền đầy đủ thông tin");
            return;
        }

        const fullTitle = `Chương ${chapterNumber}: ${chapterName}`;

        startTransition(async () => {
            try {
                await createChapter({
                    title: fullTitle,
                    content,
                    volumeId: parseInt(volumeId),
                    price,
                    isLocked,
                    order: parseInt(chapterNumber),
                });
                alert("Đăng chương thành công!");
                // Reset form
                setChapterName("");
                setChapterNumber((prev) => (parseInt(prev) + 1).toString()); // Auto increment
                setContent("");
            } catch (error) {
                console.error(error);
                alert("Có lỗi xảy ra khi đăng chương");
            }
        });
    };

    return (
        <div className="max-w-[1600px] mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Viết chương mới</h1>
                    <p className="text-gray-500 text-sm">Soạn thảo và đăng tải chương mới cho truyện.</p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Đăng chương
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)]">
                {/* Left Column: Editor (Takes up most space) */}
                <div className="lg:col-span-3 flex flex-col gap-4 h-full">
                    {/* Title Inputs Group */}
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-2 space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                                <Hash className="w-3 h-3" /> Số chương
                            </label>
                            <input
                                type="number"
                                value={chapterNumber}
                                onChange={(e) => setChapterNumber(e.target.value)}
                                placeholder="1"
                                className="w-full px-3 py-2 font-bold border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                required
                            />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                                <LinkIcon className="w-3 h-3" /> Slug
                            </label>
                            <input
                                type="text"
                                value={slug}
                                readOnly
                                className="w-full px-3 py-2 font-medium bg-gray-50 text-gray-500 border border-gray-200 rounded-lg cursor-not-allowed outline-none shadow-sm"
                            />
                        </div>
                        <div className="col-span-8 space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                                <Type className="w-3 h-3" /> Tên chương
                            </label>
                            <input
                                type="text"
                                value={chapterName}
                                onChange={(e) => setChapterName(e.target.value)}
                                placeholder="Ví dụ: Thiên thạch rơi xuống"
                                className="w-full px-3 py-2 font-bold border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex-1 min-h-0">
                        <RichTextEditor
                            content={content}
                            onChange={setContent}
                            placeholder="Nhập nội dung chương tại đây..."
                        />
                    </div>
                </div>

                {/* Right Column: Sidebar Settings */}
                <div className="lg:col-span-1 space-y-6 overflow-y-auto pr-1">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                            <BookOpen className="w-4 h-4 text-indigo-600" />
                            Thiết lập truyện
                        </h3>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Chọn Truyện</label>
                            <select
                                value={novelId}
                                onChange={(e) => setNovelId(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50"
                                required
                            >
                                <option value="">-- Chọn truyện --</option>
                                {novels.map((novel) => (
                                    <option key={novel.id} value={novel.id}>
                                        {novel.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Chọn Tập (Volume)</label>
                            <select
                                value={volumeId}
                                onChange={(e) => setVolumeId(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50"
                                required
                                disabled={!novelId}
                            >
                                <option value="">-- Chọn tập --</option>
                                {volumes.map((vol) => (
                                    <option key={vol.id} value={vol.id}>
                                        {vol.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            Thiết lập VIP
                        </h3>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <input
                                type="checkbox"
                                id="isLocked"
                                checked={isLocked}
                                onChange={(e) => setIsLocked(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="isLocked" className="text-sm font-medium text-gray-700 select-none cursor-pointer flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-gray-500" /> Khóa chương (VIP)
                            </label>
                        </div>

                        {isLocked && (
                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Giá tiền (Xu)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        value={price}
                                        onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                    <DollarSign className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
