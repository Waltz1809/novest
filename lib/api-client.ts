import { ApiResponse } from "@/types/api";

/**
 * Base API Client for making requests to the API layer
 * Used by service files to abstract fetch calls
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "";

type RequestOptions = {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    headers?: HeadersInit;
    cache?: RequestCache;
    tags?: string[];
};

/**
 * Generic API client function
 * Handles JSON serialization, error handling, and response parsing
 */
export async function apiClient<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<ApiResponse<T>> {
    const { method = "GET", body, headers = {}, cache, tags } = options;

    const url = endpoint.startsWith("http")
        ? endpoint
        : `${BASE_URL}${endpoint}`;

    try {
        const fetchOptions: RequestInit = {
            method,
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
            credentials: "include", // Include cookies for auth
        };

        if (body && method !== "GET") {
            fetchOptions.body = JSON.stringify(body);
        }

        if (cache) {
            fetchOptions.cache = cache;
        }

        if (tags) {
            fetchOptions.next = { tags };
        }

        const response = await fetch(url, fetchOptions);

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error || `HTTP error ${response.status}`,
            };
        }

        return {
            success: true,
            data: data.data ?? data,
            message: data.message,
        };
    } catch (error) {
        console.error(`API Error [${method} ${endpoint}]:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Network error",
        };
    }
}

/**
 * Helper for GET requests with query params
 */
export function buildQueryString(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, String(value));
        }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
}

/**
 * Convenience methods
 */
export const api = {
    get: <T>(endpoint: string, params?: Record<string, unknown>) =>
        apiClient<T>(`${endpoint}${params ? buildQueryString(params) : ""}`),

    post: <T>(endpoint: string, body?: unknown) =>
        apiClient<T>(endpoint, { method: "POST", body }),

    put: <T>(endpoint: string, body?: unknown) =>
        apiClient<T>(endpoint, { method: "PUT", body }),

    patch: <T>(endpoint: string, body?: unknown) =>
        apiClient<T>(endpoint, { method: "PATCH", body }),

    delete: <T>(endpoint: string) =>
        apiClient<T>(endpoint, { method: "DELETE" }),

    /** DELETE with body - for APIs that require body on DELETE */
    deleteWithBody: <T>(endpoint: string, body: unknown) =>
        apiClient<T>(endpoint, { method: "DELETE", body }),
};
