"use client";

import { useState, useEffect, useTransition } from "react";
import RichTextEditor from "@/components/editor/rich-text-editor";
import { Save, BookOpen, DollarSign, Lock, Loader2, Hash, Link as LinkIcon, Type, Plus, X } from "lucide-react";
import { getNovels, getVolumes, createChapter, createVolume } from "@/actions/chapter";
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

    // Quick Create Volume State
    const [showCreateVolume, setShowCreateVolume] = useState(false);
    const [newVolumeTitle, setNewVolumeTitle] = useState("");
    const [newVolumeOrder, setNewVolumeOrder] = useState(1);
    const [isCreatingVolume, startVolumeTransition] = useTransition();

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
            getVolumes(parseInt(novelId)).then((vols) => {
                setVolumes(vols);
                // Auto set next volume order
                if (vols.length > 0) {
                    const maxOrder = Math.max(...vols.map(v => v.order));
                    setNewVolumeOrder(maxOrder + 1);
                } else {
                    setNewVolumeOrder(1);
                }
            });
            setVolumeId(""); // Reset volume
        } else {
            setVolumes([]);
        }
    }, [novelId]);

    const handleCreateVolume = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVolumeTitle || !newVolumeOrder || !novelId) return;

        startVolumeTransition(async () => {
            const res = await createVolume({
                title: newVolumeTitle,
                order: newVolumeOrder,
                novelId: parseInt(novelId)
            });

            if (res.error) {
                alert(res.error);
            } else {
                // Refresh volumes
                const vols = await getVolumes(parseInt(novelId));
                setVolumes(vols);

                // Find the newly created volume (assuming it's the one with the order we just set)
                // Or better, we could return the created volume from the action, but for now let's find it
                const createdVol = vols.find(v => v.order === newVolumeOrder && v.title === newVolumeTitle);
                if (createdVol) {
                    setVolumeId(createdVol.id.toString());
                }

                // Reset form
                setShowCreateVolume(false);
                setNewVolumeTitle("");
                setNewVolumeOrder(prev => prev + 1);
            }
        });
    };

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
            {/* Textured Background Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-noise" style={{ zIndex: -1 }} />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Viết chương mới</h1>
                    <p className="text-[#9CA3AF] text-sm">Soạn thảo và đăng tải chương mới cho truyện.</p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="flex items-center gap-2 px-6 py-3 bg-[#F59E0B] text-[#0B0C10] font-bold rounded-lg hover:bg-[#FBBF24] transition-all shadow-lg glow-amber hover:glow-amber-strong disabled:opacity-50 disabled:cursor-not-allowed"
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
                            <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                <Hash className="w-3 h-3" /> Số chương
                            </label>
                            <input
                                type="number"
                                value={chapterNumber}
                                onChange={(e) => setChapterNumber(e.target.value)}
                                placeholder="1"
                                className="w-full px-3 py-2 font-bold bg-[#1E293B] text-white rounded-lg focus:ring-2 focus:ring-[#F59E0B] border border-[#34D399]/20 focus:border-[#F59E0B] outline-none transition-all shadow-md"
                                required
                            />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                <LinkIcon className="w-3 h-3" /> Slug
                            </label>
                            <input
                                type="text"
                                value={slug}
                                readOnly
                                className="w-full px-3 py-2 font-medium bg-muted text-muted-foreground  rounded-lg cursor-not-allowed outline-none shadow-md"
                            />
                        </div>
                        <div className="col-span-8 space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                <Type className="w-3 h-3" /> Tên chương
                            </label>
                            <input
                                type="text"
                                value={chapterName}
                                onChange={(e) => setChapterName(e.target.value)}
                                placeholder=""
                                className="w-full px-3 py-2 font-bold bg-[#1E293B] text-white rounded-lg focus:ring-2 focus:ring-[#F59E0B] border border-[#34D399]/20 focus:border-[#F59E0B] outline-none transition-all shadow-md"
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
                    <div className="bg-[#1E293B] p-5 rounded-xl shadow-lg border border-[#34D399]/20 space-y-4">
                        <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                            <BookOpen className="w-4 h-4 text-[#F59E0B]" />
                            Thiết lập truyện
                        </h3>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase">Chọn Truyện</label>
                            <select
                                value={novelId}
                                onChange={(e) => setNovelId(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none transition-all bg-[#1E293B] text-white border border-[#34D399]/20 hover:border-[#34D399]/40"
                                required
                            >
                                <option value="" className="bg-[#1E293B] text-white">-- Chọn truyện --</option>
                                {novels.map((novel) => (
                                    <option key={novel.id} value={novel.id} className="bg-[#1E293B] text-white">
                                        {novel.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Chọn Tập (Volume)</label>
                                {novelId && (
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateVolume(!showCreateVolume)}
                                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Thêm tập
                                    </button>
                                )}
                            </div>

                            {showCreateVolume && (
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg  space-y-3 mb-2 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Tạo tập mới</span>
                                        <button onClick={() => setShowCreateVolume(false)} className="text-indigo-400 hover:text-indigo-600">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={newVolumeTitle}
                                            onChange={(e) => setNewVolumeTitle(e.target.value)}
                                            placeholder="Tên tập (VD: Tập 1)"
                                            className="w-full px-2 py-1.5 text-sm rounded focus:ring-1 focus:ring-[#F59E0B] outline-none bg-[#1E293B] text-white border border-[#34D399]/20"
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={newVolumeOrder}
                                                onChange={(e) => setNewVolumeOrder(parseInt(e.target.value))}
                                                placeholder="Thứ tự"
                                                className="w-20 px-2 py-1.5 text-sm rounded focus:ring-1 focus:ring-[#F59E0B] outline-none bg-[#1E293B] text-white border border-[#34D399]/20"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleCreateVolume}
                                                disabled={isCreatingVolume || !newVolumeTitle}
                                                className="flex-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                {isCreatingVolume ? "Đang tạo..." : "Tạo ngay"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <select
                                value={volumeId}
                                onChange={(e) => setVolumeId(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none transition-all bg-[#1E293B] text-white border border-[#34D399]/20 hover:border-[#34D399]/40 disabled:opacity-50 disabled:cursor-not-allowed"
                                required
                                disabled={!novelId}
                            >
                                <option value="" className="bg-[#1E293B] text-white">-- Chọn tập --</option>
                                {volumes.map((vol) => (
                                    <option key={vol.id} value={vol.id} className="bg-[#1E293B] text-white">
                                        {vol.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-[#1E293B] p-5 rounded-xl shadow-lg border border-[#34D399]/20 space-y-4">
                        <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                            <DollarSign className="w-4 h-4 text-[#34D399]" />
                            Thiết lập VIP
                        </h3>

                        <div className="flex items-center gap-3 p-3 bg-[#0B0C10]/50 rounded-lg border border-[#34D399]/10">
                            <input
                                type="checkbox"
                                id="isLocked"
                                checked={isLocked}
                                onChange={(e) => setIsLocked(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="isLocked" className="text-sm font-medium text-white select-none cursor-pointer flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-[#9CA3AF]" /> Khóa chương (VIP)
                            </label>
                        </div>

                        {isLocked && (
                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Giá tiền (Xu)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        value={price}
                                        onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                                        className="w-full pl-8 pr-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-[#F59E0B] border border-[#34D399]/20 focus:border-[#F59E0B] outline-none transition-all bg-[#1E293B] text-white"
                                    />
                                    <DollarSign className="w-4 h-4 text-muted-foreground absolute left-2.5 top-2.5" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
