"use client"

import { useState, useTransition } from "react"
import { Star, X, Loader2 } from "lucide-react"
import { rateNovel } from "@/actions/interaction"
import { clsx } from "clsx"

interface RatingModalProps {
    novelId: number
    isOpen: boolean
    onClose: () => void
    initialRating?: number
    initialContent?: string
    onSuccess?: () => void
}

export function RatingModal({
    novelId,
    isOpen,
    onClose,
    initialRating = 0,
    initialContent = "",
    onSuccess,
}: RatingModalProps) {
    const [score, setScore] = useState(initialRating)
    const [content, setContent] = useState(initialContent)
    const [hoveredScore, setHoveredScore] = useState(0)
    const [isPending, startTransition] = useTransition()

    if (!isOpen) return null

    const handleSubmit = () => {
        if (score === 0) return

        startTransition(async () => {
            const res = await rateNovel(novelId, score, content)
            if (res.error) {
                alert(res.error)
            } else {
                onSuccess?.()
                onClose()
            }
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-xl bg-[#1E293B] p-6 shadow-2xl border border-[#34D399]/20 animate-in zoom-in-95 duration-200">
                <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                    <h3 className="text-lg font-bold text-[#F59E0B] flex items-center gap-2">
                        <Star className="w-5 h-5 fill-current" />
                        Đánh giá truyện
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-8 flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className="transition-transform hover:scale-110 focus:outline-none group"
                            onMouseEnter={() => setHoveredScore(star)}
                            onMouseLeave={() => setHoveredScore(0)}
                            onClick={() => setScore(star)}
                        >
                            <Star
                                className={clsx(
                                    "h-10 w-10 transition-colors duration-200",
                                    (hoveredScore || score) >= star
                                        ? "fill-[#F59E0B] text-[#F59E0B] drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                                        : "text-gray-600 fill-gray-800/50"
                                )}
                            />
                        </button>
                    ))}
                </div>

                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                        Nhận xét (tùy chọn)
                    </label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Chia sẻ cảm nghĩ của bạn về truyện này..."
                        className="w-full rounded-lg border border-white/10 bg-[#0B0C10] p-3 text-sm text-white focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] focus:outline-none placeholder:text-gray-600 resize-none"
                        rows={4}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={score === 0 || isPending}
                        className="flex items-center gap-2 rounded-lg bg-[#F59E0B] px-6 py-2 text-sm font-bold text-[#0B0C10] hover:bg-[#FBBF24] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg glow-amber"
                    >
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Gửi đánh giá
                    </button>
                </div>
            </div>
        </div>
    )
}
