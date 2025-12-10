import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * GET /api/library - Get user's library (followed novels)
 * Requires authentication
 * 
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * - withUpdates: boolean - only return novels with new chapters (default: false)
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
        const limit = parseInt(searchParams.get("limit") || "20", 10);
        const withUpdates = searchParams.get("withUpdates") === "true";
        const skip = (page - 1) * limit;

        if (withUpdates) {
            // Get novels with new chapters since follow
            const libraryWithUpdates = await db.library.findMany({
                where: { userId: session.user.id },
                include: {
                    novel: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            coverImage: true,
                            volumes: {
                                select: {
                                    chapters: {
                                        where: { isDraft: false },
                                        orderBy: { createdAt: "desc" },
                                        take: 1,
                                        select: {
                                            id: true,
                                            title: true,
                                            slug: true,
                                            createdAt: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            });

            // Filter and format
            const novelsWithUpdates = libraryWithUpdates
                .map((lib) => {
                    const allChapters = lib.novel.volumes.flatMap((v) => v.chapters);
                    const latestChapter = allChapters[0];

                    const newChaptersCount = allChapters.filter(
                        (ch) => new Date(ch.createdAt) > new Date(lib.createdAt)
                    ).length;

                    if (!latestChapter || newChaptersCount === 0) return null;

                    return {
                        novelId: lib.novel.id,
                        title: lib.novel.title,
                        slug: lib.novel.slug,
                        coverImage: lib.novel.coverImage,
                        latestChapter: {
                            id: latestChapter.id,
                            title: latestChapter.title,
                            slug: latestChapter.slug,
                        },
                        newChaptersCount,
                        followedAt: lib.createdAt,
                    };
                })
                .filter((n): n is NonNullable<typeof n> => n !== null);

            return NextResponse.json({
                success: true,
                data: {
                    items: novelsWithUpdates.slice(skip, skip + limit),
                    total: novelsWithUpdates.length,
                    page,
                    limit,
                    hasMore: skip + limit < novelsWithUpdates.length,
                }
            });
        }

        // Regular library list
        const [library, total] = await Promise.all([
            db.library.findMany({
                where: { userId: session.user.id },
                include: {
                    novel: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            author: true,
                            coverImage: true,
                            status: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            db.library.count({ where: { userId: session.user.id } }),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                items: library.map((l) => ({
                    ...l.novel,
                    followedAt: l.createdAt,
                })),
                total,
                page,
                limit,
                hasMore: skip + limit < total,
            }
        });
    } catch (error) {
        console.error("GET /api/library error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi tải tủ truyện" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/library - Add novel to library (follow)
 * Requires authentication
 * 
 * Body: { novelId: number }
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Chưa đăng nhập" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { novelId } = body;

        if (!novelId) {
            return NextResponse.json(
                { success: false, error: "novelId is required" },
                { status: 400 }
            );
        }

        // Check if novel exists
        const novel = await db.novel.findUnique({
            where: { id: novelId },
            select: { id: true },
        });

        if (!novel) {
            return NextResponse.json(
                { success: false, error: "Truyện không tồn tại" },
                { status: 404 }
            );
        }

        // Check if already following
        const existing = await db.library.findUnique({
            where: {
                userId_novelId: {
                    userId: session.user.id,
                    novelId,
                },
            },
        });

        if (existing) {
            return NextResponse.json(
                { success: false, error: "Truyện đã có trong tủ" },
                { status: 409 }
            );
        }

        await db.library.create({
            data: {
                userId: session.user.id,
                novelId,
            },
        });

        revalidatePath("/tu-truyen");

        return NextResponse.json({
            success: true,
            message: "Đã thêm vào tủ truyện"
        }, { status: 201 });
    } catch (error) {
        console.error("POST /api/library error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi thêm vào tủ truyện" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/library - Remove novel from library (unfollow)
 * Requires authentication
 * 
 * Body: { novelId: number }
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
        const { novelId } = body;

        if (!novelId) {
            return NextResponse.json(
                { success: false, error: "novelId is required" },
                { status: 400 }
            );
        }

        await db.library.delete({
            where: {
                userId_novelId: {
                    userId: session.user.id,
                    novelId,
                },
            },
        });

        revalidatePath("/tu-truyen");

        return NextResponse.json({
            success: true,
            message: "Đã xóa khỏi tủ truyện"
        });
    } catch (error) {
        console.error("DELETE /api/library error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi xóa khỏi tủ truyện" },
            { status: 500 }
        );
    }
}
