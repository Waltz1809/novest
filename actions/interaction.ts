"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireEmailVerification } from "@/lib/verification"

export async function addComment(data: {
    content: string
    novelId: number
    chapterId?: number
    parentId?: number
    paragraphId?: number // For paragraph-specific comments
}) {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
        return { error: "Bạn cần đăng nhập để bình luận." }
    }

    // Check email verification for write actions
    const verificationCheck = requireEmailVerification(session)
    if (verificationCheck) {
        return verificationCheck
    }

    const { content, novelId, chapterId, parentId, paragraphId } = data

    if (!content || !content.trim()) {
        return { error: "Nội dung bình luận không được để trống." }
    }

    try {
        // Validate that user exists in database
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { id: true }
        })
        if (!user) {
            return { error: "Tài khoản không tồn tại. Vui lòng đăng nhập lại." }
        }

        // Validate that novel exists
        const novel = await db.novel.findUnique({
            where: { id: novelId },
            select: { id: true, slug: true, title: true }
        })
        if (!novel) {
            return { error: "Truyện không tồn tại." }
        }

        // Validate chapter if provided
        if (chapterId) {
            const chapter = await db.chapter.findUnique({
                where: { id: chapterId },
                select: { id: true }
            })
            if (!chapter) {
                return { error: "Chương không tồn tại." }
            }
        }

        const comment = await db.comment.create({
            data: {
                content,
                userId: session.user.id,
                novelId,
                chapterId,
                parentId,
                paragraphId,
            },
        })

        // Create notification for comment reply
        if (parentId) {
            const parentComment = await db.comment.findUnique({
                where: { id: parentId },
                select: { userId: true },
            })

            // Only notify if replying to someone else's comment
            if (parentComment && parentComment.userId !== session.user.id) {
                await db.notification.create({
                    data: {
                        userId: parentComment.userId,
                        actorId: session.user.id,
                        type: "REPLY_COMMENT",
                        resourceId: comment.id.toString(),
                        resourceType: "comment",
                        message: `${session.user.nickname || session.user.name} đã phản hồi bình luận của bạn ở "${novel.title}"`,
                    },
                })
            }
        }

        // Fetch the complete comment with user data for client-side use
        const completeComment = await db.comment.findUnique({
            where: { id: comment.id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        nickname: true,
                        username: true,
                        image: true,
                    }
                },
                parent: {
                    select: {
                        id: true,
                        content: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                nickname: true,
                                username: true,
                            }
                        }
                    }
                }
            }
        })

        revalidatePath(`/truyen/${novel.slug}`)
        return { success: true, comment: completeComment }
    } catch (error) {
        console.error("Error adding comment:", error)
        return { error: "Có lỗi xảy ra khi gửi bình luận." }
    }
}

