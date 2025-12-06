"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, SlidersHorizontal, X } from "lucide-react";
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

interface SearchBarProps {
    mobileMode?: boolean;
}

export default function SearchBar({ mobileMode = false }: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [genres, setGenres] = useState<Genre[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
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

    // Focus input when mobile search opens
    useEffect(() => {
        if (isMobileSearchOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isMobileSearchOpen]);

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
        setIsMobileSearchOpen(false);
        router.push(`/truyen/${slug}`);
    };

    const closeMobileSearch = () => {
        setIsMobileSearchOpen(false);
        setQuery("");
        setIsOpen(false);
    };

    // Mobile mode: just show a search icon button
    if (mobileMode) {
        return (
            <>
                <button
                    onClick={() => setIsMobileSearchOpen(true)}
                    className="flex items-center justify-center w-9 h-9 text-gray-400 hover:text-white transition-colors"
                    title="Tìm kiếm"
                >
                    <Search className="w-5 h-5" />
                </button>

                {/* Mobile Search Overlay */}
                {isMobileSearchOpen && (
                    <div className="fixed inset-0 z-100 bg-[#0B0C10]">
                        <div className="flex flex-col h-full">
                            {/* Search Header */}
                            <div className="flex items-center gap-2 p-3 border-b border-[#1F2937]">
                                <div className="relative flex-1">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Tìm kiếm truyện, tác giả..."
                                        className="w-full pl-10 pr-4 py-2 bg-[#1F2937] border-none rounded-full focus:ring-2 focus:ring-[#F59E0B] transition-all outline-none text-sm text-white placeholder:text-gray-500"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                closeMobileSearch();
                                                router.push(`/tim-kiem?q=${encodeURIComponent(query)}`);
                                            }
                                        }}
                                    />
                                    <div className="absolute left-3 inset-y-0 flex items-center text-gray-500 pointer-events-none">
                                        {isLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Search className="w-4 h-4" />
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsFilterOpen(true)}
                                    className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-[#F59E0B] transition-colors"
                                    title="Bộ lọc nâng cao"
                                >
                                    <SlidersHorizontal className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={closeMobileSearch}
                                    className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Search Results */}
                            <div className="flex-1 overflow-y-auto">
                                {results.length > 0 && (
                                    <div className="py-2">
                                        {results.map((novel) => (
                                            <div
                                                key={novel.id}
                                                onClick={() => handleSelect(novel.slug)}
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-[#1F2937] cursor-pointer transition-colors"
                                            >
                                                <div className="relative w-10 h-14 bg-[#1F2937] rounded overflow-hidden shrink-0">
                                                    {novel.coverImage && (
                                                        <Image
                                                            src={novel.coverImage}
                                                            alt={novel.title}
                                                            fill
                                                            className="object-cover"
                                                            sizes="40px"
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium text-white truncate">
                                                        {novel.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 truncate">{novel.author}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {query && results.length === 0 && !isLoading && (
                                    <div className="p-8 text-center text-sm text-gray-500">
                                        Không tìm thấy kết quả nào.
                                    </div>
                                )}

                                {!query && (
                                    <div className="p-8 text-center text-sm text-gray-500">
                                        Nhập tên truyện hoặc tác giả để tìm kiếm
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Advanced Filter Modal */}
                        <AdvancedFilterModal
                            isOpen={isFilterOpen}
                            onClose={() => setIsFilterOpen(false)}
                            genres={genres}
                        />
                    </div>
                )}
            </>
        );
    }

    // Desktop mode: full search bar
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
                className="flex items-center justify-center w-10 h-10 bg-[#1F2937] hover:bg-[#374151] hover:text-[#F59E0B] rounded-full transition-colors text-gray-400"
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
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1E293B] border border-[#374151] rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="py-2">
                        {results.map((novel) => (
                            <div
                                key={novel.id}
                                onClick={() => handleSelect(novel.slug)}
                                className="flex items-center gap-3 px-4 py-2 hover:bg-[#374151] cursor-pointer transition-colors"
                            >
                                <div className="relative w-8 h-12 bg-[#374151] rounded overflow-hidden shrink-0">
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
                                    <h4 className="text-sm font-medium text-white truncate">
                                        {novel.title}
                                    </h4>
                                    <p className="text-xs text-gray-400 truncate">{novel.author}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isOpen && query && results.length === 0 && !isLoading && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1E293B] border border-[#374151] rounded-xl shadow-lg p-4 text-center text-sm text-gray-400 z-50">
                    Không tìm thấy kết quả nào.
                </div>
            )}
        </div>
    );
}
