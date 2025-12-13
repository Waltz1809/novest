import { db } from "@/lib/db";
import { auth } from "@/auth";

import MainHeader from "@/components/layout/main-header";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { ContinueReading } from "@/components/home/continue-reading";
import { TopSeries } from "@/components/home/top-series";
import { NovelSlider } from "@/components/novel/novel-slider";
import { RecommendedNovelShelf } from "@/components/recommendation/recommended-novel-shelf";
import { RankingColumn } from "@/components/home/ranking-column";
import { HorizontalCard } from "@/components/novel/horizontal-card";
import { ArrowRight } from "lucide-react";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    readingHistory,
    cnNovels,
    krNovels,
    jpNovels,
    completedNovels,

    newArrivals,
    generalRanking,
  ] = await Promise.all([
    // Get 5 top-rated novels for carousel
    db.novel
      .findMany({
        where: {
          approvalStatus: "APPROVED",
          isR18: false, // Hide R18 from public listings
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
      })
      .then((novels) => {
        // Calculate average rating and sort
        const novelsWithRating = novels
          .map((novel) => ({
            ...novel,
            avgRating:
              novel.ratings.length > 0
                ? novel.ratings.reduce((sum, r) => sum + r.score, 0) /
                  novel.ratings.length
                : 0,
          }))
          .sort((a, b) => b.avgRating - a.avgRating)
          .slice(0, 5)
          .map(({ ratings, avgRating, ...novel }) => novel);
        return novelsWithRating;
      }),

    // Get latest updated novels
    db.novel
      .findMany({
        where: { approvalStatus: "APPROVED", isR18: false },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          slug: true,
          author: true,
          coverImage: true,
          viewCount: true,
          ratings: { select: { score: true } },
          genres: { select: { id: true, name: true }, take: 3 },
          createdAt: true,
          updatedAt: true,
        },
      })
      .then((novels) =>
        novels.map((n) => ({
          ...n,
          views: n.viewCount,
          rating:
            n.ratings.length > 0
              ? n.ratings.reduce((a, b) => a + b.score, 0) / n.ratings.length
              : 0,
          categories: n.genres,
          latestChapter: {
            title: "Chương mới nhất",
            updatedAt: n.updatedAt,
          },
        }))
      ),

    // Get top viewed novels
    getTopViewed(20),

    // Get top rated novels
    getTopRated(20),

    // Get reading history if user is logged in
    session?.user ? getHistory() : Promise.resolve([]),

    // Get top CN novels
    getRankingByNation("CN"),
    // Get top KR novels
    getRankingByNation("KR"),
    // Get top JP novels
    getRankingByNation("JP"),

    // Get completed novels for recommendation
    db.novel
      .findMany({
        where: {
          approvalStatus: "APPROVED",
          isR18: false,
          status: "COMPLETED",
        },
        take: 15,
        orderBy: { viewCount: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          author: true,
          coverImage: true,
          viewCount: true,
          ratings: { select: { score: true } },
          genres: { select: { id: true, name: true }, take: 3 },
          createdAt: true,
        },
      })
      .then((novels) =>
        novels.map((n) => ({
          ...n,
          views: n.viewCount,
          rating:
            n.ratings.length > 0
              ? n.ratings.reduce((a, b) => a + b.score, 0) / n.ratings.length
              : 0,
          categories: n.genres,
        }))
      ),

    // Get new arrivals (created recently)
    db.novel
      .findMany({
        where: { approvalStatus: "APPROVED", isR18: false },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          slug: true,
          author: true,
          coverImage: true,
          description: true,
          viewCount: true,
          ratings: { select: { score: true } },
          genres: { select: { id: true, name: true }, take: 3 },
          createdAt: true,
        },
      })
      .then((novels) =>
        novels.map((n) => ({
          ...n,
          description: n.description || undefined,
          views: n.viewCount,
          rating:
            n.ratings.length > 0
              ? n.ratings.reduce((a, b) => a + b.score, 0) / n.ratings.length
              : 0,
          categories: n.genres,
          latestChapter: {
            title: "Chương 1: Khởi đầu",
            updatedAt: n.createdAt,
          },
        }))
      ),

    // Get general ranking (top 40 viewed)
    db.novel
      .findMany({
        where: { approvalStatus: "APPROVED", isR18: false },
        orderBy: { viewCount: "desc" },
        take: 40,
        select: {
          id: true,
          title: true,
          slug: true,
          author: true,
          coverImage: true,
          viewCount: true,
          ratings: { select: { score: true } },
          genres: { select: { id: true, name: true }, take: 3 },
          createdAt: true,
        },
      })
      .then((novels) =>
        novels.map((n) => ({
          ...n,
          views: n.viewCount,
          rating:
            n.ratings.length > 0
              ? n.ratings.reduce((a, b) => a + b.score, 0) / n.ratings.length
              : 0,
          categories: n.genres,
        }))
      ),
  ]);

  return (
    <>
      <MainHeader />
      {/* Header */}

      {/* Main Content */}
      <main className="container mx-auto pb-[4rem]">
        {/* Hero Carousel */}
        <div className="mb-8">
          <HeroCarousel novels={carouselNovels} />
        </div>

        {/* Top Series */}
        <TopSeries novels={topRated} />

        {/* Personalized Recommendations - Only for logged in users */}
        {session?.user && <RecommendedNovelShelf />}

        {/* Hot Series */}
        <div className="flex flex-col">
          <NovelSlider
            title="Hot Series"
            novels={topViewed}
            link="/rankings?sort=view"
          />
        </div>

        {/* Ranking Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <RankingColumn
            title="Xếp hạng truyện Trung"
            novels={cnNovels}
            link="/rankings?nation=CN"
          />
          <RankingColumn
            title="Xếp hạng truyện Hàn"
            novels={krNovels}
            link="/rankings?nation=KR"
          />
          <RankingColumn
            title="Xếp hạng truyện Nhật"
            novels={jpNovels}
            link="/rankings?nation=JP"
          />
        </div>

        {/* Recommended Slider */}
        <div className="mt-8">
          <NovelSlider
            title="Đề cử cho bạn"
            novels={completedNovels}
          />
        </div>

        {/* New Arrivals & Recently Updated */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
          {/* New Arrivals (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <span className="w-1.5 h-8 bg-primary rounded-full"></span>
                Truyện cập nhật
              </h3>
              <Link
                href="/latest"
                className="text-sm font-bold text-gray-500 hover:text-primary flex items-center transition-colors"
              >
                Xem tất cả <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {newArrivals.map((novel) => (
                <HorizontalCard
                  key={novel.id}
                  novel={novel}
                />
              ))}
            </div>
          </div>

          {/* Recently Updated (1/3 width) */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-4">
                <span className="w-1.5 h-8 bg-[var(--secondary)] rounded-full"></span>
                Mới lên kệ
              </h3>
              <Link
                href="/latest"
                className="text-sm font-bold text-gray-500 hover:text-primary flex items-center transition-colors"
              >
                Xem tất cả <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {latestNovels.slice(0, 8).map((novel) => (
                <HorizontalCard
                  key={novel.id}
                  novel={novel}
                  variant="compact"
                />
              ))}
            </div>
          </div>
        </div>

        {/* General Ranking Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          <RankingColumn
            title="Top Ngày"
            novels={generalRanking.slice(0, 10)}
            link="/rankings?sort=view&time=day"
          />
          <RankingColumn
            title="Top Tuần"
            novels={generalRanking.slice(10, 20)}
            link="/rankings?sort=view&time=week"
          />
          <RankingColumn
            title="Top Tháng"
            novels={generalRanking.slice(20, 30)}
            link="/rankings?sort=view&time=month"
          />
          <RankingColumn
            title="Top Năm"
            novels={generalRanking.slice(30, 40)}
            link="/rankings?sort=view&time=year"
          />
        </div>

        {/* Tabbed Slider Section */}
        <div className="mt-12">
          <Tabs
            defaultValue="editors-choice"
            className="w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-transparent p-0 h-auto gap-6">
                <TabsTrigger
                  value="editors-choice"
                  className="text-xl md:text-2xl font-bold data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent p-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-all text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  Biên tập viên đề cử
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="text-xl md:text-2xl font-bold data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent p-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-all text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  Truyện mới hoàn thành
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="editors-choice"
              className="mt-0"
            >
              <NovelSlider
                title=""
                novels={topRated} // Using topRated as placeholder for Editor's Choice
                controllerPosition="sides"
              />
            </TabsContent>
            <TabsContent
              value="completed"
              className="mt-0"
            >
              <NovelSlider
                title=""
                novels={completedNovels}
                controllerPosition="sides"
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Continue Reading Section - At the bottom */}
        {session?.user && readingHistory.length > 0 && (
          <div className="container mx-auto max-w-md mt-8">
            <ContinueReading history={readingHistory} />
          </div>
        )}
      </main>
    </>
  );
}

async function getRankingByNation(nation: string) {
  const novels = await db.novel.findMany({
    where: { approvalStatus: "APPROVED", isR18: false, nation },
    orderBy: { viewCount: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      slug: true,
      author: true,
      coverImage: true,
      viewCount: true,
      ratings: { select: { score: true } },
      genres: { select: { id: true, name: true }, take: 3 },
      createdAt: true,
    },
  });

  return novels.map((n) => ({
    ...n,
    views: n.viewCount,
    rating:
      n.ratings.length > 0
        ? n.ratings.reduce((a, b) => a + b.score, 0) / n.ratings.length
        : 0,
    categories: n.genres,
  }));
}
