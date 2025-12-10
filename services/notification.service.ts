import { api } from "@/lib/api-client";

// Notification item
export interface NotificationItem {
    id: string;
    type: string;
    message: string;
    resourceId: string;
    resourceType: string;
    isRead: boolean;
    createdAt: string;
    actor: {
        id: string;
        name: string | null;
        nickname: string | null;
        username: string | null;
        image: string | null;
    } | null;
}

// Notification list response
export interface NotificationListResponse {
    items: NotificationItem[];
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

// List params
export interface NotificationListParams {
    [key: string]: unknown;
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
}

/**
 * Notification Service
 * FE service layer for notification API calls
 */
export const notificationService = {
    /**
     * Get paginated notifications
     */
    getAll: (params: NotificationListParams = {}) =>
        api.get<NotificationListResponse>("/api/notifications", params),

    /**
     * Get unread count only
     */
    getUnreadCount: async () => {
        const response = await api.get<NotificationListResponse>("/api/notifications", { limit: 1 });
        return response.data?.unreadCount ?? 0;
    },

    /**
     * Mark specific notifications as read
     */
    markAsRead: (ids: string[]) =>
        api.patch<void>("/api/notifications", { ids }),

    /**
     * Mark all notifications as read
     */
    markAllAsRead: () =>
        api.patch<void>("/api/notifications", { all: true }),

    /**
     * Delete specific notifications
     */
    delete: (ids: string[]) =>
        api.delete<void>("/api/notifications"),

    /**
     * Delete all notifications
     */
    deleteAll: () =>
        api.delete<void>("/api/notifications"),
};
