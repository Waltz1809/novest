import { auth } from "@/auth";
import { db } from "@/lib/db";
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

        // Create chapter
        const chapter = await db.chapter.create({
            data: {
                title,
                content,
                volumeId,
                order: newOrder,
                slug: `volume-${volume.order}-chapter-${newOrder}`,
            },
        });

        return NextResponse.json(chapter);
    } catch (error) {
        console.error("Error creating chapter:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
