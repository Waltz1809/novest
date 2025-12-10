import { api } from "@/lib/api-client";

// Public user profile
export interface UserProfile {
    id: string;
    name: string | null;
    nickname: string | null;
    username: string | null;
    image: string | null;
    role: string;
    createdAt: string;
    badges: Array<{
        badge: {
            id: string;
            name: string;
            description: string;
            icon: string;
        };
    }>;
    _count: {
        novels: number;
        ratings: number;
        comments: number;
    };
}

/**
 * User Service
 * FE service layer for user API calls
 */
export const userService = {
    /**
     * Get public user profile by username
     */
    getProfile: (username: string) =>
        api.get<UserProfile>(`/api/users/${username}`),
};
