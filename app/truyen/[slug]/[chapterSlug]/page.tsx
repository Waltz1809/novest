import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Home, List, Lock } from "lucide-react";
import UnlockButton from "@/components/novel/unlock-button";
import ChapterContent from "@/components/novel/chapter-content";
// import { updateReadingHistory } from "@/actions/library";
import { incrementView } from "@/actions/ranking";
import { ChapterPageClient } from "./chapter-page-client";
import { CommentSection } from "@/components/comment/comment-section";

// Revalidate every 60 seconds
export const revalidate = 60;

interface PageProps {
    params: Promise<{
        slug: string;
        chapterSlug: string;
    }>;
}

export default async function ChapterReadingPage({ params }: PageProps) {
    const { slug, chapterSlug } = await params;
    const session = await auth();

    // 1. Fetch Current Chapter by Slug
    const chapter = await db.chapter.findFirst({
        where: {
            slug: chapterSlug,
            volume: {
                novel: {
                    slug: slug
                }
            }
        },
        include: {
            volume: true,
        },
    });

    if (!chapter) {
        notFound();
    }

    const chapterId = chapter.id;

    // 2. Fetch Novel for Navigation Context
    const novel = await db.novel.findUnique({
        where: { slug },
        select: {
            id: true,
            title: true,
            slug: true,
            volumes: {
                orderBy: { order: "asc" },
                select: {
                    id: true,
                    chapters: {
                        orderBy: { order: "asc" },
                        select: {
                            id: true,
                            title: true,
                            order: true,
                            slug: true,
                        },
                    },
                },
            },
        },
    });

    if (!novel) {
        notFound();
    }

    // Update reading history (moved to client component)
    // if (session?.user) {
    //     updateReadingHistory(novel.id, chapter.id);
    // }

    // Increment view count (fire and forget)
    incrementView(novel.id).catch(() => { });

    // Flatten chapters to a simple list for easy prev/next finding
    const allChapters = novel.volumes.flatMap((vol) => vol.chapters);
    const currentIndex = allChapters.findIndex((c) => c.id === chapterId);

    const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
    const nextChapter =
        currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

    // VIP Check
    let isLocked = chapter.isLocked && chapter.price > 0;

    // Check if user purchased or is admin/translator
    if (isLocked && session?.user) {
        // Allow Admin/Translator to bypass
        if (session.user.role === "ADMIN" || session.user.role === "TRANSLATOR") {
            isLocked = false;
        } else {
            // Check purchase
            const purchase = await db.userPurchase.findUnique({
                where: {
                    userId_chapterId: {
                        userId: session.user.id,
                        chapterId: chapter.id,
                    },
                },
            });

            if (purchase) {
                isLocked = false;
            }
        }
    }

    return (
        <ChapterPageClient
            novel={novel}
            chapter={chapter}
            prevChapter={prevChapter}
            nextChapter={nextChapter}
            isLocked={isLocked}
            session={session}
        />
    );
}
