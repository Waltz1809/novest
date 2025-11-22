import { db } from "@/lib/db";
import { Book, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import UserButton from "@/components/auth/user-button";

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
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Book className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-indigo-900 tracking-tight">
              Novest
            </span>
          </Link>

          <UserButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Truyện mới nhất
          </h1>
          <p className="text-gray-500">
            Cập nhật những bộ truyện hot nhất vừa ra mắt
          </p>
        </div>

        {/* Novel Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {novels.map((novel) => (
            <Link
              key={novel.id}
              href={`/truyen/${novel.slug}`}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col h-full"
            >
              {/* Cover Image Area */}
              <div className="aspect-[2/3] relative bg-gray-100 overflow-hidden">
                {novel.coverImage && (novel.coverImage.startsWith('http') || novel.coverImage.startsWith('/')) ? (
                  <Image
                    src={novel.coverImage}
                    alt={novel.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50 group-hover:bg-indigo-50/30 transition-colors">
                    <Book className="w-12 h-12 mb-2 text-gray-200 group-hover:text-indigo-200 transition-colors" />
                    <span className="text-xs font-medium text-gray-400">
                      No Cover
                    </span>
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm ${novel.status === 'ONGOING' ? 'bg-green-100 text-green-700' :
                    novel.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                    {novel.status}
                  </span>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-gray-900 line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">
                  {novel.title}
                </h3>
                <p className="text-sm text-gray-500 mb-3 font-medium">
                  {novel.author}
                </p>

                <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(novel.createdAt).toLocaleDateString('vi-VN')}</span>
                  {/* Placeholder for rating or views if needed */}
                  {/* <span>{Number(novel.viewCount).toLocaleString()} views</span> */}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {novels.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Book className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Chưa có truyện nào</h3>
            <p className="text-gray-500 mt-1">Hãy thêm truyện mới vào cơ sở dữ liệu.</p>
          </div>
        )}
      </main>
    </div>
  );
}
