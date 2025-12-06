"use client"

import { useState, useEffect } from "react"
import { AlignLeft, AlignJustify, AlignCenter, Minus, Plus, RotateCcw } from "lucide-react"
import { clsx } from "clsx"

export interface ReadingConfig {
    font: "times" | "merriweather" | "lora" | "roboto" | "noto" | "nunito"
    fontSize: number
    lineHeight: number
    textAlign: "left" | "justify" | "center"
    textIndent: boolean // keeping for backward compatibility with localStorage
    theme: "light" | "sepia" | "dark" | "night" | "onyx" | "dusk" | "lavender" | "frost" | "matcha" | "ocean" | "strawberry"
}

const DEFAULT_CONFIG: ReadingConfig = {
    font: "lora",
    fontSize: 18,
    lineHeight: 1.8,
    textAlign: "justify",
    textIndent: false,
    theme: "light",
}

// Font family mappings for Vietnamese-friendly fonts
const FONT_FAMILIES: Record<ReadingConfig["font"], string> = {
    times: "'Times New Roman', 'Noto Serif', Georgia, serif",
    merriweather: "'Merriweather', 'Noto Serif', Georgia, serif",
    lora: "'Lora', 'Noto Serif', Georgia, serif",
    roboto: "'Roboto', 'Noto Sans', sans-serif",
    noto: "'Noto Sans', 'Roboto', sans-serif",
    nunito: "'Nunito', 'Noto Sans', sans-serif",
}

export function getFontFamily(font: ReadingConfig["font"]): string {
    return FONT_FAMILIES[font] || FONT_FAMILIES.lora
}

