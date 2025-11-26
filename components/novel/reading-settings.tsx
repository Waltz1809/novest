"use client"

import { useState, useEffect } from "react"
import { Settings, Type, AlignLeft, AlignJustify, Moon, Sun, Coffee } from "lucide-react"
import { useTheme } from "next-themes"
import { clsx } from "clsx"

export interface ReadingConfig {
    font: "sans" | "serif" | "mono"
    fontSize: number
    textAlign: "left" | "justify"
    theme: "light" | "dark" | "sepia"
}

const DEFAULT_CONFIG: ReadingConfig = {
    font: "serif",
    fontSize: 18,
    textAlign: "justify",
    theme: "light",
}

export function ReadingSettings({
    onConfigChange,
}: {
    onConfigChange: (config: ReadingConfig) => void
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [config, setConfig] = useState<ReadingConfig>(DEFAULT_CONFIG)
    const { setTheme } = useTheme()

    // Load config from localStorage on mount
    useEffect(() => {
        const savedConfig = localStorage.getItem("reading-config")
        if (savedConfig) {
            try {
                const parsed = JSON.parse(savedConfig)
                setConfig(parsed)
                onConfigChange(parsed)
                // Sync theme with next-themes if needed, but "sepia" is custom.
                // If theme is light/dark, we can sync. Sepia is a bit special.
                // For simplicity, let's handle "theme" purely via CSS classes on the content wrapper for now, 
                // OR we can use next-themes for everything if we define "sepia" in tailwind config.
                // But the requirement says "Chế độ màu: Sáng, Tối, Màu giấy".
                // Let's assume "sepia" is a data-theme or just a class we apply.
                // 
                // Actually, next-themes handles "light" and "dark". "sepia" might need a custom class on body or wrapper.
                // Let's stick to applying classes to the content wrapper as requested:
                // "sử dụng các giá trị từ ReadingSettings để áp dụng class CSS vào phần nội dung chương"
            } catch (e) {
                console.error("Failed to parse reading config", e)
            }
        }
    }, [onConfigChange])

    const updateConfig = (newConfig: Partial<ReadingConfig>) => {
        const updated = { ...config, ...newConfig }
        setConfig(updated)
        onConfigChange(updated)
        localStorage.setItem("reading-config", JSON.stringify(updated))
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm hover:bg-gray-100 dark:bg-gray-800/90 dark:text-gray-200 dark:hover:bg-gray-700"
            >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Cài đặt</span>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop overlay */}
                    <div
                        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Settings menu */}
                    <div className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-white dark:bg-gray-900 p-4 shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                        {/* Theme */}
                        <div className="mb-4">
                            <label className="mb-2 block text-xs font-semibold text-muted-foreground uppercase">Màu nền</label>
                            <div className="flex gap-2 rounded-lg bg-muted p-1">
                                <button
                                    onClick={() => updateConfig({ theme: "light" })}
                                    className={clsx(
                                        "flex-1 flex items-center justify-center gap-1 rounded-md py-1.5 text-sm font-medium transition-colors",
                                        config.theme === "light"
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Sun className="h-4 w-4" /> Sáng
                                </button>
                                <button
                                    onClick={() => updateConfig({ theme: "sepia" })}
                                    className={clsx(
                                        "flex-1 flex items-center justify-center gap-1 rounded-md py-1.5 text-sm font-medium transition-colors",
                                        config.theme === "sepia"
                                            ? "bg-[#f4ecd8] text-[#5b4636] shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Coffee className="h-4 w-4" /> Vàng
                                </button>
                                <button
                                    onClick={() => updateConfig({ theme: "dark" })}
                                    className={clsx(
                                        "flex-1 flex items-center justify-center gap-1 rounded-md py-1.5 text-sm font-medium transition-colors",
                                        config.theme === "dark"
                                            ? "bg-gray-950 text-gray-200 shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Moon className="h-4 w-4" /> Tối
                                </button>
                            </div>
                        </div>

                        {/* Font */}
                        <div className="mb-4">
                            <label className="mb-2 block text-xs font-semibold text-muted-foreground uppercase">Font chữ</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => updateConfig({ font: "sans" })}
                                    className={clsx(
                                        "flex-1 rounded-md border px-2 py-1.5 text-sm transition-colors font-sans",
                                        config.font === "sans"
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border hover:border-primary/50 text-foreground"
                                    )}
                                >
                                    Sans
                                </button>
                                <button
                                    onClick={() => updateConfig({ font: "serif" })}
                                    className={clsx(
                                        "flex-1 rounded-md border px-2 py-1.5 text-sm transition-colors font-serif",
                                        config.font === "serif"
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border hover:border-primary/50 text-foreground"
                                    )}
                                >
                                    Serif
                                </button>
                                <button
                                    onClick={() => updateConfig({ font: "mono" })}
                                    className={clsx(
                                        "flex-1 rounded-md border px-2 py-1.5 text-sm transition-colors font-mono",
                                        config.font === "mono"
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border hover:border-primary/50 text-foreground"
                                    )}
                                >
                                    Mono
                                </button>
                            </div>
                        </div>

                        {/* Size */}
                        <div className="mb-4">
                            <label className="mb-2 block text-xs font-semibold text-muted-foreground uppercase">
                                Cỡ chữ: {config.fontSize}px
                            </label>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => updateConfig({ fontSize: Math.max(14, config.fontSize - 1) })}
                                    className="flex h-8 w-8 items-center justify-center rounded-md  hover:bg-muted text-foreground"
                                >
                                    <Type className="h-3 w-3" />
                                </button>
                                <input
                                    type="range"
                                    min="14"
                                    max="32"
                                    value={config.fontSize}
                                    onChange={(e) => updateConfig({ fontSize: parseInt(e.target.value) })}
                                    className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <button
                                    onClick={() => updateConfig({ fontSize: Math.min(32, config.fontSize + 1) })}
                                    className="flex h-8 w-8 items-center justify-center rounded-md  hover:bg-muted text-foreground"
                                >
                                    <Type className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Align */}
                        <div>
                            <label className="mb-2 block text-xs font-semibold text-muted-foreground uppercase">Căn lề</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => updateConfig({ textAlign: "left" })}
                                    className={clsx(
                                        "flex-1 flex items-center justify-center gap-2 rounded-md border px-2 py-1.5 text-sm transition-colors text-foreground",
                                        config.textAlign === "left"
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border hover:border-primary/50"
                                    )}
                                >
                                    <AlignLeft className="h-4 w-4" /> Trái
                                </button>
                                <button
                                    onClick={() => updateConfig({ textAlign: "justify" })}
                                    className={clsx(
                                        "flex-1 flex items-center justify-center gap-2 rounded-md border px-2 py-1.5 text-sm transition-colors text-foreground",
                                        config.textAlign === "justify"
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border hover:border-primary/50"
                                    )}
                                >
                                    <AlignJustify className="h-4 w-4" /> Đều
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
