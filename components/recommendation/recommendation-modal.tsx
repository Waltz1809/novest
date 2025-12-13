"use client"

import { useState, useEffect, useTransition } from "react"
import { X, Globe, BookOpen, Check, Loader2 } from "lucide-react"
import { saveUserPreferences, skipRecommendation, getAllGenres } from "@/actions/recommendation"
import { clsx } from "clsx"

interface RecommendationModalProps {
    isOpen: boolean
    onClose: () => void
    onComplete?: () => void
}

const NATIONS = [
    { code: "CN", label: "Trung Quốc", emoji: "🇨🇳" },
    { code: "JP", label: "Nhật Bản", emoji: "🇯🇵" },
    { code: "KR", label: "Hàn Quốc", emoji: "🇰🇷" },
]

interface Genre {
    id: number
    name: string
    slug: string
}

export function RecommendationModal({ isOpen, onClose, onComplete }: RecommendationModalProps) {
    const [selectedNations, setSelectedNations] = useState<string[]>([])
    const [selectedGenres, setSelectedGenres] = useState<number[]>([])
    const [genres, setGenres] = useState<Genre[]>([])
    const [loadingGenres, setLoadingGenres] = useState(true)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        const fetchGenres = async () => {
            setLoadingGenres(true)
            const result = await getAllGenres()
            setGenres(result.genres)
            setLoadingGenres(false)
        }
        if (isOpen) {
            fetchGenres()
        }
    }, [isOpen])

    const toggleNation = (code: string) => {
        setSelectedNations(prev =>
            prev.includes(code)
                ? prev.filter(n => n !== code)
                : [...prev, code]
        )
    }

    const toggleGenre = (id: number) => {
        setSelectedGenres(prev =>
            prev.includes(id)
                ? prev.filter(g => g !== id)
                : [...prev, id]
        )
    }

    const handleSave = () => {
        startTransition(async () => {
            const res = await saveUserPreferences(selectedNations, selectedGenres)
            if ('error' in res) {
                alert(res.error)
            } else {
                onComplete?.()
                onClose()
            }
        })
    }

    const handleSkip = () => {
        startTransition(async () => {
            await skipRecommendation()
            onClose()
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleSkip}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200">
                {/* Header */}
                <div className="sticky top-0 bg-white p-6 pb-4 border-b border-gray-100">
                    <button
                        onClick={handleSkip}
                        className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-amber-500" />
                        Chọn sở thích đọc truyện
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Giúp chúng tôi đề xuất truyện phù hợp với bạn
                    </p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Nation Selection */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-amber-500" />
                            Nguồn gốc truyện
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            {NATIONS.map((nation) => (
                                <button
                                    key={nation.code}
                                    onClick={() => toggleNation(nation.code)}
                                    className={clsx(
                                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                        selectedNations.includes(nation.code)
                                            ? "border-amber-500 bg-amber-50"
                                            : "border-gray-200 hover:border-gray-300"
                                    )}
                                >
                                    <span className="text-2xl">{nation.emoji}</span>
                                    <span className={clsx(
                                        "text-xs font-medium",
                                        selectedNations.includes(nation.code) ? "text-amber-600" : "text-muted-foreground"
                                    )}>
                                        {nation.label}
                                    </span>
                                    {selectedNations.includes(nation.code) && (
                                        <Check className="w-4 h-4 text-amber-500 absolute top-2 right-2" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Genre Selection */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-amber-500" />
                            Thể loại yêu thích
                        </h3>
                        {loadingGenres ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {genres.map((genre) => (
                                    <button
                                        key={genre.id}
                                        onClick={() => toggleGenre(genre.id)}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                                            selectedGenres.includes(genre.id)
                                                ? "bg-amber-500 text-white"
                                                : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
                                        )}
                                    >
                                        {genre.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white p-6 pt-4 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={handleSkip}
                        disabled={isPending}
                        className="flex-1 py-3 rounded-xl border border-gray-200 text-muted-foreground hover:bg-gray-50 transition-colors font-medium"
                    >
                        Bỏ qua
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isPending || (selectedNations.length === 0 && selectedGenres.length === 0)}
                        className="flex-1 py-3 rounded-xl bg-[#F59E0B] text-[#0B0C10] font-bold hover:bg-[#D97706] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Lưu và tiếp tục
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
