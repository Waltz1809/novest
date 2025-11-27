import { db } from "@/lib/db";
import { auth } from "@/auth";
import { BookOpen } from "lucide-react";
import MainHeader from "@/components/layout/main-header";
import { NovelCard } from "@/components/novel/novel-card";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { RankingsSidebar } from "@/components/home/rankings-sidebar";
import { ContinueReading } from "@/components/home/continue-reading";
import { getTopViewed, getTopRated } from "@/actions/ranking";
import { getHistory } from "@/actions/library";

// Revalidate data every 60 seconds (optional, good for static/ISR)
export const revalidate = 60;

export default async function Home() {
  const session = await auth();

  // Fetch data in parallel for better performance
  const [
    carouselNovels,
    latestNovels,
    topViewed,
    topRated,
    readingHistory
  ] = await Promise.all([
    // Get 5 top-rated novels for carousel
    db.novel.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        author: true,
        description: true,
        coverImage: true,
        ratings: {
          select: {
            score: true,
          },
        },
      },
    }).then(novels => {
      // Calculate average rating and sort
      const novelsWithRating = novels
        .map(novel => ({
          ...novel,
          avgRating: novel.ratings.length > 0
            ? novel.ratings.reduce((sum, r) => sum + r.score, 0) / novel.ratings.length
            : 0,
        }))
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 5)
        .map(({ ratings, avgRating, ...novel }) => novel);
      return novelsWithRating;
    }),

    // Get latest updated novels
    db.novel.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      take: 12, // Show 12 latest novels
    }),

    // Get top viewed novels
    getTopViewed(10),

    // Get top rated novels
    getTopRated(10),

    // Get reading history if user is logged in
    session?.user ? getHistory() : Promise.resolve([]),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <MainHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Carousel */}
        <div className="mb-8">
          <HeroCarousel novels={carouselNovels} />
        </div>

        {/* Continue Reading Section (only for logged-in users) */}
        {session?.user && readingHistory.length > 0 && (
          <ContinueReading history={readingHistory} />
        )}

        {/* 2-Column Layout: Latest Updates + Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Latest Updates (70% width on desktop) */}
          <div className="lg:col-span-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Mới Cập Nhật
              </h2>
              <p className="text-muted-foreground">
                Những bộ truyện mới nhất được cập nhật
              </p>
            </div>

            {/* Novel Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {latestNovels.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>

            {latestNovels.length === 0 && (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground">
                  Chưa có truyện nào
                </h3>
                <p className="text-muted-foreground mt-1">
                  Hãy thêm truyện mới vào cơ sở dữ liệu.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Rankings (30% width on desktop) */}
          <div className="lg:col-span-4">
            <RankingsSidebar topViewed={topViewed} topRated={topRated} />
          </div>
        </div>
      </main>
    </div>
  );
}
