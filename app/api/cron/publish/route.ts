import { NextResponse } from "next/server";
import { publishScheduledChapters } from "@/actions/cron";

// Secret token for cron authentication (set in environment)
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
    // Verify cron secret if configured
    if (CRON_SECRET) {
        const authHeader = request.headers.get("authorization");
        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        const result = await publishScheduledChapters();
        return NextResponse.json(result);
    } catch (error) {
        console.error("[Cron API] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// Also allow POST for flexibility
export async function POST(request: Request) {
    return GET(request);
}
