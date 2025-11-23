"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { searchNovels } from "@/actions/search";
import { useDebounce } from "@/hooks/use-debounce"; // Assuming this hook exists or I'll create it

interface SearchResult {
    id: number;
    title: string;
    slug: string;
    author: string;
    coverImage: string | null;
}

export default function SearchBar() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

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
        <div ref={containerRef} className="relative w-full max-w-md">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm kiếm truyện, tác giả..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm"
                    onFocus={() => query && setIsOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            setIsOpen(false);
                            router.push(`/tim-kiem?q=${encodeURIComponent(query)}`);
                        }
                    }}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Search className="w-4 h-4" />
                    )}
                </div>
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
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
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 p-4 text-center text-sm text-gray-500 z-50">
                    Không tìm thấy kết quả nào.
                </div>
            )}
        </div>
    );
}
