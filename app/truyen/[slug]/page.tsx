import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Book, User, Calendar, Eye, Star, List, ChevronRight } from "lucide-react";
import MainHeader from "@/components/layout/main-header";
import { auth } from "@/auth";
import LibraryButton from "@/components/novel/library-button";
import { CommentSection } from "@/components/comment/comment-section";
import { RatingButton } from "@/components/rating/rating-button";
import { getUserRating } from "@/actions/interaction";

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

    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            {/* Header */}
            <MainHeader />

            <main className="container mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <Link href="/" className="hover:text-indigo-600 transition-colors">Trang chủ</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-foreground font-medium truncate">{novel.title}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Cover & Info */}
                    <div className="lg:col-span-1">
                        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border sticky top-24">
                            <div className="aspect-2/3 relative rounded-xl overflow-hidden mb-6 bg-muted shadow-inner">
                                {novel.coverImage && (novel.coverImage.startsWith('http') || novel.coverImage.startsWith('/')) ? (
                                    <Image
                                        src={novel.coverImage}
                                        alt={novel.title}
                                        fill
                                        className="object-cover"
                                        priority
                                        sizes="(max-width: 768px) 100vw, 33vw"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                        <Book className="w-16 h-16 mb-3 text-muted-foreground/50" />
                                        <span className="text-sm font-medium text-muted-foreground">No Cover</span>
                                    </div>
                                )}
                            </div>

                            <h1 className="text-2xl font-bold text-card-foreground mb-2 text-center leading-tight">
                                {novel.title}
                            </h1>
                            <p className="text-center text-muted-foreground font-medium mb-6">
                                {novel.author}
                            </p>

                            <div className="flex flex-col gap-3 justify-center mb-6 px-6">
                                <LibraryButton novelId={novel.id} initialIsInLibrary={isInLibrary} />
                                <RatingButton
                                    novelId={novel.id}
                                    initialRating={userRating?.score}
                                    initialContent={userRating?.content || ""}
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                {/* ... (stats) */}
                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Star className="w-4 h-4" /> Trạng thái
                                    </span>
                                    <span className={`text-sm font-bold px-2 py-1 rounded ${novel.status === 'ONGOING' ? 'bg-green-100 text-green-700' :
                                        novel.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {novel.status}
                                    </span>
                                </div>
                                {/* Placeholder stats */}
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-500 flex items-center gap-2">
                                        <Eye className="w-4 h-4" /> Lượt xem
                                    </span>
                                    <span className="text-sm font-bold text-gray-900">--</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-500 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> Cập nhật
                                    </span>
                                    <span className="text-sm font-bold text-gray-900">
                                        {new Date(novel.updatedAt).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Description & Chapters */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Description */}
                        <section className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                            <h2 className="text-lg font-bold text-card-foreground mb-4 flex items-center gap-2">
                                <List className="w-5 h-5 text-indigo-600" />
                                Giới thiệu
                            </h2>
                            <div className="prose prose-indigo prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">
                                {novel.description || "Chưa có mô tả cho truyện này."}
                            </div>
                        </section>

                        {/* Chapter List */}
                        <section className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                            <h2 className="text-lg font-bold text-card-foreground mb-6 flex items-center gap-2">
                                <List className="w-5 h-5 text-indigo-600" />
                                Danh sách chương
                            </h2>

                            {novel.volumes.length > 0 ? (
                                <div className="space-y-6">
                                    {novel.volumes.map((volume) => (
                                        <div key={volume.id}>
                                            <h3 className="font-bold text-card-foreground mb-3 px-2 border-l-4 border-indigo-500 bg-muted py-1">
                                                {volume.title}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {volume.chapters.map((chapter) => (
                                                    <Link
                                                        key={chapter.id}
                                                        href={`/truyen/${novel.slug}/${chapter.slug}`}
                                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-indigo-50 transition-colors group border border-transparent hover:border-indigo-100"
                                                    >
                                                        <span className="text-sm text-muted-foreground group-hover:text-indigo-700 font-medium truncate">
                                                            {chapter.title}
                                                        </span>
                                                        <span className="text-xs text-gray-400 group-hover:text-indigo-400">
                                                            Chương {chapter.order}
                                                        </span>
                                                    </Link>
                                                ))}
                                                {volume.chapters.length === 0 && (
                                                    <p className="text-sm text-muted-foreground italic px-3">Chưa có chương nào.</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground">
                                    Chưa có danh sách chương.
                                </div>
                            )}
                        </section>

                        {/* Comments */}
                        <section className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                            <CommentSection novelId={novel.id} />
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
