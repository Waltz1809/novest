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
    const [progress, setProgress] = useState(0);

    // Auto-rotate carousel every 4 seconds with progress bar
    useEffect(() => {
        if (isPaused || novels.length === 0) return;

        let startTime = Date.now();
        const duration = 4000;

        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min((elapsed / duration) * 100, 100);
            setProgress(newProgress);

            if (newProgress >= 100) {
                setCurrentIndex((prev) => (prev + 1) % novels.length);
                startTime = Date.now();
                setProgress(0);
            }
        }, 50);

        return () => clearInterval(progressInterval);
    }, [currentIndex, isPaused, novels.length]);

    if (novels.length === 0) {
        return null;
    }

    const currentNovel = novels[currentIndex];

    return (
        // FULL WIDTH - Safe approach without viewport calculation issues
        <div
            className="relative w-full max-w-full h-[50vh] md:h-[60vh] overflow-hidden"
        >
            {/* LAYER 1: Atmospheric Background - Huge Blurred Cover */}
            <div className="absolute inset-0 -z-10">
                {currentNovel.coverImage ? (
                    <div className="relative w-full h-full">
                        <Image
                            src={currentNovel.coverImage}
                            alt=""
                            fill
                            className="object-cover blur-xl opacity-30 scale-110"
                            priority
                        />
                    </div>
                ) : (
                    <div className="w-full h-full bg-linear-to-br from-[#1E293B]/30 to-[#0B0C10]" />
                )}
            </div>

            {/* LAYER 2: CSS Gradient Mask - Seamless Fade */}
            <div
                className="absolute inset-0 -z-5"
                style={{
                    background: 'linear-gradient(to bottom, transparent 0%, rgba(11, 12, 16, 0.8) 70%, #0B0C10 100%)'
                }}
            />

            {/* LAYER 3: Content - Overlapping the Image */}
            <div
                className="relative h-full flex items-center"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <div className="container mx-auto px-6 md:px-16 max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        {/* Left: Massive Typography */}
                        <div className="lg:col-span-7 z-10">
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-[0.9] tracking-tighter drop-shadow-2xl">
                                {currentNovel.title}
                            </h1>

                            <p className="text-lg md:text-xl text-[#FBBF24] mb-4 font-semibold tracking-wide">
                                {currentNovel.author}
                            </p>

                            {currentNovel.description && (
                                <p className="text-sm md:text-base text-gray-300 mb-6 line-clamp-2 max-w-2xl leading-relaxed">
                                    {currentNovel.description}
                                </p>
                            )}

                            <Link
                                href={`/truyen/${currentNovel.slug}`}
                                className="inline-block bg-[#F59E0B] hover:bg-[#FBBF24] text-[#0B0C10] px-8 py-3 rounded-lg font-bold text-lg transition-all duration-300 hover:scale-105 glow-amber-strong uppercase tracking-wider shadow-2xl"
                            >
                                Đọc Ngay →
                            </Link>
                        </div>

                        {/* Right: Sharp Cover Image (Overlapping) */}
                        {currentNovel.coverImage && (
                            <div className="lg:col-span-5 hidden lg:block">
                                <div className="relative w-full aspect-2/3 max-w-xs ml-auto">
                                    <Image
                                        src={currentNovel.coverImage}
                                        alt={currentNovel.title}
                                        fill
                                        className="object-cover rounded-lg shadow-2xl ring-2 ring-[#34D399]/30 glow-jade"
                                        priority
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Progress Bar (Bottom) - Replacing Pagination Dots */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <div
                    className="h-full bg-linear-to-r from-[#F59E0B] to-[#FBBF24] transition-all duration-100 ease-linear glow-amber"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Thumbnail Strip (Bottom Right) */}
            <div
                className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 gap-2 hidden sm:flex"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {novels.map((novel, index) => (
                    <button
                        key={novel.id}
                        onClick={() => {
                            setCurrentIndex(index);
                            setProgress(0);
                        }}
                        className={`relative w-12 h-16 rounded overflow-hidden transition-all ${index === currentIndex
                            ? "ring-2 ring-[#F59E0B] scale-110 glow-amber"
                            : "opacity-50 hover:opacity-100 hover:scale-105"
                            }`}
                    >
                        {novel.coverImage ? (
                            <Image
                                src={novel.coverImage}
                                alt={novel.title}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-[#1E293B]" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
