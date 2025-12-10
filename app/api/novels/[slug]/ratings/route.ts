import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

interface RouteParams {
    params: Promise<{
        slug: string;
    }>;
}

/**
 * GET /api/novels/[slug]/ratings - Get ratings for a novel
 * Public endpoint
 * 
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 10)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params;
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const skip = (page - 1) * limit;

        const novel = await db.novel.findUnique({
            where: { slug },
            select: { id: true },
        });

        if (!novel) {
            return NextResponse.json(
                { success: false, error: "Truyện không tồn tại" },
                { status: 404 }
            );
        }

        const [ratings, total, stats] = await Promise.all([
            db.rating.findMany({
                where: { novelId: novel.id },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            nickname: true,
                            username: true,
                            image: true,
                        },
                    },
                    _count: {
                        select: { ratingComments: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            db.rating.count({ where: { novelId: novel.id } }),
            db.rating.aggregate({
                where: { novelId: novel.id },
                _avg: { score: true },
                _count: { _all: true },
            }),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                items: ratings.map(r => ({
                    ...r,
                    commentCount: r._count.ratingComments,
                    _count: undefined,
                })),
                total,
                page,
                limit,
                hasMore: skip + limit < total,
                stats: {
                    averageScore: stats._avg.score || 0,
                    totalRatings: stats._count._all,
                },
            },
        });
    } catch (error) {
        console.error("GET /api/novels/[slug]/ratings error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi tải đánh giá" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/novels/[slug]/ratings - Create or update a rating
 * Requires authentication
 * 
 * Body: { score: number (1-5), review?: string }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Chưa đăng nhập" },
                { status: 401 }
            );
        }

        const { slug } = await params;
        const body = await request.json();
        const { score, content } = body;

        if (!score || score < 1 || score > 5) {
            return NextResponse.json(
                { success: false, error: "Điểm đánh giá phải từ 1 đến 5" },
                { status: 400 }
            );
        }

        const novel = await db.novel.findUnique({
            where: { slug },
            select: { id: true, uploaderId: true },
        });

        if (!novel) {
            return NextResponse.json(
                { success: false, error: "Truyện không tồn tại" },
                { status: 404 }
            );
        }

        // Check if user is uploader
        if (novel.uploaderId === session.user.id) {
            return NextResponse.json(
                { success: false, error: "Không thể tự đánh giá truyện của mình" },
                { status: 400 }
            );
        }

        // Upsert rating
        const rating = await db.rating.upsert({
            where: {
                userId_novelId: {
                    userId: session.user.id,
                    novelId: novel.id,
                },
            },
            update: {
                score,
                content: content?.trim() || null,
            },
            create: {
                userId: session.user.id,
                novelId: novel.id,
                score,
                content: content?.trim() || null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        nickname: true,
                        username: true,
                        image: true,
                    },
                },
            },
        });

        revalidatePath(`/truyen/${slug}`);

        return NextResponse.json({
            success: true,
            data: rating,
            message: "Đã gửi đánh giá",
        });
    } catch (error) {
        console.error("POST /api/novels/[slug]/ratings error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi gửi đánh giá" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/novels/[slug]/ratings - Delete user's rating
 * Requires authentication
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Chưa đăng nhập" },
                { status: 401 }
            );
        }

        const { slug } = await params;

        const novel = await db.novel.findUnique({
            where: { slug },
            select: { id: true },
        });

        if (!novel) {
            return NextResponse.json(
                { success: false, error: "Truyện không tồn tại" },
                { status: 404 }
            );
        }

        await db.rating.delete({
            where: {
                userId_novelId: {
                    userId: session.user.id,
                    novelId: novel.id,
                },
            },
        });

        revalidatePath(`/truyen/${slug}`);

        return NextResponse.json({
            success: true,
            message: "Đã xóa đánh giá",
        });
    } catch (error) {
        console.error("DELETE /api/novels/[slug]/ratings error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi xóa đánh giá" },
            { status: 500 }
        );
    }
}
