"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Registration Schema with strict validation
const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name too long"),
    email: z.string().email("Invalid email address"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
});

// Profile Update Schema with strict validation
const updateProfileSchema = z.object({
    nickname: z.string().min(2, "Nickname must be at least 2 characters").max(30, "Nickname too long").optional().or(z.literal("")),
    image: z.string().url("Invalid image URL").optional().or(z.literal("")),
    username: z.string()
        .min(3, "Username must be at least 3 characters")
        .max(20, "Username must be at most 20 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
        .optional()
        .or(z.literal("")),
    birthday: z.string().optional(), // ISO date string (YYYY-MM-DD)
});

/**
 * Register a new user with email and password
 * Auto-signs in the user after successful registration (Zero-Friction Flow)
 */
export async function registerUser(data: z.infer<typeof registerSchema>) {
    // Validate input data
    const validatedFields = registerSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.issues[0].message || "Invalid input data"
        };
    }

    const { name, email, password } = validatedFields.data;

    try {
        // Check if user already exists
        const existingUser = await db.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return { error: "Email already registered" };
        }

        // Hash password with bcrypt (salt rounds: 12)
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user
        const newUser = await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "READER", // Default role
            }
        });

        // Generate auto username (same logic as createUser event)
        const emailPrefix = email.split('@')[0];
        let username = emailPrefix.replace(/[^a-zA-Z0-9_]/g, '');

        const existingUsername = await db.user.findUnique({
            where: { username }
        });

        if (existingUsername) {
            const randomDigits = Math.floor(1000 + Math.random() * 9000);
            username = `${username}_${randomDigits}`;
        }

        await db.user.update({
            where: { id: newUser.id },
            data: { username }
        });

        // Return success with auto-signin flag
        return {
            success: true,
            autoSignIn: true,
            email,
            password // Pass back for client-side signIn call
        };
    } catch (error) {
        console.error("Registration error:", error);
        return { error: "Something went wrong. Please try again." };
    }
}

/**
 * Update user profile (nickname and image)
 */
export async function updateProfile(data: z.infer<typeof updateProfileSchema>) {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized. Please sign in." };
    }

    // Validate input data
    const validatedFields = updateProfileSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.issues[0].message || "Invalid input data"
        };
    }

    const { nickname, image, username, birthday } = validatedFields.data;

    try {
        // Get current user data to check for old image and locked fields
        const currentUser = await db.user.findUnique({
            where: { id: session.user.id },
            select: {
                image: true,
                username: true,
                email: true,
                birthday: true // Check if already set
            }
        });

        // Build update data object (only include fields that were provided)
        const updateData: { nickname?: string | null; image?: string | null; username?: string; birthday?: Date | null } = {};

        if (nickname !== undefined) {
            updateData.nickname = nickname === "" ? null : nickname;
        }

        if (image !== undefined) {
            // Delete old image from R2 if it exists and is different from the new one
            if (currentUser?.image && currentUser.image !== image && image !== "") {
                const { deleteFromR2 } = await import("./upload");
                await deleteFromR2(currentUser.image);
            }
            updateData.image = image === "" ? null : image;
        }

        if (username) {
            // Check if username is taken by another user
            const existingUser = await db.user.findUnique({
                where: { username }
            });

            if (existingUser && existingUser.id !== session.user.id) {
                return { error: "Username is already taken" };
            }

            // Check if user is allowed to change username
            // Logic: Can only change if current username is "default" (matches email prefix)
            // or if the new username is same as old (no change)
            if (currentUser?.username && currentUser.username !== username) {
                const emailPrefix = currentUser.email?.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
                // We also need to account for the random digits if collision happened, but simpler heuristic:
                // If current username starts with email prefix, it's likely default.
                // OR simpler: If current username is NOT the default one, lock it.

                // Let's try to be strict:
                // If the user has a username that DOES NOT look like a default one, we assume they set it.
                // Default format: emailPrefix OR emailPrefix_XXXX

                const isDefault = currentUser.username === emailPrefix ||
                    (emailPrefix && currentUser.username.startsWith(emailPrefix + "_") && currentUser.username.length === emailPrefix.length + 5);

                if (!isDefault) {
                    return { error: "Bạn chỉ có thể thay đổi định danh một lần duy nhất." };
                }
            }

            updateData.username = username;
        }

        // Handle birthday update - one-time set only (like username)
        if (birthday !== undefined && birthday !== "") {
            // Check if birthday is already set
            if (currentUser?.birthday) {
                return { error: "Bạn chỉ có thể đặt ngày sinh một lần duy nhất." };
            }
            updateData.birthday = new Date(birthday);
        }

        // Update user profile
        await db.user.update({
            where: { id: session.user.id },
            data: updateData
        });

        return { success: "Profile updated successfully!" };
    } catch (error) {
        console.error("Profile update error:", error);
        return { error: "Failed to update profile. Please try again." };
    }
}

/**
 * Check if a username is available
 */
export async function checkUsernameAvailability(username: string) {
    if (!username || username.length < 3) return false;

    try {
        const user = await db.user.findUnique({
            where: { username }
        });
        return !user;
    } catch (error) {
        console.error("Check username error:", error);
        return false;
    }
}

/**
 * Get current user's birthday (to check if locked)
 */
export async function getUserBirthday(): Promise<Date | null> {
    const session = await auth();
    if (!session?.user?.id) return null;

    try {
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { birthday: true }
        });
        return user?.birthday || null;
    } catch {
        return null;
    }
}

/**
 * Get current user's real username and lock status from DB
 * This bypasses stale session data
 */
export async function getUsernameStatus(): Promise<{ username: string; isLocked: boolean; email: string } | null> {
    const session = await auth();
    if (!session?.user?.id) return null;

    try {
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { username: true, email: true }
        });

        if (!user || !user.username || !user.email) return null;

        // Check if username is auto-generated (matches email prefix pattern)
        const emailPrefix = user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
        const currentUsername = user.username;

        const isAutoGenerated = currentUsername === emailPrefix ||
            (currentUsername.startsWith(emailPrefix + "_") &&
                currentUsername.length === emailPrefix.length + 5 &&
                /^\d{4}$/.test(currentUsername.slice(-4)));

        return {
            username: user.username,
            isLocked: !isAutoGenerated,
            email: user.email
        };
    } catch {
        return null;
    }
}

/**
 * Get user profile by username
 */
export async function getUserProfile(username: string) {
    try {
        const user = await db.user.findUnique({
            where: { username },
            select: {
                id: true,
                name: true,
                nickname: true,
                username: true,
                image: true,
                role: true,
                createdAt: true,
                badges: {
                    include: {
                        badge: true
                    }
                }
            }
        });

        return user;
    } catch (error) {
        console.error("Get user profile error:", error);
        return null;
    }
}
