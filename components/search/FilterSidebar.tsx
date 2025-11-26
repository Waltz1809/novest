"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Filter, X } from "lucide-react";

interface Genre {
    id: number;
    name: string;
    slug: string;
}

interface FilterSidebarProps {
    genres: Genre[];
}

export default function FilterSidebar({ genres }: FilterSidebarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<string>("");
    const [selectedSort, setSelectedSort] = useState<string>("latest");

    // Initialize from URL params
    useEffect(() => {
        const genresParam = searchParams.get("genres");
        const statusParam = searchParams.get("status");
        const sortParam = searchParams.get("sort");

        setSelectedGenres(genresParam ? genresParam.split(",") : []);
        setSelectedStatus(statusParam || "");
        setSelectedSort(sortParam || "latest");
    }, [searchParams]);

    const updateFilters = (newGenres: string[], newStatus: string, newSort: string) => {
        const params = new URLSearchParams(searchParams.toString());

        // Keep the query param
        const query = searchParams.get("q");
        if (query) params.set("q", query);

        // Update filters
        if (newGenres.length > 0) {
            params.set("genres", newGenres.join(","));
        } else {
            params.delete("genres");
        }

        if (newStatus) {
            params.set("status", newStatus);
        } else {
            params.delete("status");
        }

        params.set("sort", newSort);

        // Reset to page 1 when filters change
        params.delete("page");

        router.push(`/tim-kiem?${params.toString()}`);
    };

    const handleGenreToggle = (slug: string) => {
        const newGenres = selectedGenres.includes(slug)
            ? selectedGenres.filter(g => g !== slug)
            : [...selectedGenres, slug];

        setSelectedGenres(newGenres);
        updateFilters(newGenres, selectedStatus, selectedSort);
    };

    const handleStatusChange = (status: string) => {
        setSelectedStatus(status);
        updateFilters(selectedGenres, status, selectedSort);
    };

    const handleSortChange = (sort: string) => {
        setSelectedSort(sort);
        updateFilters(selectedGenres, selectedStatus, sort);
    };

    const clearFilters = () => {
        setSelectedGenres([]);
        setSelectedStatus("");
        setSelectedSort("latest");

        const params = new URLSearchParams();
        const query = searchParams.get("q");
        if (query) params.set("q", query);
        params.set("sort", "latest");

        router.push(`/tim-kiem?${params.toString()}`);
    };

    const FilterContent = () => (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Bộ lọc</h2>
                <button
                    onClick={clearFilters}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                    Xóa tất cả
                </button>
            </div>

            {/* Sort */}
            <div>
                <h3 className="font-semibold text-foreground mb-3">Sắp xếp</h3>
                <select
                    value={selectedSort}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="latest">Mới nhất</option>
                    <option value="updated">Cập nhật gần đây</option>
                    <option value="az">A-Z</option>
                </select>
            </div>

            {/* Status */}
            <div>
                <h3 className="font-semibold text-foreground mb-3">Trạng thái</h3>
                <div className="space-y-2">
                    {["", "ONGOING", "COMPLETED"].map((status) => (
                        <label key={status} className="flex items-center cursor-pointer group">
                            <input
                                type="radio"
                                name="status"
                                checked={selectedStatus === status}
                                onChange={() => handleStatusChange(status)}
                                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-foreground group-hover:text-indigo-600">
                                {status === "" ? "Tất cả" : status === "ONGOING" ? "Đang ra" : "Hoàn thành"}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Genres */}
            <div>
                <h3 className="font-semibold text-foreground mb-3">
                    Thể loại ({selectedGenres.length > 0 && `${selectedGenres.length} đã chọn`})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {genres.map((genre) => (
                        <label key={genre.id} className="flex items-center cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={selectedGenres.includes(genre.slug)}
                                onChange={() => handleGenreToggle(genre.slug)}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-foreground group-hover:text-indigo-600">
                                {genre.name}
                            </span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Filter Button */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
            >
                <Filter className="w-5 h-5" />
                Bộ lọc
            </button>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block sticky top-6">
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <FilterContent />
                </div>
            </div>

            {/* Mobile Slide-over Panel */}
            {isMobileOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
                        onClick={() => setIsMobileOpen(false)}
                    />

                    {/* Panel */}
                    <div className="lg:hidden fixed inset-y-0 right-0 w-80 max-w-full bg-card shadow-2xl z-50 overflow-y-auto transition-transform">
                        <div className="p-6">
                            {/* Close Button */}
                            <button
                                onClick={() => setIsMobileOpen(false)}
                                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <FilterContent />
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
