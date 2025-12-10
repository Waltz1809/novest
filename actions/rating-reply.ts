"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Add a comment to a rating discussion (any logged-in user can participate)
export async function addRatingComment(
    ratingUserId: string,
    novelId: number,
    content: string
) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "Bạn cần đăng nhập để tham gia thảo luận." }
    }

    if (!content.trim()) {
        return { error: "Nội dung phản hồi không được để trống." }
    }

    if (content.trim().length > 2000) {
        return { error: "Nội dung phản hồi không được quá 2000 ký tự." }
    }

    try {
        // Get novel for revalidation path
        const novel = await db.novel.findUnique({
            where: { id: novelId },
            select: { slug: true }
        })

        if (!novel) {
            return { error: "Truyện không tồn tại." }
        }

        // Check if the rating exists
        const rating = await db.rating.findUnique({
            where: {
                userId_novelId: {
                    userId: ratingUserId,
                    novelId: novelId
                }
            }
        })

        if (!rating) {
            return { error: "Đánh giá không tồn tại." }
        }

        // Create rating comment (separate table)
        const comment = await db.ratingComment.create({
            data: {
                content: content.trim(),
                userId: session.user.id,
                ratingUserId: ratingUserId,
                ratingNovelId: novelId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        nickname: true,
                        username: true,
                        image: true,
                    }
                }
            }
        })

        revalidatePath(`/truyen/${novel.slug}`)
        return { success: true, comment }
    } catch (error) {
        console.error("Error adding rating comment:", error)
        return { error: "Có lỗi xảy ra khi gửi phản hồi." }
    }
}

// Get a single rating with all its discussion comments
export async function getRatingWithComments(
    ratingUserId: string,
    novelId: number
) {
    try {
        const rating = await db.rating.findUnique({
            where: {
                userId_novelId: {
                    userId: ratingUserId,
                    novelId: novelId
                }
            },
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
                novel: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        uploaderId: true,
                        uploader: {
                            select: {
                                id: true,
                                name: true,
                                nickname: true,
                                image: true,
                            }
                        }
                    }
                },
                ratingComments: {
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
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        })

        if (!rating) {
            return { error: "Đánh giá không tồn tại." }
        }

        return { rating }
    } catch (error) {
        console.error("Error getting rating:", error)
        return { error: "Có lỗi xảy ra." }
    }
}

// Delete a rating comment (only author can delete)
export async function deleteRatingComment(commentId: number) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "Bạn cần đăng nhập." }
    }

    try {
        const comment = await db.ratingComment.findUnique({
            where: { id: commentId },
            include: {
                rating: {
                    include: {
                        novel: { select: { slug: true } }
                    }
                }
            }
        })

        if (!comment) {
            return { error: "Bình luận không tồn tại." }
        }

        if (comment.userId !== session.user.id) {
            return { error: "Bạn không có quyền xóa bình luận này." }
        }

        await db.ratingComment.delete({
            where: { id: commentId }
        })

        revalidatePath(`/truyen/${comment.rating.novel.slug}`)
        return { success: true }
    } catch (error) {
        console.error("Error deleting rating comment:", error)
        return { error: "Có lỗi xảy ra khi xóa bình luận." }
    }
}
