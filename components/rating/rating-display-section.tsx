"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, User, ChevronRight, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { RatingDetailModal } from "./rating-detail-modal"

interface RatingUser {
    id: string
    name: string | null
    nickname: string | null
    username: string | null
    image: string | null
}

interface Rating {
    userId: string
    novelId: number
    score: number
    content: string | null
    createdAt: Date
    user: RatingUser
}

interface RatingDisplaySectionProps {
    ratings: Rating[]
    totalCount: number
    novelSlug: string
    averageRating: string
}

function StarRating({ score }: { score: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-4 h-4 ${star <= score
                        ? "text-amber-400 fill-amber-400"
                        : "text-gray-300"
                        }`}
                />
            ))}
        </div>
    )
}

function RatingItem({ rating, onClick }: { rating: Rating; onClick: () => void }) {
    const displayName = rating.user.nickname || rating.user.name || "Ẩn danh"
    const timeAgo = formatDistanceToNow(new Date(rating.createdAt), {
        addSuffix: true,
        locale: vi,
    })

    return (
        <div
            onClick={onClick}
            className="flex gap-3 py-4 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors group"
        >
            {/* Avatar */}
            <div className="shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-200">
                    {rating.user.image ? (
                        <Image
                            src={rating.user.image}
                            alt={displayName}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                        {displayName}
                    </span>
                    <StarRating score={rating.score} />
                    <span className="text-xs text-muted-foreground">{timeAgo}</span>
                </div>
                {rating.content && (
                    <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                        {rating.content}
                    </p>
                )}
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary/70 transition-colors">
                    <MessageSquare className="w-3 h-3" />
                    <span>Xem chi tiết</span>
                </div>
            </div>
        </div>
    )
}

export function RatingDisplaySection({
    ratings,
    totalCount,
    novelSlug,
    averageRating,
}: RatingDisplaySectionProps) {
    const [selectedRating, setSelectedRating] = useState<Rating | null>(null)

    if (ratings.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-primary">
                    <Star className="w-4 h-4" />
                    Đánh giá ({averageRating}/5)
                </h3>
                <p className="text-sm text-muted-foreground italic py-4 text-center">
                    Chưa có đánh giá nào. Hãy là người đầu tiên!
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm flex items-center gap-2 text-primary">
                        <Star className="w-4 h-4" />
                        Đánh giá ({averageRating}/5)
                    </h3>
                    {totalCount > 3 && (
                        <Link
                            href={`/truyen/${novelSlug}/danh-gia`}
                            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                        >
                            Xem tất cả {totalCount} đánh giá
                            <ChevronRight className="w-3 h-3" />
                        </Link>
                    )}
                </div>

                <div className="divide-y divide-gray-100">
                    {ratings.slice(0, 3).map((rating) => (
                        <RatingItem
                            key={rating.userId}
                            rating={rating}
                            onClick={() => setSelectedRating(rating)}
                        />
                    ))}
                </div>

                {totalCount > 3 && (
                    <Link
                        href={`/truyen/${novelSlug}/danh-gia`}
                        className="mt-4 w-full py-2.5 flex items-center justify-center gap-2 bg-gray-50 text-primary font-medium text-sm rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                        Xem thêm {totalCount - 3} đánh giá khác
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                )}
            </div>

            {/* Rating Detail Modal */}
            {selectedRating && (
                <RatingDetailModal
                    isOpen={!!selectedRating}
                    onClose={() => setSelectedRating(null)}
                    ratingUserId={selectedRating.userId}
                    novelId={selectedRating.novelId}
                />
            )}
        </>
    )
}

