import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

/**
 * PUT /api/comments/:id - Edit a comment
 * Requires authentication, owner only, within 10 minutes
 * 
 * Body: { content: string }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Chưa đăng nhập" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const commentId = parseInt(id, 10);

        const body = await request.json();
        const { content } = body;

        if (!content?.trim()) {
            return NextResponse.json(
                { success: false, error: "Nội dung không được để trống" },
                { status: 400 }
            );
        }

        const comment = await db.comment.findUnique({
            where: { id: commentId },
        });

        if (!comment) {
            return NextResponse.json(
                { success: false, error: "Bình luận không tồn tại" },
                { status: 404 }
            );
        }

        if (comment.userId !== session.user.id) {
            return NextResponse.json(
                { success: false, error: "Không có quyền sửa bình luận này" },
                { status: 403 }
            );
        }

        // Check 10 minute window
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        if (comment.createdAt < tenMinutesAgo) {
            return NextResponse.json(
                { success: false, error: "Đã quá 10 phút, không thể sửa bình luận" },
                { status: 403 }
            );
        }

        await db.comment.update({
            where: { id: commentId },
            data: { content: content.trim() },
        });

        revalidatePath("/");

        return NextResponse.json({
            success: true,
            message: "Đã cập nhật bình luận",
        });
    } catch (error) {
        console.error("PUT /api/comments/[id] error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi sửa bình luận" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/comments/:id - Delete a comment
 * Requires authentication (owner, admin, or novel uploader)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Chưa đăng nhập" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const commentId = parseInt(id, 10);

        const comment = await db.comment.findUnique({
            where: { id: commentId },
            include: { novel: { select: { uploaderId: true } } },
        });

        if (!comment) {
            return NextResponse.json(
                { success: false, error: "Bình luận không tồn tại" },
                { status: 404 }
            );
        }

        const isOwner = comment.userId === session.user.id;
        const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
        const isUploader = comment.novel.uploaderId === session.user.id;

        if (!isOwner && !isAdmin && !isUploader) {
            return NextResponse.json(
                { success: false, error: "Không có quyền xóa bình luận này" },
                { status: 403 }
            );
        }

        await db.comment.delete({
            where: { id: commentId },
        });

        revalidatePath("/");

        return NextResponse.json({
            success: true,
            message: "Đã xóa bình luận",
        });
    } catch (error) {
        console.error("DELETE /api/comments/[id] error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi xóa bình luận" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/comments/:id - Vote or pin a comment
 * Requires authentication
 * 
 * Body: { action: "vote" | "pin", voteType?: "UPVOTE" | "DOWNVOTE" }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Chưa đăng nhập" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const commentId = parseInt(id, 10);

        const body = await request.json();
        const { action, voteType } = body;

        const comment = await db.comment.findUnique({
            where: { id: commentId },
            include: { novel: { select: { uploaderId: true } } },
        });

        if (!comment) {
            return NextResponse.json(
                { success: false, error: "Bình luận không tồn tại" },
                { status: 404 }
            );
        }

        if (action === "vote") {
            if (!voteType || !["UPVOTE", "DOWNVOTE"].includes(voteType)) {
                return NextResponse.json(
                    { success: false, error: "voteType phải là UPVOTE hoặc DOWNVOTE" },
                    { status: 400 }
                );
            }

            const existingVote = await db.commentReaction.findUnique({
                where: {
                    userId_commentId: {
                        userId: session.user.id,
                        commentId,
                    },
                },
            });

            if (existingVote) {
                if (existingVote.type === voteType) {
                    // Toggle off
                    await db.commentReaction.delete({
                        where: { id: existingVote.id },
                    });
                } else {
                    // Change vote
                    await db.commentReaction.update({
                        where: { id: existingVote.id },
                        data: { type: voteType },
                    });
                }
            } else {
                // New vote
                await db.commentReaction.create({
                    data: {
                        userId: session.user.id,
                        commentId,
                        type: voteType,
                    },
                });
            }

            revalidatePath("/");

            return NextResponse.json({
                success: true,
                message: "Đã cập nhật vote",
            });
        }

        if (action === "pin") {
            const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
            const isUploader = comment.novel.uploaderId === session.user.id;

            if (!isAdmin && !isUploader) {
                return NextResponse.json(
                    { success: false, error: "Không có quyền ghim bình luận" },
                    { status: 403 }
                );
            }

            if (comment.isPinned) {
                // Unpin
                await db.comment.update({
                    where: { id: commentId },
                    data: { isPinned: false, pinnedAt: null, pinnedBy: null },
                });

                revalidatePath("/");

                return NextResponse.json({
                    success: true,
                    data: { pinned: false },
                    message: "Đã bỏ ghim",
                });
            }

            // Check max 3 pins
            const pinnedCount = await db.comment.count({
                where: { novelId: comment.novelId, isPinned: true },
            });

            if (pinnedCount >= 3) {
                return NextResponse.json(
                    { success: false, error: "Đã đạt tối đa 3 bình luận ghim" },
                    { status: 400 }
                );
            }

            await db.comment.update({
                where: { id: commentId },
                data: {
                    isPinned: true,
                    pinnedAt: new Date(),
                    pinnedBy: session.user.id,
                },
            });

            revalidatePath("/");

            return NextResponse.json({
                success: true,
                data: { pinned: true },
                message: "Đã ghim bình luận",
            });
        }

        return NextResponse.json(
            { success: false, error: "action không hợp lệ" },
            { status: 400 }
        );
    } catch (error) {
        console.error("PATCH /api/comments/[id] error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi cập nhật bình luận" },
            { status: 500 }
        );
    }
}
