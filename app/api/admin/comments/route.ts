import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logAdminActionDirect } from "@/lib/admin-log";
import { checkAdminAuth, unauthorizedResponse, safeParseInt } from "@/lib/api-utils";

/**
 * GET /api/admin/comments - Get paginated comments for admin
 * Admin/Moderator only
 */
export async function GET(request: NextRequest) {
    try {
        const session = await checkAdminAuth();
        if (!session) {
            return unauthorizedResponse();
        }

        const { searchParams } = new URL(request.url);
        const page = safeParseInt(searchParams.get("page"), 1);
        const limit = safeParseInt(searchParams.get("limit"), 10);
        const search = searchParams.get("search") || "";
        const skip = (page - 1) * limit;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = search ? { content: { contains: search } } : {};

        const [comments, total] = await Promise.all([
            db.comment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                            nickname: true,
                        },
                    },
                    novel: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                        },
                    },
                    chapter: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            }),
            db.comment.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                items: comments,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + limit < total,
            },
        });
    } catch (error) {
        console.error("GET /api/admin/comments error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi tải danh sách bình luận" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/comments - Delete a comment
 * Admin/Moderator only
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await checkAdminAuth();
        if (!session) {
            return unauthorizedResponse();
        }

        const body = await request.json();
        const { commentId } = body;

        if (!commentId) {
            return NextResponse.json(
                { success: false, error: "commentId là bắt buộc" },
                { status: 400 }
            );
        }

        const comment = await db.comment.findUnique({
            where: { id: commentId },
            select: { content: true, userId: true },
        });

        if (!comment) {
            return NextResponse.json(
                { success: false, error: "Bình luận không tồn tại" },
                { status: 404 }
            );
        }

        await db.comment.delete({
            where: { id: commentId },
        });

        await logAdminActionDirect(
            session.user.id,
            "DELETE_COMMENT",
            String(commentId),
            "COMMENT",
            `Xóa bình luận: "${comment.content.substring(0, 50)}..."`
        );

        revalidatePath("/admin/comments");

        return NextResponse.json({
            success: true,
            message: "Đã xóa bình luận",
        });
    } catch (error) {
        console.error("DELETE /api/admin/comments error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi xóa bình luận" },
            { status: 500 }
        );
    }
}
