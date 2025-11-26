import { getAdvancedSearchResults, getGenres } from "@/actions/search";
import Link from "next/link";
import Image from "next/image";
import { Book, Search } from "lucide-react";
import FilterSidebar from "@/components/search/FilterSidebar";
import PaginationControls from "@/components/search/PaginationControls";

interface SearchPageProps {
    searchParams: Promise<{
        q?: string;
        genres?: string;
        status?: string;
        sort?: string;
        page?: string;
    }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const params = await searchParams;
    const query = params.q || "";
    const genreSlugs = params.genres ? params.genres.split(",") : [];
    const status = params.status;
    const sort = params.sort || "latest";
    const page = parseInt(params.page || "1");

    // Fetch all genres for filter sidebar
    const genres = await getGenres();

    // Fetch search results with filters
    const { novels, totalCount, pageSize } = await getAdvancedSearchResults({
        query,
        genreSlugs,
        status,
        sort,
        page,
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    // Determine page title based on filters
    const getPageTitle = () => {
        if (query) return `Kết quả tìm kiếm: "${query}"`;
        if (genreSlugs.length > 0) return "Tìm kiếm nâng cao";
        return "Tất cả truyện";
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                    {getPageTitle()}
                </h1>
                <p className="text-muted-foreground">
                    Tìm thấy {totalCount} kết quả
                    {genreSlugs.length > 0 && ` với ${genreSlugs.length} thể loại`}
                    {status && ` - ${status === "ONGOING" ? "Đang ra" : "Hoàn thành"}`}
                </p>
            </div>

            {/* Main Content */}
            <div className="lg:flex lg:gap-8">
                {/* Desktop Filter Sidebar */}
                <div className="w-[280px] shrink-0 hidden lg:block">
                    <FilterSidebar genres={genres} />
                </div>

                {/* Mobile Filter  */}
                <div className="lg:hidden mb-6">
                    <FilterSidebar genres={genres} />
                </div>

                {/* Results */}
                <div className="flex-1">
                    {novels.length > 0 ? (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                {novels.map((novel) => (
                                    <Link
                                        key={novel.id}
                                        href={`/truyen/${novel.slug}`}
                                        className="group bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full"
                                    >
                                        {/* Cover Image */}
                                        <div className="aspect-[2/3] relative bg-muted overflow-hidden">
                                            {novel.coverImage ? (
                                                <Image
                                                    src={novel.coverImage}
                                                    alt={novel.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/50 group-hover:bg-indigo-50/30 transition-colors">
                                                    <Book className="w-12 h-12 mb-2 text-muted-foreground/50 group-hover:text-indigo-200 transition-colors" />
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        No Cover
                                                    </span>
                                                </div>
                                            )}

                                            {/* Status Badge */}
                                            <div className="absolute top-2 right-2">
                                                <span
                                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${novel.status === "ONGOING"
                                                        ? "bg-green-500 text-white"
                                                        : "bg-blue-500 text-white"
                                                        }`}
                                                >
                                                    {novel.status === "ONGOING" ? "Đang ra" : "Hoàn"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-3 md:p-4 flex flex-col grow">
                                            <h3 className="font-bold text-card-foreground line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors text-sm md:text-base">
                                                {novel.title}
                                            </h3>
                                            <p className="text-xs md:text-sm text-muted-foreground mb-2 font-medium">
                                                {novel.author}
                                            </p>

                                            {/* Genres */}
                                            {novel.genres.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-auto">
                                                    {novel.genres.slice(0, 2).map((genre) => (
                                                        <span
                                                            key={genre.id}
                                                            className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full"
                                                        >
                                                            {genre.name}
                                                        </span>
                                                    ))}
                                                    {novel.genres.length > 2 && (
                                                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                                                            +{novel.genres.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* Pagination */}
                            <PaginationControls currentPage={page} totalPages={totalPages} />
                        </>
                    ) : (
                        /* Empty State */
                        <div className="text-center py-20">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                                <Search className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">
                                Không tìm thấy kết quả
                            </h3>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                {query
                                    ? `Không tìm thấy truyện nào với từ khóa "${query}"`
                                    : "Không có truyện nào phù hợp với bộ lọc đã chọn"}
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Thử thay đổi từ khóa hoặc bộ lọc của bạn
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
