import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Book, User, Calendar, Eye, Star, List, ChevronRight, BookOpen, Heart, MessageSquare, Award } from "lucide-react";
import MainHeader from "@/components/layout/main-header";
import { auth } from "@/auth";
import LibraryButton from "@/components/novel/library-button";
import { CommentSection } from "@/components/comment/comment-section";
import { RatingButton } from "@/components/rating/rating-button";
import { getUserRating } from "@/actions/interaction";
import NovelDescription from "@/components/novel/novel-description";

// Revalidate every 60 seconds
export const revalidate = 60;

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function NovelDetailPage({ params }: PageProps) {
    const { slug } = await params;
    const session = await auth();

    const novel = await db.novel.findUnique({
        where: { slug },
        include: {
            volumes: {
                orderBy: { order: "asc" },
                include: {
                    chapters: {
                        orderBy: { order: "asc" },
                        select: {
                            id: true,
                            title: true,
                            order: true,
                            slug: true,
                        }
                    },
                },
            },
        },
    });

    if (!novel) {
        notFound();
    }

    let isInLibrary = false;
    if (session?.user) {
        const libraryEntry = await db.library.findUnique({
            where: {
                userId_novelId: {
                    userId: session.user.id,
                    novelId: novel.id,
                },
            },
        });
        isInLibrary = !!libraryEntry;
    }

    const userRating = novel ? await getUserRating(novel.id) : null;

    // Get first chapter for "Read Now" button
    const firstChapter = novel.volumes[0]?.chapters[0];

    // Calculate total chapters
    const totalChapters = novel.volumes.reduce((acc, vol) => acc + vol.chapters.length, 0);

    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            {/* Header */}
            <MainHeader />

            <main>
                {/* Hero Section - Header Card Layout */}
                <div className="relative bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950 py-12 md:py-16">
                    <div className="container mx-auto px-4">
                        {/* Header Card */}
                        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 p-6 md:p-10">
                            {/* 3-Column Grid Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_auto] gap-6 md:gap-8">
                                {/* Left Column: Cover Image */}
                                <div className="w-full md:w-56 shrink-0 relative group mx-auto md:mx-0">
                                    <div className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-xl ring-1 ring-gray-200 dark:ring-gray-700 transition-transform duration-300 group-hover:-translate-y-1">
                                        {novel.coverImage && (novel.coverImage.startsWith('http') || novel.coverImage.startsWith('/')) ? (
                                            <Image
                                                src={novel.coverImage}
                                                alt={novel.title}
                                                fill
                                                className="object-cover"
                                                priority
                                                sizes="(max-width: 768px) 100vw, 224px"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-gray-400">
                                                <Book className="w-16 h-16 mb-3 opacity-50" />
                                                <span className="text-sm font-medium">No Cover</span>
                                            </div>
                                        )}
                                        {/* Shine effect */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Middle Column: Novel Info */}
                                <div className="flex flex-col gap-4 text-center md:text-left">
                                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-foreground tracking-tight">
                                        {novel.title}
                                    </h1>

                                    {/* Metadata Row */}
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-muted-foreground text-sm">
                                        <span className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
                                            <User className="w-4 h-4" /> <strong>Tác giả:</strong> {novel.author}
                                        </span>
                                    </div>

                                    {/* Status & Genres */}
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${novel.status === 'ONGOING' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300' :
                                            novel.status === 'COMPLETED' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300' :
                                                'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                                            }`}>
                                            {novel.status === 'ONGOING' ? 'Đang tiến hành' : novel.status === 'COMPLETED' ? 'Hoàn thành' : 'Tạm dừng'}
                                        </span>
                                        {/* Placeholder for genres/tags */}
                                        <span className="text-xs text-muted-foreground italic">
                                            Tag/genre (coming soon)
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <NovelDescription description={novel.description || "Chưa có mô tả."} className="text-muted-foreground" />

                                    {/* Actions */}
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                                        {firstChapter ? (
                                            <Link
                                                href={`/truyen/${novel.slug}/${firstChapter.slug}`}
                                                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-full hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                                            >
                                                <BookOpen className="w-5 h-5" />
                                                Đọc ngay
                                            </Link>
                                        ) : (
                                            <button disabled className="flex items-center gap-2 px-8 py-3 bg-gray-100 dark:bg-gray-800 text-gray-400 font-bold rounded-full cursor-not-allowed border border-gray-200 dark:border-gray-700">
                                                Chưa có chương
                                            </button>
                                        )}

                                        <LibraryButton
                                            novelId={novel.id}
                                            initialIsInLibrary={isInLibrary}
                                            className="h-[48px] px-6 rounded-full bg-gray-100 dark:bg-gray-800 text-foreground hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:-translate-y-0.5"
                                        />

                                        <div className="w-full sm:w-auto">
                                            <RatingButton
                                                novelId={novel.id}
                                                initialRating={userRating?.score}
                                                initialContent={userRating?.content || ""}
                                                className="h-[48px] px-6 rounded-full bg-gray-100 dark:bg-gray-800 text-foreground hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:-translate-y-0.5"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Stats & Achievements */}
                                <div className="lg:w-60 space-y-4 mx-auto lg:mx-0 w-full max-w-sm lg:max-w-none">
                                    {/* Stats Card */}
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-6 border border-indigo-200/50 dark:border-indigo-800/50">
                                        <h3 className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wide">Thống kê</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <List className="w-4 h-4" />
                                                    Chương
                                                </span>
                                                <span className="text-lg font-bold text-foreground font-mono">{totalChapters}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <Eye className="w-4 h-4" />
                                                    Lượt xem
                                                </span>
                                                <span className="text-lg font-bold text-foreground font-mono">--</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <Star className="w-4 h-4" />
                                                    Đánh giá
                                                </span>
                                                <span className="text-lg font-bold text-foreground font-mono flex items-center gap-1">
                                                    {userRating?.score || "--"} <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Achievements Card */}
                                    <div className="bg-card rounded-xl p-6 border border-border/50 shadow-sm">
                                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2 uppercase tracking-wide">
                                            <Award className="w-4 h-4 text-yellow-500" />
                                            Thành tích
                                        </h3>
                                        <div className="flex gap-2 flex-wrap">
                                            <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-sm font-bold text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800" title="Top 1">T1</div>
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800" title="Trending">Tr</div>
                                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm text-gray-400 border border-gray-200 dark:border-gray-700">+</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body Section (V2) */}
                <div className="bg-background py-12">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-10">
                            {/* Left Column: Chapter Catalog (75%) */}
                            <div className="lg:col-span-3 space-y-8">
                                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <List className="w-6 h-6 text-indigo-600" />
                                        Mục lục / Danh sách chương
                                    </h2>
                                    <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                        {totalChapters} chương
                                    </span>
                                </div>

                                {novel.volumes.length > 0 ? (
                                    <div className="space-y-10">
                                        {novel.volumes.map((volume) => (
                                            <div key={volume.id}>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
                                                    <h3 className="font-bold text-lg text-foreground/90">
                                                        {volume.title}
                                                    </h3>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                                                    {volume.chapters.map((chapter) => (
                                                        <Link
                                                            key={chapter.id}
                                                            href={`/truyen/${novel.slug}/${chapter.slug}`}
                                                            className="group flex items-center gap-2 py-2.5 border-b border-dashed border-border/40 hover:bg-gray-50 dark:hover:bg-white/5 px-2 rounded transition-colors"
                                                            title={chapter.title}
                                                        >
                                                            <span className="text-xs font-mono text-muted-foreground group-hover:text-indigo-500 transition-colors w-16 flex-shrink-0">
                                                                Chương {chapter.order}
                                                            </span>
                                                            <span className="text-sm text-foreground/80 group-hover:text-indigo-600 transition-colors truncate">
                                                                {chapter.title}
                                                            </span>
                                                        </Link>
                                                    ))}
                                                    {volume.chapters.length === 0 && (
                                                        <p className="text-sm text-muted-foreground italic col-span-full py-2">Chưa có chương nào.</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-xl border border-border/40 border-dashed">
                                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>Chưa có danh sách chương.</p>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Sidebar (25%) */}
                            <div className="lg:col-span-1 space-y-8">
                                {/* Translator Profile */}
                                <div className="bg-card rounded-xl shadow-sm border border-border/50 p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm">Nhóm dịch</h3>
                                            <p className="text-xs text-muted-foreground">Novest Official</p>
                                        </div>
                                    </div>
                                    <button className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm rounded-lg hover:shadow-md hover:opacity-90 transition-all">
                                        🎁 Ủng hộ nhóm dịch
                                    </button>
                                </div>

                                {/* Related Novels or Other Widget - Placeholder */}
                                <div className="bg-card rounded-xl shadow-sm border border-border/50 p-5">
                                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                                        <Book className="w-4 h-4 text-indigo-500" />
                                        Truyện liên quan
                                    </h3>
                                    <p className="text-xs text-muted-foreground italic">Coming soon...</p>
                                </div>

                                {/* Comments Section (Styled) */}
                                <div className="bg-white dark:bg-card shadow-lg rounded-xl overflow-hidden border-t-4 border-indigo-500">
                                    <div className="p-5">
                                        <CommentSection novelId={novel.id} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
