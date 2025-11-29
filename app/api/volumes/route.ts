import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { novelId } = await request.json();

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

        // Get the highest volume order
        const lastVolume = await db.volume.findFirst({
            where: { novelId },
            orderBy: { order: "desc" },
        });

        const newOrder = lastVolume ? lastVolume.order + 1 : 1;

        // Create volume
        const volume = await db.volume.create({
            data: {
                title: `Tập ${newOrder}`,
                order: newOrder,
                novelId,
            },
        });

        return NextResponse.json(volume);
    } catch (error) {
        console.error("Error creating volume:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
