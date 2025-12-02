"use client";

import Link from "next/link";
import Image from "next/image";
import { Eye, BookOpen } from "lucide-react";

interface NovelGridCardProps {
    id: number;
    title: string;
    coverImage: string | null;
    status: "ONGOING" | "COMPLETED" | "HIATUS";
    viewCount: number;
    chapterCount: number;
}

export default function NovelGridCard({
    id,
    title,
    coverImage,
    status,
    viewCount,
    chapterCount,
}: NovelGridCardProps) {
    // Format view count (e.g., 1.2M, 450K)
    const formatViews = (count: number) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
        return count.toString();
    };

    // Status badge styling
    const statusStyles = {
        ONGOING: "bg-[#34D399] text-[#0B0C10]",
        COMPLETED: "bg-[#3B82F6] text-white",
        HIATUS: "bg-[#9CA3AF] text-[#0B0C10]",
    };

    // Vietnamese status labels
    const statusLabels = {
        ONGOING: "Đang tiến hành",
        COMPLETED: "Hoàn thành",
        HIATUS: "Tạm dừng",
    };

    return (
        <div className="group relative aspect-2/3 rounded-xl overflow-hidden bg-[#1E293B] border border-[#34D399]/20 hover:border-[#34D399]/40 transition-all duration-300 cursor-pointer">
            {/* Cover Image or Gradient Fallback */}
            {coverImage ? (
                <Image
                    src={coverImage}
                    alt={title}
                    fill
                    className="object-cover group-hover:opacity-30 transition-opacity duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
            ) : (
                <div className="absolute inset-0 bg-linear-to-br from-[#1E293B] via-[#0B0C10] to-[#1E293B] flex items-center justify-center p-6 group-hover:opacity-30 transition-opacity duration-300">
                    <h3 className="text-white text-center font-bold text-lg line-clamp-3">
                        {title}
                    </h3>
                </div>
            )}

            {/* Status Badge (Top-Right) */}
            <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10">
                <span
                    className={`px-2 py-0.5 text-[10px] md:px-3 md:py-1 md:text-xs font-bold rounded-full uppercase ${statusStyles[status]}`}
                >
                    {statusLabels[status]}
                </span>
            </div>

            {/* Hover Overlay with Manage Button */}
            <Link
                href={`/dashboard/novels/edit/${id}`}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
            >
                <button className="px-6 py-3 bg-[#F59E0B] text-[#0B0C10] font-bold rounded-lg shadow-lg glow-amber-strong hover:scale-105 transition-transform">
                    Quản lý & Viết
                </button>
            </Link>

            {/* Stats Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-[#0B0C10]/80 backdrop-blur-sm z-10">
                <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                    <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{formatViews(viewCount)} Views</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span>{chapterCount} Chapters</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
