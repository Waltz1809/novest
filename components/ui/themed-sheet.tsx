"use client"

import * as React from "react"
import { X } from "lucide-react"
import { READING_THEMES, ReadingTheme } from "@/lib/reading-themes"

interface ThemedSheetProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    themeId?: string
    children: React.ReactNode
}

export function ThemedSheet({
    isOpen,
    onClose,
    title,
    themeId = "light",
    children,
}: ThemedSheetProps) {
    const theme: ReadingTheme = READING_THEMES[themeId] || READING_THEMES["light"]

    // Close on Escape key
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        if (isOpen) {
            document.addEventListener("keydown", handleEscape)
            document.body.style.overflow = "hidden"
        }
        return () => {
            document.removeEventListener("keydown", handleEscape)
            document.body.style.overflow = ""
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sheet Panel */}
            <div
                className="absolute inset-y-0 right-0 w-full sm:max-w-md shadow-xl flex flex-col"
                style={{
                    backgroundColor: theme.ui.background,
                }}
            >
                {/* Header */}
                {title && (
                    <div
                        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
                        style={{
                            borderColor: theme.ui.border,
                        }}
                    >
                        <h2
                            className="font-semibold text-lg"
                            style={{ color: theme.ui.text }}
                        >
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg transition-colors"
                            style={{
                                color: theme.ui.text,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.ui.hover)}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-hidden">{children}</div>
            </div>
        </div>
    )
}
