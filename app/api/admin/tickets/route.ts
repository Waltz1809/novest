import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Helper to check admin or moderator role
async function checkAdmin() {
    const session = await auth();
    const isAdminOrMod = session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";
    if (!isAdminOrMod) {
        return null;
    }
    return session;
}

/**
 * GET /api/admin/tickets - Get paginated tickets
 * Admin/Moderator only
 */
export async function GET(request: NextRequest) {
    try {
        const session = await checkAdmin();
        if (!session) {
            return NextResponse.json(
                { success: false, error: "Không có quyền truy cập" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const status = searchParams.get("status") || "";
        const skip = (page - 1) * limit;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = status ? { status } : {};

        const [tickets, total] = await Promise.all([
            db.ticket.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                            nickname: true,
                        },
                    },
                },
            }),
            db.ticket.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                items: tickets,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + limit < total,
            },
        });
    } catch (error) {
        console.error("GET /api/admin/tickets error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi tải danh sách ticket" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/tickets - Update ticket status
 * Admin/Moderator only
 */
export async function PATCH(request: NextRequest) {
    try {
        const session = await checkAdmin();
        if (!session) {
            return NextResponse.json(
                { success: false, error: "Không có quyền truy cập" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { ticketId, status } = body;

        if (!ticketId || !status) {
            return NextResponse.json(
                { success: false, error: "ticketId và status là bắt buộc" },
                { status: 400 }
            );
        }

        const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { success: false, error: "Trạng thái không hợp lệ" },
                { status: 400 }
            );
        }

        await db.ticket.update({
            where: { id: ticketId },
            data: { status },
        });

        revalidatePath("/admin/tickets");

        return NextResponse.json({
            success: true,
            message: "Đã cập nhật trạng thái ticket",
        });
    } catch (error) {
        console.error("PATCH /api/admin/tickets error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi cập nhật ticket" },
            { status: 500 }
        );
    }
}
