"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { searchNovels, getGenres } from "@/actions/search";
import { useDebounce } from "@/hooks/use-debounce"; // Assuming this hook exists or I'll create it
import AdvancedFilterModal from "./advanced-filter-modal";

interface SearchResult {
    id: number;
    title: string;
    slug: string;
    author: string;
    coverImage: string | null;
}

interface Genre {
    id: number;
    name: string;
    slug: string;
}

export default function SearchBar() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [genres, setGenres] = useState<Genre[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Fetch genres on mount
    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const data = await getGenres();
                setGenres(data);
            } catch (error) {
                console.error("Error fetching genres:", error);
            }
        };
        fetchGenres();
    }, []);

    // Debounce query
    const [debouncedQuery, setDebouncedQuery] = useState(query);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(handler);
    }, [query]);

    useEffect(() => {
        const fetchResults = async () => {
            if (!debouncedQuery.trim()) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const data = await searchNovels(debouncedQuery);
                setResults(data);
                setIsOpen(true);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [debouncedQuery]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (slug: string) => {
        setIsOpen(false);
        setQuery("");
        router.push(`/truyen/${slug}`);
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-md flex items-center gap-2">
            <div className="relative flex-1">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm kiếm truyện, tác giả..."
                    className="w-full pl-10 pr-4 py-2 bg-muted border-none rounded-full focus:ring-2 focus:ring-indigo-500 focus:bg-background transition-all outline-none text-sm text-foreground placeholder:text-muted-foreground"
                    onFocus={() => query && setIsOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            setIsOpen(false);
                            router.push(`/tim-kiem?q=${encodeURIComponent(query)}`);
                        }
                    }}
                />
                <div className="absolute left-3 inset-y-0 flex items-center text-muted-foreground pointer-events-none">
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Search className="w-4 h-4" />
                    )}
                </div>
            </div>

            {/* Advanced Filter Button */}
            <button
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center justify-center w-10 h-10 bg-muted hover:bg-indigo-100 hover:text-indigo-600 rounded-full transition-colors"
                title="Bộ lọc nâng cao"
            >
                <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Advanced Filter Modal */}
            <AdvancedFilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                genres={genres}
            />

            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-lg  overflow-hidden z-50">
                    <div className="py-2">
                        {results.map((novel) => (
                            <div
                                key={novel.id}
                                onClick={() => handleSelect(novel.slug)}
                                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <div className="relative w-8 h-12 bg-gray-200 rounded overflow-hidden shrink-0">
                                    {novel.coverImage && (
                                        <Image
                                            src={novel.coverImage}
                                            alt={novel.title}
                                            fill
                                            className="object-cover"
                                            sizes="32px"
                                        />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-gray-900 truncate">
                                        {novel.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 truncate">{novel.author}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isOpen && query && results.length === 0 && !isLoading && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-lg  p-4 text-center text-sm text-gray-500 z-50">
                    Không tìm thấy kết quả nào.
                </div>
            )}
        </div>
    );
}