export function ReadingSettings({
    onConfigChange,
}: {
    onConfigChange: (config: ReadingConfig) => void
}) {
    const [config, setConfig] = useState<ReadingConfig>(DEFAULT_CONFIG)

    // Load config from localStorage on mount
    useEffect(() => {
        const savedConfig = localStorage.getItem("reading-config")
        if (savedConfig) {
            try {
                const parsed = JSON.parse(savedConfig)
                // Migrate old font values if necessary
                if (parsed.font === "serif" || parsed.font === "mono" || parsed.font === "sans") {
                    parsed.font = "lora" // Default to Lora for old configs
                }
                // Merge with default to ensure new fields exist
                const merged = { ...DEFAULT_CONFIG, ...parsed }
                setConfig(merged)
                onConfigChange(merged)
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

    const resetConfig = () => {
        setConfig(DEFAULT_CONFIG)
        onConfigChange(DEFAULT_CONFIG)
        localStorage.setItem("reading-config", JSON.stringify(DEFAULT_CONFIG))
    }

    // Determine panel theme based on reading theme
    const isDarkPanel = ["dark", "night", "onyx", "dusk"].includes(config.theme)

    // Font options with display names
    const fontOptions: { id: ReadingConfig["font"]; name: string }[] = [
        { id: "times", name: "Times" },
        { id: "merriweather", name: "Merriweather" },
        { id: "lora", name: "Lora" },
        { id: "roboto", name: "Roboto" },
        { id: "noto", name: "Noto" },
        { id: "nunito", name: "Nunito" },
    ]

    return (
        <div className={clsx(
            "w-[320px] rounded-2xl p-5 shadow-2xl border backdrop-blur-md transition-colors duration-300",
            isDarkPanel
                ? "bg-[#1a1a1a]/95 border-white/10 text-gray-200"
                : "bg-white/95 border-gray-200 text-gray-800"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">Cài đặt hiển thị</h3>
                <button
                    onClick={resetConfig}
                    className="text-xs text-amber-500 hover:text-amber-600 font-medium flex items-center gap-1"
                >
                    <RotateCcw className="w-3 h-3" /> Mặc định
                </button>
            </div>

            {/* Typography Section */}
            <div className="space-y-4 mb-6">
                <h4 className="text-xs font-bold uppercase opacity-50 tracking-wider">Phông chữ</h4>

                {/* Font Family - 2 rows of 3 */}
                <div className="grid grid-cols-3 gap-2">
                    {fontOptions.map((fontOpt) => (
                        <button
                            key={fontOpt.id}
                            onClick={() => updateConfig({ font: fontOpt.id })}
                            className={clsx(
                                "px-2 py-2 rounded-lg text-xs border transition-all",
                                config.font === fontOpt.id
                                    ? "border-amber-500 bg-amber-500/10 text-amber-500"
                                    : isDarkPanel
                                        ? "border-transparent bg-white/5 hover:bg-white/10"
                                        : "border-transparent bg-black/5 hover:bg-black/10"
                            )}
                            style={{ fontFamily: FONT_FAMILIES[fontOpt.id] }}
                        >
                            {fontOpt.name}
                        </button>
                    ))}
                </div>

                {/* Font Size */}
                <div className="flex items-center justify-between">
                    <span className="text-sm opacity-80">Cỡ chữ</span>
                    <div className={clsx(
                        "flex items-center gap-3 rounded-lg p-1",
                        isDarkPanel ? "bg-white/5" : "bg-black/5"
                    )}>
                        <button
                            onClick={() => updateConfig({ fontSize: Math.max(14, config.fontSize - 1) })}
                            className={clsx(
                                "p-1.5 rounded transition-colors",
                                isDarkPanel ? "hover:bg-white/10" : "hover:bg-black/10"
                            )}
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium w-8 text-center">{config.fontSize}</span>
                        <button
                            onClick={() => updateConfig({ fontSize: Math.min(32, config.fontSize + 1) })}
                            className={clsx(
                                "p-1.5 rounded transition-colors",
                                isDarkPanel ? "hover:bg-white/10" : "hover:bg-black/10"
                            )}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Line Height */}
                <div className="flex items-center justify-between">
                    <span className="text-sm opacity-80">Dãn dòng</span>
                    <div className={clsx(
                        "flex items-center gap-3 rounded-lg p-1",
                        isDarkPanel ? "bg-white/5" : "bg-black/5"
                    )}>
                        <button
                            onClick={() => updateConfig({ lineHeight: Math.max(1.2, Number((config.lineHeight - 0.1).toFixed(1))) })}
                            className={clsx(
                                "p-1.5 rounded transition-colors",
                                isDarkPanel ? "hover:bg-white/10" : "hover:bg-black/10"
                            )}
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium w-8 text-center">{config.lineHeight}</span>
                        <button
                            onClick={() => updateConfig({ lineHeight: Math.min(2.5, Number((config.lineHeight + 0.1).toFixed(1))) })}
                            className={clsx(
                                "p-1.5 rounded transition-colors",
                                isDarkPanel ? "hover:bg-white/10" : "hover:bg-black/10"
                            )}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Layout Section */}
            <div className="space-y-4 mb-6">
                <h4 className="text-xs font-bold uppercase opacity-50 tracking-wider">Bố cục</h4>

                <div className="flex items-center justify-between">
                    <span className="text-sm opacity-80">Căn lề</span>
                    <div className={clsx(
                        "flex rounded-lg p-1",
                        isDarkPanel ? "bg-white/5" : "bg-black/5"
                    )}>
                        <button
                            onClick={() => updateConfig({ textAlign: "left" })}
                            className={clsx(
                                "p-2 rounded transition-colors",
                                config.textAlign === "left"
                                    ? isDarkPanel ? "bg-gray-700 shadow-sm text-amber-500" : "bg-white shadow-sm text-amber-500"
                                    : "hover:text-amber-500"
                            )}
                        >
                            <AlignLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => updateConfig({ textAlign: "center" })}
                            className={clsx(
                                "p-2 rounded transition-colors",
                                config.textAlign === "center"
                                    ? isDarkPanel ? "bg-gray-700 shadow-sm text-amber-500" : "bg-white shadow-sm text-amber-500"
                                    : "hover:text-amber-500"
                            )}
                        >
                            <AlignCenter className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => updateConfig({ textAlign: "justify" })}
                            className={clsx(
                                "p-2 rounded transition-colors",
                                config.textAlign === "justify"
                                    ? isDarkPanel ? "bg-gray-700 shadow-sm text-amber-500" : "bg-white shadow-sm text-amber-500"
                                    : "hover:text-amber-500"
                            )}
                        >
                            <AlignJustify className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Theme Section */}
            <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase opacity-50 tracking-wider">Giao diện</h4>
                <div className="grid grid-cols-4 gap-3">
                    {[
                        { id: "light", name: "Light", color: "#ffffff", text: "#000" },
                        { id: "sepia", name: "Sepia", color: "#f4ecd8", text: "#5b4636" },
                        { id: "lavender", name: "Lavender", color: "#e6e6fa", text: "#2c2c54" },
                        { id: "frost", name: "Frost", color: "#f0f8ff", text: "#1e3799" },
                        { id: "matcha", name: "Matcha", color: "#f0fff4", text: "#000" },
                        { id: "ocean", name: "Ocean", color: "#f0f9ff", text: "#000" },
                        { id: "strawberry", name: "Pink", color: "#fff1f2", text: "#000" },
                        { id: "dark", name: "Dark", color: "#1f2937", text: "#fff" },
                        { id: "night", name: "Night", color: "#0B0C10", text: "#fff" },
                        { id: "onyx", name: "Onyx", color: "#000000", text: "#fff" },
                        { id: "dusk", name: "Dusk", color: "#202030", text: "#fff" },
                    ].map((themeOption) => (
                        <button
                            key={themeOption.id}
                            type="button"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                updateConfig({ theme: themeOption.id as ReadingConfig["theme"] })
                            }}
                            className="flex flex-col items-center gap-1 group cursor-pointer"
                        >
                            <div
                                className={clsx(
                                    "w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-sm transition-all pointer-events-none",
                                    config.theme === themeOption.id
                                        ? "border-amber-500 scale-110"
                                        : isDarkPanel
                                            ? "border-transparent group-hover:border-gray-600"
                                            : "border-transparent group-hover:border-gray-300"
                                )}
                                style={{ backgroundColor: themeOption.color }}
                            >
                                <span
                                    className="font-bold text-xs pointer-events-none"
                                    style={{ color: themeOption.text }}
                                >
                                    A
                                </span>
                            </div>
                            <span className="text-[10px] opacity-70 pointer-events-none">{themeOption.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
