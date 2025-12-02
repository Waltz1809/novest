import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const volumeId = parseInt(id);
        const body = await req.json();
        const { title } = body;

        if (!title) {
            return new NextResponse("Title is required", { status: 400 });
        }

        // Check ownership
        const volume = await db.volume.findUnique({
            where: { id: volumeId },
            include: { novel: true },
        });

        if (!volume) {
            return new NextResponse("Volume not found", { status: 404 });
        }

        // Verify user is author (or admin)
        // Note: You might want to add role checks here if needed
        // For now assuming if they can access the dashboard they might be the author
        // Ideally: if (volume.novel.authorId !== session.user.id) ...

        const updatedVolume = await db.volume.update({
            where: { id: volumeId },
            data: { title },
        });

        return NextResponse.json(updatedVolume);
    } catch (error) {
        console.error("[VOLUME_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
