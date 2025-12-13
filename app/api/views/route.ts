import { NextRequest, NextResponse } from "next/server";
import { incrementChapterView } from "@/actions/view";

/**
 * POST /api/views - Increment view count for a chapter completion
 * Called by GA4 tracker when user scrolls >= 85% of chapter content
 * 
 * Body: { novelId: number, chapterId: number }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { novelId, chapterId } = body;

        if (!novelId || !chapterId) {
            return NextResponse.json(
                { success: false, error: "novelId and chapterId are required" },
                { status: 400 }
            );
        }

        const result = await incrementChapterView(novelId, chapterId);

        return NextResponse.json({
            success: true,
            counted: result,
        });
    } catch (error) {
        console.error("POST /api/views error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to increment view" },
            { status: 500 }
        );
    }
}
