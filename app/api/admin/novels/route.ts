import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logAdminActionDirect } from "@/lib/admin-log";

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
 * GET /api/admin/novels - Get paginated novels for admin
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
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "";
        const skip = (page - 1) * limit;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};

        if (search) {
            where.title = { contains: search };
        }

        if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
            where.approvalStatus = status;
        }

        const [novels, total] = await Promise.all([
            db.novel.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    uploader: {
                        select: {
                            id: true,
                            name: true,
                            nickname: true,
                        },
                    },
                    _count: {
                        select: {
                            comments: true,
                        },
                    },
                },
            }),
            db.novel.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                items: novels,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + limit < total,
            },
        });
    } catch (error) {
        console.error("GET /api/admin/novels error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi tải danh sách truyện" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/novels - Approve/Reject/Delete novel
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
        const { novelId, action, reason } = body;

        if (!novelId || !action) {
            return NextResponse.json(
                { success: false, error: "novelId và action là bắt buộc" },
                { status: 400 }
            );
        }

        const novel = await db.novel.findUnique({
            where: { id: novelId },
            select: { title: true, uploaderId: true },
        });

        if (!novel) {
            return NextResponse.json(
                { success: false, error: "Không tìm thấy truyện" },
                { status: 404 }
            );
        }

        switch (action) {
            case "approve": {
                await db.novel.update({
                    where: { id: novelId },
                    data: {
                        approvalStatus: "APPROVED",
                        rejectionReason: null,
                    },
                });

                await db.notification.create({
                    data: {
                        userId: novel.uploaderId,
                        actorId: session.user.id,
                        type: "NOVEL_APPROVED",
                        resourceId: String(novelId),
                        resourceType: "NOVEL",
                        message: `Truyện "${novel.title}" đã được duyệt`,
                    },
                });

                await logAdminActionDirect(
                    session.user.id,
                    "APPROVE_NOVEL",
                    String(novelId),
                    "NOVEL",
                    `Duyệt truyện "${novel.title}"`
                );

                revalidatePath("/admin/novels");

                return NextResponse.json({
                    success: true,
                    message: "Đã duyệt truyện",
                });
            }

            case "reject": {
                await db.novel.update({
                    where: { id: novelId },
                    data: {
                        approvalStatus: "REJECTED",
                        rejectionReason: reason || "Không đạt yêu cầu",
                    },
                });

                await db.notification.create({
                    data: {
                        userId: novel.uploaderId,
                        actorId: session.user.id,
                        type: "NOVEL_REJECTED",
                        resourceId: String(novelId),
                        resourceType: "NOVEL",
                        message: `Truyện "${novel.title}" đã bị từ chối. Lý do: ${reason || "Không đạt yêu cầu"}`,
                    },
                });

                await logAdminActionDirect(
                    session.user.id,
                    "REJECT_NOVEL",
                    String(novelId),
                    "NOVEL",
                    `Từ chối truyện "${novel.title}". Lý do: ${reason || "Không đạt yêu cầu"}`
                );

                revalidatePath("/admin/novels");

                return NextResponse.json({
                    success: true,
                    message: "Đã từ chối truyện",
                });
            }

            case "delete": {
                await db.novel.update({
                    where: { id: novelId },
                    data: {
                        approvalStatus: "REJECTED",
                        rejectionReason: "Đã bị xóa bởi quản trị viên",
                    },
                });

                await logAdminActionDirect(
                    session.user.id,
                    "DELETE_NOVEL",
                    String(novelId),
                    "NOVEL",
                    `Ẩn truyện "${novel.title}"`
                );

                revalidatePath("/admin/novels");

                return NextResponse.json({
                    success: true,
                    message: "Đã ẩn truyện",
                });
            }

            default:
                return NextResponse.json(
                    { success: false, error: "action không hợp lệ" },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error("PATCH /api/admin/novels error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi cập nhật truyện" },
            { status: 500 }
        );
    }
}
