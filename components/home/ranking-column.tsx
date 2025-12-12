import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HorizontalCard } from "@/components/novel/horizontal-card";

interface RankingColumnProps {
  title: string;
  novels: any[];
  link?: string;
}

export function RankingColumn({ title, novels, link }: RankingColumnProps) {
  if (!novels || novels.length === 0) return null;

  const topNovel = novels[0];
  const otherNovels = novels.slice(1, 10);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <span className="w-1 h-6 bg-primary rounded-full"></span>
          {title}
        </h3>
        {link && (
          <Link
            href={link}
            className="text-xs font-bold text-gray-500 hover:text-primary flex items-center transition-colors"
          >
            Xem thêm <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {/* Top 1 */}
        <HorizontalCard
          novel={topNovel}
          variant="compact"
          rank={1}
        />

        {/* Top 2-10 */}
        <div className="flex flex-col gap-2">
          {otherNovels.map((novel, index) => (
            <HorizontalCard
              key={novel.id}
              novel={novel}
              variant="text-only"
              rank={index + 2}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
