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
                return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900";
            case 2:
                return "bg-gradient-to-r from-gray-300 to-gray-500 text-gray-900";
            case 3:
                return "bg-gradient-to-r from-amber-600 to-amber-800 text-amber-100";
            default:
                return "bg-muted text-muted-foreground";
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
        <div className="bg-card border border-border rounded-lg p-4 sticky top-4">
            <h2 className="text-xl font-bold text-foreground mb-4">Bảng Xếp Hạng</h2>

            <Tabs defaultValue="views" className="w-full">
                <TabsList className="w-full grid grid-cols-2 bg-muted">
                    <TabsTrigger value="views">Top View</TabsTrigger>
                    <TabsTrigger value="rating">Top Đánh Giá</TabsTrigger>
                </TabsList>

                {/* Top View Tab */}
                <TabsContent value="views">
                    <div className="space-y-3">
                        {topViewed.map((novel, index) => (
                            <Link
                                key={novel.id}
                                href={`/truyen/${novel.slug}`}
                                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
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
                                    <h3 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                        {novel.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                        {novel.author}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
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
                                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
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
                                    <h3 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                        {novel.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                        {novel.author}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <div className="flex items-center">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`w-3 h-3 ${star <= Math.round(novel.averageRating)
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "fill-gray-300 text-gray-300"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs text-muted-foreground ml-1">
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
