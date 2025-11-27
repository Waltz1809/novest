"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";


interface Novel {
    id: number;
    title: string;
    slug: string;
    author: string;
    description: string | null;
    coverImage: string | null;
}

interface HeroCarouselProps {
    novels: Novel[];
}

export function HeroCarousel({ novels }: HeroCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Auto-rotate carousel every 5 seconds
    useEffect(() => {
        if (isPaused || novels.length === 0) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % novels.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [currentIndex, isPaused, novels.length]);

    if (novels.length === 0) {
        return null;
    }

    const currentNovel = novels[currentIndex];



    return (
        <div
            className="relative w-full h-[400px] md:h-[500px] rounded-xl overflow-hidden group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Background Image with Gradient Overlay */}
            <div className="absolute inset-0">
                {currentNovel.coverImage ? (
                    <Image
                        src={currentNovel.coverImage}
                        alt={currentNovel.title}
                        fill
                        className="object-cover"
                        priority
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600" />
                )}
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative h-full flex items-center">
                <div className="container mx-auto px-4 md:px-8 max-w-2xl">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                        {currentNovel.title}
                    </h2>
                    <p className="text-lg md:text-xl text-gray-200 mb-2">
                        Tác giả: {currentNovel.author}
                    </p>
                    {currentNovel.description && (
                        <p className="text-sm md:text-base text-gray-300 mb-6 line-clamp-3">
                            {currentNovel.description}
                        </p>
                    )}
                    <Link
                        href={`/truyen/${currentNovel.slug}`}
                        className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 shadow-lg"
                    >
                        Đọc ngay
                    </Link>
                </div>
            </div>



            {/* Pagination Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {novels.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`h-2 rounded-full transition-all cursor-pointer ${index === currentIndex
                                ? "bg-white w-8"
                                : "bg-white/50 hover:bg-white/75 w-2"
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
