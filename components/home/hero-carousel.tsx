"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";

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

    // Auto-rotate carousel every 2.5 seconds (faster) with progress bar
    useEffect(() => {
        if (isPaused || novels.length === 0) return;

        let startTime = Date.now();
        const duration = 2500; // Faster rotation

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
        <Link
            href={`/truyen/${currentNovel.slug}`}
            className="block relative w-full max-w-full h-[40vh] md:h-[50vh] overflow-hidden cursor-pointer group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
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

            {/* LAYER 3: Content - Compact Info Layout */}
            <div className="relative h-full flex items-center">
                <div className="container mx-auto px-4 md:px-8 max-w-6xl">
                    <div className="flex gap-4 md:gap-6 items-center">
                        {/* Cover Image - Always visible */}
                        <div className="relative w-24 h-36 md:w-32 md:h-48 shrink-0 rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10 group-hover:ring-[#F59E0B]/50 transition-all">
                            {currentNovel.coverImage ? (
                                <Image
                                    src={currentNovel.coverImage}
                                    alt={currentNovel.title}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full bg-linear-to-br from-[#F59E0B] to-[#FBBF24] flex items-center justify-center">
                                    <BookOpen className="w-10 h-10 text-[#0B0C10]" />
                                </div>
                            )}
                        </div>

                        {/* Text Info */}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2 line-clamp-2 group-hover:text-[#FBBF24] transition-colors">
                                {currentNovel.title}
                            </h2>

                            <p className="text-sm md:text-base text-[#FBBF24] mb-2 font-medium">
                                {currentNovel.author}
                            </p>

                            {currentNovel.description && (
                                <p className="text-xs md:text-sm text-gray-400 line-clamp-3 md:line-clamp-4 max-w-xl leading-relaxed">
                                    {currentNovel.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Bar (Bottom) */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <div
                    className="h-full bg-linear-to-r from-[#F59E0B] to-[#FBBF24] transition-all duration-100 ease-linear"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Thumbnail Strip (Bottom Right) */}
            <div
                className="absolute bottom-4 right-4 gap-2 hidden sm:flex"
                onClick={(e) => e.preventDefault()}
            >
                {novels.map((novel, index) => (
                    <button
                        key={novel.id}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCurrentIndex(index);
                            setProgress(0);
                        }}
                        className={`relative w-10 h-14 rounded overflow-hidden transition-all ${index === currentIndex
                            ? "ring-2 ring-[#F59E0B] scale-110"
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
        </Link>
    );
}
