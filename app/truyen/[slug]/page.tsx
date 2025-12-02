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
import { getRelatedNovels } from "@/actions/novel";
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
            genres: true,
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
                            createdAt: true,
                            wordCount: true,
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

    // Calculate Real Word Count
    const totalWordCount = novel.volumes.reduce((acc, vol) => {
        return acc + vol.chapters.reduce((cAcc, chapter) => cAcc + (chapter.wordCount || 0), 0);
    }, 0);

    const wordCount = totalWordCount.toLocaleString('vi-VN');

    // Calculate Last Updated
    let lastUpdated = "Chưa cập nhật";
    if (totalChapters > 0) {
        // Find the very last chapter based on createdAt
        const allChapters = novel.volumes.flatMap(v => v.chapters);
        const lastChapter = allChapters.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        if (lastChapter) {
            const diffInHours = (new Date().getTime() - new Date(lastChapter.createdAt).getTime()) / (1000 * 60 * 60);
            if (diffInHours < 1) {
                lastUpdated = "Vừa xong";
            } else if (diffInHours < 24) {
                lastUpdated = `${Math.floor(diffInHours)} giờ trước`;
            } else {
                lastUpdated = `${Math.floor(diffInHours / 24)} ngày trước`;
            }
        }
    }

    // Fetch Related Novels
    const relatedNovels = await getRelatedNovels(novel.id, novel.genres.map(g => g.id));

    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            {/* Header */}
            <MainHeader />

            <main>
                {/* Hero Section - Dark Ink & Neon */}
                <div className="relative bg-background py-12 md:py-16">
                    <div className="container mx-auto px-4">
                        {/* Dark Card with Jade Border Glow */}
                        <div className="relative bg-[#1E293B] backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-[#34D399]/20 glow-jade">
                            {/* Content Container */}
                            <div className="relative z-10 p-6 md:p-10">
                                {/* 3-Column Grid Layout */}
                                <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_auto] gap-6 md:gap-8">
                                    {/* Left Column: Cover Image */}
                                    <div className="w-full md:w-56 shrink-0 relative group mx-auto md:mx-0">
                                        <div className="aspect-2/3 relative rounded-lg overflow-hidden shadow-2xl ring-2 ring-[#34D399]/30 transition-all duration-300 group-hover:ring-[#34D399]/60 group-hover:scale-105 glow-jade">
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
                                                <div className="w-full h-full bg-linear-to-br from-[#F59E0B] to-[#FBBF24] flex flex-col items-center justify-center text-[#0B0C10]">
                                                    <Book className="w-16 h-16 mb-3" />
                                                    <span className="text-sm font-medium">No Cover</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Middle Column: Novel Info */}
                                    <div className="flex flex-col gap-4 text-center md:text-left">
                                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-white tracking-tight">
                                            {novel.title}
                                        </h1>

                                        {/* Metadata Row */}
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-[#9CA3AF] text-sm">
                                            <span className="flex items-center gap-1.5 hover:text-[#FBBF24] transition-colors cursor-pointer">
                                                <User className="w-4 h-4" /> <strong className="text-[#9CA3AF]">Tác giả:</strong> {novel.author}
                                            </span>
                                        </div>

                                        {/* Status & Genres */}
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${novel.status === 'ONGOING' ? 'bg-[#10B981]/20 border-[#10B981] text-[#34D399]' :
                                                novel.status === 'COMPLETED' ? 'bg-[#F59E0B]/20 border-[#F59E0B] text-[#FBBF24]' :
                                                    'bg-[#9CA3AF]/20 border-[#9CA3AF] text-[#9CA3AF]'
                                                }`}>
                                                {novel.status === 'ONGOING' ? 'Đang tiến hành' : novel.status === 'COMPLETED' ? 'Hoàn thành' : 'Tạm dừng'}
                                            </span>
                                            {/* Genre Tags - Dark Style */}
                                            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F59E0B]/20 border-2 border-[#F59E0B] text-[#FBBF24]">
                                                Huyền Huyễn
                                            </span>
                                            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#34D399]/20 border-2 border-[#34D399] text-[#34D399]">
                                                Tiên Hiệp
                                            </span>
                                        </div>

                                        {/* Description */}
                                        <NovelDescription description={novel.description || "Chưa có mô tả."} className="text-[#9CA3AF]" />

                                        {/* Actions */}
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                                            {firstChapter ? (
                                                <Link
                                                    href={`/truyen/${novel.slug}/${firstChapter.slug}`}
                                                    className="flex items-center gap-2 px-8 py-3 bg-[#F59E0B] text-[#0B0C10] font-bold rounded-lg hover:bg-[#FBBF24] shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 glow-amber-strong"
                                                >
                                                    <BookOpen className="w-5 h-5" />
                                                    Đọc ngay
                                                </Link>
                                            ) : (
                                                <button disabled className="flex items-center gap-2 px-8 py-3 bg-[#0B0C10] text-[#9CA3AF] font-bold rounded-lg cursor-not-allowed border-2 border-[#34D399]/20">
                                                    Chưa có chương
                                                </button>
                                            )}

                                            <LibraryButton
                                                novelId={novel.id}
                                                initialIsInLibrary={isInLibrary}
                                                className="h-[48px] px-6 rounded-lg bg-[#1E293B] text-white border-2 border-[#34D399]/40 hover:border-[#34D399] hover:bg-[#0B0C10] font-medium transition-all duration-200 hover:scale-105"
                                            />

                                            <div className="w-full sm:w-auto">
                                                <RatingButton
                                                    novelId={novel.id}
                                                    initialRating={userRating?.score}
                                                    initialContent={userRating?.content || ""}
                                                    className="h-[48px] px-6 rounded-lg bg-[#1E293B] text-white border-2 border-[#34D399]/40 hover:border-[#34D399] hover:bg-[#0B0C10] font-medium transition-all duration-200 hover:scale-105"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Stats & Achievements */}
                                    <div className="lg:w-64 space-y-4 mx-auto lg:mx-0 w-full max-w-sm lg:max-w-none">
                                        {/* Stats Card - Dark Style */}
                                        <div className="bg-[#0B0C10] rounded-xl p-5 border border-[#34D399]/20">
                                            <h3 className="text-xs font-bold text-[#9CA3AF] mb-4 uppercase tracking-wide">Thống kê</h3>
                                            <div className="space-y-3">
                                                {/* Views */}
                                                <div className="bg-[#1E293B] rounded-lg px-4 py-3 flex items-center justify-between border border-[#34D399]/10">
                                                    <span className="text-sm text-[#9CA3AF] flex items-center gap-2">
                                                        <Eye className="w-4 h-4 text-[#34D399]" />
                                                        Lượt xem
                                                    </span>
                                                    <span className="text-base font-bold text-white font-mono">354.3K</span>
                                                </div>
                                                {/* Rating */}
                                                <div className="bg-[#1E293B] rounded-lg px-4 py-3 flex items-center justify-between border border-[#34D399]/10">
                                                    <span className="text-sm text-[#9CA3AF] flex items-center gap-2">
                                                        <Star className="w-4 h-4 text-[#FBBF24]" />
                                                        Đánh giá
                                                    </span>
                                                    <span className="text-base font-bold text-white font-mono flex items-center gap-1">
                                                        {userRating?.score || "4.9"}/5
                                                    </span>
                                                </div>
                                                {/* Chapters */}
                                                <div className="bg-[#1E293B] rounded-lg px-4 py-3 flex items-center justify-between border border-[#34D399]/10">
                                                    <span className="text-sm text-[#9CA3AF] flex items-center gap-2">
                                                        <List className="w-4 h-4 text-[#F59E0B]" />
                                                        Chương
                                                    </span>
                                                    <span className="text-base font-bold text-white font-mono">{totalChapters}</span>
                                                </div>
                                                {/* Last Updated */}
                                                <div className="bg-[#1E293B] rounded-lg px-4 py-3 flex items-center justify-between border border-[#34D399]/10">
                                                    <span className="text-sm text-[#9CA3AF] flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-blue-400" />
                                                        Cập nhật
                                                    </span>
                                                    <span className="text-base font-bold text-white font-mono">{lastUpdated}</span>
                                                </div>
                                                {/* Word Count */}
                                                <div className="bg-[#1E293B] rounded-lg px-4 py-3 flex items-center justify-between border border-[#34D399]/10">
                                                    <span className="text-sm text-[#9CA3AF] flex items-center gap-2">
                                                        <Book className="w-4 h-4 text-pink-400" />
                                                        Số chữ
                                                    </span>
                                                    <span className="text-base font-bold text-white font-mono">{wordCount} chữ</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Achievements Card - Dark Badges */}
                                        <div className="bg-[#1E293B] rounded-xl p-5 border border-[#34D399]/20">
                                            <h3 className="text-xs font-bold text-[#9CA3AF] mb-3 uppercase tracking-wide flex items-center gap-2">
                                                <Award className="w-4 h-4 text-[#FBBF24]" />
                                                Thành tích
                                            </h3>
                                            <div className="flex gap-2 flex-wrap">
                                                <div className="w-12 h-12 rounded-full bg-[#F59E0B]/20 border-2 border-[#F59E0B] flex items-center justify-center text-sm font-bold shadow-sm" title="Top 1">
                                                    🏆
                                                </div>
                                                <div className="w-12 h-12 rounded-full bg-[#34D399]/20 border-2 border-[#34D399] flex items-center justify-center text-sm font-bold shadow-sm" title="Trending">
                                                    🔥
                                                </div>
                                                <div className="w-12 h-12 rounded-full bg-[#FBBF24]/20 border-2 border-[#FBBF24] flex items-center justify-center text-sm font-bold shadow-sm" title="Popular">
                                                    ⭐
                                                </div>
                                            </div>
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
                                                            <span className="text-xs font-mono text-muted-foreground group-hover:text-indigo-500 transition-colors w-16 shrink-0">
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
                                    <button className="w-full py-2 bg-linear-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm rounded-lg hover:shadow-md hover:opacity-90 transition-all">
                                        🎁 Ủng hộ nhóm dịch
                                    </button>
                                </div>

                                {/* Related Novels or Other Widget - Placeholder */}
                                <div className="bg-card rounded-xl shadow-sm border border-border/50 p-5">
                                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                                        <Book className="w-4 h-4 text-indigo-500" />
                                        Truyện liên quan
                                    </h3>
                                    <div className="space-y-3">
                                        {relatedNovels.map((related) => (
                                            <Link
                                                key={related.id}
                                                href={`/truyen/${related.slug}`}
                                                className="flex gap-3 group hover:bg-muted/50 p-2 rounded-lg transition-colors"
                                            >
                                                <div className="relative w-12 h-16 shrink-0 rounded overflow-hidden shadow-sm">
                                                    {related.coverImage ? (
                                                        <Image
                                                            src={related.coverImage}
                                                            alt={related.title}
                                                            fill
                                                            className="object-cover"
                                                            sizes="48px"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-muted" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col justify-center min-w-0">
                                                    <h4 className="text-sm font-medium truncate group-hover:text-indigo-600 transition-colors">
                                                        {related.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span>{related.author}</span>
                                                        {related.genres[0] && (
                                                            <span className="px-1.5 py-0.5 rounded-full bg-muted text-[10px]">
                                                                {related.genres[0].name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                        {relatedNovels.length === 0 && (
                                            <p className="text-xs text-muted-foreground italic">Chưa có truyện liên quan.</p>
                                        )}
                                    </div>
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
