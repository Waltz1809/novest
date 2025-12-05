"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { clsx } from "clsx"
import { READING_THEMES, ReadingTheme } from "@/lib/reading-themes"

interface SheetProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title?: string
    className?: string
    side?: "left" | "right"
    themeId?: string // Theme ID from READING_THEMES
}

export function Sheet({
    isOpen,
    onClose,
    children,
    title,
    className,
    side = "right",
    themeId = "night", // Default to app dark theme
}: SheetProps) {
    const sheetRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)

    // Get theme colors
    const theme: ReadingTheme = READING_THEMES[themeId] || READING_THEMES["night"]

    // Ensure client-side only rendering for hydration
    useEffect(() => {
        setMounted(true)
    }, [])

    // Handle escape key
    useEffect(() => {
        if (!mounted) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose()
            }
        }
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, onClose, mounted])

    // Prevent body scroll when open
    useEffect(() => {
        if (!mounted) return
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }
        return () => {
            document.body.style.overflow = ""
        }
    }, [isOpen, mounted])

    // Don't render on server to avoid hydration mismatch
    if (!mounted) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100"
                        onClick={onClose}
                    />

                    {/* Sheet Panel */}
                    <motion.div
                        ref={sheetRef}
                        initial={{ x: side === "right" ? "100%" : "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: side === "right" ? "100%" : "-100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className={clsx(
                            "fixed top-0 h-full z-101 flex flex-col",
                            "w-full sm:w-[420px] max-w-full",
                            side === "right" ? "right-0 border-l" : "left-0 border-r",
                            className
                        )}
                        style={{
                            backgroundColor: theme.ui.background,
                            borderColor: theme.ui.border,
                            color: theme.ui.text,
                            // Custom scrollbar CSS variables
                            "--scrollbar-thumb": theme.ui.border,
                            "--scrollbar-track": "transparent",
                            "--scrollbar-hover": theme.ui.text,
                        } as React.CSSProperties}
                    >
                        {/* Header */}
                        {title && (
                            <div
                                className="flex items-center justify-between px-5 py-4 border-b"
                                style={{ borderColor: theme.ui.border }}
                            >
                                <h2
                                    className="text-lg font-bold"
                                    style={{ color: theme.foreground }}
                                >
                                    {title}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full transition-colors"
                                    style={{
                                        color: theme.ui.text,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = theme.ui.hover
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "transparent"
                                    }}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 overflow-hidden">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

// Re-export theme for convenience
export { READING_THEMES, type ReadingTheme }
