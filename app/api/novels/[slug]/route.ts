import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateSearchIndex } from "@/lib/utils";
import { revalidatePath } from "next/cache";

interface RouteParams {
    params: Promise<{
        slug: string;
    }>;
}

/**
 * GET /api/novels/:slug - Get a single novel by slug
 * Public endpoint (for approved novels)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params;

        const novel = await db.novel.findUnique({
            where: { slug },
            include: {
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
                        image: true,
                    },
                },
                translationGroup: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                volumes: {
                    orderBy: { order: "asc" },
                    include: {
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
                _count: {
                    select: {
                        ratings: true,
                        library: true,
                    },
                },
            },
        });

        if (!novel) {
            return NextResponse.json(
                { success: false, error: "Không tìm thấy truyện" },
                { status: 404 }
            );
        }

        // Check access for non-approved novels
        if (novel.approvalStatus !== "APPROVED") {
            const session = await auth();
            const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";
            const isUploader = session?.user?.id === novel.uploaderId;

            if (!isAdmin && !isUploader) {
                return NextResponse.json(
                    { success: false, error: "Truyện chưa được duyệt" },
                    { status: 403 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            data: novel
        });
    } catch (error) {
        console.error("GET /api/novels/[slug] error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi tải truyện" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/novels/:slug - Update a novel
 * Requires authentication (uploader or admin)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: "Chưa đăng nhập" },
                { status: 401 }
            );
        }

        const { slug } = await params;

        // Find the novel
        const existingNovel = await db.novel.findUnique({
            where: { slug },
            select: { id: true, uploaderId: true, coverImage: true },
        });

        if (!existingNovel) {
            return NextResponse.json(
                { success: false, error: "Không tìm thấy truyện" },
                { status: 404 }
            );
        }

        // Check authorization
        const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
        const isUploader = existingNovel.uploaderId === session.user.id;

        if (!isAdmin && !isUploader) {
            return NextResponse.json(
                { success: false, error: "Không có quyền chỉnh sửa" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const {
            title,
            newSlug,
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
        } = body;

        const searchIndex = generateSearchIndex(title, author, alternativeTitles || "");

        // Delete old cover if changed
        if (existingNovel.coverImage && existingNovel.coverImage !== coverImage) {
            const { deleteFromR2 } = await import("@/actions/upload");
            await deleteFromR2(existingNovel.coverImage);
        }

        const updatedNovel = await db.novel.update({
            where: { id: existingNovel.id },
            data: {
                title,
                slug: newSlug || slug,
                author,
                artist: artist || null,
                description,
                status,
                coverImage,
                alternativeTitles,
                searchIndex,
                nation,
                novelFormat,
                isR18: isR18 ?? false,
                isLicensedDrop: isLicensedDrop ?? false,
                genres: genreIds && genreIds.length > 0 ? {
                    set: [],
                    connect: genreIds.map((id: number) => ({ id: Number(id) })),
                } : { set: [] },
            },
        });

        revalidatePath("/");

        return NextResponse.json({
            success: true,
            data: updatedNovel,
            message: "Đã cập nhật truyện"
        });
    } catch (error) {
        console.error("PUT /api/novels/[slug] error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi cập nhật truyện" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/novels/:slug - Delete a novel
 * Requires admin role
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: "Chưa đăng nhập" },
                { status: 401 }
            );
        }

        const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: "Không có quyền xóa" },
                { status: 403 }
            );
        }

        const { slug } = await params;

        const novel = await db.novel.findUnique({
            where: { slug },
            select: { id: true },
        });

        if (!novel) {
            return NextResponse.json(
                { success: false, error: "Không tìm thấy truyện" },
                { status: 404 }
            );
        }

        await db.novel.delete({
            where: { id: novel.id },
        });

        revalidatePath("/");

        return NextResponse.json({
            success: true,
            message: "Đã xóa truyện"
        });
    } catch (error) {
        console.error("DELETE /api/novels/[slug] error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi xóa truyện" },
            { status: 500 }
        );
    }
}
