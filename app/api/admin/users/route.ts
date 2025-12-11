import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logAdminActionDirect } from "@/lib/admin-log";
import { checkAdminAuth, unauthorizedResponse, safeParseInt, isValidRole } from "@/lib/api-utils";

/**
 * GET /api/admin/users - Get paginated users
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
        const where: any = search
            ? {
                OR: [
                    { name: { contains: search } },
                    { email: { contains: search } },
                    { nickname: { contains: search } },
                    { username: { contains: search } },
                ],
            }
            : {};

        const [users, total] = await Promise.all([
            db.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    role: true,
                    nickname: true,
                    username: true,
                    createdAt: true,
                    isBanned: true,
                    _count: {
                        select: { comments: true },
                    },
                },
            }),
            db.user.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                items: users,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + limit < total,
            },
        });
    } catch (error) {
        console.error("GET /api/admin/users error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi tải danh sách người dùng" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/users - Update user (role, ban/unban)
 * Admin/Moderator only
 */
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();
        const currentRole = session?.user?.role;

        if (!currentRole || (currentRole !== "ADMIN" && currentRole !== "MODERATOR")) {
            return NextResponse.json(
                { success: false, error: "Không có quyền truy cập" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { userId, action, role, reason } = body;

        if (!userId || !action) {
            return NextResponse.json(
                { success: false, error: "userId và action là bắt buộc" },
                { status: 400 }
            );
        }

        const targetUser = await db.user.findUnique({
            where: { id: userId },
            select: { role: true, name: true },
        });

        if (!targetUser) {
            return NextResponse.json(
                { success: false, error: "Không tìm thấy người dùng" },
                { status: 404 }
            );
        }

        switch (action) {
            case "updateRole": {
                if (!isValidRole(role)) {
                    return NextResponse.json(
                        { success: false, error: "Vai trò không hợp lệ" },
                        { status: 400 }
                    );
                }

                await db.user.update({
                    where: { id: userId },
                    data: { role },
                });

                revalidatePath("/admin/users");

                return NextResponse.json({
                    success: true,
                    message: "Đã cập nhật vai trò. Người dùng cần đăng nhập lại.",
                });
            }

            case "ban": {
                if (targetUser.role === "ADMIN") {
                    return NextResponse.json(
                        { success: false, error: "Không thể cấm Admin" },
                        { status: 403 }
                    );
                }

                if (currentRole === "MODERATOR" && targetUser.role !== "READER") {
                    return NextResponse.json(
                        { success: false, error: "Moderator chỉ có thể cấm người dùng thường" },
                        { status: 403 }
                    );
                }

                await db.user.update({
                    where: { id: userId },
                    data: {
                        isBanned: true,
                        banReason: reason || "Vi phạm quy định",
                    },
                });

                await logAdminActionDirect(
                    session.user.id,
                    "BAN_USER",
                    userId,
                    "USER",
                    `Cấm người dùng "${targetUser.name || "Unknown"}". Lý do: ${reason || "Vi phạm quy định"}`
                );

                revalidatePath("/admin/users");

                return NextResponse.json({
                    success: true,
                    message: "Đã cấm người dùng",
                });
            }

            case "unban": {
                if (currentRole === "MODERATOR" && targetUser.role !== "READER") {
                    return NextResponse.json(
                        { success: false, error: "Moderator chỉ có thể bỏ cấm người dùng thường" },
                        { status: 403 }
                    );
                }

                await db.user.update({
                    where: { id: userId },
                    data: {
                        isBanned: false,
                        banReason: null,
                    },
                });

                await logAdminActionDirect(
                    session.user.id,
                    "UNBAN_USER",
                    userId,
                    "USER",
                    "Bỏ cấm người dùng"
                );

                revalidatePath("/admin/users");

                return NextResponse.json({
                    success: true,
                    message: "Đã bỏ cấm người dùng",
                });
            }

            default:
                return NextResponse.json(
                    { success: false, error: "action không hợp lệ" },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error("PATCH /api/admin/users error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi cập nhật người dùng" },
            { status: 500 }
        );
    }
}
