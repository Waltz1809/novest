import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

interface RouteParams {
    params: Promise<{
        username: string;
    }>;
}

/**
 * GET /api/users/:username - Get public user profile
 * Public endpoint
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { username } = await params;

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
                        badge: true,
                    },
                },
                _count: {
                    select: {
                        novels: true,
                        ratings: true,
                        comments: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Không tìm thấy người dùng" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error("GET /api/users/[username] error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi tải thông tin người dùng" },
            { status: 500 }
        );
    }
}
