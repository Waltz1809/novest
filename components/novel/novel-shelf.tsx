"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HoverNovelCard } from "./hover-novel-card";
import Link from "next/link";
import { clsx } from "clsx";

interface NovelShelfProps {
    title: string;
    novels: any[];
    link?: string;
}

export function NovelShelf({ title, novels, link }: NovelShelfProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === "left" ? -current.clientWidth * 0.8 : current.clientWidth * 0.8;
            current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
    };

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    if (novels.length === 0) return null;

    return (
        <div className="group/shelf relative py-8">
            {/* Header */}
            <div className="mb-4 flex items-end justify-between px-4 md:px-12">
                <h2 className="text-xl font-bold text-white md:text-2xl">{title}</h2>
                {link && (
                    <Link
                        href={link}
                        className="text-xs font-medium text-gray-400 hover:text-white transition-colors"
                    >
                        Xem tất cả &gt;
                    </Link>
                )}
            </div>

            {/* Scroll Container */}
            <div className="relative">
                {/* Left Arrow */}
                <button
                    onClick={() => scroll("left")}
                    className={clsx(
                        "absolute left-0 top-0 z-30 h-full w-16 bg-linear-to-r from-black/80 to-transparent text-white opacity-0 transition-opacity hover:from-black/90 group-hover/shelf:opacity-100",
                        !showLeftArrow && "hidden!"
                    )}
                >
                    <ChevronLeft className="mx-auto h-8 w-8" />
                </button>

                {/* List */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex gap-4 overflow-x-auto scroll-smooth px-4 pb-8 md:px-12 scrollbar-hide snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                    {novels.map((novel) => (
                        <div key={novel.id} className="snap-start">
                            <HoverNovelCard novel={novel} />
                        </div>
                    ))}
                </div>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll("right")}
                    className={clsx(
                        "absolute right-0 top-0 z-30 h-full w-16 bg-linear-to-l from-black/80 to-transparent text-white opacity-0 transition-opacity hover:from-black/90 group-hover/shelf:opacity-100",
                        !showRightArrow && "hidden!"
                    )}
                >
                    <ChevronRight className="mx-auto h-8 w-8" />
                </button>
            </div>
        </div>
    );
}
