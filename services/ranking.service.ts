import { api } from "@/lib/api-client";

// Ranking types
export type RankingType = "views" | "rating" | "latest" | "updated";

// Base novel ranking item
export interface RankingNovelBase {
    id: number;
    title: string;
    slug: string;
    author: string;
    coverImage: string | null;
}

// View ranking item
export interface ViewRankingNovel extends RankingNovelBase {
    viewCount: number;
}

// Rating ranking item
export interface RatingRankingNovel extends RankingNovelBase {
    averageRating: number;
    ratingCount: number;
}

// Latest/Updated ranking item
export interface DateRankingNovel extends RankingNovelBase {
    createdAt?: string;
    updatedAt?: string;
}

// Union type for all ranking items
export type RankingNovel = ViewRankingNovel | RatingRankingNovel | DateRankingNovel;

// Ranking params
export interface RankingParams {
    [key: string]: unknown;
    type?: RankingType;
    limit?: number;
    includeR18?: boolean;
}

/**
 * Rankings Service
 * FE service layer for ranking API calls
 */
export const rankingService = {
    /**
     * Get novels by ranking type
     */
    getRankings: (params: RankingParams = {}) =>
        api.get<RankingNovel[]>("/api/rankings", params),

    /**
     * Get top viewed novels
     */
    getTopViewed: (limit = 10) =>
        api.get<ViewRankingNovel[]>("/api/rankings", { type: "views", limit }),

    /**
     * Get top rated novels
     */
    getTopRated: (limit = 10) =>
        api.get<RatingRankingNovel[]>("/api/rankings", { type: "rating", limit }),

    /**
     * Get latest novels
     */
    getLatest: (limit = 10) =>
        api.get<DateRankingNovel[]>("/api/rankings", { type: "latest", limit }),

    /**
     * Get recently updated novels
     */
    getRecentlyUpdated: (limit = 10) =>
        api.get<DateRankingNovel[]>("/api/rankings", { type: "updated", limit }),
};
