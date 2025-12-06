"use client"

import { useState, useEffect, useTransition, useMemo } from "react"
import { useForm } from "react-hook-form"
import { addComment, getComments } from "@/actions/interaction"
import { Loader2, MessageCircle, MessageSquare, Reply, Send, User } from "lucide-react"
import Image from "next/image"
import { clsx } from "clsx"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

import { voteComment } from "@/actions/comment"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import Link from "next/link"
import { ReadingTheme, READING_THEMES } from "@/lib/reading-themes"

interface CommentUser {
    id: string
    name: string | null
    nickname: string | null
    username: string | null
    image: string | null
}

interface Comment {
    id: number
    content: string
    createdAt: Date
    user: CommentUser
    parentId: number | null
    paragraphId?: number | null // For paragraph-based comments
    parent?: {
        id: number
        content: string
        user: {
            id: string
            name: string | null
            nickname: string | null
            username: string | null
        }
    } | null // Parent comment for reply context
    children?: Comment[]
    score: number
    userVote: "UPVOTE" | "DOWNVOTE" | null
    replyCount?: number // Count of direct children for drill-down
}

interface CommentSectionProps {
    novelId: number
    chapterId?: number
    themeId?: string
}

// Utility to build tree from flat list
function buildCommentTree(flatComments: Comment[]): Comment[] {
    const commentMap = new Map<number, Comment>()
    const roots: Comment[] = []

    // First pass: create map and initialize children array
    flatComments.forEach((c) => {
        commentMap.set(c.id, { ...c, children: [] })
    })

    // Second pass: link children to parents
    flatComments.forEach((c) => {
        const comment = commentMap.get(c.id)!
        if (c.parentId && commentMap.has(c.parentId)) {
            commentMap.get(c.parentId)!.children!.push(comment)
        } else {
            roots.push(comment)
        }
    })

    return roots
}

export function CommentSection({ novelId, chapterId, themeId }: CommentSectionProps) {
    const [flatComments, setFlatComments] = useState<Comment[]>([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const { data: session } = useSession()
    const router = useRouter()

    const fetchComments = async (pageNum: number, reset = false) => {
        setLoading(true)
        const res = await getComments(novelId, chapterId, pageNum)
        if (reset) {
            setFlatComments(res.comments as any)
        } else {
            // Merge and deduplicate based on ID
            setFlatComments((prev) => {
                const newComments = res.comments as any
                const existingIds = new Set(prev.map((c) => c.id))
                const uniqueNewComments = newComments.filter((c: Comment) => !existingIds.has(c.id))
                return [...prev, ...uniqueNewComments]
            })
        }
        setHasMore(res.hasMore)
        setTotal(res.total)
        setLoading(false)
    }

    useEffect(() => {
        fetchComments(1, true)
    }, [novelId, chapterId])

    const handleLoadMore = () => {
        const nextPage = page + 1
        setPage(nextPage)
        fetchComments(nextPage)
    }

    const handleCommentAdded = () => {
        // Ideally we should just fetch the new comment or optimistically add it.
        // For simplicity, re-fetch the first page to see the new comment (if it's recent).
        // Or fetch everything again.
        fetchComments(1, true)
        setPage(1)
    }

    const commentTree = useMemo(() => buildCommentTree(flatComments), [flatComments])

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-xl font-bold text-gray-200">
                <MessageSquare className="h-6 w-6 text-[#F59E0B]" />
                <h3>Bình luận ({total})</h3>
            </div>

            {session ? (
                <CommentForm
                    novelId={novelId}
                    chapterId={chapterId}
                    onSuccess={handleCommentAdded}
                />
            ) : (
                <div className="rounded-lg bg-[#0B0C10]/50 p-4 text-center border border-gray-800">
                    <p className="mb-2 text-gray-400">
                        Bạn cần đăng nhập để bình luận.
                    </p>
                    <button
                        onClick={() => router.push("/login")}
                        className="rounded-md bg-[#F59E0B] px-4 py-2 text-sm font-medium text-[#0B0C10] hover:bg-[#D97706]"
                    >
                        Đăng nhập ngay
                    </button>
                </div>
            )}

            <div className="space-y-6">
                {commentTree.map((comment) => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        novelId={novelId}
                        chapterId={chapterId}
                        onReplySuccess={handleCommentAdded}
                    />
                ))}
            </div>

            {loading && (
                <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            )}

            {!loading && hasMore && (
                <div className="flex justify-center">
                    <button
                        onClick={handleLoadMore}
                        className="text-sm font-medium text-[#F59E0B] hover:underline"
                    >
                        Xem thêm bình luận
                    </button>
                </div>
            )}
        </div>
    )
}

