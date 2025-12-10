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
                        : "text-gray-600"
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
            className="flex gap-3 py-4 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/5 -mx-2 px-2 rounded-lg transition-colors group"
        >
            {/* Avatar */}
            <div className="shrink-0">
                <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border border-white/10">
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
                            <User className="w-5 h-5 text-gray-500" />
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-white group-hover:text-amber-400 transition-colors">
                        {displayName}
                    </span>
                    <StarRating score={rating.score} />
                    <span className="text-xs text-gray-500">{timeAgo}</span>
                </div>
                {rating.content && (
                    <p className="mt-1.5 text-sm text-gray-300 line-clamp-2">
                        {rating.content}
                    </p>
                )}
                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 group-hover:text-amber-500/70 transition-colors">
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
            <div className="bg-[#1E293B] rounded-xl shadow-sm border border-[#34D399]/20 p-5">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-[#F59E0B]">
                    <Star className="w-4 h-4" />
                    Đánh giá ({averageRating}/5)
                </h3>
                <p className="text-sm text-gray-500 italic py-4 text-center">
                    Chưa có đánh giá nào. Hãy là người đầu tiên!
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="bg-[#1E293B] rounded-xl shadow-sm border border-[#34D399]/20 p-5">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm flex items-center gap-2 text-[#F59E0B]">
                        <Star className="w-4 h-4" />
                        Đánh giá ({averageRating}/5)
                    </h3>
                    {totalCount > 3 && (
                        <Link
                            href={`/truyen/${novelSlug}/danh-gia`}
                            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                        >
                            Xem tất cả {totalCount} đánh giá
                            <ChevronRight className="w-3 h-3" />
                        </Link>
                    )}
                </div>

                <div className="divide-y divide-white/5">
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
                        className="mt-4 w-full py-2.5 flex items-center justify-center gap-2 bg-[#0B0C10] text-amber-400 font-medium text-sm rounded-lg hover:bg-[#0B0C10]/80 transition-colors border border-amber-500/20"
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

