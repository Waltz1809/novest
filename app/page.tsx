import { db } from "@/lib/db";
import { auth } from "@/auth";
import { BookOpen } from "lucide-react";
import MainHeader from "@/components/layout/main-header";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { ContinueReading } from "@/components/home/continue-reading";
import { NovelShelf } from "@/components/novel/novel-shelf";
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
      where: {
        approvalStatus: "APPROVED",
      },
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
      where: {
        approvalStatus: "APPROVED",
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 20, // Increased for shelf
    }),

    // Get top viewed novels
    getTopViewed(20),

    // Get top rated novels
    getTopRated(20),

    // Get reading history if user is logged in
    session?.user ? getHistory() : Promise.resolve([]),
  ]);

  return (
    <div className="min-h-screen bg-[#0B0C10] text-gray-100 font-sans pb-20">
      {/* Header */}
      <MainHeader />

      {/* Main Content */}
      <main>
        {/* Hero Carousel */}
        <div className="mb-8">
          <HeroCarousel novels={carouselNovels} />
        </div>

        {/* Shelves Stack */}
        <div className="flex flex-col gap-4">
          <NovelShelf title="Thịnh Hành" novels={topViewed} link="/rankings?sort=view" />
          <NovelShelf title="Mới Cập Nhật" novels={latestNovels} link="/latest" />
          <NovelShelf title="Đánh Giá Cao" novels={topRated} link="/rankings?sort=rating" />
        </div>

        {/* Continue Reading Section - At the bottom */}
        {session?.user && readingHistory.length > 0 && (
          <div className="container mx-auto max-w-md mt-8">
            <ContinueReading history={readingHistory} />
          </div>
        )}
      </main>
    </div>
  );
}
