import { describe, it, expect } from "vitest";
import {
    safeParseInt,
    safeParseIntClamped,
    isValidEnum,
    isValidRole,
    isValidVoteType,
    VALID_ROLES,
    VALID_APPROVAL_STATUSES,
} from "./validation";

describe("safeParseInt", () => {
    it("returns parsed number for valid input", () => {
        expect(safeParseInt("42", 0)).toBe(42);
        expect(safeParseInt("100", 0)).toBe(100);
        expect(safeParseInt("-5", 0)).toBe(-5);
    });

    it("returns default for NaN input", () => {
        expect(safeParseInt("abc", 10)).toBe(10);
        expect(safeParseInt("12.5abc", 10)).toBe(12); // parseInt stops at non-digit
        expect(safeParseInt("", 5)).toBe(5);
    });

    it("returns default for null/undefined", () => {
        expect(safeParseInt(null, 5)).toBe(5);
    });
});

describe("safeParseIntClamped", () => {
    it("clamps value within bounds", () => {
        expect(safeParseIntClamped("100", 10, 1, 50)).toBe(50); // Clamped to max
        expect(safeParseIntClamped("0", 10, 1, 50)).toBe(1); // Clamped to min
        expect(safeParseIntClamped("25", 10, 1, 50)).toBe(25); // Within bounds
    });

    it("returns clamped default for invalid input", () => {
        expect(safeParseIntClamped("abc", 10, 1, 50)).toBe(10);
        expect(safeParseIntClamped(null, 100, 1, 50)).toBe(50); // Default exceeds max
    });
});

describe("isValidEnum", () => {
    it("returns true for valid enum values", () => {
        expect(isValidEnum("MODERATOR", VALID_ROLES)).toBe(true);
        expect(isValidEnum("READER", VALID_ROLES)).toBe(true);
        expect(isValidEnum("PENDING", VALID_APPROVAL_STATUSES)).toBe(true);
    });

    it("returns false for invalid values", () => {
        expect(isValidEnum("ADMIN", VALID_ROLES)).toBe(false);
        expect(isValidEnum("hacker", VALID_ROLES)).toBe(false);
        expect(isValidEnum("", VALID_ROLES)).toBe(false);
        expect(isValidEnum(null, VALID_ROLES)).toBe(false);
        expect(isValidEnum(123, VALID_ROLES)).toBe(false);
    });
});

describe("isValidRole", () => {
    it("accepts valid roles", () => {
        expect(isValidRole("MODERATOR")).toBe(true);
        expect(isValidRole("READER")).toBe(true);
    });

    it("rejects invalid roles", () => {
        expect(isValidRole("ADMIN")).toBe(false); // ADMIN not assignable via dashboard
        expect(isValidRole("admin")).toBe(false); // Case sensitive
        expect(isValidRole("")).toBe(false);
    });
});

describe("isValidVoteType", () => {
    it("accepts valid vote types", () => {
        expect(isValidVoteType("UPVOTE")).toBe(true);
        expect(isValidVoteType("DOWNVOTE")).toBe(true);
    });

    it("rejects invalid vote types", () => {
        expect(isValidVoteType("upvote")).toBe(false); // Case sensitive
        expect(isValidVoteType("LIKE")).toBe(false);
        expect(isValidVoteType(null)).toBe(false);
    });
});