export function CommentItem({
    comment,
    novelId,
    chapterId,
    onReplySuccess,
    level = 0,
    theme,
    onDrillDown,
}: {
    comment: Comment
    novelId: number
    chapterId?: number
    onReplySuccess: () => void
    level?: number
    theme?: ReadingTheme
    onDrillDown?: (comment: Comment) => void
}) {
    const [isReplying, setIsReplying] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false) // For inline expansion
    const [fetchedChildren, setFetchedChildren] = useState<Comment[]>([])
    const [loadingChildren, setLoadingChildren] = useState(false)
    const { data: session } = useSession()
    const router = useRouter()

    const [score, setScore] = useState(comment.score || 0)
    const [userVote, setUserVote] = useState(comment.userVote)

    const handleVote = async (type: "UPVOTE" | "DOWNVOTE") => {
        if (!session) {
            router.push("/login")
            return
        }

        // Optimistic update
        const previousVote = userVote
        const previousScore = score

        if (userVote === type) {
            // Toggle off
            setUserVote(null)
            setScore(prev => type === "UPVOTE" ? prev - 1 : prev + 1)
        } else {
            // Change vote
            setUserVote(type)
            if (userVote) {
                // Switching vote (e.g. +1 to -1 = -2)
                setScore(prev => type === "UPVOTE" ? prev + 2 : prev - 2)
            } else {
                // New vote
                setScore(prev => type === "UPVOTE" ? prev + 1 : prev - 1)
            }
        }

        // Call server action
        const res = await voteComment(comment.id, type)
        if ('error' in res) {
            // Revert on error
            setUserVote(previousVote)
            setScore(previousScore)
        }
    }

    // Handle inline expansion (when no drawer available)
    const handleExpandChildren = async () => {
        if (isExpanded) {
            setIsExpanded(false)
            return
        }

        // If children are already in comment, use them
        if (comment.children && comment.children.length > 0) {
            setFetchedChildren(comment.children)
            setIsExpanded(true)
            return
        }

        // Otherwise fetch from server
        setLoadingChildren(true)
        try {
            const { getCommentReplies } = await import("@/actions/interaction")
            const res = await getCommentReplies(comment.id)
            setFetchedChildren(res.comments as Comment[])
            setIsExpanded(true)
        } catch (error) {
            console.error("Failed to fetch replies:", error)
        }
        setLoadingChildren(false)
    }

    // Default theme fallback
    const t = theme || READING_THEMES["night"]
    const isDark = theme ? ["dark", "night", "onyx", "dusk"].includes(theme.id) : true

    const replyCount = comment.replyCount || comment.children?.length || 0
    const hasReplies = replyCount > 0

    // Calculate indentation based on level (half avatar width = ~16px per level)
    const indentPx = level > 0 ? Math.min(level * 16, 48) : 0

    return (
        <div className="min-w-0" style={{ marginLeft: indentPx }}>
            <div className="flex gap-2 sm:gap-3">
                {/* Avatar */}
                <div className="shrink-0">
                    <Link href={`/u/${comment.user.username || comment.user.id}`}>
                        {comment.user.image ? (
                            <Image
                                src={comment.user.image}
                                alt={comment.user.name || "User"}
                                width={32}
                                height={32}
                                className="rounded-full object-cover hover:ring-2 hover:ring-amber-500 transition-all w-7 h-7 sm:w-8 sm:h-8"
                            />
                        ) : (
                            <div
                                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border hover:border-amber-500 transition-colors"
                                style={{
                                    backgroundColor: t.ui.hover,
                                    borderColor: t.ui.border,
                                }}
                            >
                                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: t.ui.text }} />
                            </div>
                        )}
                    </Link>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Header: Name + Date */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Link
                            href={`/u/${comment.user.username || comment.user.id}`}
                            className="font-semibold text-sm hover:text-amber-500 transition-colors"
                            style={{ color: t.foreground }}
                        >
                            {comment.user.nickname || comment.user.name || "Người dùng ẩn danh"}
                        </Link>
                        <span className="text-xs" style={{ color: t.ui.text, opacity: 0.6 }}>
                            {new Date(comment.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                        {/* Paragraph hashtag */}
                        {comment.paragraphId !== null && comment.paragraphId !== undefined && (
                            <span
                                className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                style={{
                                    backgroundColor: "rgba(245,158,11,0.15)",
                                    color: "#f59e0b",
                                }}
                            >
                                #{comment.paragraphId + 1}
                            </span>
                        )}
                    </div>

                    {/* Reply context tag */}
                    {comment.parent && (
                        <div
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md"
                            style={{
                                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                            }}
                        >
                            <span style={{ color: "#f59e0b" }} className="font-medium">
                                @{comment.parent.user.nickname || comment.parent.user.name || "User"}
                            </span>
                            <span style={{ color: t.ui.text, opacity: 0.5 }}>·</span>
                            <span className="truncate max-w-[150px] sm:max-w-[200px]" style={{ color: t.ui.text, opacity: 0.7 }}>
                                {comment.parent.content.length > 30
                                    ? comment.parent.content.slice(0, 30) + "..."
                                    : comment.parent.content}
                            </span>
                        </div>
                    )}

                    {/* Comment content */}
                    <p className="text-sm whitespace-pre-wrap break-words" style={{ color: t.foreground, opacity: 0.9 }}>
                        {comment.content}
                    </p>

                    {/* Actions: Vote + Reply */}
                    <div className="flex items-center gap-3 pt-1">
                        <div
                            className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5"
                            style={{
                                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                            }}
                        >
                            <button
                                onClick={() => handleVote("UPVOTE")}
                                className={clsx(
                                    "p-1 rounded transition-colors",
                                    userVote === "UPVOTE" ? "text-amber-500" : ""
                                )}
                                style={{ color: userVote === "UPVOTE" ? undefined : t.ui.text }}
                            >
                                <ThumbsUp className={clsx("w-3 h-3", userVote === "UPVOTE" && "fill-current")} />
                            </button>
                            <span className={clsx(
                                "text-xs font-medium min-w-[1ch] text-center",
                                userVote === "UPVOTE" ? "text-amber-500" :
                                    userVote === "DOWNVOTE" ? "text-red-500" : ""
                            )} style={{ color: !userVote ? t.ui.text : undefined }}>
                                {score}
                            </span>
                            <button
                                onClick={() => handleVote("DOWNVOTE")}
                                className={clsx(
                                    "p-1 rounded transition-colors",
                                    userVote === "DOWNVOTE" ? "text-red-500" : ""
                                )}
                                style={{ color: userVote === "DOWNVOTE" ? undefined : t.ui.text }}
                            >
                                <ThumbsDown className={clsx("w-3 h-3", userVote === "DOWNVOTE" && "fill-current")} />
                            </button>
                        </div>

                        {session && (
                            <button
                                onClick={() => setIsReplying(!isReplying)}
                                className="flex items-center gap-1 text-xs font-medium hover:text-amber-500 transition-colors"
                                style={{ color: t.ui.text }}
                            >
                                <Reply className="h-3 w-3" />
                                Trả lời
                            </button>
                        )}
                    </div>

                    {/* Reply form */}
                    {isReplying && (
                        <div className="mt-2">
                            <CommentForm
                                novelId={novelId}
                                chapterId={chapterId}
                                parentId={comment.id}
                                paragraphId={comment.paragraphId}
                                onSuccess={() => {
                                    setIsReplying(false)
                                    onReplySuccess()
                                }}
                                autoFocus
                                theme={theme}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Children comments - indented, no border line */}
            {level < 1 ? (
                comment.children && comment.children.length > 0 && (
                    <div className="mt-3 space-y-3">
                        {comment.children.map((child) => (
                            <CommentItem
                                key={child.id}
                                comment={child}
                                novelId={novelId}
                                chapterId={chapterId}
                                onReplySuccess={onReplySuccess}
                                level={level + 1}
                                theme={theme}
                                onDrillDown={onDrillDown}
                            />
                        ))}
                    </div>
                )
            ) : (
                // At depth 1+, use drawer if available, otherwise expand inline
                hasReplies && (
                    <div className="mt-2 ml-9 sm:ml-11">
                        <button
                            onClick={() => {
                                if (onDrillDown) {
                                    onDrillDown(comment)
                                } else {
                                    handleExpandChildren()
                                }
                            }}
                            disabled={loadingChildren}
                            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
                            style={{
                                backgroundColor: isDark ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.1)",
                                color: "#f59e0b",
                            }}
                        >
                            {loadingChildren ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <MessageCircle className="w-3 h-3" />
                            )}
                            {isExpanded ? "Ẩn trả lời" : `Xem ${replyCount} trả lời`}
                        </button>

                        {/* Inline expanded children */}
                        {isExpanded && !onDrillDown && fetchedChildren.length > 0 && (
                            <div className="mt-3 space-y-3">
                                {fetchedChildren.map((child) => (
                                    <CommentItem
                                        key={child.id}
                                        comment={child}
                                        novelId={novelId}
                                        chapterId={chapterId}
                                        onReplySuccess={onReplySuccess}
                                        level={level + 1}
                                        theme={theme}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )
            )}
        </div>
    )
}

function CommentForm({
    novelId,
    chapterId,
    parentId,
    paragraphId,
    onSuccess,
    autoFocus = false,
    theme,
}: {
    novelId: number
    chapterId?: number
    parentId?: number
    paragraphId?: number | null
    onSuccess: () => void
    autoFocus?: boolean
    theme?: ReadingTheme
}) {
    const { register, handleSubmit, reset } = useForm<{ content: string }>()
    const [isPending, startTransition] = useTransition()

    // Default theme fallback
    const t = theme || READING_THEMES["night"]
    const isDark = theme ? ["dark", "night", "onyx", "dusk"].includes(theme.id) : true

    const onSubmit = (data: { content: string }) => {
        startTransition(async () => {
            const res = await addComment({
                content: data.content,
                novelId,
                chapterId,
                parentId,
                paragraphId: paragraphId ?? undefined,
            })

            if ('error' in res) {
                alert(res.error)
            } else {
                reset()
                onSuccess()
            }
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
            <textarea
                {...register("content", { required: true })}
                placeholder={parentId ? "Viết câu trả lời..." : "Viết bình luận của bạn..."}
                className="w-full rounded-md p-3 text-sm focus:outline-none transition-colors"
                style={{
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: t.ui.border,
                    color: t.foreground,
                }}
                rows={3}
                autoFocus={autoFocus}
            />
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 rounded-md bg-[#F59E0B] px-4 py-2 text-sm font-medium text-[#0B0C10] hover:bg-[#D97706] disabled:opacity-50"
                >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {parentId ? "Trả lời" : "Gửi bình luận"}
                </button>
            </div>
        </form>
    )
}
