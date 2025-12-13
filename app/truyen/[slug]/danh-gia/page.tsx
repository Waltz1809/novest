import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star, User, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import MainHeader from "@/components/layout/main-header";
import { getNovelRatings } from "@/actions/interaction";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

// Revalidate every 60 seconds
export const revalidate = 60;

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string }>;
}

function StarRating({ score }: { score: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-5 h-5 ${star <= score
                        ? "text-amber-500 fill-amber-500"
                        : "text-gray-300"
                        }`}
                />
            ))}
        </div>
    );
}

export default async function RatingsPage({ params, searchParams }: PageProps) {
    const { slug } = await params;
    const { page: pageParam } = await searchParams;
    const page = parseInt(pageParam || "1", 10);
    const limit = 10;

    const novel = await db.novel.findUnique({
        where: { slug },
        select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
        },
    });

    if (!novel) {
        notFound();
    }

    // Fetch ratings
    const ratingsResult = await getNovelRatings(novel.id, page, limit);

    // Fetch average rating
    const ratingsData = await db.rating.aggregate({
        where: { novelId: novel.id },
        _avg: { score: true },
        _count: { score: true },
    });
    const averageRating = ratingsData._avg.score ? ratingsData._avg.score.toFixed(1) : "0";
    const ratingCount = ratingsData._count.score;

    const totalPages = Math.ceil(ratingsResult.total / limit);

    return (
        <div className="min-h-screen bg-background">
            <MainHeader />

            <main className="container mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <Link
                    href={`/truyen/${novel.slug}`}
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-amber-600 transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại {novel.title}
                </Link>

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    {novel.coverImage && (
                        <div className="w-16 h-24 relative rounded-lg overflow-hidden shrink-0">
                            <Image
                                src={novel.coverImage}
                                alt={novel.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-foreground mb-2">
                            Đánh giá - {novel.title}
                        </h1>
                        <div className="flex items-center gap-3">
                            <StarRating score={Math.round(parseFloat(averageRating))} />
                            <span className="text-amber-600 font-bold text-lg">{averageRating}/5</span>
                            <span className="text-muted-foreground">({ratingCount} đánh giá)</span>
                        </div>
                    </div>
                </div>

                {/* Ratings List */}
                {ratingsResult.ratings.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-muted-foreground">Chưa có đánh giá nào cho truyện này.</p>
                        <p className="text-muted-foreground text-sm mt-2">Hãy là người đầu tiên đánh giá!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {ratingsResult.ratings.map((rating) => {
                            const displayName = rating.user.nickname || rating.user.name || "Ẩn danh";
                            const timeAgo = formatDistanceToNow(new Date(rating.createdAt), {
                                addSuffix: true,
                                locale: vi,
                            });

                            return (
                                <div
                                    key={rating.userId}
                                    className="bg-white rounded-xl border border-gray-200 p-6"
                                >
                                    <div className="flex gap-4">
                                        {/* Avatar */}
                                        <Link
                                            href={`/u/${rating.user.username || rating.user.id}`}
                                            className="shrink-0"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                                                {rating.user.image ? (
                                                    <Image
                                                        src={rating.user.image}
                                                        alt={displayName}
                                                        width={48}
                                                        height={48}
                                                        className="object-cover w-full h-full"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <User className="w-6 h-6 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                        </Link>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap mb-2">
                                                <Link
                                                    href={`/u/${rating.user.username || rating.user.id}`}
                                                    className="font-medium text-foreground hover:text-amber-600 transition-colors"
                                                >
                                                    {displayName}
                                                </Link>
                                                <StarRating score={rating.score} />
                                                <span className="text-sm text-muted-foreground">{timeAgo}</span>
                                            </div>
                                            {rating.content ? (
                                                <p className="text-foreground whitespace-pre-wrap">
                                                    {rating.content}
                                                </p>
                                            ) : (
                                                <p className="text-muted-foreground italic">
                                                    Không có nhận xét.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <Link
                            href={`/truyen/${novel.slug}/danh-gia?page=${page - 1}`}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 transition-colors ${page <= 1
                                ? "opacity-50 pointer-events-none text-muted-foreground"
                                : "text-foreground hover:bg-gray-50 hover:border-amber-500"
                                }`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Trước
                        </Link>

                        <span className="text-muted-foreground">
                            Trang {page} / {totalPages}
                        </span>

                        <Link
                            href={`/truyen/${novel.slug}/danh-gia?page=${page + 1}`}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 transition-colors ${page >= totalPages
                                ? "opacity-50 pointer-events-none text-muted-foreground"
                                : "text-foreground hover:bg-gray-50 hover:border-amber-500"
                                }`}
                        >
                            Sau
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
