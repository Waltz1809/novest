import { auth } from "@/auth";
import { db } from "@/lib/db";
import { toSlug } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { title, content, novelId, volumeId } = await request.json();

        // Verify user owns the novel
        const novel = await db.novel.findUnique({
            where: { id: novelId },
        });

        if (!novel) {
            return NextResponse.json({ error: "Novel not found" }, { status: 404 });
        }

        if (session.user.role !== "ADMIN" && novel.uploaderId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Get the highest order number in the volume
        const lastChapter = await db.chapter.findFirst({
            where: { volumeId },
            orderBy: { order: "desc" },
        });

        const newOrder = lastChapter ? lastChapter.order + 1 : 1;

        // Get volume info for slug
        const volume = await db.volume.findUnique({
            where: { id: volumeId },
        });

        if (!volume) {
            return NextResponse.json({ error: "Volume not found" }, { status: 404 });
        }

        // ============ TRANSACTION-WRAPPED CHAPTER CREATION ============
        // Step 1: Create Chapter + Step 2: Update with ID-based slug (Atomic)
        const chapter = await db.$transaction(async (tx) => {
            // Create chapter with temporary slug
            const tempChapter = await tx.chapter.create({
                data: {
                    title,
                    content,
                    volumeId,
                    order: newOrder,
                    slug: `temp-ch-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`, // Temporary unique slug
                },
            });

            // Generate final ID-based slug
            const finalSlug = `${toSlug(title)}-${tempChapter.id}`;

            // Update with final slug
            const updatedChapter = await tx.chapter.update({
                where: { id: tempChapter.id },
                data: { slug: finalSlug },
            });

            return updatedChapter;
        });

        // Create notifications for users who have this novel in their library
        try {
            const libraryUsers = await db.library.findMany({
                where: { novelId: novel.id },
                select: { userId: true },
            });

            // Create notification for each library user
            for (const libraryUser of libraryUsers) {
                await db.notification.create({
                    data: {
                        userId: libraryUser.userId,
                        type: "NEW_CHAPTER",
                        resourceId: `/truyen/${novel.slug}/${chapter.slug}`,
                        resourceType: "chapter",
                        message: `Truyện bạn thích vừa cập nhật chương [${novel.title} - ${chapter.title}] mới toanh luôn nè`,
                    },
                });
            }
        } catch (notifError) {
            console.error("Error creating chapter notifications:", notifError);
            // Don't fail the chapter creation if notification fails
        }

        return NextResponse.json(chapter);
    } catch (error) {
        console.error("Error creating  chapter:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
