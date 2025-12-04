"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { clsx } from "clsx"

interface SheetProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title?: string
    className?: string
    side?: "left" | "right"
}

export function Sheet({
    isOpen,
    onClose,
    children,
    title,
    className,
    side = "right",
}: SheetProps) {
    const sheetRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)

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
                            "bg-[#0B0C10] border-l border-white/10",
                            "w-full sm:w-[420px] max-w-full",
                            side === "right" ? "right-0" : "left-0",
                            className
                        )}
                    >
                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                                <h2 className="text-lg font-bold text-gray-100">
                                    {title}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
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
