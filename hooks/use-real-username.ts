"use client";

import { useState, useEffect } from "react";
import { getUsernameStatus } from "@/actions/user";

/**
 * Hook to fetch the real username from database, bypassing stale JWT session
 * Returns: { username, isLocked, isLoading }
 */
export function useRealUsername(fallbackUsername?: string | null) {
    const [username, setUsername] = useState<string | null>(fallbackUsername || null);
    const [isLocked, setIsLocked] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        getUsernameStatus().then((data) => {
            if (cancelled) return;

            if (data) {
                setUsername(data.username);
                setIsLocked(data.isLocked);
            } else if (fallbackUsername) {
                setUsername(fallbackUsername);
            }
            setIsLoading(false);
        }).catch(() => {
            if (!cancelled && fallbackUsername) {
                setUsername(fallbackUsername);
            }
            setIsLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, [fallbackUsername]);

    return { username, isLocked, isLoading };
}
