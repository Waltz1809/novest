import { auth } from "@/auth";
import { getHistory, getLibrary } from "@/actions/library";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Book, Clock, Heart } from "lucide-react";
import MainHeader from "@/components/layout/main-header";

export default async function LibraryPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/api/auth/signin");
    }

    const library = await getLibrary();
    const history = await getHistory();

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <MainHeader />

            <main className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-8">Tủ truyện của tôi</h1>

                <div className="space-y-12">
                    {/* Library Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-6">
                            <Heart className="w-6 h-6 text-pink-500" />
                            <h2 className="text-xl font-bold text-gray-800">Truyện yêu thích</h2>
                        </div>

                        {library.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {library.map((item) => (
                                    <Link
                                        key={item.novelId}
                                        href={`/truyen/${item.novel.slug}`}
                                        className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col"
                                    >
                                        <div className="aspect-2/3 relative bg-gray-100">
                                            {item.novel.coverImage ? (
                                                <Image
                                                    src={item.novel.coverImage}
                                                    alt={item.novel.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <Book className="w-12 h-12" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                                {item.novel.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">{item.novel.author}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
                                <p className="text-gray-500">Bạn chưa lưu truyện nào.</p>
                            </div>
                        )}
                    </section>

                    {/* History Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-6">
                            <Clock className="w-6 h-6 text-indigo-500" />
                            <h2 className="text-xl font-bold text-gray-800">Lịch sử đọc</h2>
                        </div>

                        {history.length > 0 ? (
                            <div className="space-y-4">
                                {history.map((item) => (
                                    <div
                                        key={item.novelId}
                                        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow"
                                    >
                                        <Link href={`/truyen/${item.novel.slug}`} className="shrink-0 w-16 h-24 relative bg-gray-100 rounded-lg overflow-hidden">
                                            {item.novel.coverImage ? (
                                                <Image
                                                    src={item.novel.coverImage}
                                                    alt={item.novel.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <Book className="w-6 h-6" />
                                                </div>
                                            )}
                                        </Link>

                                        <div className="flex-1 min-w-0">
                                            <Link href={`/truyen/${item.novel.slug}`} className="font-bold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1">
                                                {item.novel.title}
                                            </Link>
                                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                                <span>Đọc đến:</span>
                                                <Link href={`/truyen/${item.novel.slug}/${item.chapter.slug}`} className="text-indigo-600 font-medium hover:underline truncate">
                                                    {item.chapter.title}
                                                </Link>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">
                                                {new Date(item.updatedAt).toLocaleDateString("vi-VN")} {new Date(item.updatedAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>

                                        <Link
                                            href={`/truyen/${item.novel.slug}/${item.chapter.slug}`}
                                            className="shrink-0 px-4 py-2 bg-indigo-50 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                                        >
                                            Đọc tiếp
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
                                <p className="text-gray-500">Bạn chưa đọc truyện nào.</p>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
