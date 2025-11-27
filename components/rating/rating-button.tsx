"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { RatingModal } from "./rating-modal"

interface RatingButtonProps {
    novelId: number
    initialRating?: number
    initialContent?: string
    className?: string
}

export function RatingButton({ novelId, initialRating, initialContent, className }: RatingButtonProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 font-medium text-white transition-colors hover:bg-yellow-600 ${className || ""}`}
            >
                <Star className="h-4 w-4 fill-current" />
                Đánh giá truyện
            </button>

            <RatingModal
                novelId={novelId}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                initialRating={initialRating}
                initialContent={initialContent}
            />
        </>
    )
}
