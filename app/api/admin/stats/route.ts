import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * GET /api/admin/stats - Get dashboard statistics
 * Admin/Moderator only
 */
export async function GET() {
    try {
        const session = await auth();
        const isAdminOrMod = session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";

        if (!isAdminOrMod) {
            return NextResponse.json(
                { success: false, error: "Không có quyền truy cập" },
                { status: 403 }
            );
        }

        const [
            totalUsers,
            totalComments,
            totalNovels,
            openTickets,
            pendingNovels,
            bannedUsers,
            totalRatings,
        ] = await Promise.all([
            db.user.count(),
            db.comment.count(),
            db.novel.count(),
            db.ticket.count({ where: { status: "OPEN" } }),
            db.novel.count({ where: { approvalStatus: "PENDING" } }),
            db.user.count({ where: { isBanned: true } }),
            db.rating.count(),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                totalUsers,
                totalComments,
                totalNovels,
                openTickets,
                pendingNovels,
                bannedUsers,
                totalRatings,
            },
        });
    } catch (error) {
        console.error("GET /api/admin/stats error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi tải thống kê" },
            { status: 500 }
        );
    }
}
