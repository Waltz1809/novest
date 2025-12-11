import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Re-export pure utilities
export * from "./validation";

/**
 * Check if current user is admin or moderator
 * Returns session if authorized, null otherwise
 */
export async function checkAdminAuth() {
    const session = await auth();
    const isAdminOrMod = session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";
    if (!isAdminOrMod) {
        return null;
    }
    return session;
}

/**
 * Create unauthorized response for admin routes
 */
export function unauthorizedResponse() {
    return NextResponse.json(
        { success: false, error: "Không có quyền truy cập" },
        { status: 403 }
    );
}
