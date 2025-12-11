import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { checkAdminAuth, unauthorizedResponse, safeParseInt, isValidEnum } from "@/lib/api-utils";

// Valid ticket statuses
const VALID_TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

/**
 * GET /api/admin/tickets - Get paginated tickets
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
        const status = searchParams.get("status") || "";
        const skip = (page - 1) * limit;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = isValidEnum(status, VALID_TICKET_STATUSES) ? { status } : {};

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
        const session = await checkAdminAuth();
        if (!session) {
            return unauthorizedResponse();
        }

        const body = await request.json();
        const { ticketId, status } = body;

        if (!ticketId || !status) {
            return NextResponse.json(
                { success: false, error: "ticketId và status là bắt buộc" },
                { status: 400 }
            );
        }

        if (!isValidEnum(status, VALID_TICKET_STATUSES)) {
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
