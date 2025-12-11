import { api } from "@/lib/api-client";

// Rating item
export interface RatingItem {
    id: number;
    score: number;
    review: string | null;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        nickname: string | null;
        username: string | null;
        image: string | null;
    };
    commentCount: number;
}

// Rating list response
export interface RatingListResponse {
    items: RatingItem[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    stats: {
        averageScore: number;
        totalRatings: number;
    };
}

// Rating list params
export interface RatingListParams {
    [key: string]: unknown;
    page?: number;
    limit?: number;
}

// Create/update rating params
export interface RatingParams {
    score: number;
    review?: string;
}

/**
 * Rating Service
 * FE service layer for rating API calls
 */
export const ratingService = {
    /**
     * Get ratings for a novel
     */
    getAll: (novelSlug: string, params: RatingListParams = {}) =>
        api.get<RatingListResponse>(`/api/novels/${novelSlug}/ratings`, params),

    /**
     * Create or update a rating
     */
    submit: (novelSlug: string, data: RatingParams) =>
        api.post<RatingItem>(`/api/novels/${novelSlug}/ratings`, data),

    /**
     * Delete user's rating
     */
    delete: (novelSlug: string) =>
        api.delete<void>(`/api/novels/${novelSlug}/ratings`),
};
