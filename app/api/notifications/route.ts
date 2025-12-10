import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * GET /api/notifications - Get user's notifications
 * Requires authentication
 * 
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 15)
 * - unreadOnly: boolean (default: false)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Chưa đăng nhập" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "15", 10);
        const unreadOnly = searchParams.get("unreadOnly") === "true";
        const skip = (page - 1) * limit;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = { userId: session.user.id };
        if (unreadOnly) {
            where.isRead = false;
        }

        const [notifications, total, unreadCount] = await Promise.all([
            db.notification.findMany({
                where,
                include: {
                    actor: {
                        select: {
                            id: true,
                            name: true,
                            nickname: true,
                            username: true,
                            image: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip,
            }),
            db.notification.count({ where }),
            db.notification.count({
                where: { userId: session.user.id, isRead: false },
            }),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                items: notifications,
                total,
                unreadCount,
                page,
                limit,
                hasMore: skip + limit < total,
            }
        });
    } catch (error) {
        console.error("GET /api/notifications error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi tải thông báo" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/notifications - Mark notifications as read
 * Requires authentication
 * 
 * Body: { ids?: string[], all?: boolean }
 */
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Chưa đăng nhập" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { ids, all } = body;

        if (all) {
            // Mark all as read
            await db.notification.updateMany({
                where: {
                    userId: session.user.id,
                    isRead: false,
                },
                data: { isRead: true },
            });
        } else if (ids && Array.isArray(ids) && ids.length > 0) {
            // Mark specific notifications as read
            await db.notification.updateMany({
                where: {
                    id: { in: ids },
                    userId: session.user.id,
                },
                data: { isRead: true },
            });
        } else {
            return NextResponse.json(
                { success: false, error: "Vui lòng cung cấp ids hoặc all=true" },
                { status: 400 }
            );
        }

        revalidatePath("/");

        return NextResponse.json({
            success: true,
            message: "Đã đánh dấu đã đọc"
        });
    } catch (error) {
        console.error("PATCH /api/notifications error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi cập nhật thông báo" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/notifications - Delete notifications
 * Requires authentication
 * 
 * Body: { ids?: string[], all?: boolean }
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Chưa đăng nhập" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { ids, all } = body;

        if (all) {
            await db.notification.deleteMany({
                where: { userId: session.user.id },
            });
        } else if (ids && Array.isArray(ids) && ids.length > 0) {
            await db.notification.deleteMany({
                where: {
                    id: { in: ids },
                    userId: session.user.id,
                },
            });
        } else {
            return NextResponse.json(
                { success: false, error: "Vui lòng cung cấp ids hoặc all=true" },
                { status: 400 }
            );
        }

        revalidatePath("/");

        return NextResponse.json({
            success: true,
            message: "Đã xóa thông báo"
        });
    } catch (error) {
        console.error("DELETE /api/notifications error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi xóa thông báo" },
            { status: 500 }
        );
    }
}
