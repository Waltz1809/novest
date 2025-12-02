"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Home, List, Lock } from "lucide-react"
import UnlockButton from "@/components/novel/unlock-button"
import ChapterContent from "@/components/novel/chapter-content"
import { CommentSection } from "@/components/comment/comment-section"
import { ReadingSettings, ReadingConfig } from "@/components/novel/reading-settings"
import { clsx } from "clsx"
import { Session } from "next-auth"

interface ChapterPageClientProps {
    novel: any
    chapter: any
    prevChapter: any
    nextChapter: any
    isLocked: boolean
    session: Session | null
}

export function ChapterPageClient({
    novel,
    chapter,
    prevChapter,
    nextChapter,
    isLocked,
    session,
}: ChapterPageClientProps) {
    const [config, setConfig] = useState<ReadingConfig>({
        font: "serif",
        fontSize: 18,
        textAlign: "justify",
        theme: "light",
    })
    const [progress, setProgress] = useState(0)
    const [showHeader, setShowHeader] = useState(true)
    const lastScrollY = useRef(0)
    const scrollTimeout = useRef<NodeJS.Timeout | null>(null)
    const isRestoring = useRef(true)

    useEffect(() => {
        // Reset lock on chapter change
        isRestoring.current = true

        // 1. Restore scroll position
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        const key = `reading-pos-${chapter.id}`
        const savedPos = localStorage.getItem(key)

        if (savedPos) {
            const pos = parseInt(savedPos)
            if (!isNaN(pos) && pos >= 0) {
                // Retry mechanism to wait for content to load
                let attempts = 0
                const maxAttempts = 10 // 1 second total

                const tryScroll = () => {
                    const docHeight = document.documentElement.scrollHeight
                    const winHeight = window.innerHeight

                    // If page is long enough to scroll to pos, OR we ran out of attempts
                    if (docHeight - winHeight >= pos || attempts >= maxAttempts) {
                        const targetPos = Math.min(pos, docHeight - winHeight)
                        window.scrollTo({ top: targetPos, behavior: "instant" })
                        // Unlock after restoration
                        setTimeout(() => { isRestoring.current = false }, 50)
                        return true // Done
                    }
                    return false // Keep waiting
                }

                // Try immediately
                if (!tryScroll()) {
                    const interval = setInterval(() => {
                        attempts++
                        if (tryScroll()) {
                            clearInterval(interval)
                        }
                    }, 100)
                }
            } else {
                // Invalid pos, unlock
                setTimeout(() => { isRestoring.current = false }, 100)
            }
        } else {
            // No saved pos (new chapter), unlock after delay to allow initial render/scroll-to-top
            setTimeout(() => { isRestoring.current = false }, 100)
        }

        // 2. Scroll handler
        const handleScroll = () => {
            // Safety Lock: Don't save while restoring
            if (isRestoring.current) return

            const currentScrollY = window.scrollY
            const docHeight = document.documentElement.scrollHeight
            const winHeight = window.innerHeight

            // Calculate Progress
            const totalScroll = docHeight - winHeight
            const currentProgress = totalScroll > 0 ? (currentScrollY / totalScroll) * 100 : 0
            setProgress(Math.min(100, Math.max(0, currentProgress)))

            // Smart Header Logic
            if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                setShowHeader(false)
            } else {
                setShowHeader(true)
            }
            lastScrollY.current = currentScrollY

            // Save Scroll Position (throttled)
            if (!scrollTimeout.current) {
                scrollTimeout.current = setTimeout(() => {
                    localStorage.setItem(key, currentScrollY.toString())
                    scrollTimeout.current = null
                }, 500)
            }
        }

        window.addEventListener("scroll", handleScroll, { passive: true })

        return () => {
            window.removeEventListener("scroll", handleScroll)
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
        }
    }, [chapter.id])

    // 3. Update History
    useEffect(() => {
        if (session?.user) {
            import("@/actions/library").then(({ updateReadingHistory }) => {
                updateReadingHistory(novel.id, chapter.id)
            })
        }
    }, [chapter.id, novel.id, session?.user])

    return (
        <div
            className={clsx(
                "min-h-screen transition-colors duration-300",
                config.theme === "light" && "bg-[#f9f7f1] text-gray-900",
                config.theme === "sepia" && "bg-[#f4ecd8] text-[#5b4636]",
                config.theme === "dark" && "bg-gray-950 text-white"
            )}
            style={{
                fontFamily: config.font === "mono" ? "monospace" : config.font === "sans" ? "sans-serif" : "serif",
                "--background": config.theme === "dark" ? "#030712" : config.theme === "sepia" ? "#f4ecd8" : "#ffffff",
                "--foreground": config.theme === "dark" ? "#ffffff" : config.theme === "sepia" ? "#5b4636" : "#09090b",
            } as React.CSSProperties}
        >
            {/* Reading Progress Bar */}
            <div
                className="fixed top-0 left-0 h-1 bg-[#F59E0B] z-50 transition-all duration-150 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                style={{ width: `${progress}%` }}
            />

            {/* Sticky Header */}
            <header
                className={clsx(
                    "fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-50 shadow-sm transition-transform duration-300 backdrop-blur-sm border-b",
                    !showHeader && "-translate-y-full",
                    config.theme === "light" && "bg-[#f9f7f1]/95 border-gray-200/50",
                    config.theme === "sepia" && "bg-[#f4ecd8]/95 border-[#e6dac0]/50",
                    config.theme === "dark" && "bg-gray-950/95 border-gray-800/50"
                )}
            >
                <Link
                    href={`/truyen/${novel.slug}`}
                    className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                    <span className="font-sans text-sm font-medium truncate max-w-[150px] sm:max-w-xs">
                        {novel.title}
                    </span>
                </Link>
                <div className="flex items-center gap-4">
                    <ReadingSettings onConfigChange={setConfig} />
                    <Link href="/" className="hover:text-indigo-600">
                        <Home className="w-5 h-5" />
                    </Link>
                </div>
            </header>

            <main className="pt-20 pb-20 container mx-auto px-4 max-w-4xl">
                {/* Chapter Title */}
                <div className="mb-8 text-center">
                    <h2 className="text-sm font-sans opacity-70 uppercase tracking-widest mb-2">
                        {chapter.volume.title}
                    </h2>
                    <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                        {chapter.title}
                    </h1>
                </div>

                {/* Top Navigation */}
                <div className="flex items-center justify-between mb-10 font-sans text-sm">
                    {prevChapter ? (
                        <Link
                            href={`/truyen/${novel.slug}/${prevChapter.slug}`}
                            className={clsx(
                                "flex items-center gap-1 px-4 py-2 border rounded-full transition-all",
                                config.theme === "dark"
                                    ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                                    : "bg-white border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700"
                            )}
                        >
                            <ChevronLeft className="w-4 h-4" /> Chương trước
                        </Link>
                    ) : (
                        <button disabled className="flex items-center gap-1 px-4 py-2 opacity-50 cursor-not-allowed border border-transparent bg-gray-100 dark:bg-gray-800 rounded-full">
                            <ChevronLeft className="w-4 h-4" /> Chương trước
                        </button>
                    )}

                    <Link
                        href={`/truyen/${novel.slug}`}
                        className="flex items-center gap-2 px-4 py-2 hover:text-indigo-600"
                    >
                        <List className="w-5 h-5" />
                        <span className="hidden sm:inline">Mục lục</span>
                    </Link>

                    {nextChapter ? (
                        <Link
                            href={`/truyen/${novel.slug}/${nextChapter.slug}`}
                            className={clsx(
                                "flex items-center gap-1 px-4 py-2 border rounded-full transition-all",
                                config.theme === "dark"
                                    ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                                    : "bg-white border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700"
                            )}
                        >
                            Chương sau <ChevronRight className="w-4 h-4" />
                        </Link>
                    ) : (
                        <button disabled className="flex items-center gap-1 px-4 py-2 opacity-50 cursor-not-allowed border border-transparent bg-gray-100 dark:bg-gray-800">
                            Chương sau <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div
                    className="relative"
                    style={{
                        fontSize: `${config.fontSize}px`,
                        textAlign: config.textAlign,
                        lineHeight: 1.8,
                    }}
                >
                    {isLocked ? (
                        <div className={clsx(
                            "border rounded-2xl p-10 text-center shadow-sm my-10",
                            config.theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                        )}>
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                                <Lock className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Chương VIP</h3>
                            <p className="opacity-70 mb-6">
                                Chương này đã bị khóa. Vui lòng mở khóa để tiếp tục đọc.
                            </p>

                            {session?.user ? (
                                <UnlockButton chapterId={chapter.id} price={chapter.price} />
                            ) : (
                                <Link href="/api/auth/signin" className="inline-block px-6 py-3 bg-indigo-600 text-white font-sans font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                                    Đăng nhập để mở khóa
                                </Link>
                            )}
                        </div>
                    ) : (
                        <ChapterContent
                            content={chapter.content}
                            className={clsx(
                                config.font === "mono" && "font-mono!",
                                config.font === "sans" && "font-sans!",
                                config.font === "serif" && "font-serif!",
                                config.theme === "dark" && "prose-invert text-white"
                            )}
                        />
                    )}
                </div>

                {/* Bottom Navigation */}
                <div className="flex items-center justify-between mt-16 font-sans text-sm">
                    {prevChapter ? (
                        <Link
                            href={`/truyen/${novel.slug}/${prevChapter.slug}`}
                            className={clsx(
                                "flex items-center gap-1 px-4 py-2 border rounded-full transition-all",
                                config.theme === "dark"
                                    ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                                    : "bg-white border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700"
                            )}
                        >
                            <ChevronLeft className="w-4 h-4" /> Chương trước
                        </Link>
                    ) : (
                        <button disabled className="flex items-center gap-1 px-4 py-2 opacity-50 cursor-not-allowed border border-transparent bg-gray-100 dark:bg-gray-800 rounded-full">
                            <ChevronLeft className="w-4 h-4" /> Chương trước
                        </button>
                    )}

                    {nextChapter ? (
                        <Link
                            href={`/truyen/${novel.slug}/${nextChapter.slug}`}
                            className={clsx(
                                "flex items-center gap-1 px-4 py-2 border rounded-full transition-all",
                                config.theme === "dark"
                                    ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                                    : "bg-white border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700"
                            )}
                        >
                            Chương sau <ChevronRight className="w-4 h-4" />
                        </Link>
                    ) : (
                        <button disabled className="flex items-center gap-1 px-4 py-2 opacity-50 cursor-not-allowed border border-transparent bg-gray-100 dark:bg-gray-800">
                            Chương sau <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Comments */}
                <div className="mt-16 max-w-3xl mx-auto">
                    <CommentSection novelId={novel.id} chapterId={chapter.id} />
                </div>
            </main>
        </div>
    )
}
