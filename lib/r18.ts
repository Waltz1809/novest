import { Session } from "next-auth";

/**
 * Check if user is eligible to view R18 content
 * Requirements:
 * 1. Must be logged in
 * 2. Must have birthday set
 * 3. Must be 18 years or older
 * 
 * @returns true if user can view R18, false otherwise
 */
export function canViewR18(session: Session | null, userBirthday?: Date | string | null): boolean {
    // Must be logged in
    if (!session?.user) {
        return false;
    }

    // Must have birthday set
    if (!userBirthday) {
        return false;
    }

    // Calculate age
    const birthday = new Date(userBirthday);
    const today = new Date();

    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();

    // Adjust age if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
        age--;
    }

    // Must be 18 or older
    return age >= 18;
}

/**
 * Get R18 filter for Prisma queries based on user eligibility
 * Returns a where clause to filter out R18 content for ineligible users
 */
export function getR18Filter(session: Session | null, userBirthday?: Date | string | null): { isR18?: boolean } {
    if (canViewR18(session, userBirthday)) {
        return {}; // No filter, can see all content
    }
    return { isR18: false }; // Only show non-R18 content
}
