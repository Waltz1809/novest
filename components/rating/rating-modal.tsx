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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">Đánh giá truyện</h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-6 flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className="transition-transform hover:scale-110 focus:outline-none"
                            onMouseEnter={() => setHoveredScore(star)}
                            onMouseLeave={() => setHoveredScore(0)}
                            onClick={() => setScore(star)}
                        >
                            <Star
                                className={clsx(
                                    "h-8 w-8",
                                    (hoveredScore || score) >= star
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-muted-foreground/30"
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
                        className="w-full rounded-md border border-input bg-background p-3 text-sm text-foreground focus:border-primary focus:outline-none placeholder:text-muted-foreground"
                        rows={4}
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={score === 0 || isPending}
                        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Gửi đánh giá
                    </button>
                </div>
            </div>
        </div>
    )
}
