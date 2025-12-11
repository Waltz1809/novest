import { api } from "@/lib/api-client";
import { Genre, GenreWithCount } from "@/types/api";

/**
 * Genre Service
 * FE service layer for genre API calls
 */
export const genreService = {
    /**
     * Get all genres
     * @param withCount - Include novel count for each genre
     */
    getAll: (withCount = false) =>
        api.get<Genre[]>("/api/genres", { withCount }),

    /**
     * Get all genres with novel counts (admin view)
     */
    getAllWithCount: () =>
        api.get<GenreWithCount[]>("/api/genres", { withCount: true }),

    /**
     * Get a single genre by ID
     */
    getById: (id: number) =>
        api.get<GenreWithCount>(`/api/genres/${id}`),

    /**
     * Create a new genre (Admin only)
     */
    create: (name: string) =>
        api.post<Genre>("/api/genres", { name }),

    /**
     * Update a genre (Admin only)
     */
    update: (id: number, name: string) =>
        api.put<Genre>(`/api/genres/${id}`, { name }),

    /**
     * Delete a genre (Admin only)
     */
    delete: (id: number) =>
        api.delete<void>(`/api/genres/${id}`),
};
