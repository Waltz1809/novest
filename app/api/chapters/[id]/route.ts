import { auth } from "@/auth";
import { db } from "@/lib/db";
import { calculateWordCount } from "@/lib/utils";
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

        const chapter = await db.chapter.findUnique({
            where: { id: parseInt(id) },
            include: {
                volume: {
                    include: {
                        novel: true,
                    },
                },
            },
        });

        if (!chapter) {
            return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
        }

        // Check authorization
        if (
            session.user.role !== "ADMIN" &&
            chapter.volume.novel.uploaderId !== session.user.id
        ) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        return NextResponse.json(chapter);
    } catch (error) {
        console.error("Error fetching chapter:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { title, content } = await request.json();

        const chapter = await db.chapter.findUnique({
            where: { id: parseInt(id) },
            include: {
                volume: {
                    include: {
                        novel: true,
                    },
                },
            },
        });

        if (!chapter) {
            return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
        }

        // Check authorization
        if (
            session.user.role !== "ADMIN" &&
            chapter.volume.novel.uploaderId !== session.user.id
        ) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const wordCount = calculateWordCount(content);
        const updatedChapter = await db.chapter.update({
            where: { id: parseInt(id) },
            data: {
                title,
                content,
                wordCount,
            },
        });

        return NextResponse.json(updatedChapter);
    } catch (error) {
        console.error("Error updating chapter:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
