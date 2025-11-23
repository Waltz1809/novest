import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Home, List, Lock } from "lucide-react";
import UnlockButton from "@/components/novel/unlock-button";
import ChapterContent from "@/components/novel/chapter-content";
import { updateReadingHistory } from "@/actions/library";

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

    // Update reading history (fire and forget)
    if (session?.user) {
        updateReadingHistory(novel.id, chapter.id);
    }

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
        <div className="min-h-screen bg-[#f9f7f1] text-gray-800 font-serif">
            {/* Sticky Header (Hidden on scroll down - simplified as fixed for now) */}
            <header className="fixed top-0 left-0 right-0 bg-[#f9f7f1]/95 backdrop-blur-sm border-b border-gray-200/50 h-14 flex items-center justify-between px-4 z-50 shadow-sm transition-transform duration-300">
                <Link
                    href={`/truyen/${slug}`}
                    className="flex items-center gap-1 text-gray-600 hover:text-indigo-600 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                    <span className="font-sans text-sm font-medium truncate max-w-[150px] sm:max-w-xs">
                        {novel.title}
                    </span>
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-gray-500 hover:text-indigo-600">
                        <Home className="w-5 h-5" />
                    </Link>
                </div>
            </header>

            <main className="pt-20 pb-20 container mx-auto px-4 max-w-4xl">
                {/* Chapter Title */}
                <div className="mb-8 text-center">
                    <h2 className="text-sm font-sans text-gray-500 uppercase tracking-widest mb-2">
                        {chapter.volume.title}
                    </h2>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                        {chapter.title}
                    </h1>
                </div>

                {/* Top Navigation */}
                <div className="flex items-center justify-between mb-10 font-sans text-sm">
                    {prevChapter ? (
                        <Link
                            href={`/truyen/${slug}/${prevChapter.slug}`}
                            className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-full hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" /> Chương trước
                        </Link>
                    ) : (
                        <button disabled className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-400 rounded-full cursor-not-allowed">
                            <ChevronLeft className="w-4 h-4" /> Chương trước
                        </button>
                    )}

                    <Link
                        href={`/truyen/${slug}`}
                        className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-indigo-600"
                    >
                        <List className="w-5 h-5" />
                        <span className="hidden sm:inline">Mục lục</span>
                    </Link>

                    {nextChapter ? (
                        <Link
                            href={`/truyen/${slug}/${nextChapter.slug}`}
                            className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-full hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all"
                        >
                            Chương sau <ChevronRight className="w-4 h-4" />
                        </Link>
                    ) : (
                        <button disabled className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-400 rounded-full cursor-not-allowed">
                            Chương sau <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="relative">
                    {isLocked ? (
                        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm my-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                                <Lock className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Chương VIP</h3>
                            <p className="text-gray-500 mb-6">
                                Chương này đã bị khóa. Vui lòng mở khóa để tiếp tục đọc.
                            </p>

                            {session?.user ? (
                                <UnlockButton chapterId={chapter.id} price={chapter.price} />
                            ) : (
                                <Link href="/api/auth/signin" className="inline-block px-6 py-3 bg-indigo-600 text-white font-sans font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                                    Đăng nhập để mở khóa
                                </Link>
                            )}
                        </div>
                    ) : (
                        <ChapterContent content={chapter.content} />
                    )}
                </div>

                {/* Bottom Navigation */}
                <div className="flex items-center justify-between mt-16 font-sans text-sm">
                    {prevChapter ? (
                        <Link
                            href={`/truyen/${slug}/${prevChapter.slug}`}
                            className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-full hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" /> Chương trước
                        </Link>
                    ) : (
                        <button disabled className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-400 rounded-full cursor-not-allowed">
                            <ChevronLeft className="w-4 h-4" /> Chương trước
                        </button>
                    )}

                    {nextChapter ? (
                        <Link
                            href={`/truyen/${slug}/${nextChapter.slug}`}
                            className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-full hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all"
                        >
                            Chương sau <ChevronRight className="w-4 h-4" />
                        </Link>
                    ) : (
                        <button disabled className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-400 rounded-full cursor-not-allowed">
                            Chương sau <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}
