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
 * GET /api/novels/[slug]/chapters - Get all chapters for a novel
 * Public endpoint
 * 
 * Query params:
 * - includeContent: boolean (default: false) - include chapter content
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params;
        const { searchParams } = new URL(request.url);
        const includeContent = searchParams.get("includeContent") === "true";

        const novel = await db.novel.findUnique({
            where: { slug },
            select: {
                id: true,
                title: true,
                volumes: {
                    orderBy: { order: "asc" },
                    select: {
                        id: true,
                        title: true,
                        order: true,
                        chapters: {
                            where: { isDraft: false },
                            orderBy: { order: "asc" },
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                order: true,
                                wordCount: true,
                                isLocked: true,
                                price: true,
                                createdAt: true,
                                ...(includeContent && { content: true }),
                            },
                        },
                    },
                },
            },
        });

        if (!novel) {
            return NextResponse.json(
                { success: false, error: "Truyện không tồn tại" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                novelId: novel.id,
                novelTitle: novel.title,
                volumes: novel.volumes,
            },
        });
    } catch (error) {
        console.error("GET /api/novels/[slug]/chapters error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi tải danh sách chương" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/novels/[slug]/chapters - Create a new chapter
 * Requires authentication (novel owner only)
 * 
 * Body: { volumeId, title, content, order?, slug? }
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
        const { volumeId, title, content, order, slug: chapterSlug, isDraft } = body;

        if (!volumeId || !title?.trim()) {
            return NextResponse.json(
                { success: false, error: "volumeId và title là bắt buộc" },
                { status: 400 }
            );
        }

        // Check novel ownership
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

        if (novel.uploaderId !== session.user.id && session.user.role !== "ADMIN") {
            return NextResponse.json(
                { success: false, error: "Không có quyền thêm chương" },
                { status: 403 }
            );
        }

        // Auto-generate slug if not provided
        const finalSlug = chapterSlug || `chuong-${Date.now()}`;

        // Auto-calculate order if not provided
        let finalOrder = order;
        if (!order) {
            const maxOrderChapter = await db.chapter.findFirst({
                where: { volumeId },
                orderBy: { order: "desc" },
                select: { order: true },
            });
            finalOrder = (maxOrderChapter?.order || 0) + 1;
        }

        const chapter = await db.chapter.create({
            data: {
                title: title.trim(),
                slug: finalSlug,
                content: content || "",
                order: finalOrder,
                volumeId,
                wordCount: content ? content.split(/\s+/).length : 0,
                isDraft: isDraft ?? false,
            },
        });

        revalidatePath(`/truyen/${slug}`);

        return NextResponse.json({
            success: true,
            data: chapter,
            message: "Đã tạo chương mới",
        }, { status: 201 });
    } catch (error) {
        console.error("POST /api/novels/[slug]/chapters error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi tạo chương" },
            { status: 500 }
        );
    }
}
