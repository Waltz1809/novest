/**
 * Pure utility functions for validation and parsing
 * No external dependencies - safe for unit testing
 */

// Valid roles that can be assigned via dashboard
export const VALID_ROLES = ["MODERATOR", "READER"] as const;

// Valid vote types
export const VALID_VOTE_TYPES = ["UPVOTE", "DOWNVOTE"] as const;

// Valid approval statuses
export const VALID_APPROVAL_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

// Valid novel statuses  
export const VALID_NOVEL_STATUSES = ["ONGOING", "COMPLETED", "HIATUS", "DROPPED"] as const;

/**
 * Parse integer from string with NaN validation
 * Returns default value if parsing fails or result is NaN
 */
export function safeParseInt(value: string | null, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse and clamp integer within bounds
 * Useful for pagination limit validation
 */
export function safeParseIntClamped(
    value: string | null,
    defaultValue: number,
    min: number,
    max: number
): number {
    const parsed = safeParseInt(value, defaultValue);
    return Math.min(Math.max(parsed, min), max);
}

/**
 * Validate if value is in allowed list
 */
export function isValidEnum<T extends string>(
    value: unknown,
    allowed: readonly T[]
): value is T {
    return typeof value === "string" && allowed.includes(value as T);
}

/**
 * Type guard for vote types
 */
export function isValidVoteType(value: unknown): value is "UPVOTE" | "DOWNVOTE" {
    return isValidEnum(value, VALID_VOTE_TYPES);
}

/**
 * Type guard for roles
 */
export function isValidRole(value: unknown): value is "MODERATOR" | "READER" {
    return isValidEnum(value, VALID_ROLES);
}
