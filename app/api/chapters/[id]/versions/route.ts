import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

        // Fetch versions ordered by creation date (newest first)
        const versions = await db.chapterVersion.findMany({
            where: {
                chapterId: parseInt(id),
                expiresAt: { gt: new Date() }, // Only non-expired versions
            },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                wordCount: true,
                createdAt: true,
                expiresAt: true,
            },
        });

        return NextResponse.json({ versions });
    } catch (error) {
        console.error("Error fetching chapter versions:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
