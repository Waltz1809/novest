import { db } from "@/lib/db";
import { Book } from "lucide-react";
import MainHeader from "@/components/layout/main-header";
import { NovelCard } from "@/components/novel/novel-card";

// Revalidate data every 60 seconds (optional, good for static/ISR)
export const revalidate = 60;

export default async function Home() {
  // Fetch latest novels from database
  const novels = await db.novel.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 20, // Limit to 20 latest novels
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <MainHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Truyện mới nhất
          </h1>
          <p className="text-muted-foreground">
            Cập nhật những bộ truyện hot nhất vừa ra mắt
          </p>
        </div>

        {/* Novel Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {novels.map((novel) => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>

        {novels.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Book className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">Chưa có truyện nào</h3>
            <p className="text-muted-foreground mt-1">Hãy thêm truyện mới vào cơ sở dữ liệu.</p>
          </div>
        )}
      </main>
    </div>
  );
}
