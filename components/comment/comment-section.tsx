"use client"

import { useState, useEffect, useTransition, useMemo, useRef } from "react"
import { commentService, CommentItem as CommentItemType } from "@/services"
import { Loader2, MessageCircle, MessageSquare, Reply, Send, User, Pencil, Trash2, Pin, X, Check, ChevronDown } from "lucide-react"
import Image from "next/image"
import { clsx } from "clsx"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

import { ThumbsUp, ThumbsDown } from "lucide-react"
import Link from "next/link"
import { ReadingTheme, READING_THEMES } from "@/lib/reading-themes"
import CommentEditor, { CommentEditorRef } from "@/components/editor/comment-editor"

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
    updatedAt?: Date
    user: CommentUser
    parentId: number | null
    paragraphId?: number | null // For paragraph-based comments
    isPinned?: boolean
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
    uploaderId?: string // Novel uploader ID for pin permission
}

// Utility to build FLAT comment structure (max 1 level of nesting)
// All replies go directly under root comment, no deep nesting
// Thread context is shown via reply context tag (@user · parent_content)
function buildCommentTree(flatComments: Comment[]): Comment[] {
    const commentMap = new Map<number, Comment>()
    const roots: Comment[] = []

    // First pass: create map and initialize children array
    flatComments.forEach((c) => {
        commentMap.set(c.id, { ...c, children: [] })
    })

    // Find root ancestor for each comment
    const findRootId = (comment: Comment): number | null => {
        if (!comment.parentId) return null // Already a root

        let current = comment
        while (current.parentId && commentMap.has(current.parentId)) {
            current = commentMap.get(current.parentId)!
        }
        // current is now the root, return its id if current is different from original
        return current.id !== comment.id ? current.id : null
    }

    // Second pass: link ALL replies directly to their root (flat structure)
    flatComments.forEach((c) => {
        const comment = commentMap.get(c.id)!
        if (!c.parentId) {
            // Root comment
            roots.push(comment)
        } else {
            // Find the root ancestor and attach there
            const rootId = findRootId(c)
            if (rootId && commentMap.has(rootId)) {
                commentMap.get(rootId)!.children!.push(comment)
            } else if (commentMap.has(c.parentId)) {
                // Direct parent is root
                commentMap.get(c.parentId)!.children!.push(comment)
            } else {
                // Orphan - treat as root
                roots.push(comment)
            }
        }
    })

    // Sort children (replies) by createdAt ASC (oldest first, like Facebook)
    // Root comments are already sorted DESC from server
    roots.forEach(root => {
        if (root.children && root.children.length > 0) {
            root.children.sort((a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )
        }
    })

    return roots
}

export function CommentSection({ novelId, chapterId, themeId, uploaderId }: CommentSectionProps) {
    const [flatComments, setFlatComments] = useState<Comment[]>([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    // Track expanded comment IDs to preserve state after updates
    const [expandedCommentIds, setExpandedCommentIds] = useState<Set<number>>(new Set())
    // Form key to force remount and reset form
    const [formKey, setFormKey] = useState(0)
    // Cooldown timer state (lifted from CommentForm to persist through remount)
    const [cooldown, setCooldown] = useState(0)
    // Sorting state
    const [sortBy, setSortBy] = useState<'newest' | 'votes' | 'replies'>('newest')
    const [showSortDropdown, setShowSortDropdown] = useState(false)
    const { data: session } = useSession()
    const router = useRouter()

    // Countdown effect
    useEffect(() => {
        if (cooldown <= 0) return
        const timer = setTimeout(() => setCooldown(prev => prev - 1), 1000)
        return () => clearTimeout(timer)
    }, [cooldown])

    const fetchComments = async (pageNum: number, sort: 'newest' | 'votes' | 'replies' = sortBy) => {
        setLoading(true)
        try {
            const res = await commentService.getAll({
                novelId,
                chapterId,
                page: pageNum,
                sort,
            })
            if (res.success && res.data) {
                setFlatComments(res.data.items as any)
                setHasMore(res.data.hasMore)
                setTotal(res.data.total)
            }
        } catch (error) {
            console.error("Failed to fetch comments:", error)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchComments(1, sortBy)
    }, [novelId, chapterId, sortBy])

    const handleLoadMore = () => {
        const nextPage = page + 1
        setPage(nextPage)
        fetchComments(nextPage)
    }

    const handleLoadPrevious = () => {
        if (page > 1) {
            const prevPage = page - 1
            setPage(prevPage)
            fetchComments(prevPage)
        }
    }

    // Handle new top-level comment - refetch to show at top
    const handleCommentAdded = (newComment?: Comment) => {
        // Ignore the newComment param, just refetch for top-level comments
        setPage(1)
        fetchComments(1)
        // Force form remount to reset
        setFormKey(prev => prev + 1)
        // Start 30s cooldown
        setCooldown(10)
    }

    // Handle reply added - simple refetch approach (like DiscussionDrawer)
    const handleReplyAdded = (newComment: Comment, parentId: number) => {
        // Just refetch current page - simple and reliable
        fetchComments(page)
        setTotal(prev => prev + 1)
    }

    // Toggle expanded state
    const toggleExpanded = (commentId: number) => {
        setExpandedCommentIds(prev => {
            const newSet = new Set(prev)
            if (newSet.has(commentId)) {
                newSet.delete(commentId)
            } else {
                newSet.add(commentId)
            }
            return newSet
        })
    }

    const commentTree = useMemo(() => buildCommentTree(flatComments), [flatComments])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg md:text-xl font-bold text-foreground">
                    <MessageSquare className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    <span className="text-muted-foreground">({total})</span>
                </div>

                {/* Sorting Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-sm text-muted-foreground hover:bg-gray-200 transition-colors"
                    >
                        <span>{
                            sortBy === 'newest' ? 'Mới nhất' :
                                sortBy === 'votes' ? 'Votes cao' : 'Nhiều phản hồi'
                        }</span>
                        <ChevronDown className={clsx("w-4 h-4 transition-transform", showSortDropdown && "rotate-180")} />
                    </button>

                    {showSortDropdown && (
                        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[140px]">
                            {[
                                { value: 'newest', label: 'Mới nhất' },
                                { value: 'votes', label: 'Votes cao' },
                                { value: 'replies', label: 'Nhiều phản hồi' },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        setSortBy(option.value as any)
                                        setPage(1)
                                        setShowSortDropdown(false)
                                    }}
                                    className={clsx(
                                        "w-full px-4 py-2 text-left text-sm transition-colors",
                                        sortBy === option.value
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-gray-50"
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {session ? (
                <CommentForm
                    key={formKey}
                    novelId={novelId}
                    chapterId={chapterId}
                    onSuccess={handleCommentAdded}
                    cooldown={cooldown}
                />
            ) : (
                <div className="rounded-lg bg-gray-50 p-4 text-center border border-gray-200">
                    <p className="mb-2 text-muted-foreground">
                        Bạn cần đăng nhập để bình luận.
                    </p>
                    <button
                        onClick={() => router.push("/login")}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                    >
                        Đăng nhập ngay
                    </button>
                </div>
            )}

            <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-4 md:p-6">
                {commentTree.map((comment) => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        novelId={novelId}
                        chapterId={chapterId}
                        onReplySuccess={handleReplyAdded}
                        expandedCommentIds={expandedCommentIds}
                        toggleExpanded={toggleExpanded}
                        uploaderId={uploaderId}
                    />
                ))}
            </div>

            {loading && (
                <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Page-based navigation */}
            {!loading && (
                <div className="flex justify-center gap-4">
                    {page > 1 && (
                        <button
                            onClick={handleLoadPrevious}
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            ← Bình luận mới hơn
                        </button>
                    )}
                    {hasMore && (
                        <button
                            onClick={handleLoadMore}
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            Bình luận cũ hơn →
                        </button>
                    )}
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
    expandedCommentIds,
    toggleExpanded,
    level = 0,
    theme,
    onDrillDown,
    uploaderId,
}: {
    comment: Comment
    novelId: number
    chapterId?: number
    onReplySuccess: (newComment: Comment, parentId: number) => void
    expandedCommentIds?: Set<number>
    toggleExpanded?: (commentId: number) => void
    level?: number
    theme?: ReadingTheme
    onDrillDown?: (comment: Comment) => void
    uploaderId?: string
}) {
    const [isReplying, setIsReplying] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(comment.content)
    const [isPending, startTransition] = useTransition()
    const [localContent, setLocalContent] = useState(comment.content)
    const [localIsPinned, setLocalIsPinned] = useState(comment.isPinned || false)
    // Use controlled expansion from parent if available, otherwise use local state
    const isExpandedControlled = expandedCommentIds?.has(comment.id)
    const [isExpandedLocal, setIsExpandedLocal] = useState(false)
    const isExpanded = toggleExpanded ? isExpandedControlled : isExpandedLocal

    const [fetchedChildren, setFetchedChildren] = useState<Comment[]>([])
    const [loadingChildren, setLoadingChildren] = useState(false)
    const { data: session } = useSession()
    const router = useRouter()

    const [score, setScore] = useState(comment.score || 0)
    const [userVote, setUserVote] = useState(comment.userVote)

    // Check if edit is allowed (within 10 minutes of creation)
    const isEditAllowed = session?.user?.id === comment.user.id &&
        (Date.now() - new Date(comment.createdAt).getTime()) < 10 * 60 * 1000

    // Check if delete is allowed (own comment, admin, mod, or uploader)
    const canDelete = session?.user?.id === comment.user.id ||
        session?.user?.role === "ADMIN" ||
        session?.user?.role === "MODERATOR"

    // Check if pin is allowed (admin, mod, or uploader)
    const isUploader = uploaderId && session?.user?.id === uploaderId
    const canPin = session?.user?.role === "ADMIN" ||
        session?.user?.role === "MODERATOR" ||
        isUploader

    // Check if comment was edited
    const isEdited = comment.updatedAt &&
        new Date(comment.updatedAt).getTime() > new Date(comment.createdAt).getTime() + 1000

    const handleEdit = () => {
        if (!editContent.trim()) return
        startTransition(async () => {
            const res = await commentService.edit(comment.id, editContent)
            if (!res.success) {
                alert(res.error)
            } else {
                setLocalContent(editContent)
                setIsEditing(false)
            }
        })
    }

    const handleDelete = () => {
        if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return
        startTransition(async () => {
            const res = await commentService.delete(comment.id)
            if (!res.success) {
                alert(res.error)
            } else {
                // Refresh page to show updated comments
                router.refresh()
            }
        })
    }

    const handlePin = () => {
        startTransition(async () => {
            const res = await commentService.togglePin(comment.id)
            if (!res.success) {
                alert(res.error)
            } else if (res.data) {
                setLocalIsPinned(res.data.pinned)
            }
        })
    }

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

        // Call API
        const res = await commentService.vote(comment.id, type)
        if (!res.success) {
            // Revert on error
            setUserVote(previousVote)
            setScore(previousScore)
        }
    }

    // Handle inline expansion (when no drawer available)
    const handleExpandChildren = async () => {
        // Use controlled expansion if available
        if (toggleExpanded) {
            if (isExpanded) {
                toggleExpanded(comment.id)
                return
            }
            // Fetch children first if needed
            if (!comment.children || comment.children.length === 0) {
                setLoadingChildren(true)
                try {
                    const res = await commentService.getReplies(comment.id, novelId)
                    if (res.success && res.data) {
                        setFetchedChildren(res.data.items as unknown as Comment[])
                    }
                } catch (error) {
                    console.error("Failed to fetch replies:", error)
                }
                setLoadingChildren(false)
            } else {
                setFetchedChildren(comment.children)
            }
            toggleExpanded(comment.id)
            return
        }

        // Fallback to local state
        if (isExpanded) {
            setIsExpandedLocal(false)
            return
        }

        // If children are already in comment, use them
        if (comment.children && comment.children.length > 0) {
            setFetchedChildren(comment.children)
            setIsExpandedLocal(true)
            return
        }

        // Otherwise fetch from server
        setLoadingChildren(true)
        try {
            const res = await commentService.getReplies(comment.id, novelId)
            if (res.success && res.data) {
                setFetchedChildren(res.data.items as unknown as Comment[])
            }
            setIsExpandedLocal(true)
        } catch (error) {
            console.error("Failed to fetch replies:", error)
        }
        setLoadingChildren(false)
    }

    // Theme-based styling: use when `theme` prop is explicitly provided (for reader/drawer)
    // Otherwise fall back to Tailwind classes for light mode (main comment section)
    const useThemeStyles = !!theme
    const t = theme || READING_THEMES["night"] // fallback for type safety but won't be used if useThemeStyles is false
    const isDark = theme ? ["dark", "night", "onyx", "dusk"].includes(theme.id) : false

    const replyCount = comment.replyCount || comment.children?.length || 0
    const hasReplies = replyCount > 0

    // Calculate indentation based on level (half avatar width = ~16px per level)
    const indentPx = level > 0 ? Math.min(level * 16, 48) : 0

    return (
        <div
            id={`comment-${comment.id}`}
            className={clsx(
                "min-w-0",
                localIsPinned && "relative p-3 rounded-lg border-2 border-amber-500/50 bg-amber-500/5"
            )}
            style={{ marginLeft: indentPx }}
        >
            {/* Pin indicator */}
            {localIsPinned && (
                <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-amber-500">
                    <Pin className="h-3 w-3 fill-current" />
                    <span className="font-medium">Đã ghim</span>
                </div>
            )}
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
                                className={clsx(
                                    "flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border hover:border-amber-500 transition-colors",
                                    !useThemeStyles && "border-2 border-primary/60 bg-gray-100"
                                )}
                                style={useThemeStyles ? {
                                    backgroundColor: t.ui.hover,
                                    borderColor: t.ui.border,
                                } : undefined}
                            >
                                <User
                                    className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                                    style={useThemeStyles ? { color: t.ui.text } : undefined}
                                />
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
                            className={clsx(
                                "font-semibold text-sm md:text-base hover:text-amber-500 transition-colors",
                                !useThemeStyles && "text-foreground"
                            )}
                            style={useThemeStyles ? { color: t.foreground } : undefined}
                        >
                            {comment.user.nickname || comment.user.name || "Người dùng ẩn danh"}
                        </Link>
                        <button
                            onClick={() => {
                                const url = `${window.location.origin}${window.location.pathname}#comment-${comment.id}`
                                navigator.clipboard.writeText(url)
                                    .then(() => alert("Đã sao chép link!"))
                                    .catch(() => { })
                            }}
                            className={clsx(
                                "text-sm hover:text-amber-500 transition-colors cursor-pointer",
                                !useThemeStyles && "text-muted-foreground"
                            )}
                            style={useThemeStyles ? { color: t.ui.text, opacity: 0.6 } : undefined}
                            title="Click để sao chép link"
                        >
                            {new Date(comment.createdAt).toLocaleDateString("vi-VN")}
                        </button>
                        {isEdited && (
                            <span
                                className={clsx(
                                    "text-sm italic",
                                    !useThemeStyles && "text-muted-foreground"
                                )}
                                style={useThemeStyles ? { color: t.ui.text, opacity: 0.5 } : undefined}
                            >
                                (đã chỉnh sửa)
                            </span>
                        )}
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
                            <span
                                className={!useThemeStyles ? "text-muted-foreground" : undefined}
                                style={useThemeStyles ? { color: t.ui.text, opacity: 0.5 } : undefined}
                            >·</span>
                            <span
                                className={clsx(
                                    "truncate max-w-[150px] sm:max-w-[200px]",
                                    !useThemeStyles && "text-muted-foreground"
                                )}
                                style={useThemeStyles ? { color: t.ui.text, opacity: 0.7 } : undefined}
                            >
                                {comment.parent.content.length > 30
                                    ? comment.parent.content.slice(0, 30) + "..."
                                    : comment.parent.content}
                            </span>
                        </div>
                    )}

                    {/* Comment content - either editing or display */}
                    {isEditing ? (
                        <div className="space-y-2">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full rounded-md p-2 text-sm"
                                style={{
                                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                                    borderWidth: 1,
                                    borderStyle: "solid",
                                    borderColor: t.ui.border,
                                    color: t.foreground,
                                }}
                                rows={3}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleEdit}
                                    disabled={isPending}
                                    className="flex items-center gap-1 text-xs font-medium text-green-500 hover:text-green-400"
                                >
                                    <Check className="h-3 w-3" />
                                    Lưu
                                </button>
                                <button
                                    onClick={() => { setIsEditing(false); setEditContent(localContent); }}
                                    className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-300"
                                >
                                    <X className="h-3 w-3" />
                                    Hủy
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={clsx(
                                "text-sm md:text-base prose prose-sm md:prose-base max-w-none [&_p]:my-0 [&_strong]:text-inherit [&_em]:text-inherit",
                                !useThemeStyles && "text-foreground"
                            )}
                            style={useThemeStyles ? { color: t.foreground } : undefined}
                            dangerouslySetInnerHTML={{ __html: localContent }}
                        />
                    )}

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
                                    userVote === "UPVOTE" ? "text-amber-500" : (!useThemeStyles && "text-gray-500 hover:text-gray-700")
                                )}
                                style={useThemeStyles && userVote !== "UPVOTE" ? { color: t.ui.text } : undefined}
                            >
                                <ThumbsUp className={clsx("w-3.5 h-3.5", userVote === "UPVOTE" && "fill-current")} />
                            </button>
                            <span
                                className={clsx(
                                    "text-sm font-medium min-w-[1.5ch] text-center",
                                    userVote === "UPVOTE" ? "text-amber-500" :
                                        userVote === "DOWNVOTE" ? "text-red-500" : (!useThemeStyles && "text-gray-600")
                                )}
                                style={useThemeStyles && !userVote ? { color: t.ui.text } : undefined}
                            >
                                {score}
                            </span>
                            <button
                                onClick={() => handleVote("DOWNVOTE")}
                                className={clsx(
                                    "p-1 rounded transition-colors",
                                    userVote === "DOWNVOTE" ? "text-red-500" : (!useThemeStyles && "text-gray-500 hover:text-gray-700")
                                )}
                                style={useThemeStyles && userVote !== "DOWNVOTE" ? { color: t.ui.text } : undefined}
                            >
                                <ThumbsDown className={clsx("w-3.5 h-3.5", userVote === "DOWNVOTE" && "fill-current")} />
                            </button>
                        </div>

                        {session && (
                            <button
                                onClick={() => setIsReplying(!isReplying)}
                                className={clsx(
                                    "flex items-center gap-1 text-sm font-medium hover:text-amber-500 transition-colors",
                                    !useThemeStyles && "text-gray-600"
                                )}
                                style={useThemeStyles ? { color: t.ui.text } : undefined}
                            >
                                <Reply className="h-3.5 w-3.5" />
                                Trả lời
                            </button>
                        )}

                        {isEditAllowed && !isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className={clsx(
                                    "flex items-center gap-1 text-sm font-medium hover:text-blue-500 transition-colors",
                                    !useThemeStyles && "text-gray-600"
                                )}
                                style={useThemeStyles ? { color: t.ui.text } : undefined}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                                Sửa
                            </button>
                        )}

                        {canDelete && (
                            <button
                                onClick={handleDelete}
                                disabled={isPending}
                                className={clsx(
                                    "flex items-center gap-1 text-sm font-medium hover:text-red-500 transition-colors",
                                    !useThemeStyles && "text-gray-600"
                                )}
                                style={useThemeStyles ? { color: t.ui.text } : undefined}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Xóa
                            </button>
                        )}

                        {canPin && (
                            <button
                                onClick={handlePin}
                                disabled={isPending}
                                className={clsx(
                                    "flex items-center gap-1 text-sm font-medium transition-colors",
                                    localIsPinned ? "text-amber-500" : (useThemeStyles ? "hover:text-amber-500" : "text-gray-600 hover:text-amber-500")
                                )}
                                style={useThemeStyles && !localIsPinned ? { color: t.ui.text } : undefined}
                            >
                                <Pin className={clsx("h-3.5 w-3.5", localIsPinned && "fill-current")} />
                                {localIsPinned ? "Bỏ ghim" : "Ghim"}
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
                                onSuccess={(newComment) => {
                                    setIsReplying(false)
                                    if (newComment) {
                                        onReplySuccess(newComment, comment.id)
                                    }
                                }}
                                autoFocus
                                theme={theme}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Children comments - only show first level directly */}
            {level < 1 && comment.children && comment.children.length > 0 && (
                <div className="mt-3 space-y-3">
                    {comment.children.map((child) => (
                        <CommentItem
                            key={child.id}
                            comment={child}
                            novelId={novelId}
                            chapterId={chapterId}
                            onReplySuccess={onReplySuccess}
                            expandedCommentIds={expandedCommentIds}
                            toggleExpanded={toggleExpanded}
                            level={level + 1}
                            theme={theme}
                            onDrillDown={onDrillDown}
                            uploaderId={uploaderId}
                        />
                    ))}
                </div>
            )}

            {/* Flat structure: All replies shown directly under root (level 0) */}
            {/* No "View replies" button needed - all children are siblings at level 1 */}
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
    cooldown: externalCooldown,
}: {
    novelId: number
    chapterId?: number
    parentId?: number
    paragraphId?: number | null
    onSuccess: (newComment?: Comment) => void
    autoFocus?: boolean
    theme?: ReadingTheme
    cooldown?: number  // Optional external cooldown (from parent)
}) {
    const editorRef = useRef<CommentEditorRef>(null)
    const [isPending, startTransition] = useTransition()
    // Local cooldown for reply forms
    const [localCooldown, setLocalCooldown] = useState(0)

    // Use external cooldown if provided, otherwise local
    const cooldown = externalCooldown ?? localCooldown

    // Countdown effect (only for local cooldown)
    useEffect(() => {
        if (externalCooldown !== undefined || localCooldown <= 0) return
        const timer = setTimeout(() => setLocalCooldown(prev => prev - 1), 1000)
        return () => clearTimeout(timer)
    }, [localCooldown, externalCooldown])

    // Auto focus
    useEffect(() => {
        if (autoFocus && editorRef.current) {
            editorRef.current.focus()
        }
    }, [autoFocus])

    const handleSubmit = (html: string) => {
        // Strip HTML tags to check if there's actual text content
        const textContent = html.replace(/<[^>]*>/g, '').trim()
        if (!textContent) return

        // Check cooldown
        if (cooldown > 0) return

        startTransition(async () => {
            const res = await commentService.create({
                content: html,
                novelId,
                chapterId,
                parentId,
                paragraphId: paragraphId ?? undefined,
            })

            if (!res.success) {
                alert(res.error)
            } else {
                // Clear editor
                editorRef.current?.clear()
                // Start cooldown (only for local/reply forms without external cooldown)
                if (externalCooldown === undefined) {
                    setLocalCooldown(10)
                }
                // Pass the new comment to parent if available
                const newComment = res.data as unknown as Comment
                onSuccess(newComment)
            }
        })
    }

    return (
        <CommentEditor
            ref={editorRef}
            placeholder={parentId ? "Viết câu trả lời..." : "Viết bình luận của bạn..."}
            onSubmit={handleSubmit}
            disabled={isPending}
            loading={isPending}
            cooldown={cooldown}
        />
    )
}
