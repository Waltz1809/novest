import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { versionId } = await request.json();

        if (!versionId) {
            return NextResponse.json({ error: "Version ID required" }, { status: 400 });
        }

        // Get chapter with novel uploader info
        const chapter = await db.chapter.findUnique({
            where: { id: parseInt(id) },
            include: {
                volume: {
                    include: {
                        novel: {
                            select: { uploaderId: true },
                        },
                    },
                },
            },
        });

        if (!chapter) {
            return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
        }

        // Check authorization
        const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
        const isUploader = chapter.volume.novel.uploaderId === session.user.id;

        if (!isAdmin && !isUploader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Get the version to revert to
        const version = await db.chapterVersion.findUnique({
            where: { id: versionId },
        });

        if (!version || version.chapterId !== parseInt(id)) {
            return NextResponse.json({ error: "Version not found" }, { status: 404 });
        }

        if (version.expiresAt && version.expiresAt < new Date()) {
            return NextResponse.json({ error: "Version expired" }, { status: 400 });
        }

        // Save current version before reverting (so user can undo if needed)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await db.chapterVersion.create({
            data: {
                chapterId: chapter.id,
                title: chapter.title,
                content: chapter.content,
                wordCount: chapter.wordCount,
                expiresAt: expiresAt,
            },
        });

        // Revert chapter to the selected version
        const updatedChapter = await db.chapter.update({
            where: { id: parseInt(id) },
            data: {
                title: version.title,
                content: version.content,
                wordCount: version.wordCount,
            },
        });

        return NextResponse.json({ success: true, chapter: updatedChapter });
    } catch (error) {
        console.error("Error reverting chapter:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
