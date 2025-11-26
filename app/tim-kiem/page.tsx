import { searchNovels } from "@/actions/search";
import Link from "next/link";
import Image from "next/image";
import { Book } from "lucide-react";

interface SearchPageProps {
    searchParams: Promise<{
        q?: string;
    }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { q } = await searchParams;
    const query = q || "";
    const novels = await searchNovels(query);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                    Kết quả tìm kiếm: "{query}"
                </h1>
                <p className="text-muted-foreground">
                    Tìm thấy {novels.length} kết quả phù hợp
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {novels.map((novel) => (
                    <Link
                        key={novel.id}
                        href={`/truyen/${novel.slug}`}
                        className="group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 flex flex-col h-full"
                    >
                        {/* Cover Image Area */}
                        <div className="aspect-2/3 relative bg-muted overflow-hidden">
                            {novel.coverImage ? (
                                <Image
                                    src={novel.coverImage}
                                    alt={novel.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/50 group-hover:bg-indigo-50/30 transition-colors">
                                    <Book className="w-12 h-12 mb-2 text-muted-foreground/50 group-hover:text-indigo-200 transition-colors" />
                                    <span className="text-xs font-medium text-muted-foreground">
                                        No Cover
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Content Area */}
                        <div className="p-4 flex flex-col grow">
                            <h3 className="font-bold text-card-foreground line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">
                                {novel.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3 font-medium">
                                {novel.author}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>

            {novels.length === 0 && (
                <div className="text-center py-20">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <Book className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">Không tìm thấy kết quả</h3>
                    <p className="text-muted-foreground mt-1">Thử tìm kiếm với từ khóa khác.</p>
                </div>
            )}
        </div>
    );
}
