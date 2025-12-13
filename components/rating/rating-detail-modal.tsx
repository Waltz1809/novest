"use client"

import { useState, useEffect, useTransition } from "react"
import { X, Star, Send, Loader2, MessageSquare, Trash2 } from "lucide-react"
import { getRatingWithComments, addRatingComment, deleteRatingComment } from "@/actions/rating-reply"
import Image from "next/image"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { clsx } from "clsx"

interface RatingDetailModalProps {
    isOpen: boolean
    onClose: () => void
    ratingUserId: string
    novelId: number
}

interface RatingCommentData {
    id: number
    content: string
    createdAt: Date
    user: {
        id: string
        name: string | null
        nickname: string | null
        username: string | null
        image: string | null
    }
}

interface RatingData {
    userId: string
    novelId: number
    score: number
    content: string | null
    createdAt: Date
    user: {
        id: string
        name: string | null
        nickname: string | null
        username: string | null
        image: string | null
    }
    novel: {
        id: number
        title: string
        slug: string
        uploaderId: string
        uploader: {
            id: string
            name: string | null
            nickname: string | null
            image: string | null
        }
    }
    ratingComments: RatingCommentData[]
}

export function RatingDetailModal({ isOpen, onClose, ratingUserId, novelId }: RatingDetailModalProps) {
    const [rating, setRating] = useState<RatingData | null>(null)
    const [loading, setLoading] = useState(true)
    const [replyContent, setReplyContent] = useState("")
    const [isPending, startTransition] = useTransition()
    const { data: session } = useSession()

    const isUploader = session?.user?.id === rating?.novel.uploaderId

    useEffect(() => {
        if (isOpen) {
            setLoading(true)
            getRatingWithComments(ratingUserId, novelId).then((res) => {
                if ('rating' in res && res.rating) {
                    setRating(res.rating as RatingData)
                }
                setLoading(false)
            })
        }
    }, [isOpen, ratingUserId, novelId])

    const handleSubmitReply = () => {
        if (!replyContent.trim()) return

        startTransition(async () => {
            const res = await addRatingComment(ratingUserId, novelId, replyContent)
            if ('error' in res) {
                alert(res.error)
            } else if (res.comment) {
                setRating(prev => prev ? {
                    ...prev,
                    ratingComments: [...prev.ratingComments, res.comment as RatingCommentData]
                } : null)
                setReplyContent("")
            }
        })
    }

    const handleDeleteComment = (commentId: number) => {
        if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return

        startTransition(async () => {
            const res = await deleteRatingComment(commentId)
            if ('error' in res) {
                alert(res.error)
            } else {
                setRating(prev => prev ? {
                    ...prev,
                    ratingComments: prev.ratingComments.filter((c: RatingCommentData) => c.id !== commentId)
                } : null)
            }
        })
    }

    if (!isOpen) return null

    const displayName = rating?.user.nickname || rating?.user.name || "Ẩn danh"

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden border border-gray-200 flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex items-center justify-between z-10">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        Chi tiết đánh giá
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : rating ? (
                        <>
                            {/* Rating Header */}
                            <div className="flex items-start gap-3">
                                <Link href={`/u/${rating.user.username || rating.user.id}`}>
                                    {rating.user.image ? (
                                        <Image
                                            src={rating.user.image}
                                            alt={displayName}
                                            width={48}
                                            height={48}
                                            className="rounded-full object-cover w-12 h-12"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg text-muted-foreground">
                                            {displayName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </Link>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Link
                                            href={`/u/${rating.user.username || rating.user.id}`}
                                            className="font-semibold text-foreground hover:text-primary transition-colors"
                                        >
                                            {displayName}
                                        </Link>
                                        <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={clsx(
                                                        "w-4 h-4",
                                                        star <= rating.score
                                                            ? "fill-amber-500 text-amber-500"
                                                            : "text-gray-300"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(rating.createdAt).toLocaleDateString("vi-VN", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric"
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Rating Content */}
                            {rating.content && (
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <p className="text-foreground whitespace-pre-wrap">{rating.content}</p>
                                </div>
                            )}

                            {/* Discussion Section */}
                            {rating.ratingComments.length > 0 && (
                                <div className="space-y-3 pt-4 border-t border-gray-200">
                                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" />
                                        Thảo luận ({rating.ratingComments.length})
                                    </h3>
                                    {rating.ratingComments.map((comment: RatingCommentData) => {
                                        const isCommentAuthorUploader = comment.user.id === rating.novel.uploaderId
                                        const commentDisplayName = comment.user.nickname || comment.user.name || "Ẩn danh"
                                        return (
                                            <div
                                                key={comment.id}
                                                className={clsx(
                                                    "rounded-xl p-4",
                                                    isCommentAuthorUploader
                                                        ? "bg-amber-50 border border-amber-200"
                                                        : "bg-gray-50 border border-gray-200"
                                                )}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {comment.user.image ? (
                                                        <Image
                                                            src={comment.user.image}
                                                            alt={commentDisplayName}
                                                            width={32}
                                                            height={32}
                                                            className="rounded-full object-cover w-8 h-8"
                                                        />
                                                    ) : (
                                                        <div className={clsx(
                                                            "w-8 h-8 rounded-full flex items-center justify-center text-xs",
                                                            isCommentAuthorUploader
                                                                ? "bg-amber-200 text-amber-700"
                                                                : "bg-gray-200 text-muted-foreground"
                                                        )}>
                                                            {commentDisplayName.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <Link
                                                                href={`/u/${comment.user.username || comment.user.id}`}
                                                                className={clsx(
                                                                    "text-sm font-medium hover:underline",
                                                                    isCommentAuthorUploader ? "text-amber-600" : "text-foreground"
                                                                )}
                                                            >
                                                                {commentDisplayName}
                                                            </Link>
                                                            {isCommentAuthorUploader && (
                                                                <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">
                                                                    Nhóm dịch
                                                                </span>
                                                            )}
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(comment.createdAt).toLocaleDateString("vi-VN")}
                                                            </span>
                                                            {session?.user?.id === comment.user.id && (
                                                                <button
                                                                    onClick={() => handleDeleteComment(comment.id)}
                                                                    className="ml-auto p-1 text-muted-foreground hover:text-red-500 transition-colors"
                                                                    disabled={isPending}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            Không tìm thấy đánh giá.
                        </div>
                    )}
                </div>

                {/* Reply Form - For all logged-in users */}
                {session?.user && rating && (
                    <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Nhập bình luận của bạn..."
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                                disabled={isPending}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSubmitReply()
                                    }
                                }}
                            />
                            <button
                                onClick={handleSubmitReply}
                                disabled={isPending || !replyContent.trim()}
                                className="px-4 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isPending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
