"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, SlidersHorizontal, X, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { searchService, genreService } from "@/services";
import AdvancedFilterModal from "./advanced-filter-modal";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Use media query to detect mobile/tablet (less than 1024px)
  const isMobile = useMediaQuery("only screen and (max-width : 1024px)");

  // Fetch genres on mount
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await genreService.getAll();
        if (response.success && response.data) {
          setGenres(response.data);
        }
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
        const response = await searchService.quickSearch(debouncedQuery);
        if (response.success && response.data) {
          setResults(response.data);
          setIsOpen(true);
        }
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
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
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
  if (isMobile) {
    return (
      <>
        <Button
          onClick={() => setIsMobileSearchOpen(true)}
          title="Tìm kiếm"
          variant="ghost"
          size="icon"
        >
          <Search size={24} />
        </Button>

        {/* Mobile Search Dialog */}
        <Dialog
          open={isMobileSearchOpen}
          onOpenChange={setIsMobileSearchOpen}
        >
          <DialogContent
            hideCloseButton
            className="w-full h-full max-w-full sm:max-w-lg sm:h-auto sm:max-h-[80vh] p-0 gap-0 flex flex-col !rounded-none sm:!rounded-lg border-0 sm:border"
          >
            <DialogHeader className="sr-only">
              <DialogTitle>Tìm kiếm</DialogTitle>
            </DialogHeader>

            {/* Search Header */}
            <div className="flex items-center gap-2 p-3 border-b border-border shrink-0">
              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm kiếm truyện, tác giả..."
                  className="w-full pl-10 pr-10 h-12 border border-gray-400 rounded-full focus-visible:ring-2 focus-visible:ring-primary transition-all text-sm text-foreground placeholder:text-muted-foreground shadow-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      closeMobileSearch();
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
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="absolute right-3 inset-y-0 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                  title="Bộ lọc nâng cao"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </button>
              </div>
              <DialogClose asChild>
                <button className="flex items-center justify-center w-10 h-10 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </DialogClose>
            </div>

            {/* Search Results */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {results.length > 0 ? (
                  <div className="space-y-1">
                    {results.map((novel) => (
                      <div
                        key={novel.id}
                        onClick={() => handleSelect(novel.slug)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-accent cursor-pointer transition-colors rounded-lg"
                      >
                        <div className="relative w-10 h-14 bg-muted rounded overflow-hidden shrink-0">
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
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {novel.title}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {novel.author}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[calc(100vh-100px)] sm:h-[300px] flex flex-col items-center justify-center text-muted-foreground opacity-50">
                    <BookOpen className="w-12 h-12 mb-2" />
                    <p className="text-sm">
                      {query
                        ? "Không tìm thấy kết quả"
                        : "Nhập từ khóa để tìm kiếm"}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Advanced Filter Modal */}
        <AdvancedFilterModal
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          genres={genres}
        />
      </>
    );
  }

  // Desktop mode: full search bar
  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-md"
    >
      <div className="relative w-full">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm truyện, tác giả..."
          className="w-full pl-10 pr-10 h-12 border-gray-300 rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-background transition-all text-sm text-foreground placeholder:text-muted-foreground shadow-none"
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
          {isLoading ? <Loader2 size={20} /> : <Search size={20} />}
        </div>
        <button
          onClick={() => setIsFilterOpen(true)}
          className="absolute right-4 inset-y-0 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
          title="Bộ lọc nâng cao"
        >
          <SlidersHorizontal size={20} />
        </button>
      </div>

      {/* Advanced Filter Modal */}
      <AdvancedFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        genres={genres}
      />

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50">
          <div className="py-2">
            {results.map((novel) => (
              <div
                key={novel.id}
                onClick={() => handleSelect(novel.slug)}
                className="flex items-center gap-3 px-4 py-2 hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="relative w-8 h-12 bg-muted rounded overflow-hidden shrink-0">
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
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {novel.title}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {novel.author}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOpen && query && results.length === 0 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-lg p-4 text-center text-sm text-muted-foreground z-50">
          Không tìm thấy kết quả nào.
        </div>
      )}
    </div>
  );
}
