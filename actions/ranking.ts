"use server";

import { db } from "@/lib/db";

export interface NovelWithViewCount {
  id: number;
  title: string;
  slug: string;
  author: string;
  coverImage: string | null;
  viewCount: number;
  chapterCount?: number;
  avgRating?: number;
  description?: string | null;
  genre?: string;
}

export interface NovelWithRating {
  id: number;
  title: string;
  slug: string;
  author: string;
  coverImage: string | null;
  averageRating: number;
  avgRating?: number;
  ratingCount: number;
  chapterCount?: number;
  description?: string | null;
  genre?: string;
  genres: { name: string }[];
}

/**
 * Get top viewed novels ordered by viewCount descending
 * @param limit Number of novels to return (default: 10)
 */
export async function getTopViewed(
  limit: number = 10
): Promise<NovelWithViewCount[]> {
  const novels = await db.novel.findMany({
    where: {
      approvalStatus: "APPROVED",
      isR18: false,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      author: true,
      coverImage: true,
      viewCount: true,
      description: true,
      genres: { select: { name: true }, take: 1 },
      ratings: { select: { score: true } },
      volumes: {
        select: {
          _count: { select: { chapters: true } },
        },
      },
    },
    orderBy: {
      viewCount: "desc",
    },
    take: limit,
  });

  return novels.map((novel) => {
    const chapterCount = novel.volumes.reduce((sum, v) => sum + v._count.chapters, 0);
    const avgRating = novel.ratings.length > 0
      ? novel.ratings.reduce((sum, r) => sum + r.score, 0) / novel.ratings.length
      : 0;
    return {
      id: novel.id,
      title: novel.title,
      slug: novel.slug,
      author: novel.author,
      coverImage: novel.coverImage,
      viewCount: novel.viewCount,
      chapterCount,
      avgRating,
      description: novel.description,
      genre: novel.genres[0]?.name,
    };
  });
}

/**
 * Get top rated novels ordered by average rating descending
 * @param limit Number of novels to return (default: 10)
 */
export async function getTopRated(
  limit: number = 10
): Promise<NovelWithRating[]> {
  const novelsWithRatings = await db.novel.findMany({
    where: {
      approvalStatus: "APPROVED",
      isR18: false,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      author: true,
      coverImage: true,
      description: true,
      ratings: { select: { score: true } },
      genres: { select: { name: true } },
      volumes: {
        select: {
          _count: { select: { chapters: true } },
        },
      },
    },
  });

  const novelsWithAverage = novelsWithRatings
    .map((novel) => {
      const totalScore = novel.ratings.reduce((sum, rating) => sum + rating.score, 0);
      const ratingCount = novel.ratings.length;
      const averageRating = ratingCount > 0 ? totalScore / ratingCount : 0;
      const chapterCount = novel.volumes.reduce((sum, v) => sum + v._count.chapters, 0);

      return {
        id: novel.id,
        title: novel.title,
        slug: novel.slug,
        author: novel.author,
        coverImage: novel.coverImage,
        averageRating: Number(averageRating.toFixed(2)),
        avgRating: Number(averageRating.toFixed(2)),
        ratingCount,
        chapterCount,
        description: novel.description,
        genre: novel.genres[0]?.name,
        genres: novel.genres,
      };
    })
    .filter((novel) => novel.ratingCount > 0)
    .sort((a, b) => {
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      return b.ratingCount - a.ratingCount;
    })
    .slice(0, limit);

  return novelsWithAverage;
}

/**
 * Increment view count for a novel (fire and forget)
 * This is called when a user views a chapter
 * @param novelId ID of the novel to increment views for
 */
export async function incrementView(novelId: number): Promise<void> {
  try {
    await db.novel.update({
      where: { id: novelId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  } catch (error) {
    // Silently fail - we don't want to block page rendering
    console.error(`Failed to increment view for novel ${novelId}:`, error);
  }
}
