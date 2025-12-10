import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { toSlug } from "@/lib/utils";
import { revalidatePath } from "next/cache";

/**
 * GET /api/genres - List all genres
 * Public endpoint - no auth required
 * 
 * Query params:
 * - withCount: boolean - include novel count (default: false)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const withCount = searchParams.get("withCount") === "true";

        const genres = await db.genre.findMany({
            orderBy: { name: "asc" },
            ...(withCount && {
                include: {
                    _count: {
                        select: { novels: true }
                    }
                }
            })
        });

        return NextResponse.json({
            success: true,
            data: genres
        });
    } catch (error) {
        console.error("GET /api/genres error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi tải danh sách thể loại" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/genres - Create a new genre
 * Admin/Moderator only
 * 
 * Body: { name: string }
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || !["ADMIN", "MODERATOR"].includes(session.user.role as string)) {
            return NextResponse.json(
                { success: false, error: "Không có quyền thực hiện" },
                { status: 403 }
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

        // Check if genre already exists
        const existing = await db.genre.findFirst({
            where: {
                OR: [
                    { name: name.trim() },
                    { slug }
                ]
            }
        });

        if (existing) {
            return NextResponse.json(
                { success: false, error: "Thể loại này đã tồn tại" },
                { status: 409 }
            );
        }

        const genre = await db.genre.create({
            data: {
                name: name.trim(),
                slug,
            },
        });

        // Revalidate cached data
        revalidatePath("/");

        return NextResponse.json({
            success: true,
            data: genre,
            message: "Đã tạo thể loại mới"
        }, { status: 201 });
    } catch (error) {
        console.error("POST /api/genres error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi tạo thể loại" },
            { status: 500 }
        );
    }
}
