import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { safeParseInt } from "@/lib/api-utils";

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
        const page = safeParseInt(searchParams.get("page"), 1);
        const limit = safeParseInt(searchParams.get("limit"), 20);
        const withUpdates = searchParams.get("withUpdates") === "true";
        const skip = (page - 1) * limit;

        if (withUpdates) {
            // Get novels with new chapters since lastReadAt
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
                                orderBy: { order: "asc" },
                                select: {
                                    order: true,
                                    chapters: {
                                        where: { isDraft: false },
                                        orderBy: { order: "asc" },
                                        select: {
                                            id: true,
                                            title: true,
                                            slug: true,
                                            order: true,
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

            // Get reading history for smart routing
            const novelIds = libraryWithUpdates.map(lib => lib.novelId);
            const readingHistories = await db.readingHistory.findMany({
                where: {
                    userId: session.user.id,
                    novelId: { in: novelIds },
                },
                include: {
                    chapter: {
                        select: { order: true },
                    },
                },
            });
            const historyMap = new Map(readingHistories.map(h => [h.novelId, h]));

            // Filter and format
            const novelsWithUpdates = libraryWithUpdates
                .map((lib) => {
                    // Flatten chapters sorted by volume order then chapter order
                    const allChapters = lib.novel.volumes.flatMap((v) =>
                        v.chapters.map(ch => ({ ...ch, volumeOrder: v.order }))
                    );

                    if (allChapters.length === 0) return null;

                    // Count new chapters since lastReadAt
                    const newChaptersCount = allChapters.filter(
                        (ch) => new Date(ch.createdAt) > new Date(lib.lastReadAt)
                    ).length;

                    if (newChaptersCount === 0) return null;

                    // Find next unread chapter based on reading history
                    const history = historyMap.get(lib.novelId);
                    let nextChapter = allChapters[0]; // Default to first

                    if (history && history.chapter) {
                        const lastReadOrder = history.chapter.order;
                        const nextUnread = allChapters.find(ch => ch.order > lastReadOrder);
                        if (nextUnread) {
                            nextChapter = nextUnread;
                        } else {
                            nextChapter = allChapters[allChapters.length - 1];
                        }
                    }

                    // Latest chapter for display
                    const latestChapter = allChapters[allChapters.length - 1];

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
                        nextChapterSlug: nextChapter.slug,
                        newChaptersCount,
                        lastReadAt: lib.lastReadAt,
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
