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
                className={className}
                title="Đánh giá truyện"
            >
                <Star className="h-5 w-5 text-[#FBBF24]" />
                <span className="hidden md:inline">Đánh giá truyện</span>
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