export async function getComments(
    novelId: number,
    chapterId?: number,
    page: number = 1,
    paragraphId?: number | null, // Filter by specific paragraph
    sortBy: 'newest' | 'votes' | 'replies' = 'newest'
) {
    const TAKE = 10
    const SKIP = (page - 1) * TAKE
    const session = await auth()

    try {
        const whereCondition: any = {
            novelId,
        }

        if (chapterId) {
            whereCondition.chapterId = chapterId
            // If paragraphId is explicitly provided (including 0), filter by it
            if (paragraphId !== undefined && paragraphId !== null) {
                whereCondition.paragraphId = paragraphId
            }
        } else {
            whereCondition.chapterId = null
        }

        // Build orderBy based on sortBy parameter
        let orderByClause: any[] = [{ isPinned: 'desc' }] // Always pinned first

        switch (sortBy) {
            case 'votes':
                // For votes, we need to sort after fetching since it's computed
                orderByClause.push({ createdAt: 'desc' })
                break
            case 'replies':
                // Sort by reply count
                orderByClause.push({ createdAt: 'desc' })
                break
            case 'newest':
            default:
                orderByClause.push({ createdAt: 'desc' })
                break
        }

        // Fetch flat list of comments
        const comments = await db.comment.findMany({
            where: whereCondition,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        nickname: true,
                        username: true,
                        image: true,
                    },
                },
                parent: {
                    select: {
                        id: true,
                        content: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                nickname: true,
                                username: true,
                            },
                        },
                    },
                },
                reactions: true,
                _count: {
                    select: { children: true }
                }
            },
            orderBy: orderByClause,
            take: TAKE,
            skip: SKIP,
        })

        // Process comments to add score and userVote
        let processedComments = comments.map(comment => {
            const upvotes = comment.reactions.filter(r => r.type === "UPVOTE").length
            const downvotes = comment.reactions.filter(r => r.type === "DOWNVOTE").length
            const score = upvotes - downvotes
            const userVote = session?.user?.id ? comment.reactions.find(r => r.userId === session.user.id)?.type : null

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { reactions, _count, ...rest } = comment
            return {
                ...rest,
                score,
                userVote,
                replyCount: _count?.children || 0,
            }
        })

        // Apply post-fetch sorting for votes and replies (keeping pinned first)
        if (sortBy === 'votes') {
            processedComments = processedComments.sort((a, b) => {
                // Pinned comments always first
                if (a.isPinned && !b.isPinned) return -1
                if (!a.isPinned && b.isPinned) return 1
                // Then sort by score
                return b.score - a.score
            })
        } else if (sortBy === 'replies') {
            processedComments = processedComments.sort((a, b) => {
                // Pinned comments always first
                if (a.isPinned && !b.isPinned) return -1
                if (!a.isPinned && b.isPinned) return 1
                // Then sort by reply count
                return b.replyCount - a.replyCount
            })
        }

        // Count total comments (flat)
        const total = await db.comment.count({ where: whereCondition })

        return {
            comments: processedComments,
            hasMore: SKIP + TAKE < total,
            total
        }
    } catch (error) {
        console.error("Error fetching comments:", error)
        return { comments: [], hasMore: false, total: 0 }
    }
}

// Get comment counts per paragraph for a chapter (for displaying indicators)
export async function getChapterParagraphCommentCounts(chapterId: number) {
    try {
        const counts = await db.comment.groupBy({
            by: ['paragraphId'],
            where: {
                chapterId,
                paragraphId: { not: null }
            },
            _count: { id: true }
        })

        // Convert to Record<number, number>
        const result: Record<number, number> = {}
        counts.forEach((c) => {
            if (c.paragraphId !== null) {
                result[c.paragraphId] = c._count.id
            }
        })
        return result
    } catch (error) {
        console.error("Error fetching paragraph comment counts:", error)
        return {}
    }
}

// Get 10 newest comments from ANY chapter of a novel (for Tab 1: Chapter Discussion)
export async function getChapterDiscussions(novelId: number, limit: number = 10) {
    const session = await auth()

    try {
        const comments = await db.comment.findMany({
            where: {
                novelId,
                chapterId: { not: null }, // Only chapter comments
                parentId: null, // Only root comments
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        nickname: true,
                        username: true,
                        image: true,
                    },
                },
                chapter: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        order: true,
                        volume: {
                            select: {
                                novelId: true,
                                novel: {
                                    select: {
                                        slug: true,
                                    }
                                }
                            }
                        }
                    },
                },
                reactions: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        })

        // Process comments with score and userVote
        const processedComments = comments.map(comment => {
            const upvotes = comment.reactions.filter(r => r.type === "UPVOTE").length
            const downvotes = comment.reactions.filter(r => r.type === "DOWNVOTE").length
            const score = upvotes - downvotes
            const userVote = session?.user?.id ? comment.reactions.find(r => r.userId === session.user.id)?.type : null

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { reactions, ...rest } = comment
            return {
                ...rest,
                score,
                userVote,
            }
        })

        return { comments: processedComments }
    } catch (error) {
        console.error("Error fetching chapter discussions:", error)
        return { comments: [] }
    }
}

