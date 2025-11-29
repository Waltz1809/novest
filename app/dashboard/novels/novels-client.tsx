"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import NovelGridCard from "@/components/dashboard/novel-grid-card";
import ReindexButton from "@/components/novel/reindex-button";

interface Novel {
    id: number;
    title: string;
    author: string;
    coverImage: string | null;
    status: "ONGOING" | "COMPLETED" | "HIATUS";
    viewCount: number;
    volumes: {
        _count: {
            chapters: number;
        };
    }[];
}

interface NovelsPageProps {
    novels: Novel[];
}

export default function NovelsPageClient({ novels }: NovelsPageProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredNovels, setFilteredNovels] = useState(novels);

    // Client-side search filtering
    useEffect(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) {
            setFilteredNovels(novels);
            return;
        }

        const filtered = novels.filter(
            (novel) =>
                novel.title.toLowerCase().includes(query) ||
                novel.author.toLowerCase().includes(query)
        );
        setFilteredNovels(filtered);
    }, [searchQuery, novels]);

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Search Bar (Left) */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1E293B] text-white rounded-lg border border-[#34D399]/20 focus-within:border-[#F59E0B] transition-all w-full md:w-[400px]">
                    <Search className="w-5 h-5 text-[#9CA3AF]" />
                    <input
                        type="text"
                        placeholder="Search novels..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-white placeholder:text-[#9CA3AF]"
                    />
                </div>

                {/* Action Buttons (Right) */}
                <div className="flex items-center gap-3">
                    <ReindexButton />
                    <Link
                        href="/dashboard/novels/create"
                        className="flex items-center gap-2 px-6 py-2.5 border-2 border-[#F59E0B] text-[#F59E0B] font-bold rounded-lg hover:bg-[#F59E0B] hover:text-[#0B0C10] transition-all duration-300"
                    >
                        <Plus className="w-4 h-4" />
                        Tạo Truyện Mới
                    </Link>
                </div>
            </div>

            {/* Grid Layout */}
            {filteredNovels.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {filteredNovels.map((novel) => {
                        const chapterCount = novel.volumes.reduce(
                            (acc, vol) => acc + vol._count.chapters,
                            0
                        );

                        return (
                            <NovelGridCard
                                key={novel.id}
                                id={novel.id}
                                title={novel.title}
                                coverImage={novel.coverImage}
                                status={novel.status as "ONGOING" | "COMPLETED" | "HIATUS"}
                                viewCount={novel.viewCount}
                                chapterCount={chapterCount}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-full bg-[#1E293B] flex items-center justify-center mb-4">
                        <Search className="w-10 h-10 text-[#9CA3AF]" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                        {searchQuery ? "No novels found" : "No novels yet"}
                    </h3>
                    <p className="text-[#9CA3AF] mb-6">
                        {searchQuery
                            ? `No results for "${searchQuery}"`
                            : "Create your first masterpiece!"}
                    </p>
                    {!searchQuery && (
                        <Link
                            href="/dashboard/novels/create"
                            className="px-6 py-3 bg-[#F59E0B] text-[#0B0C10] font-bold rounded-lg hover:bg-[#FBBF24] transition-colors glow-amber"
                        >
                            Tạo Truyện Mới
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
