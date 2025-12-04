"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { X, ChevronDown, ChevronRight } from "lucide-react"
import { clsx } from "clsx"
import { READING_THEMES } from "@/lib/reading-themes"

interface Chapter {
    id: string
    title: string
    slug: string
    order: number
}

interface Volume {
    id: string
    chapters: Chapter[]
}

interface Novel {
    id: string
    title: string
    slug: string
    volumes: Volume[]
}

interface ChapterListSidebarProps {
    novel: Novel
    currentChapterId: string
    isOpen: boolean
    onClose: () => void
    themeId?: string
}

export function ChapterListSidebar({
    novel,
    currentChapterId,
    isOpen,
    onClose,
    themeId = "light",
}: ChapterListSidebarProps) {
    const sidebarRef = useRef<HTMLDivElement>(null)

    // Get current theme or fallback to light
    const theme = READING_THEMES[themeId] || READING_THEMES["light"]

    // State for collapsed volumes
    const [collapsedVolumes, setCollapsedVolumes] = useState<Record<string, boolean>>({})

    const toggleVolume = (volumeId: string) => {
        setCollapsedVolumes(prev => ({
            ...prev,
            [volumeId]: !prev[volumeId]
        }))
    }

    // Scroll to current chapter on open
    useEffect(() => {
        if (isOpen) {
            const activeEl = document.getElementById(`chapter-${currentChapterId}`)
            if (activeEl) {
                activeEl.scrollIntoView({ block: "center", behavior: "smooth" })
            }
        }
    }, [isOpen, currentChapterId])

    // Don't render anything if not open
    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-60 transition-opacity duration-300 backdrop-blur-sm opacity-100"
                onClick={onClose}
            />

            {/* Sidebar */}
            <div
                ref={sidebarRef}
                className="fixed top-0 right-0 h-full w-[75vw] max-w-xs sm:w-80 sm:max-w-none shadow-2xl z-70 flex flex-col font-sans animate-in slide-in-from-right duration-300"
                style={{
                    backgroundColor: theme.ui.background,
                    color: theme.ui.text,
                    borderColor: theme.ui.border
                }}
            >
                {/* Header */}
                <div
                    className="p-4 border-b flex items-center justify-between backdrop-blur-md"
                    style={{
                        borderColor: theme.ui.border,
                        backgroundColor: `${theme.ui.background}cc` // 80% opacity
                    }}
                >
                    <h2 className="font-bold text-lg truncate pr-4">
                        {novel.title}
                    </h2>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            onClose()
                        }}
                        className="p-2 rounded-full transition-colors hover:opacity-80"
                        style={{ backgroundColor: theme.ui.hover }}
                        title="Đóng mục lục"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {novel.volumes.map((volume, vIndex) => {
                        const isCollapsed = collapsedVolumes[volume.id]
                        return (
                            <div key={volume.id} className="space-y-2">
                                <button
                                    onClick={() => toggleVolume(volume.id)}
                                    className="w-full flex items-center justify-between text-sm font-bold uppercase tracking-wider sticky top-0 py-2 z-10 opacity-70 hover:opacity-100 transition-opacity"
                                    style={{ backgroundColor: theme.ui.background }}
                                >
                                    <span>Tập {vIndex + 1}</span>
                                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>

                                {!isCollapsed && (
                                    <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                                        {volume.chapters.map((chapter) => {
                                            const isActive = chapter.id === currentChapterId
                                            return (
                                                <Link
                                                    key={chapter.id}
                                                    id={`chapter-${chapter.id}`}
                                                    href={`/truyen/${novel.slug}/${chapter.slug}`}
                                                    onClick={onClose}
                                                    className={clsx(
                                                        "block px-4 py-3 rounded-lg text-base transition-all duration-200",
                                                        isActive && "font-medium border-l-4"
                                                    )}
                                                    style={{
                                                        backgroundColor: isActive ? theme.ui.active : "transparent",
                                                        color: isActive ? theme.foreground : theme.ui.text,
                                                        borderColor: isActive ? "#f59e0b" : "transparent", // Amber-500 for active border
                                                    }}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <span className="opacity-70 min-w-[24px]">
                                                            {chapter.order}.
                                                        </span>
                                                        <span>{chapter.title}</span>
                                                    </div>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </>
    )
}
