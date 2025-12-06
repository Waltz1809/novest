"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";

interface ReadingHistory {
    novel: {
        id: number;
        title: string;
        slug: string;
        coverImage: string | null;
    };
    chapter: {
        id: number;
        title: string;
        slug: string;
        order: number;
    };
}

interface ContinueReadingProps {
    history: ReadingHistory[];
}

export function ContinueReading({ history }: ContinueReadingProps) {
    if (history.length === 0) {
        return null;
    }

    return (
        <div className="py-4">
            {/* Compact Header */}
            <div className="flex items-center gap-2 mb-3 px-4">
                <BookOpen className="w-4 h-4 text-[#F59E0B]" />
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                    Tiếp tục đọc
                </h3>
            </div>

            {/* Compact List - No cards, minimal styling */}
            <div className="flex flex-col">
                {history.slice(0, 4).map((item) => (
                    <Link
                        key={item.novel.id}
                        href={`/truyen/${item.novel.slug}/${item.chapter.slug}`}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors group"
                    >
                        {/* Small Cover Thumbnail */}
                        <div className="relative w-10 h-14 shrink-0 rounded overflow-hidden">
                            {item.novel.coverImage ? (
                                <Image
                                    src={item.novel.coverImage}
                                    alt={item.novel.title}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-[#1E293B] flex items-center justify-center">
                                    <BookOpen className="w-4 h-4 text-[#F59E0B]" />
                                </div>
                            )}
                        </div>

                        {/* Novel Info - Compact */}
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-white truncate group-hover:text-[#FBBF24] transition-colors">
                                {item.novel.title}
                            </h4>
                            <p className="text-xs text-gray-500 truncate">
                                {item.chapter.title}
                            </p>
                        </div>

                        {/* Arrow indicator */}
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#F59E0B] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
