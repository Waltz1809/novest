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
            if ('error' in res) {
                alert(res.error)
            } else {
                onSuccess?.()
                onClose()
            }
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-200">
                <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                        <Star className="w-5 h-5 fill-current" />
                        Đánh giá truyện
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 hover:bg-gray-100 text-muted-foreground hover:text-foreground transition-colors"
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
                                        ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                                        : "text-gray-300 fill-gray-200"
                                )}
                            />
                        </button>
                    ))}
                </div>

                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-foreground">
                        Nhận xét (tùy chọn)
                    </label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Chia sẻ cảm nghĩ của bạn về truyện này..."
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-muted-foreground/50 resize-none"
                        rows={4}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={score === 0 || isPending}
                        className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Gửi đánh giá
                    </button>
                </div>
            </div>
        </div>
    )
}
