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
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <BookOpen className="w-6 h-6" />
                    Tiếp tục đọc
                </h2>
            </div>

            {/* Horizontal Scrollable Container */}
            <div className="relative">
                <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    {history.slice(0, 10).map((item) => (
                        <Link
                            key={item.novel.id}
                            href={`/truyen/${item.novel.slug}/${item.chapter.slug}`}
                            className="flex-shrink-0 w-64 bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all group"
                        >
                            <div className="flex gap-3 p-3">
                                {/* Cover Image */}
                                <div className="relative w-16 h-24 flex-shrink-0 rounded overflow-hidden">
                                    {item.novel.coverImage ? (
                                        <Image
                                            src={item.novel.coverImage}
                                            alt={item.novel.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                            <BookOpen className="w-8 h-8 text-white" />
                                        </div>
                                    )}
                                </div>

                                {/* Novel Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-indigo-600 transition-colors mb-1">
                                        {item.novel.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        Đọc tiếp: {item.chapter.title}
                                    </p>
                                    <div className="flex items-center text-xs text-indigo-600 font-medium">
                                        <span>Đọc tiếp</span>
                                        <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
