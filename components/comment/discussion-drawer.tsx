"use client"

import { useState, useEffect, useTransition } from "react"
import { useForm } from "react-hook-form"
import { addComment, getComments, getCommentReplies } from "@/actions/interaction"
import { ArrowLeft, Loader2, MessageSquare, Send, User } from "lucide-react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Sheet, READING_THEMES, ReadingTheme } from "@/components/ui/sheet"
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
    paragraphId?: number | null
    parent?: {
        id: number
        content: string
        user: {
            id: string
            name: string | null
            nickname: string | null
            username: string | null
        }
    } | null
    children?: Comment[]
    score: number
    userVote: "UPVOTE" | "DOWNVOTE" | null
    replyCount?: number
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
    themeId?: string // Theme ID for syncing with reader theme
    paragraphId?: number | null // For paragraph-specific comments
    onCommentAdded?: () => void // Callback when comment is added
}

export function DiscussionDrawer({
    isOpen,
    onClose,
    novelId,
    chapterId,
    themeId = "night",
    paragraphId = null,
    onCommentAdded,
}: DiscussionDrawerProps) {
    const [flatComments, setFlatComments] = useState<Comment[]>([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const { data: session } = useSession()
    const router = useRouter()

    // Sub-thread drill-down state
    const [subThreadRoot, setSubThreadRoot] = useState<Comment | null>(null)
    const [subThreadComments, setSubThreadComments] = useState<Comment[]>([])
    const [subThreadLoading, setSubThreadLoading] = useState(false)

    // Get theme
    const theme: ReadingTheme = READING_THEMES[themeId] || READING_THEMES["night"]

    const fetchComments = async (pageNum: number, reset = false) => {
        setLoading(true)
        const res = await getComments(novelId, chapterId, pageNum, paragraphId)
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

    // Fetch comments when drawer opens or paragraphId changes
    useEffect(() => {
        if (isOpen) {
            fetchComments(1, true)
            setPage(1)
        }
    }, [isOpen, novelId, chapterId, paragraphId])

    const handleLoadMore = () => {
        const nextPage = page + 1
        setPage(nextPage)
        fetchComments(nextPage)
    }

    const handleCommentAdded = () => {
        fetchComments(1, true)
        setPage(1)
        // Notify parent to refresh comment counts
        if (onCommentAdded) {
            onCommentAdded()
        }
        // Also refresh sub-thread if active
        if (subThreadRoot) {
            handleDrillDown(subThreadRoot)
        }
    }

    // Handle drill-down into a comment's sub-thread
    const handleDrillDown = async (comment: Comment) => {
        setSubThreadRoot(comment)
        setSubThreadLoading(true)
        const res = await getCommentReplies(comment.id)
        setSubThreadComments(res.comments as any)
        setSubThreadLoading(false)
    }

    // Handle back navigation from sub-thread
    const handleBackFromSubThread = () => {
        setSubThreadRoot(null)
        setSubThreadComments([])
    }

    const commentTree = buildCommentTree(flatComments)

    // Generate title based on context
    const getTitle = () => {
        if (subThreadRoot) {
            const userName = subThreadRoot.user.nickname || subThreadRoot.user.name || "Người dùng"
            return `Trả lời ${userName}`
        }
        if (paragraphId !== null) {
            return `Thảo luận đoạn ${paragraphId + 1} (${total})`
        }
        return `Thảo luận (${total})`
    }

    return (
        <Sheet
            isOpen={isOpen}
            onClose={onClose}
            title={getTitle()}
            themeId={themeId}
        >
            <div className="flex flex-col h-full">
                {/* Back button for sub-thread view */}
                {subThreadRoot && (
                    <button
                        onClick={handleBackFromSubThread}
                        className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b transition-colors"
                        style={{
                            borderColor: theme.ui.border,
                            color: theme.ui.text,
                        }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại
                    </button>
                )}

                {/* Scrollable Comment List */}
                <div
                    className="flex-1 overflow-y-auto px-4 py-4 space-y-6"
                    style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: `${theme.ui.border} transparent`,
                    }}
                >
                    {subThreadRoot ? (
                        // Sub-thread view: show parent comment + its direct replies
                        <>
                            {/* Parent comment (context) */}
                            <div
                                className="pb-4 border-b mb-4"
                                style={{ borderColor: theme.ui.border }}
                            >
                                <CommentItem
                                    key={subThreadRoot.id}
                                    comment={{ ...subThreadRoot, children: [], replyCount: 0 }}
                                    novelId={novelId}
                                    chapterId={chapterId}
                                    onReplySuccess={handleCommentAdded}
                                    theme={theme}
                                />
                            </div>

                            {/* Sub-thread replies */}
                            {subThreadLoading ? (
                                <div className="flex justify-center py-4">
                                    <Loader2
                                        className="h-6 w-6 animate-spin"
                                        style={{ color: theme.ui.text }}
                                    />
                                </div>
                            ) : subThreadComments.length === 0 ? (
                                <div
                                    className="flex flex-col items-center justify-center py-8"
                                    style={{ color: theme.ui.text }}
                                >
                                    <p className="text-sm opacity-70">Chưa có trả lời nào</p>
                                </div>
                            ) : (
                                subThreadComments.map((reply) => (
                                    <CommentItem
                                        key={reply.id}
                                        comment={reply}
                                        novelId={novelId}
                                        chapterId={chapterId}
                                        onReplySuccess={handleCommentAdded}
                                        theme={theme}
                                        onDrillDown={handleDrillDown}
                                        level={1}
                                    />
                                ))
                            )}
                        </>
                    ) : (
                        // Main comment list
                        commentTree.length === 0 && !loading ? (
                            <div
                                className="flex flex-col items-center justify-center py-12"
                                style={{ color: theme.ui.text }}
                            >
                                <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
                                <p className="text-sm">Chưa có bình luận nào</p>
                                <p className="text-xs mt-1 opacity-70">Hãy là người đầu tiên bình luận!</p>
                            </div>
                        ) : (
                            commentTree.map((comment) => (
                                <CommentItem
                                    key={comment.id}
                                    comment={comment}
                                    novelId={novelId}
                                    chapterId={chapterId}
                                    onReplySuccess={handleCommentAdded}
                                    theme={theme}
                                    onDrillDown={handleDrillDown}
                                />
                            ))
                        )
                    )}

                    {loading && (
                        <div className="flex justify-center py-4">
                            <Loader2
                                className="h-6 w-6 animate-spin"
                                style={{ color: theme.ui.text }}
                            />
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
                <div
                    className="border-t p-4"
                    style={{
                        borderColor: theme.ui.border,
                        backgroundColor: theme.ui.background,
                    }}
                >
                    {session ? (
                        <CommentFormDrawer
                            novelId={novelId}
                            chapterId={chapterId}
                            paragraphId={paragraphId}
                            onSuccess={handleCommentAdded}
                            theme={theme}
                        />
                    ) : (
                        <div className="text-center py-2">
                            <p className="text-sm mb-2" style={{ color: theme.ui.text }}>
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
    paragraphId,
    onSuccess,
    theme,
}: {
    novelId: number
    chapterId?: number
    paragraphId?: number | null
    onSuccess: () => void
    theme: ReadingTheme
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

    // Determine if this is a dark theme
    const isDark = ["dark", "night", "onyx", "dusk"].includes(theme.id)

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
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.ui.hover }}
                    >
                        <User className="w-5 h-5" style={{ color: theme.ui.text }} />
                    </div>
                )}
            </div>
            <div className="flex-1 flex items-center gap-2">
                <input
                    {...register("content", { required: true })}
                    placeholder="Viết bình luận..."
                    className="flex-1 px-4 py-2.5 text-sm rounded-full focus:outline-none transition-colors"
                    style={{
                        backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                        borderColor: theme.ui.border,
                        borderWidth: 1,
                        borderStyle: "solid",
                        color: theme.foreground,
                    }}
                    disabled={isPending}
                />
                <button
                    type="submit"
                    disabled={isPending}
                    className="p-2.5 text-amber-500 hover:text-amber-400 disabled:opacity-50 transition-colors shrink-0"
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
