"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Play } from "lucide-react";
import { clsx } from "clsx";

interface HoverNovelCardProps {
    novel: {
        id: number;
        title: string;
        slug: string;
        author: string;
        coverImage: string | null;
        avgRating?: number;
        description?: string | null;
    };
    className?: string;
}

export function HoverNovelCard({ novel, className }: HoverNovelCardProps) {
    return (
        <Link
            href={`/truyen/${novel.slug}`}
            className={clsx(
                "group relative block h-[320px] w-[200px] shrink-0 cursor-pointer transition-all duration-300 ease-in-out",
                "hover:z-20 hover:scale-110",
                className
            )}
        >
            {/* Base Card (Cover) */}
            <div className="relative h-full w-full overflow-hidden rounded-md shadow-md transition-all duration-300 group-hover:shadow-xl">
                <Image
                    src={novel.coverImage || "/placeholder.jpg"}
                    alt={novel.title}
                    fill
                    className="object-cover transition-transform duration-300"
                    sizes="(max-width: 768px) 150px, 200px"
                />

                {/* Gradient Overlay (Always visible but stronger on hover) */}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-90" />

                {/* Title (Visible at bottom initially) */}
                <div className="absolute bottom-0 left-0 right-0 p-3 transition-all duration-300 group-hover:bottom-12">
                    <h3 className="line-clamp-2 text-sm font-bold text-white drop-shadow-md">
                        {novel.title}
                    </h3>
                </div>
            </div>

            {/* Hover Details (Pop out / Overlay) */}
            <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {/* Meta Info */}
                <div className="translate-y-4 transform transition-transform duration-300 group-hover:translate-y-0">
                    <div className="mb-2 flex items-center gap-1 text-xs text-gray-300">
                        <span className="truncate max-w-[100px]">{novel.author}</span>
                        {novel.avgRating && (
                            <>
                                <span>•</span>
                                <div className="flex items-center text-yellow-400">
                                    <Star className="h-3 w-3 fill-current" />
                                    <span className="ml-0.5">{novel.avgRating.toFixed(1)}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Action Button */}
                    <button className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-1.5 text-xs font-bold text-black shadow-lg transition-transform hover:scale-105 active:scale-95">
                        <Play className="h-3 w-3 fill-current" />
                        Đọc Ngay
                    </button>
                </div>
            </div>
        </Link>
    );
}
