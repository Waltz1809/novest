"use client";

import { useEffect, useRef } from "react";
import { markNovelViewed } from "@/actions/view";

interface ViewTrackerProps {
    novelId: number;
}

/**
 * Client component that tracks novel views after page load.
 * This sets the cookie to prevent duplicate view counts.
 */
export function ViewTracker({ novelId }: ViewTrackerProps) {
    const tracked = useRef(false);

    useEffect(() => {
        if (!tracked.current) {
            tracked.current = true;
            markNovelViewed(novelId);
        }
    }, [novelId]);

    return null; // This component renders nothing
}
