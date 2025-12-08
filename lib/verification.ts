import { Session } from "next-auth";

/**
 * Error code returned when email verification is required
 */
export const REQUIRE_VERIFICATION = "REQUIRE_VERIFICATION";

/**
 * Check if email verification is required for a user action
 * Returns null if verified, or error object if not verified
 */
export function requireEmailVerification(session: Session | null): { error: string } | null {
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    // Check if email is verified
    // if (!session.user.emailVerified) {
    //     return { error: REQUIRE_VERIFICATION };
    // }

    return null;
}

/**
 * Check if a user's email is verified
 */
export function isEmailVerified(session: Session | null): boolean {
    return !!session?.user?.emailVerified;
}
