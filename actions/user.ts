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
});

/**
 * Register a new user with email and password
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
        await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "READER", // Default role
            }
        });

        return { success: "Account created successfully! You can now sign in." };
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

    const { nickname, image } = validatedFields.data;

    try {
        // Build update data object (only include fields that were provided)
        const updateData: { nickname?: string | null; image?: string | null } = {};

        if (nickname !== undefined) {
            updateData.nickname = nickname === "" ? null : nickname;
        }

        if (image !== undefined) {
            updateData.image = image === "" ? null : image;
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