// Get replies to a specific comment (for drill-down sub-thread view)
export async function getCommentReplies(commentId: number, page: number = 1) {
    const TAKE = 10
    const SKIP = (page - 1) * TAKE
    const session = await auth()

    try {
        const replies = await db.comment.findMany({
            where: { parentId: commentId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        nickname: true,
                        username: true,
                        image: true,
                    },
                },
                parent: {
                    select: {
                        id: true,
                        content: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                nickname: true,
                                username: true,
                            },
                        },
                    },
                },
                reactions: true,
                _count: {
                    select: { children: true }
                }
            },
            orderBy: { createdAt: "asc" },
            take: TAKE,
            skip: SKIP,
        })

        const processedReplies = replies.map(comment => {
            const upvotes = comment.reactions.filter(r => r.type === "UPVOTE").length
            const downvotes = comment.reactions.filter(r => r.type === "DOWNVOTE").length
            const score = upvotes - downvotes
            const userVote = session?.user?.id ? comment.reactions.find(r => r.userId === session.user.id)?.type : null

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { reactions, _count, ...rest } = comment
            return {
                ...rest,
                score,
                userVote,
                replyCount: _count?.children || 0,
            }
        })

        const total = await db.comment.count({ where: { parentId: commentId } })

        return {
            comments: processedReplies,
            hasMore: SKIP + TAKE < total,
            total
        }
    } catch (error) {
        console.error("Error fetching comment replies:", error)
        return { comments: [], hasMore: false, total: 0 }
    }
}

export async function rateNovel(novelId: number, score: number, content?: string) {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
        return { error: "Bạn cần đăng nhập để đánh giá." }
    }

    // Check email verification for write actions
    const verificationCheck = requireEmailVerification(session)
    if (verificationCheck) {
        return verificationCheck
    }

    if (score < 1 || score > 5) {
        return { error: "Điểm đánh giá không hợp lệ." }
    }

    try {
        // Validate user exists
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { id: true }
        })
        if (!user) {
            return { error: "Tài khoản không tồn tại. Vui lòng đăng nhập lại." }
        }

        // Validate novel exists
        const novel = await db.novel.findUnique({
            where: { id: novelId },
            select: { id: true }
        })
        if (!novel) {
            return { error: "Truyện không tồn tại." }
        }

        await db.rating.upsert({
            where: {
                userId_novelId: {
                    userId: session.user.id,
                    novelId,
                },
            },
            update: {
                score,
                content,
            },
            create: {
                userId: session.user.id,
                novelId,
                score,
                content,
            },
        })

        revalidatePath(`/truyen/${novelId}`)
        return { success: true }
    } catch (error) {
        console.error("Error rating novel:", error)
        return { error: "Có lỗi xảy ra khi đánh giá." }
    }
}

export async function getNovelRating(novelId: number) {
    try {
        const aggregations = await db.rating.aggregate({
            where: { novelId },
            _avg: { score: true },
            _count: { score: true },
        })

        return {
            average: aggregations._avg.score || 0,
            count: aggregations._count.score || 0,
        }
    } catch (error) {
        console.error("Error getting rating:", error)
        return { average: 0, count: 0 }
    }
}

export async function getUserRating(novelId: number) {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
        return null
    }

    try {
        const rating = await db.rating.findUnique({
            where: {
                userId_novelId: {
                    userId: session.user.id,
                    novelId,
                },
            },
        })
        return rating
    } catch (error) {
        return null
    }
}

// Get paginated ratings with user info for display
export async function getNovelRatings(novelId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit

    try {
        const [ratings, total] = await Promise.all([
            db.rating.findMany({
                where: { novelId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            nickname: true,
                            username: true,
                            image: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip,
            }),
            db.rating.count({ where: { novelId } }),
        ])

        return {
            ratings,
            total,
            hasMore: skip + limit < total,
            page,
        }
    } catch (error) {
        console.error("Error fetching novel ratings:", error)
        return { ratings: [], total: 0, hasMore: false, page }
    }
}
