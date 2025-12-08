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
import VolumeList from "@/components/novel/volume-list";
import { incrementView } from "@/actions/view";
import { canViewR18 } from "@/lib/r18";

// Revalidate every 60 seconds
export const revalidate = 60;

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function NovelDetailPage({ params }: PageProps) {
    const { slug } = await params;
    const session = await auth();

    // First fetch novel with basic info to check permissions
    const novelBasic = await db.novel.findUnique({
        where: { slug },
        select: {
            id: true,
            uploaderId: true,
        },
    });

    if (!novelBasic) {
        notFound();
    }

    // Determine if user can see drafts
    const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";
    const isUploader = session?.user?.id === novelBasic.uploaderId;
    const canSeeDrafts = isAdmin || isUploader;

    // Build chapter filter - only show published chapters to public
    const chapterWhere = canSeeDrafts ? {} : { isDraft: false };

    const novel = await db.novel.findUnique({
        where: { slug },
        include: {
            genres: true,
            uploader: {
                select: {
                    id: true,
                    name: true,
                    nickname: true,
                    username: true,
                    image: true,
                }
            },
            volumes: {
                orderBy: { order: "asc" },
                include: {
                    chapters: {
                        where: chapterWhere,
                        orderBy: { order: "asc" },
                        select: {
                            id: true,
                            title: true,
                            order: true,
                            slug: true,
                            createdAt: true,
                            wordCount: true,
                            isDraft: true, // Include to show draft badge
                            publishAt: true, // Include to show scheduled time
                        }
                    },
                },
            },
        },
    });

    if (!novel) {
        notFound();
    }

    // Approval Status Visibility Check (reusing isAdmin, isUploader from earlier)
    // REJECTED novels: Admin/mod or uploader can see (so uploader can edit and resubmit)
    if (novel.approvalStatus === "REJECTED" && !canSeeDrafts) {
        notFound();
    }

    // PENDING novels: Only admin/mod and uploader can see
    if (novel.approvalStatus === "PENDING" && !canSeeDrafts) {
        notFound();
    }

    // R18 Content Protection: Block access for ineligible users
    if (novel.isR18) {
        // Get user's birthday for R18 check
        const userData = session?.user?.id ? await db.user.findUnique({
            where: { id: session.user.id },
            select: { birthday: true }
        }) : null;

        if (!canViewR18(session, userData?.birthday)) {
            notFound(); // Show 404 for non-logged-in, no birthday, or under 18
        }
    }

    // Increment view count (server-side, spam-protected)
    await incrementView(novel.id);

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

    // Fetch followers count (library entries for this novel)
    const followersCount = await db.library.count({
        where: { novelId: novel.id }
    });

    // Fetch average rating
    const ratingsData = await db.rating.aggregate({
        where: { novelId: novel.id },
        _avg: { score: true },
        _count: { score: true }
    });
    const averageRating = ratingsData._avg.score ? ratingsData._avg.score.toFixed(1) : "0";
    const ratingCount = ratingsData._count.score;

    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            {/* Header */}
            <MainHeader />

            <main>
                {/* Hero Section - Dark Ink & Neon */}
                <div className="relative bg-background py-12 md:py-16">
                    <div className="container mx-auto px-4">
                        {/* Dark Card with Jade Border Glow */}
                        <div className="relative bg-[#1E293B] backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-[#374151]">
                            {/* Content Container */}
                            <div className="relative z-10 p-6 md:p-8">
                                {/* Top Row: Cover | Info | Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_280px] gap-6 md:gap-8">
                                    {/* Left: Cover Image */}
                                    <div className="w-40 md:w-48 shrink-0 relative group mx-auto md:mx-0">
                                        <div className="aspect-2/3 relative rounded-lg overflow-hidden shadow-2xl ring-2 ring-[#F59E0B]/30 transition-all duration-300 group-hover:ring-[#F59E0B]/60 group-hover:scale-105">
                                            {novel.coverImage && (novel.coverImage.startsWith('http') || novel.coverImage.startsWith('/')) ? (
                                                <Image
                                                    src={novel.coverImage}
                                                    alt={novel.title}
                                                    fill
                                                    className="object-cover"
                                                    priority
                                                    sizes="(max-width: 768px) 160px, 192px"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-linear-to-br from-[#F59E0B] to-[#FBBF24] flex flex-col items-center justify-center text-[#0B0C10]">
                                                    <Book className="w-12 h-12 mb-2" />
                                                    <span className="text-xs font-medium">No Cover</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Middle: Novel Info - Left Aligned */}
                                    <div className="flex flex-col gap-3 text-left">
                                        {/* Title */}
                                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-white">
                                            {novel.title}
                                        </h1>

                                        {/* Author */}
                                        <div className="flex items-center gap-2 text-[#9CA3AF] text-sm">
                                            <User className="w-4 h-4" />
                                            <span>Tác giả:</span>
                                            <span className="text-white font-medium">{novel.author}</span>
                                        </div>

                                        {/* Status & Genres */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${novel.status === 'ONGOING'
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : novel.status === 'COMPLETED'
                                                    ? 'bg-amber-500/20 text-amber-400'
                                                    : 'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                {novel.status === 'ONGOING' ? 'Đang tiến hành' : novel.status === 'COMPLETED' ? 'Hoàn thành' : 'Tạm dừng'}
                                            </span>
                                            {novel.genres.slice(0, 3).map((genre) => (
                                                <span key={genre.id} className="px-3 py-1 rounded-full text-xs font-medium bg-[#374151] text-[#9CA3AF]">
                                                    {genre.name}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-wrap gap-3 pt-2">
                                            {firstChapter ? (
                                                <Link
                                                    href={`/truyen/${novel.slug}/${firstChapter.slug}`}
                                                    className="flex items-center gap-2 px-6 py-2.5 bg-[#F59E0B] text-[#0B0C10] font-bold rounded-lg hover:bg-[#FBBF24] transition-all"
                                                >
                                                    <BookOpen className="w-5 h-5" />
                                                    <span>Đọc ngay</span>
                                                </Link>
                                            ) : (
                                                <button disabled className="flex items-center gap-2 px-6 py-2.5 bg-[#374151] text-[#9CA3AF] font-bold rounded-lg cursor-not-allowed">
                                                    <BookOpen className="w-5 h-5" />
                                                    <span>Chưa có chương</span>
                                                </button>
                                            )}

                                            <LibraryButton
                                                novelId={novel.id}
                                                initialIsInLibrary={isInLibrary}
                                                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B0C10] text-white border border-[#374151] hover:border-[#F59E0B] font-medium transition-all"
                                            />

                                            <RatingButton
                                                novelId={novel.id}
                                                initialRating={userRating?.score}
                                                initialContent={userRating?.content || ""}
                                                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B0C10] text-white border border-[#374151] hover:border-[#F59E0B] font-medium transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Right: Stats */}
                                    <div className="lg:block">
                                        <div className="bg-[#0B0C10] rounded-xl p-4 border border-[#374151]">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between py-2 border-b border-[#374151]">
                                                    <span className="text-sm text-[#9CA3AF]">Số từ:</span>
                                                    <span className="font-bold text-white">{wordCount}</span>
                                                </div>
                                                <div className="flex items-center justify-between py-2 border-b border-[#374151]">
                                                    <span className="text-sm text-[#9CA3AF]">Đề cử:</span>
                                                    <span className="font-bold text-white">0</span>
                                                </div>
                                                <div className="flex items-center justify-between py-2 border-b border-[#374151]">
                                                    <span className="text-sm text-[#9CA3AF]">Phiếu thưởng:</span>
                                                    <span className="font-bold text-white">0</span>
                                                </div>
                                                <div className="flex items-center justify-between py-2 border-b border-[#374151]">
                                                    <span className="text-sm text-[#9CA3AF]">View:</span>
                                                    <span className="font-bold text-white">{novel.viewCount.toLocaleString('vi-VN')}</span>
                                                </div>
                                                <div className="flex items-center justify-between py-2 border-b border-[#374151]">
                                                    <span className="text-sm text-[#9CA3AF]">Đánh giá:</span>
                                                    <span className="font-bold text-white">{averageRating}/5</span>
                                                </div>
                                                <div className="flex items-center justify-between py-2 border-b border-[#374151]">
                                                    <span className="text-sm text-[#9CA3AF]">Cập nhật:</span>
                                                    <span className="font-bold text-white">{lastUpdated}</span>
                                                </div>
                                                <div className="flex items-center justify-between py-2">
                                                    <span className="text-sm text-[#9CA3AF]">Lượt theo dõi:</span>
                                                    <span className="font-bold text-white">{followersCount.toLocaleString('vi-VN')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Row: Summary | Badges */}
                                <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 mt-6 pt-6 border-t border-[#374151]">
                                    {/* Summary */}
                                    <div>
                                        <NovelDescription description={novel.description || "Chưa có mô tả."} className="text-[#9CA3AF] text-sm leading-relaxed" />
                                    </div>

                                    {/* Badges */}
                                    <div className="flex lg:flex-col gap-4">
                                        <div className="bg-[#0B0C10] rounded-xl p-4 border border-[#374151] flex-1">
                                            <h3 className="text-xs font-bold text-[#9CA3AF] mb-3 uppercase tracking-wide flex items-center gap-2">
                                                <Award className="w-4 h-4 text-amber-400" /> Thành tích
                                            </h3>
                                            <div className="flex gap-2 flex-wrap">
                                                <div className="w-10 h-10 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-sm" title="Top 1">🏆</div>
                                                <div className="w-10 h-10 rounded-full bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center text-sm" title="Trending">🔥</div>
                                                <div className="w-10 h-10 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center text-sm" title="Popular">⭐</div>
                                            </div>
                                        </div>

                                        {/* Mobile Stats - Only visible on smaller screens */}
                                        <div className="lg:hidden bg-[#0B0C10] rounded-xl p-4 border border-[#374151] flex-1">
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div>
                                                    <div className="font-bold text-white">{totalChapters}</div>
                                                    <div className="text-xs text-[#9CA3AF]">Chương</div>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white">4.9</div>
                                                    <div className="text-xs text-[#9CA3AF]">Đánh giá</div>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white">{wordCount}</div>
                                                    <div className="text-xs text-[#9CA3AF]">Chữ</div>
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
                            <div className="lg:col-span-3 space-y-8 order-1">
                                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                                    <h2 className="text-xl font-bold flex items-center gap-2 text-[#F59E0B]">
                                        <List className="w-6 h-6" />
                                        Mục lục / Danh sách chương
                                    </h2>
                                    <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                        {totalChapters} chương
                                    </span>
                                </div>

                                {novel.volumes.length > 0 ? (
                                    <VolumeList volumes={novel.volumes} novelSlug={novel.slug} />
                                ) : (
                                    <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-xl border border-border/40 border-dashed">
                                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>Chưa có danh sách chương.</p>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Sidebar (25%) */}
                            <div className="lg:col-span-1 space-y-8 order-2">

                                {/* Translator Profile */}
                                <div className="bg-[#1E293B] rounded-xl shadow-sm border border-[#34D399]/20 p-5">
                                    <Link href={`/u/${novel.uploader.username || novel.uploader.id}`} className="flex items-center gap-3 mb-4 group">
                                        <div className="w-12 h-12 rounded-full bg-[#34D399]/10 flex items-center justify-center text-[#34D399] overflow-hidden border border-[#34D399]/20 group-hover:border-[#F59E0B] transition-colors">
                                            {novel.uploader.image ? (
                                                <Image
                                                    src={novel.uploader.image}
                                                    alt={novel.uploader.name || "Uploader"}
                                                    width={48}
                                                    height={48}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <User className="w-6 h-6" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-gray-200 group-hover:text-[#F59E0B] transition-colors">Nhóm dịch</h3>
                                            <p className="text-xs text-gray-400">{novel.uploader.nickname || novel.uploader.name || "Novest Official"}</p>
                                        </div>
                                    </Link>
                                    <button className="w-full py-2 bg-[#F59E0B] text-[#0B0C10] font-bold text-sm rounded-lg hover:bg-[#D97706] hover:shadow-md transition-all">
                                        🎁 Ủng hộ nhóm dịch
                                    </button>
                                </div>

                                {/* Related Novels */}
                                <div className="bg-[#1E293B] rounded-xl shadow-sm border border-[#34D399]/20 p-5">
                                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-[#F59E0B]">
                                        <Book className="w-4 h-4" />
                                        Truyện liên quan
                                    </h3>
                                    <div className="space-y-3">
                                        {relatedNovels.map((related) => (
                                            <Link
                                                key={related.id}
                                                href={`/truyen/${related.slug}`}
                                                className="flex gap-3 group hover:bg-[#0B0C10]/50 p-2 rounded-lg transition-colors"
                                            >
                                                <div className="relative w-12 h-16 shrink-0 rounded overflow-hidden shadow-sm border border-[#34D399]/20">
                                                    {related.coverImage ? (
                                                        <Image
                                                            src={related.coverImage}
                                                            alt={related.title}
                                                            fill
                                                            className="object-cover"
                                                            sizes="48px"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-[#0B0C10]" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col justify-center min-w-0">
                                                    <h4 className="text-sm font-medium truncate text-gray-300 group-hover:text-[#F59E0B] transition-colors">
                                                        {related.title}
                                                    </h4>
                                                    <div className="flex items-center gap-1 text-xs text-gray-500 flex-wrap">
                                                        <span className="truncate">{related.author}</span>
                                                        {related.genres.slice(0, 2).map((genre, idx) => (
                                                            <span key={`desktop-${idx}`} className="px-1.5 py-0.5 rounded-full bg-[#0B0C10] text-[10px] text-[#34D399] hidden lg:inline">
                                                                {genre.name}
                                                            </span>
                                                        ))}
                                                        {related.genres.slice(0, 3).map((genre, idx) => (
                                                            <span key={`mobile-${idx}`} className="px-1.5 py-0.5 rounded-full bg-[#0B0C10] text-[10px] text-[#34D399] lg:hidden">
                                                                {genre.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                        {relatedNovels.length === 0 && (
                                            <p className="text-xs text-gray-500 italic">Chưa có truyện liên quan.</p>
                                        )}
                                    </div>
                                </div>
                            </div >

                            {/* Comments Section - Full width on desktop */}
                            < div className="lg:col-span-4 order-3" >
                                <div className="mt-0 lg:mt-0 pt-0 lg:pt-8 lg:border-t lg:border-white/10">
                                    <div className="bg-[#1E293B] shadow-lg rounded-xl overflow-hidden border-l-4 border-[#F59E0B]">
                                        <div className="p-6 md:p-8">
                                            <CommentSection novelId={novel.id} />
                                        </div>
                                    </div>
                                </div>
                            </div >
                        </div >
                    </div >
                </div >
            </main >
        </div >
    );
}
