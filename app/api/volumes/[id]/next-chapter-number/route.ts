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

        const volumeId = parseInt(id);

        // Get the highest chapter order in this volume
        const lastChapter = await db.chapter.findFirst({
            where: { volumeId },
            orderBy: { order: "desc" },
        });

        const nextOrder = lastChapter ? lastChapter.order + 1 : 1;

        return NextResponse.json({ nextOrder });
    } catch (error) {
        console.error("Error getting next chapter number:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
