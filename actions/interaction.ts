"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

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

    const { content, novelId, chapterId, parentId, paragraphId } = data

    if (!content || !content.trim()) {
        return { error: "Nội dung bình luận không được để trống." }
    }

    try {
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
                const novel = await db.novel.findUnique({
                    where: { id: novelId },
                    select: { title: true, slug: true },
                })

                await db.notification.create({
                    data: {
                        userId: parentComment.userId,
                        actorId: session.user.id,
                        type: "REPLY_COMMENT",
                        resourceId: comment.id.toString(),
                        resourceType: "comment",
                        message: `${session.user.nickname || session.user.name} replied to your comment on "${novel?.title || 'a novel'}"`,
                    },
                })
            }
        }

        revalidatePath(`/truyen/${novelId}`)
        return { success: true }
    } catch (error) {
        console.error("Error adding comment:", error)
        return { error: "Có lỗi xảy ra khi gửi bình luận." }
    }
}

export async function getComments(
    novelId: number,
    chapterId?: number,
    page: number = 1,
    paragraphId?: number | null // Filter by specific paragraph
) {
    const TAKE = 20
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

        // Fetch flat list of comments, sorted by createdAt ASC
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
            orderBy: {
                createdAt: "asc",
            },
            take: TAKE,
            skip: SKIP,
        })

        // Process comments to add score and userVote
        const processedComments = comments.map(comment => {
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

    if (score < 1 || score > 5) {
        return { error: "Điểm đánh giá không hợp lệ." }
    }

    try {
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
