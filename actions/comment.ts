"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireEmailVerification } from "@/lib/verification";

export async function voteComment(commentId: number, voteType: "UPVOTE" | "DOWNVOTE") {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    // Check email verification for write actions
    const verificationCheck = requireEmailVerification(session);
    if (verificationCheck) {
        return verificationCheck;
    }

    const userId = session.user.id;

    try {
        // Check existing vote
        const existingVote = await db.commentReaction.findUnique({
            where: {
                userId_commentId: {
                    userId,
                    commentId,
                },
            },
        });

        if (existingVote) {
            if (existingVote.type === voteType) {
                // Toggle off (remove vote)
                await db.commentReaction.delete({
                    where: { id: existingVote.id },
                });
            } else {
                // Change vote type
                await db.commentReaction.update({
                    where: { id: existingVote.id },
                    data: { type: voteType },
                });
            }
        } else {
            // Create new vote
            await db.commentReaction.create({
                data: {
                    userId,
                    commentId,
                    type: voteType,
                },
            });
        }

        revalidatePath("/truyen/[slug]", "page");
        return { success: true };
    } catch (error) {
        console.error("Error voting comment:", error);
        return { error: "Failed to vote" };
    }
}

export async function getCommentVotes(commentId: number) {
    const upvotes = await db.commentReaction.count({
        where: { commentId, type: "UPVOTE" },
    });
    const downvotes = await db.commentReaction.count({
        where: { commentId, type: "DOWNVOTE" },
    });

    return { upvotes, downvotes, score: upvotes - downvotes };
}

// Edit comment - only allowed within 10 minutes of creation
export async function editComment(commentId: number, newContent: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Bạn cần đăng nhập." };
    }

    const verificationCheck = requireEmailVerification(session);
    if (verificationCheck) {
        return verificationCheck;
    }

    if (!newContent || !newContent.trim()) {
        return { error: "Nội dung bình luận không được để trống." };
    }

    try {
        const comment = await db.comment.findUnique({
            where: { id: commentId },
            include: { novel: { select: { slug: true } } },
        });

        if (!comment) {
            return { error: "Bình luận không tồn tại." };
        }

        // Check ownership
        if (comment.userId !== session.user.id) {
            return { error: "Bạn không có quyền sửa bình luận này." };
        }

        // Check 10 minute window
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        if (comment.createdAt < tenMinutesAgo) {
            return { error: "Đã quá 10 phút, không thể sửa bình luận." };
        }

        await db.comment.update({
            where: { id: commentId },
            data: { content: newContent.trim() },
        });

        revalidatePath(`/truyen/${comment.novel.slug}`);
        return { success: true };
    } catch (error) {
        console.error("Error editing comment:", error);
        return { error: "Có lỗi xảy ra khi sửa bình luận." };
    }
}

// Delete comment - user can delete own, admin/mod can delete any
export async function deleteUserComment(commentId: number) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Bạn cần đăng nhập." };
    }

    const verificationCheck = requireEmailVerification(session);
    if (verificationCheck) {
        return verificationCheck;
    }

    try {
        const comment = await db.comment.findUnique({
            where: { id: commentId },
            include: { novel: { select: { slug: true, uploaderId: true } } },
        });

        if (!comment) {
            return { error: "Bình luận không tồn tại." };
        }

        const isOwner = comment.userId === session.user.id;
        const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
        const isUploader = comment.novel.uploaderId === session.user.id;

        if (!isOwner && !isAdmin && !isUploader) {
            return { error: "Bạn không có quyền xóa bình luận này." };
        }

        await db.comment.delete({
            where: { id: commentId },
        });

        revalidatePath(`/truyen/${comment.novel.slug}`);
        return { success: true };
    } catch (error) {
        console.error("Error deleting comment:", error);
        return { error: "Có lỗi xảy ra khi xóa bình luận." };
    }
}

// Pin comment - admin/mod/uploader only, max 3 per novel
export async function pinComment(commentId: number, novelId: number) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Bạn cần đăng nhập." };
    }

    try {
        // Check novel and permissions
        const novel = await db.novel.findUnique({
            where: { id: novelId },
            select: { slug: true, uploaderId: true },
        });

        if (!novel) {
            return { error: "Truyện không tồn tại." };
        }

        const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
        const isUploader = novel.uploaderId === session.user.id;

        if (!isAdmin && !isUploader) {
            return { error: "Bạn không có quyền ghim bình luận." };
        }

        // Check comment exists and belongs to this novel
        const comment = await db.comment.findUnique({
            where: { id: commentId },
        });

        if (!comment || comment.novelId !== novelId) {
            return { error: "Bình luận không hợp lệ." };
        }

        // Toggle pin state
        if (comment.isPinned) {
            // Unpin
            await db.comment.update({
                where: { id: commentId },
                data: { isPinned: false, pinnedAt: null, pinnedBy: null },
            });
            revalidatePath(`/truyen/${novel.slug}`);
            return { success: true, pinned: false };
        }

        // Check max 3 pins
        const pinnedCount = await db.comment.count({
            where: { novelId, isPinned: true },
        });

        if (pinnedCount >= 3) {
            return { error: "Đã đạt tối đa 3 bình luận ghim." };
        }

        // Pin the comment
        await db.comment.update({
            where: { id: commentId },
            data: {
                isPinned: true,
                pinnedAt: new Date(),
                pinnedBy: session.user.id,
            },
        });

        revalidatePath(`/truyen/${novel.slug}`);
        return { success: true, pinned: true };
    } catch (error) {
        console.error("Error pinning comment:", error);
        return { error: "Có lỗi xảy ra khi ghim bình luận." };
    }
}
