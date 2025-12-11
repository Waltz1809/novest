import { api } from "@/lib/api-client";

// Comment user
export interface CommentUser {
    id: string;
    name: string | null;
    nickname: string | null;
    username: string | null;
    image: string | null;
}

// Comment item
export interface CommentItem {
    id: number;
    content: string;
    createdAt: string;
    updatedAt: string;
    isPinned: boolean;
    paragraphId: number | null;
    score: number;
    userVote: "UPVOTE" | "DOWNVOTE" | null;
    replyCount: number;
    user: CommentUser;
    parent: {
        id: number;
        content: string;
        user: Omit<CommentUser, "image">;
    } | null;
}

// Comment list response
export interface CommentListResponse {
    items: CommentItem[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

// List params
export interface CommentListParams {
    [key: string]: unknown;
    novelId: number;
    chapterId?: number;
    paragraphId?: number;
    parentId?: number;
    page?: number;
    limit?: number;
    sort?: "newest" | "votes" | "replies";
}

// Create comment params
export interface CreateCommentParams {
    novelId: number;
    content: string;
    chapterId?: number;
    parentId?: number;
    paragraphId?: number;
}

/**
 * Comment Service
 * FE service layer for comment API calls
 */
export const commentService = {
    /**
     * Get paginated comments
     */
    getAll: (params: CommentListParams) =>
        api.get<CommentListResponse>("/api/comments", params),

    /**
     * Get replies to a comment
     */
    getReplies: (parentId: number, novelId: number, params: Omit<CommentListParams, "novelId" | "parentId"> = {}) =>
        api.get<CommentListResponse>("/api/comments", { ...params, novelId, parentId }),

    /**
     * Create a new comment
     */
    create: (data: CreateCommentParams) =>
        api.post<CommentItem>("/api/comments", data),

    /**
     * Edit a comment (within 10 minutes)
     */
    edit: (id: number, content: string) =>
        api.put<void>(`/api/comments/${id}`, { content }),

    /**
     * Delete a comment
     */
    delete: (id: number) =>
        api.delete<void>(`/api/comments/${id}`),

    /**
     * Vote on a comment
     */
    vote: (id: number, voteType: "UPVOTE" | "DOWNVOTE") =>
        api.patch<void>(`/api/comments/${id}`, { action: "vote", voteType }),

    /**
     * Pin/unpin a comment
     */
    togglePin: (id: number) =>
        api.patch<{ pinned: boolean }>(`/api/comments/${id}`, { action: "pin" }),

    /**
     * Get chapter discussions for a novel (newest chapter comments)
     */
    getChapterDiscussions: (novelId: number, limit: number = 10) =>
        api.get<CommentListResponse>("/api/comments", { novelId, chapterDiscussions: true, limit }),
};
