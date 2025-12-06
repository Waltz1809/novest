"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Lock, MessageSquare } from "lucide-react"
import UnlockButton from "@/components/novel/unlock-button"
import { ParagraphChapterContent } from "@/components/novel/paragraph-chapter-content"
import { DiscussionDrawer } from "@/components/comment/discussion-drawer"
import { ReadingSettings, ReadingConfig, getFontFamily } from "@/components/novel/reading-settings"
import { SpeedDialFab } from "@/components/reading/speed-dial-fab"
import { ChapterListSidebar } from "@/components/reading/chapter-list-sidebar"
import { useOnClickOutside } from "@/hooks/use-click-outside"
import { getChapterParagraphCommentCounts } from "@/actions/interaction"
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
        font: "lora",
        fontSize: 18,
        lineHeight: 1.8,
        textAlign: "justify",
        textIndent: false,
        theme: "light",
    })
    const [progress, setProgress] = useState(0)
    const [showSettings, setShowSettings] = useState(false)
    const [showTOC, setShowTOC] = useState(false)
    const [showComments, setShowComments] = useState(false)
    const [selectedParagraphId, setSelectedParagraphId] = useState<number | null>(null)
    const [paragraphCommentCounts, setParagraphCommentCounts] = useState<Record<number, number>>({})
    const scrollTimeout = useRef<NodeJS.Timeout | null>(null)
    const isRestoring = useRef(true)
    const settingsRef = useRef<HTMLDivElement>(null)

    // Close settings panel when clicking outside
    useOnClickOutside(settingsRef, () => {
        if (showSettings) setShowSettings(false)
    })

    // Load saved reading config on mount
    useEffect(() => {
        const savedConfig = localStorage.getItem("reading-config")
        if (savedConfig) {
            try {
                const parsed = JSON.parse(savedConfig)
                setConfig(prev => ({ ...prev, ...parsed }))
            } catch (e) {
                console.error("Failed to parse reading config", e)
            }
        }
    }, [])

    // Fetch paragraph comment counts
    useEffect(() => {
        if (!isLocked && chapter?.id) {
            getChapterParagraphCommentCounts(chapter.id).then(counts => {
                setParagraphCommentCounts(counts)
            })
        }
    }, [chapter?.id, isLocked])

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
    const lastUpdatedChapter = useRef<string | null>(null)
    useEffect(() => {
        if (session?.user && lastUpdatedChapter.current !== chapter.id) {
            lastUpdatedChapter.current = chapter.id
            import("@/actions/library").then(({ updateReadingHistory }) => {
                updateReadingHistory(novel.id, chapter.id)
            })
        }
    }, [chapter.id, novel.id, session?.user])

    // 4. Keyboard Navigation (Arrow Keys)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger when typing in inputs or textareas
            const target = e.target as HTMLElement
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                return
            }

            // Left Arrow → Previous Chapter
            if (e.key === "ArrowLeft" && prevChapter) {
                window.location.href = `/truyen/${novel.slug}/${prevChapter.slug}`
            }

            // Right Arrow → Next Chapter
            if (e.key === "ArrowRight" && nextChapter) {
                window.location.href = `/truyen/${novel.slug}/${nextChapter.slug}`
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [novel.slug, prevChapter, nextChapter])

    return (
        <div
            className={clsx(
                "min-h-screen transition-colors duration-300",
                // Light themes
                config.theme === "light" && "bg-[#f9f7f1] text-gray-900",
                config.theme === "sepia" && "bg-[#f4ecd8] text-[#5b4636]",
                config.theme === "lavender" && "bg-[#e6e6fa] text-[#2c2c54]",
                config.theme === "frost" && "bg-[#f0f8ff] text-[#1e3799]",
                config.theme === "matcha" && "bg-[#f0fff4] text-black",
                config.theme === "ocean" && "bg-[#f0f9ff] text-black",
                config.theme === "strawberry" && "bg-[#fff1f2] text-black",
                // Dark themes
                config.theme === "dark" && "bg-gray-900 text-gray-100",
                config.theme === "night" && "bg-[#0B0C10] text-gray-200", // Deep Charcoal
                config.theme === "onyx" && "bg-[#000000] text-gray-300", // Pure Black
                config.theme === "dusk" && "bg-[#202030] text-gray-200" // Midnight Blue
            )}
            style={{
                fontFamily: getFontFamily(config.font),
            } as React.CSSProperties}
        >
            {/* Reading Progress Bar */}
            <div
                className="fixed top-0 left-0 h-1 bg-[#F59E0B] z-50 transition-all duration-150 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                style={{ width: `${progress}%` }}
            />

            {/* Settings Panel (Conditional Render) */}
            {showSettings && (
                <div
                    ref={settingsRef}
                    className="fixed bottom-24 right-8 z-50 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-200"
                >
                    <ReadingSettings onConfigChange={setConfig} />
                </div>
            )}

            <main className="pt-12 pb-20 container mx-auto px-4 max-w-4xl">
                {/* Chapter Title */}
                <div className="mb-8 text-center">
                    <h2 className="text-sm font-sans opacity-70 uppercase tracking-widest mb-2">
                        {chapter.volume.title}
                    </h2>
                    <h1 className="text-3xl md:text-4xl font-bold leading-tight font-display">
                        {chapter.title}
                    </h1>
                </div>

                {/* Content */}
                <div
                    className="relative"
                    style={{
                        fontSize: `${config.fontSize}px`,
                        textAlign: config.textAlign,
                        lineHeight: config.lineHeight,
                        textIndent: config.textIndent ? "2em" : "0",
                    }}
                >
                    {isLocked ? (
                        <div className={clsx(
                            "border rounded-2xl p-10 text-center shadow-sm my-10",
                            ["dark", "night", "onyx", "dusk"].includes(config.theme)
                                ? "bg-white/5 border-white/10"
                                : "bg-black/5 border-black/10"
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
                        <ParagraphChapterContent
                            content={chapter.content}
                            fontSize={config.fontSize}
                            lineHeight={config.lineHeight}
                            paragraphCommentCounts={paragraphCommentCounts}
                            themeId={config.theme}
                            onParagraphClick={(pid) => {
                                setSelectedParagraphId(pid)
                                setShowComments(true)
                            }}
                            className={clsx(
                                ["dark", "night", "onyx", "dusk"].includes(config.theme) && "prose-invert"
                            )}
                        />
                    )}
                </div>

                {/* Discuss Chapter Button */}
                <div className="mt-16 max-w-3xl mx-auto">
                    <button
                        onClick={() => {
                            setSelectedParagraphId(null) // Show all chapter comments
                            setShowComments(true)
                        }}
                        className={clsx(
                            "w-full py-4 px-6 rounded-2xl border flex items-center justify-center gap-3 transition-all duration-200",
                            ["dark", "night", "onyx", "dusk"].includes(config.theme)
                                ? "bg-white/5 border-white/10 hover:bg-white/10 text-gray-200"
                                : "bg-black/5 border-black/10 hover:bg-black/10 text-gray-700"
                        )}
                    >
                        <MessageSquare className="w-5 h-5" />
                        <span className="font-medium">Thảo luận chương này</span>
                    </button>
                </div>
            </main>

            {/* Speed Dial FAB */}
            <SpeedDialFab
                novelSlug={novel.slug}
                chapterSlug={chapter.slug}
                prevChapterSlug={prevChapter?.slug}
                nextChapterSlug={nextChapter?.slug}
                onToggleSettings={() => {
                    setShowSettings(!showSettings)
                    setShowTOC(false)
                }}
                onToggleTOC={() => {
                    setShowTOC(!showTOC)
                    setShowSettings(false)
                }}
                onToggleComments={() => {
                    setShowComments(true)
                    setShowSettings(false)
                    setShowTOC(false)
                }}
                isHidden={showTOC}
                themeId={config.theme}
            />

            {/* TOC Sidebar */}
            <ChapterListSidebar
                novel={novel}
                currentChapterId={chapter.id}
                isOpen={showTOC}
                onClose={() => setShowTOC(false)}
                themeId={config.theme}
            />

            {/* Discussion Drawer */}
            <DiscussionDrawer
                isOpen={showComments}
                onClose={() => {
                    setShowComments(false)
                    setSelectedParagraphId(null)
                }}
                novelId={novel.id}
                chapterId={chapter.id}
                themeId={config.theme}
                paragraphId={selectedParagraphId}
                onCommentAdded={() => {
                    // Refresh paragraph comment counts
                    getChapterParagraphCommentCounts(chapter.id).then(counts => {
                        setParagraphCommentCounts(counts)
                    })
                }}
            />
        </div>
    )
}
