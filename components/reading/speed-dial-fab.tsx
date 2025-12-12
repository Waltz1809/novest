"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Plus,
    Home,
    Settings,
    ChevronLeft,
    ChevronRight,
    List,
    MessageSquare,
    X
} from "lucide-react"
import { useOnClickOutside } from "@/hooks/use-click-outside"
import { clsx } from "clsx"
import Link from "next/link"
import { READING_THEMES, ReadingTheme } from "@/lib/reading-themes"

interface SpeedDialFabProps {
    novelSlug: string
    chapterSlug: string
    prevChapterSlug?: string
    nextChapterSlug?: string
    onToggleSettings: () => void
    onToggleTOC: () => void
    onToggleComments: () => void
    isHidden?: boolean
    themeId?: string // Theme syncing with reader
    isPending?: boolean // If novel is pending approval, link to /cho-duyet
}

export function SpeedDialFab({
    novelSlug,
    chapterSlug,
    prevChapterSlug,
    nextChapterSlug,
    onToggleSettings,
    onToggleTOC,
    onToggleComments,
    isHidden = false,
    themeId = "night",
    isPending = false
}: SpeedDialFabProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useOnClickOutside(containerRef, () => setIsOpen(false))

    const toggleMenu = () => setIsOpen(!isOpen)

    // Get theme colors
    const theme: ReadingTheme = READING_THEMES[themeId] || READING_THEMES["night"]
    const isDark = ["dark", "night", "onyx", "dusk"].includes(themeId)

    // Menu items configuration
    const menuItems = [
        {
            id: "settings",
            icon: Settings,
            label: "Cài đặt",
            onClick: () => {
                onToggleSettings()
                setIsOpen(false)
            },
        },
        {
            id: "home",
            icon: Home,
            label: "Trang chính",
            href: isPending ? `/truyen/${novelSlug}/cho-duyet` : `/truyen/${novelSlug}`,
        },
        {
            id: "toc",
            icon: List,
            label: "Mục lục",
            onClick: () => {
                onToggleTOC()
                setIsOpen(false)
            },
        },
        {
            id: "comments",
            icon: MessageSquare,
            label: "Bình luận",
            onClick: () => {
                onToggleComments()
                setIsOpen(false)
            },
        },
    ]

    const navItems = [
        {
            id: "prev",
            icon: ChevronLeft,
            label: "Chương trước",
            href: prevChapterSlug ? `/truyen/${novelSlug}/${prevChapterSlug}` : undefined,
            disabled: !prevChapterSlug,
        },
        {
            id: "next",
            icon: ChevronRight,
            label: "Chương sau",
            href: nextChapterSlug ? `/truyen/${novelSlug}/${nextChapterSlug}` : undefined,
            disabled: !nextChapterSlug,
        },
    ]

    return (
        <motion.div
            ref={containerRef}
            className={clsx(
                "fixed bottom-8 right-8 z-50 transition-all duration-300",
                isHidden && "translate-y-32 opacity-0 pointer-events-none"
            )}
            layout
        >
            <motion.div
                layout
                className={clsx(
                    "backdrop-blur-md shadow-2xl border flex items-center justify-center overflow-hidden",
                    isOpen ? "rounded-3xl" : "rounded-full"
                )}
                style={{
                    backgroundColor: isDark ? "rgba(30, 30, 40, 0.95)" : "rgba(255, 255, 255, 0.95)",
                    borderColor: theme.ui.border,
                }}
                initial={false}
                animate={{
                    width: isOpen ? "auto" : 56,
                    height: isOpen ? "auto" : 56,
                }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                }}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        // Expanded Menu
                        <motion.div
                            key="menu"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15, delay: 0.1 }}
                            className="flex flex-col items-center gap-1.5 p-2"
                        >
                            {/* Close Button */}
                            <motion.button
                                onClick={toggleMenu}
                                className="w-full p-2.5 rounded-xl text-red-400 transition-colors flex items-center justify-center"
                                style={{
                                    backgroundColor: "transparent",
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                            >
                                <X className="w-5 h-5" />
                            </motion.button>

                            {/* Menu Items */}
                            {menuItems.map((item, index) => {
                                const Icon = item.icon
                                const content = (
                                    <motion.div
                                        className="w-full p-2.5 rounded-xl text-amber-500 transition-colors flex items-center justify-center"
                                        style={{ backgroundColor: "transparent" }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05 + index * 0.03 }}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </motion.div>
                                )

                                if (item.href) {
                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            title={item.label}
                                            className="w-full"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            {content}
                                        </Link>
                                    )
                                }

                                return (
                                    <button
                                        key={item.id}
                                        onClick={item.onClick}
                                        title={item.label}
                                        className="w-full"
                                    >
                                        {content}
                                    </button>
                                )
                            })}

                            {/* Divider */}
                            <motion.div
                                className="w-8 h-px my-0.5"
                                style={{ backgroundColor: theme.ui.border }}
                                initial={{ opacity: 0, scaleX: 0 }}
                                animate={{ opacity: 1, scaleX: 1 }}
                                transition={{ delay: 0.2 }}
                            />

                            {/* Navigation Items */}
                            {navItems.map((item, index) => {
                                const Icon = item.icon
                                const content = (
                                    <motion.div
                                        className={clsx(
                                            "w-full p-2.5 rounded-xl transition-colors flex items-center justify-center",
                                            item.disabled && "cursor-not-allowed"
                                        )}
                                        style={{
                                            color: item.disabled ? (isDark ? "#4b5563" : "#9ca3af") : "#f59e0b",
                                            backgroundColor: "transparent",
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!item.disabled) {
                                                e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"
                                            }
                                        }}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.25 + index * 0.03 }}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </motion.div>
                                )

                                if (item.href && !item.disabled) {
                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            title={item.label}
                                            className="w-full"
                                        >
                                            {content}
                                        </Link>
                                    )
                                }

                                return (
                                    <button
                                        key={item.id}
                                        disabled={item.disabled}
                                        title={item.label}
                                        className="w-full"
                                    >
                                        {content}
                                    </button>
                                )
                            })}
                        </motion.div>
                    ) : (
                        // Collapsed FAB Button
                        <motion.button
                            key="fab"
                            onClick={toggleMenu}
                            className="w-14 h-14 flex items-center justify-center"
                            style={{ color: isDark ? "#fff" : "#1f2937" }}
                            initial={{ opacity: 0, rotate: -45 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: 45 }}
                            transition={{ duration: 0.15 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Plus className="w-7 h-7" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    )
}
