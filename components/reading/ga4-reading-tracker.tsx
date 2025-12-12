"use client";

import { useEffect, useRef, useCallback } from "react";
import { sendGAEvent } from '@next/third-parties/google';

interface GA4ReadingTrackerProps {
    novelSlug: string;
    chapterSlug: string;
    novelId: number;     // For view count increment
    chapterId: number;   // For view count increment
    wordCount: number;
    novelTitle?: string;
    chapterTitle?: string;
    contentRef?: React.RefObject<HTMLElement | null>;
}

// Milestones to track (using 90 instead of 100 for realistic completion)
const MILESTONES = [25, 50, 75, 90];
const COMPLETION_THRESHOLD = 85; // Consider chapter complete at 85%

export function GA4ReadingTracker({
    novelSlug,
    chapterSlug,
    novelId,
    chapterId,
    wordCount,
    novelTitle,
    chapterTitle,
    contentRef,
}: GA4ReadingTrackerProps) {
    // Tracking state
    const startTime = useRef<number>(Date.now());
    const activeTime = useRef<number>(0);
    const lastActiveTimestamp = useRef<number>(Date.now());
    const isVisible = useRef<boolean>(true);
    const reachedMilestones = useRef<Set<number>>(new Set());
    const milestoneTimestamps = useRef<Record<number, number>>({});
    const maxScrollPercent = useRef<number>(0);
    const hasCompletedChapter = useRef<boolean>(false);

    // RAF throttling
    const rafId = useRef<number | null>(null);
    const isScrollPending = useRef<boolean>(false);

    // Send GA4 event using @next/third-parties
    const sendEvent = useCallback((eventName: string, params: Record<string, unknown>) => {
        sendGAEvent('event', eventName, {
            ...params,
            novel_slug: novelSlug,
            chapter_slug: chapterSlug,
            novel_title: novelTitle,
            chapter_title: chapterTitle,
        });
    }, [novelSlug, chapterSlug, novelTitle, chapterTitle]);

    // Send GA4 event with beacon transport (for beforeunload - survives page close)
    const sendBeaconEvent = useCallback((eventName: string, params: Record<string, unknown>) => {
        sendGAEvent('event', eventName, {
            ...params,
            novel_slug: novelSlug,
            chapter_slug: chapterSlug,
            novel_title: novelTitle,
            chapter_title: chapterTitle,
            transport_type: "beacon", // Survives page close
        });
    }, [novelSlug, chapterSlug, novelTitle, chapterTitle]);

    // Calculate scroll percentage based on content container or document
    const getScrollPercent = useCallback(() => {
        if (typeof window === "undefined") return 0;

        // If we have a content ref, calculate based on that element
        if (contentRef?.current) {
            const rect = contentRef.current.getBoundingClientRect();
            const contentTop = rect.top + window.scrollY;
            const contentHeight = rect.height;
            const viewportHeight = window.innerHeight;
            const scrollTop = window.scrollY;

            // How much of content has been scrolled past
            const scrolledIntoContent = scrollTop - contentTop + viewportHeight;

            if (contentHeight <= 0) return 100;
            return Math.min(100, Math.max(0, Math.round((scrolledIntoContent / contentHeight) * 100)));
        }

        // Fallback: use document scroll
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;

        if (docHeight <= 0) return 100;
        return Math.min(100, Math.round((scrollTop / docHeight) * 100));
    }, [contentRef]);

    // Get active reading time in seconds
    const getActiveTimeSeconds = useCallback(() => {
        if (isVisible.current) {
            return Math.round((activeTime.current + (Date.now() - lastActiveTimestamp.current)) / 1000);
        }
        return Math.round(activeTime.current / 1000);
    }, []);

    // Calculate words read based on scroll percentage
    const getWordsRead = useCallback((scrollPercent: number) => {
        return Math.round((scrollPercent / 100) * wordCount);
    }, [wordCount]);

    // Process scroll - check for milestones
    const processScroll = useCallback(() => {
        const scrollPercent = getScrollPercent();
        maxScrollPercent.current = Math.max(maxScrollPercent.current, scrollPercent);

        // Check milestones
        for (const milestone of MILESTONES) {
            if (scrollPercent >= milestone && !reachedMilestones.current.has(milestone)) {
                reachedMilestones.current.add(milestone);
                const timeToReach = getActiveTimeSeconds();
                milestoneTimestamps.current[milestone] = timeToReach;

                sendEvent("scroll_milestone", {
                    milestone,
                    time_to_reach_seconds: timeToReach,
                    word_count_so_far: getWordsRead(milestone),
                    total_word_count: wordCount,
                });
            }
        }

        // Check chapter complete at COMPLETION_THRESHOLD (85%)
        if (scrollPercent >= COMPLETION_THRESHOLD && !hasCompletedChapter.current) {
            hasCompletedChapter.current = true;
            const timeToReach = getActiveTimeSeconds();
            sendEvent("chapter_complete", {
                reading_time_seconds: timeToReach,
                word_count: wordCount,
                scroll_percent_at_complete: scrollPercent,
            });

            // Increment view count for this chapter (fire-and-forget)
            fetch("/api/views", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ novelId, chapterId }),
            }).catch(() => {
                // Silently fail - view count is not critical
            });
        }

        isScrollPending.current = false;
    }, [getScrollPercent, getActiveTimeSeconds, getWordsRead, sendEvent, wordCount]);

    // Throttled scroll handler using requestAnimationFrame
    const handleScroll = useCallback(() => {
        // Skip if already pending - RAF throttling
        if (isScrollPending.current) return;

        isScrollPending.current = true;
        rafId.current = requestAnimationFrame(processScroll);
    }, [processScroll]);

    // Handle visibility change
    const handleVisibilityChange = useCallback(() => {
        if (document.hidden) {
            if (isVisible.current) {
                activeTime.current += Date.now() - lastActiveTimestamp.current;
                isVisible.current = false;
            }
        } else {
            lastActiveTimestamp.current = Date.now();
            isVisible.current = true;
        }
    }, []);

    // Send final reading_time event when leaving (uses beacon for reliability)
    const sendReadingTimeEvent = useCallback(() => {
        const timeSeconds = getActiveTimeSeconds();
        const scrollPercent = maxScrollPercent.current;

        // Only send if user spent more than 5 seconds
        if (timeSeconds >= 5) {
            sendBeaconEvent("reading_time", {
                time_seconds: timeSeconds,
                scroll_percent: scrollPercent,
                word_count: wordCount,
                words_read: getWordsRead(scrollPercent),
                completed: hasCompletedChapter.current,
            });
        }
    }, [getActiveTimeSeconds, sendBeaconEvent, wordCount, getWordsRead]);

    // Setup effects
    useEffect(() => {
        // Reset state for new chapter
        startTime.current = Date.now();
        activeTime.current = 0;
        lastActiveTimestamp.current = Date.now();
        isVisible.current = !document.hidden;
        reachedMilestones.current = new Set();
        milestoneTimestamps.current = {};
        maxScrollPercent.current = 0;
        hasCompletedChapter.current = false;
        isScrollPending.current = false;

        // Add listeners
        window.addEventListener("scroll", handleScroll, { passive: true });
        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Send reading_time on page leave
        const handleBeforeUnload = () => {
            sendReadingTimeEvent();
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        // Check initial scroll position
        handleScroll();

        return () => {
            // Cancel any pending RAF
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
            }

            // Cleanup and send final event
            sendReadingTimeEvent();
            window.removeEventListener("scroll", handleScroll);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [novelSlug, chapterSlug, handleScroll, handleVisibilityChange, sendReadingTimeEvent]);

    // This component doesn't render anything
    return null;
}
