import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateSearchIndex } from "@/lib/utils";
import { revalidatePath } from "next/cache";

/**
 * GET /api/novels - List novels
 * Public endpoint
 * 
 * Query params:
 * - status: string - novel status filter (ONGOING, COMPLETED, etc.)
 * - approvalStatus: string - PENDING, APPROVED, REJECTED (admin only)
 * - uploaderId: string - filter by uploader
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 50)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const status = searchParams.get("status") || "";
        const approvalStatus = searchParams.get("approvalStatus") || "APPROVED";
        const uploaderId = searchParams.get("uploaderId") || "";
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
        const skip = (page - 1) * limit;

        // Check if requesting non-approved novels (requires admin)
        const session = await auth();
        const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};

        // Non-admins can only see approved novels
        if (!isAdmin || approvalStatus === "APPROVED") {
            where.approvalStatus = "APPROVED";
        } else if (approvalStatus) {
            where.approvalStatus = approvalStatus;
        }

        if (status) {
            where.status = status;
        }

        if (uploaderId) {
            where.uploaderId = uploaderId;
        }

        const [novels, total] = await Promise.all([
            db.novel.findMany({
                where,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    author: true,
                    coverImage: true,
                    status: true,
                    approvalStatus: true,
                    viewCount: true,
                    createdAt: true,
                    updatedAt: true,
                    genres: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                    uploader: {
                        select: {
                            id: true,
                            name: true,
                            nickname: true,
                            username: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
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
                hasMore: skip + limit < total,
            }
        });
    } catch (error) {
        console.error("GET /api/novels error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi tải danh sách truyện" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/novels - Create a new novel
 * Requires authentication
 * 
 * Body: CreateNovelDto
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: "Chưa đăng nhập" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            title,
            slug,
            author,
            artist,
            description,
            status,
            coverImage,
            alternativeTitles,
            genreIds,
            nation,
            novelFormat,
            isR18,
            isLicensedDrop,
            groupId,
        } = body;

        // Basic validation
        if (!title || !slug || !author || !description || !coverImage) {
            return NextResponse.json(
                { success: false, error: "Vui lòng điền đầy đủ thông tin bắt buộc" },
                { status: 400 }
            );
        }

        // Check if slug already exists
        const existingNovel = await db.novel.findUnique({
            where: { slug },
            select: { id: true, title: true },
        });

        if (existingNovel) {
            return NextResponse.json(
                { success: false, error: `Truyện này có lẽ đã có tại Novest. Tìm "${existingNovel.title}"` },
                { status: 409 }
            );
        }

        // Verify user exists
        const userExists = await db.user.findUnique({
            where: { id: session.user.id },
            select: { id: true }
        });

        if (!userExists) {
            return NextResponse.json(
                { success: false, error: "Không tìm thấy người dùng. Vui lòng đăng nhập lại." },
                { status: 401 }
            );
        }

        // Validate genre IDs
        let validGenreIds: number[] = [];
        if (genreIds && genreIds.length > 0) {
            const existingGenres = await db.genre.findMany({
                where: { id: { in: genreIds.map((id: number) => Number(id)) } },
                select: { id: true }
            });
            validGenreIds = existingGenres.map(g => g.id);
        }

        const searchIndex = generateSearchIndex(title, author, alternativeTitles || "");

        const novel = await db.novel.create({
            data: {
                title,
                slug,
                author,
                artist: artist || null,
                description,
                status: status || "ONGOING",
                coverImage,
                alternativeTitles,
                searchIndex,
                uploaderId: session.user.id,
                approvalStatus: "PENDING",
                nation: nation || "CN",
                novelFormat: novelFormat || "WN",
                isR18: isR18 ?? false,
                isLicensedDrop: isLicensedDrop ?? false,
                translationGroupId: groupId || null,
                genres: validGenreIds.length > 0 ? {
                    connect: validGenreIds.map((id) => ({ id })),
                } : undefined,
            },
        });

        // Notify admins (fire and forget)
        try {
            const admins = await db.user.findMany({
                where: {
                    role: { in: ["ADMIN", "MODERATOR"] },
                },
                select: { id: true },
            });

            const uploaderName = session.user.nickname || session.user.name || "Người dùng";

            await Promise.all(
                admins.map((admin) =>
                    db.notification.create({
                        data: {
                            userId: admin.id,
                            actorId: session.user.id,
                            type: "NEW_NOVEL_SUBMISSION",
                            resourceId: novel.slug,
                            resourceType: "NOVEL",
                            message: `${uploaderName} đã gửi truyện "${novel.title}" chờ duyệt`,
                        },
                    })
                )
            );
        } catch (notifyError) {
            console.error("Failed to notify admins:", notifyError);
        }

        revalidatePath("/");

        return NextResponse.json({
            success: true,
            data: novel,
            message: "Đã tạo truyện mới"
        }, { status: 201 });
    } catch (error) {
        console.error("POST /api/novels error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi tạo truyện" },
            { status: 500 }
        );
    }
}
