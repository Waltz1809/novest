import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/library/read
 * Mark library entry(s) as read (update lastReadAt)
 * Body: { novelId?: number, all?: boolean }
 */
export async function PATCH(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { novelId, all } = body as { novelId?: number; all?: boolean };

        if (all) {
            // Mark all library entries as read
            await db.library.updateMany({
                where: { userId: session.user.id },
                data: { lastReadAt: new Date() },
            });
        } else if (novelId) {
            // Mark single entry as read
            await db.library.update({
                where: {
                    userId_novelId: {
                        userId: session.user.id,
                        novelId,
                    },
                },
                data: { lastReadAt: new Date() },
            });
        } else {
            return NextResponse.json(
                { error: "Either novelId or all must be provided" },
                { status: 400 }
            );
        }

        revalidatePath("/");
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[PATCH /api/library/read] Error:", error);
        return NextResponse.json(
            { error: "Failed to mark as read" },
            { status: 500 }
        );
    }
}
