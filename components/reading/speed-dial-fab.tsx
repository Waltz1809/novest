"use client"

import { useState, useRef } from "react"
import {
    Plus,
    Home,
    Settings,
    ChevronLeft,
    ChevronRight,
    List
} from "lucide-react"
import { useOnClickOutside } from "@/hooks/use-click-outside"
import { clsx } from "clsx"
import Link from "next/link"

interface SpeedDialFabProps {
    novelSlug: string
    chapterSlug: string
    prevChapterSlug?: string
    nextChapterSlug?: string
    onToggleSettings: () => void
    onToggleTOC: () => void
    isHidden?: boolean
}

export function SpeedDialFab({
    novelSlug,
    chapterSlug,
    prevChapterSlug,
    nextChapterSlug,
    onToggleSettings,
    onToggleTOC,
    isHidden = false
}: SpeedDialFabProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useOnClickOutside(containerRef, () => setIsOpen(false))

    const toggleMenu = () => setIsOpen(!isOpen)

    return (
        <div
            ref={containerRef}
            className={clsx(
                "fixed bottom-8 right-8 z-50 flex flex-col items-center gap-4 transition-all duration-300",
                isHidden ? "translate-y-32 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
            )}
        >
            {/* Menu Content */}
            <div
                className={clsx(
                    "flex flex-col items-center gap-3 p-2 rounded-full bg-slate-900/80 backdrop-blur-md shadow-2xl border border-white/10 transition-all duration-300 ease-out origin-bottom",
                    isOpen
                        ? "opacity-100 translate-y-0 scale-100 visible"
                        : "opacity-0 translate-y-8 scale-95 invisible pointer-events-none"
                )}
            >
                {/* Settings */}
                <button
                    onClick={() => {
                        onToggleSettings()
                        setIsOpen(false)
                    }}
                    className="p-3 rounded-full text-amber-500 hover:bg-white/10 transition-colors"
                    title="Cài đặt"
                >
                    <Settings className="w-6 h-6" />
                </button>

                {/* Home (Novel Detail) */}
                <Link
                    href={`/truyen/${novelSlug}`}
                    className="p-3 rounded-full text-amber-500 hover:bg-white/10 transition-colors"
                    title="Trang chính"
                >
                    <Home className="w-6 h-6" />
                </Link>

                {/* TOC */}
                <button
                    onClick={() => {
                        onToggleTOC()
                        setIsOpen(false)
                    }}
                    className="p-3 rounded-full text-amber-500 hover:bg-white/10 transition-colors"
                    title="Mục lục"
                >
                    <List className="w-6 h-6" />
                </button>

                <div className="w-8 h-px bg-white/20 my-1" />

                {/* Previous Chapter */}
                {prevChapterSlug ? (
                    <Link
                        href={`/truyen/${novelSlug}/${prevChapterSlug}`}
                        className="p-3 rounded-full text-amber-500 hover:bg-white/10 transition-colors"
                        title="Chương trước"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                ) : (
                    <button disabled className="p-3 rounded-full text-gray-500 cursor-not-allowed">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}

                {/* Next Chapter */}
                {nextChapterSlug ? (
                    <Link
                        href={`/truyen/${novelSlug}/${nextChapterSlug}`}
                        className="p-3 rounded-full text-amber-500 hover:bg-white/10 transition-colors"
                        title="Chương sau"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </Link>
                ) : (
                    <button disabled className="p-3 rounded-full text-gray-500 cursor-not-allowed">
                        <ChevronRight className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* Main Trigger Button */}
            <button
                onClick={toggleMenu}
                className={clsx(
                    "w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg flex items-center justify-center transition-all duration-300 ease-in-out z-50",
                    isOpen && "rotate-45 bg-red-500 hover:bg-red-600"
                )}
            >
                <Plus className="w-8 h-8" />
            </button>
        </div>
    )
}
