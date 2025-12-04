"use client"

import { useState, useEffect, useTransition } from "react"
import { useForm } from "react-hook-form"
import { addComment, getComments } from "@/actions/interaction"
import { Loader2, MessageSquare, Send, User } from "lucide-react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Sheet } from "@/components/ui/sheet"
import { CommentItem } from "./comment-section"

interface Comment {
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
    parentId: number | null
    children?: Comment[]
    score: number
    userVote: "UPVOTE" | "DOWNVOTE" | null
}

// Build tree from flat list
function buildCommentTree(flatComments: Comment[]): Comment[] {
    const commentMap = new Map<number, Comment>()
    const roots: Comment[] = []

    flatComments.forEach((c) => {
        commentMap.set(c.id, { ...c, children: [] })
    })

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

interface DiscussionDrawerProps {
    isOpen: boolean
    onClose: () => void
    novelId: number
    chapterId?: number
}

export function DiscussionDrawer({
    isOpen,
    onClose,
    novelId,
    chapterId,
}: DiscussionDrawerProps) {
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

    // Fetch comments when drawer opens
    useEffect(() => {
        if (isOpen) {
            fetchComments(1, true)
            setPage(1)
        }
    }, [isOpen, novelId, chapterId])

    const handleLoadMore = () => {
        const nextPage = page + 1
        setPage(nextPage)
        fetchComments(nextPage)
    }

    const handleCommentAdded = () => {
        fetchComments(1, true)
        setPage(1)
    }

    const commentTree = buildCommentTree(flatComments)

    return (
        <Sheet
            isOpen={isOpen}
            onClose={onClose}
            title={`Thảo luận (${total})`}
        >
            <div className="flex flex-col h-full">
                {/* Scrollable Comment List */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                    {commentTree.length === 0 && !loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
                            <p className="text-sm">Chưa có bình luận nào</p>
                            <p className="text-xs mt-1">Hãy là người đầu tiên bình luận!</p>
                        </div>
                    ) : (
                        commentTree.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                novelId={novelId}
                                chapterId={chapterId}
                                onReplySuccess={handleCommentAdded}
                            />
                        ))
                    )}

                    {loading && (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                        </div>
                    )}

                    {!loading && hasMore && (
                        <div className="flex justify-center pb-4">
                            <button
                                onClick={handleLoadMore}
                                className="text-sm font-medium text-amber-500 hover:underline"
                            >
                                Xem thêm bình luận
                            </button>
                        </div>
                    )}
                </div>

                {/* Fixed Comment Input Footer */}
                <div className="border-t border-white/10 p-4 bg-[#0B0C10]">
                    {session ? (
                        <CommentFormDrawer
                            novelId={novelId}
                            chapterId={chapterId}
                            onSuccess={handleCommentAdded}
                        />
                    ) : (
                        <div className="text-center py-2">
                            <p className="text-sm text-gray-400 mb-2">
                                Đăng nhập để bình luận
                            </p>
                            <button
                                onClick={() => router.push("/login")}
                                className="px-4 py-2 text-sm font-medium bg-amber-500 text-black rounded-lg hover:bg-amber-600 transition-colors"
                            >
                                Đăng nhập
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Sheet>
    )
}

// Compact comment form for drawer footer
function CommentFormDrawer({
    novelId,
    chapterId,
    onSuccess,
}: {
    novelId: number
    chapterId?: number
    onSuccess: () => void
}) {
    const { register, handleSubmit, reset } = useForm<{ content: string }>()
    const [isPending, startTransition] = useTransition()
    const { data: session } = useSession()

    const onSubmit = (data: { content: string }) => {
        if (!data.content.trim()) return
        startTransition(async () => {
            const res = await addComment({
                content: data.content,
                novelId,
                chapterId,
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
        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-3 items-center">
            <div className="shrink-0">
                {session?.user?.image ? (
                    <Image
                        src={session.user.image}
                        alt="You"
                        width={36}
                        height={36}
                        className="rounded-full object-cover"
                    />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                    </div>
                )}
            </div>
            <div className="flex-1 relative">
                <input
                    {...register("content", { required: true })}
                    placeholder="Viết bình luận..."
                    className="w-full px-4 py-2.5 pr-12 text-sm bg-white/5 border border-white/10 rounded-full text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                    disabled={isPending}
                />
                <button
                    type="submit"
                    disabled={isPending}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-amber-500 hover:text-amber-400 disabled:opacity-50 transition-colors"
                >
                    {isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </button>
            </div>
        </form>
    )
}
