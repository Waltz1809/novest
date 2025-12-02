"use client"

import { useState, useEffect, useTransition, useMemo } from "react"
import { useForm } from "react-hook-form"
import { addComment, getComments } from "@/actions/interaction"
import { Loader2, MessageSquare, Reply, Send, User } from "lucide-react"
import Image from "next/image"
import { clsx } from "clsx"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface CommentUser {
    id: string
    name: string | null
    nickname: string | null
    image: string | null
}

interface Comment {
    id: number
    content: string
    createdAt: Date
    user: CommentUser
    parentId: number | null
    children?: Comment[]
}

interface CommentSectionProps {
    novelId: number
    chapterId?: number
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

export function CommentSection({ novelId, chapterId }: CommentSectionProps) {
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

function CommentItem({
    comment,
    novelId,
    chapterId,
    onReplySuccess,
    level = 0,
}: {
    comment: Comment
    novelId: number
    chapterId?: number
    onReplySuccess: () => void
    level?: number
}) {
    const [isReplying, setIsReplying] = useState(false)
    const { data: session } = useSession()

    return (
        <div className="flex gap-4">
            <div className="shrink-0">
                {comment.user.image ? (
                    <Image
                        src={comment.user.image}
                        alt={comment.user.name || "User"}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                    />
                ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B0C10] border border-gray-800">
                        <User className="h-6 w-6 text-gray-500" />
                    </div>
                )}
            </div>
            <div className="flex-1 space-y-2">
                <div className="rounded-lg bg-[#0B0C10] p-4 border border-gray-800">
                    <div className="mb-1 flex items-center justify-between">
                        <span className="font-semibold text-gray-200">{comment.user.nickname || comment.user.name || "Người dùng ẩn danh"}</span>
                        <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                    </div>
                    <p className="text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                </div>

                <div className="flex items-center gap-4 pl-2">
                    {session && (
                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#F59E0B]"
                        >
                            <Reply className="h-3 w-3" />
                            Trả lời
                        </button>
                    )}
                </div>

                {isReplying && (
                    <div className="mt-2 pl-4 border-l-2 border-border">
                        <CommentForm
                            novelId={novelId}
                            chapterId={chapterId}
                            parentId={comment.id}
                            onSuccess={() => {
                                setIsReplying(false)
                                onReplySuccess()
                            }}
                            autoFocus
                        />
                    </div>
                )}

                {comment.children && comment.children.length > 0 && (
                    <div className="mt-4 space-y-4 pl-4 border-l-2 border-border">
                        {comment.children.map((child) => (
                            <CommentItem
                                key={child.id}
                                comment={child}
                                novelId={novelId}
                                chapterId={chapterId}
                                onReplySuccess={onReplySuccess}
                                level={level + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function CommentForm({
    novelId,
    chapterId,
    parentId,
    onSuccess,
    autoFocus = false,
}: {
    novelId: number
    chapterId?: number
    parentId?: number
    onSuccess: () => void
    autoFocus?: boolean
}) {
    const { register, handleSubmit, reset } = useForm<{ content: string }>()
    const [isPending, startTransition] = useTransition()

    const onSubmit = (data: { content: string }) => {
        startTransition(async () => {
            const res = await addComment({
                content: data.content,
                novelId,
                chapterId,
                parentId,
            })

            if (res.error) {
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
                className="w-full rounded-md border border-gray-700 bg-[#0B0C10] p-3 text-sm text-gray-200 focus:border-[#F59E0B] focus:outline-none placeholder:text-gray-600"
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
