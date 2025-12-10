"use client";

import { Library, X, BookOpen, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getLibraryUpdates, getLibraryUpdateCount } from "@/actions/notification";
import Link from "next/link";
import Image from "next/image";

interface LibraryUpdate {
    novelId: number;
    title: string;
    slug: string;
    coverImage: string | null;
    latestChapter: {
        id: number;
        title: string;
        slug: string;
    };
    newChaptersCount: number;
    followedAt: Date;
}

export function LibraryNotificationBell() {
    const [updateCount, setUpdateCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [novels, setNovels] = useState<LibraryUpdate[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadUpdateCount();
        const interval = setInterval(loadUpdateCount, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    async function loadUpdateCount() {
        const count = await getLibraryUpdateCount();
        setUpdateCount(count);
    }

    async function loadUpdates() {
        setLoading(true);
        const result = await getLibraryUpdates(5);
        setNovels(result.novels);
        setLoading(false);
    }

    function handleOpen() {
        setIsOpen(true);
        loadUpdates();
    }

    return (
        <>
            <button
                onClick={handleOpen}
                className="relative p-2 hover:bg-[#1E293B] rounded-lg transition-colors"
                aria-label="Tủ truyện cập nhật"
            >
                <Library className="w-5 h-5 text-gray-300" />
                {updateCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-amber-500 rounded-full min-w-[20px]">
                        {updateCount > 99 ? "99+" : updateCount}
                    </span>
                )}
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative bg-[#0B0C10] rounded-xl border border-amber-500/20 shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-amber-500/20 flex items-center justify-between shrink-0">
                            <h3 className="text-white font-semibold flex items-center gap-2">
                                <Library className="w-5 h-5 text-amber-500" />
                                Truyện cập nhật
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {loading ? (
                                <div className="py-8 text-center text-gray-400">
                                    Đang tải...
                                </div>
                            ) : novels.length === 0 ? (
                                <div className="py-8 text-center">
                                    <Library className="w-12 h-12 mx-auto text-gray-600 mb-2" />
                                    <p className="text-gray-400 text-sm">
                                        Không có truyện nào cập nhật
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {novels.map((novel) => (
                                        <Link
                                            key={novel.novelId}
                                            href={`/truyen/${novel.slug}`}
                                            onClick={() => setIsOpen(false)}
                                            className="flex gap-3 p-3 bg-[#1E293B] hover:bg-[#2D3A4F] rounded-lg transition-colors group"
                                        >
                                            {/* Cover */}
                                            <div className="w-16 h-24 relative shrink-0 rounded-md overflow-hidden bg-gray-800">
                                                {novel.coverImage ? (
                                                    <Image
                                                        src={novel.coverImage}
                                                        alt={novel.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <BookOpen className="w-6 h-6 text-gray-600" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-white line-clamp-2 group-hover:text-amber-400 transition-colors">
                                                    {novel.title}
                                                </h4>
                                                <p className="text-sm text-gray-400 mt-1 line-clamp-1">
                                                    {novel.latestChapter.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded">
                                                        +{novel.newChaptersCount} chương mới
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-amber-500/20 shrink-0">
                            <Link
                                href="/tu-truyen"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-colors"
                            >
                                Xem tủ truyện
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
