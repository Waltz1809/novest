import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { toSlug } from "@/lib/utils";
import { revalidatePath } from "next/cache";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

/**
 * GET /api/genres/:id - Get a single genre
 * Public endpoint
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const genreId = parseInt(id, 10);

        if (isNaN(genreId)) {
            return NextResponse.json(
                { success: false, error: "ID không hợp lệ" },
                { status: 400 }
            );
        }

        const genre = await db.genre.findUnique({
            where: { id: genreId },
            include: {
                _count: {
                    select: { novels: true }
                }
            }
        });

        if (!genre) {
            return NextResponse.json(
                { success: false, error: "Không tìm thấy thể loại" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: genre
        });
    } catch (error) {
        console.error("GET /api/genres/[id] error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi tải thể loại" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/genres/:id - Update a genre
 * Admin/Moderator only
 * 
 * Body: { name: string }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();

        if (!session?.user || !["ADMIN", "MODERATOR"].includes(session.user.role as string)) {
            return NextResponse.json(
                { success: false, error: "Không có quyền thực hiện" },
                { status: 403 }
            );
        }

        const { id } = await params;
        const genreId = parseInt(id, 10);

        if (isNaN(genreId)) {
            return NextResponse.json(
                { success: false, error: "ID không hợp lệ" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { name } = body;

        if (!name || name.trim().length < 2) {
            return NextResponse.json(
                { success: false, error: "Tên thể loại phải có ít nhất 2 ký tự" },
                { status: 400 }
            );
        }

        const slug = toSlug(name);

        // Check if another genre with same name/slug exists
        const existing = await db.genre.findFirst({
            where: {
                AND: [
                    { id: { not: genreId } },
                    {
                        OR: [
                            { name: name.trim() },
                            { slug }
                        ]
                    }
                ]
            }
        });

        if (existing) {
            return NextResponse.json(
                { success: false, error: "Thể loại này đã tồn tại" },
                { status: 409 }
            );
        }

        const genre = await db.genre.update({
            where: { id: genreId },
            data: {
                name: name.trim(),
                slug,
            },
        });

        revalidatePath("/");

        return NextResponse.json({
            success: true,
            data: genre,
            message: "Đã cập nhật thể loại"
        });
    } catch (error) {
        console.error("PUT /api/genres/[id] error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi cập nhật thể loại" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/genres/:id - Delete a genre
 * Admin/Moderator only
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();

        if (!session?.user || !["ADMIN", "MODERATOR"].includes(session.user.role as string)) {
            return NextResponse.json(
                { success: false, error: "Không có quyền thực hiện" },
                { status: 403 }
            );
        }

        const { id } = await params;
        const genreId = parseInt(id, 10);

        if (isNaN(genreId)) {
            return NextResponse.json(
                { success: false, error: "ID không hợp lệ" },
                { status: 400 }
            );
        }

        // Check how many novels use this genre
        const genre = await db.genre.findUnique({
            where: { id: genreId },
            include: {
                _count: {
                    select: { novels: true }
                }
            }
        });

        if (!genre) {
            return NextResponse.json(
                { success: false, error: "Không tìm thấy thể loại" },
                { status: 404 }
            );
        }

        if (genre._count.novels > 0) {
            return NextResponse.json(
                { success: false, error: `Không thể xóa - có ${genre._count.novels} truyện đang dùng thể loại này` },
                { status: 409 }
            );
        }

        await db.genre.delete({
            where: { id: genreId },
        });

        revalidatePath("/");

        return NextResponse.json({
            success: true,
            message: "Đã xóa thể loại"
        });
    } catch (error) {
        console.error("DELETE /api/genres/[id] error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi xóa thể loại" },
            { status: 500 }
        );
    }
}
