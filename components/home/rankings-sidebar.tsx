"use client";

import Link from "next/link";
import { Star, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NovelWithViewCount {
    id: number;
    title: string;
    slug: string;
    author: string;
    viewCount: number;
}

interface NovelWithRating {
    id: number;
    title: string;
    slug: string;
    author: string;
    averageRating: number;
    ratingCount: number;
}

interface RankingsSidebarProps {
    topViewed: NovelWithViewCount[];
    topRated: NovelWithRating[];
}

export function RankingsSidebar({ topViewed, topRated }: RankingsSidebarProps) {
    const getBadgeColor = (rank: number) => {
        switch (rank) {
            case 1:
                return "bg-[#F59E0B] text-[#0B0C10] glow-amber";
            case 2:
                return "bg-[#FBBF24] text-[#0B0C10]";
            case 3:
                return "bg-[#FCD34D] text-[#0B0C10]";
            default:
                return "bg-[#1E293B] text-white border border-[#34D399]/20";
        }
    };

    const formatViews = (views: number) => {
        if (views >= 1000000) {
            return `${(views / 1000000).toFixed(1)}M`;
        } else if (views >= 1000) {
            return `${(views / 1000).toFixed(0)}K`;
        }
        return views.toString();
    };

    return (
        <div className="bg-[#020617] text-white shadow-lg rounded-lg p-4 sticky top-4 border border-[#34D399]/20">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#F59E0B]">—</span>
                Bảng Xếp Hạng
            </h2>

            <Tabs defaultValue="views" className="w-full">
                <TabsList className="w-full grid grid-cols-2 bg-[#1E293B] p-1 rounded-lg border border-[#34D399]/20">
                    <TabsTrigger
                        value="views"
                        className="data-[state=active]:bg-[#F59E0B] data-[state=active]:text-[#0B0C10] data-[state=active]:shadow-sm text-[#9CA3AF] hover:bg-[#1E293B]/50"
                    >
                        Top View
                    </TabsTrigger>
                    <TabsTrigger
                        value="rating"
                        className="data-[state=active]:bg-[#F59E0B] data-[state=active]:text-[#0B0C10] data-[state=active]:shadow-sm text-[#9CA3AF] hover:bg-[#1E293B]/50"
                    >
                        Top Đánh Giá
                    </TabsTrigger>
                </TabsList>

                {/* Top View Tab */}
                <TabsContent value="views">
                    <div className="space-y-3">
                        {topViewed.map((novel, index) => (
                            <Link
                                key={novel.id}
                                href={`/truyen/${novel.slug}`}
                                className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#1E293B] transition-colors group border border-transparent hover:border-[#34D399]/30"
                            >
                                {/* Rank Badge */}
                                <div
                                    className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${getBadgeColor(
                                        index + 1
                                    )}`}
                                >
                                    {index + 1}
                                </div>

                                {/* Novel Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm text-white line-clamp-1 group-hover:text-[#FBBF24] transition-colors">
                                        {novel.title}
                                    </h3>
                                    <p className="text-xs text-[#9CA3AF] line-clamp-1">
                                        {novel.author}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1 text-xs text-[#34D399]">
                                        <Eye className="w-3 h-3" />
                                        <span>{formatViews(novel.viewCount)}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </TabsContent>

                {/* Top Rated Tab */}
                <TabsContent value="rating">
                    <div className="space-y-3">
                        {topRated.map((novel, index) => (
                            <Link
                                key={novel.id}
                                href={`/truyen/${novel.slug}`}
                                className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors group"
                            >
                                {/* Rank Badge */}
                                <div
                                    className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${getBadgeColor(
                                        index + 1
                                    )}`}
                                >
                                    {index + 1}
                                </div>

                                {/* Novel Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm text-white line-clamp-1 group-hover:text-indigo-200 transition-colors">
                                        {novel.title}
                                    </h3>
                                    <p className="text-xs text-indigo-100 line-clamp-1">
                                        {novel.author}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <div className="flex items-center">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`w-3 h-3 ${star <= Math.round(novel.averageRating)
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "fill-gray-400 text-gray-400"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs text-indigo-200 ml-1">
                                            {novel.averageRating.toFixed(1)} ({novel.ratingCount})
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
