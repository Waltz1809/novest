"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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

  const updateFilters = (
    newGenres: string[],
    newStatus: string,
    newSort: string
  ) => {
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
      ? selectedGenres.filter((g) => g !== slug)
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

  const renderFilterContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Bộ lọc</h2>
        <button
          onClick={clearFilters}
          className="text-sm text-[#F59E0B] hover:text-[#FBBF24] font-medium"
        >
          Xóa tất cả
        </button>
      </div>

      {/* Sort */}
      <div>
        <Label className="font-semibold text-white mb-3 block">Sắp xếp</Label>
        <Select
          value={selectedSort}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-full bg-[#1F2937] border-[#374151] text-white focus:ring-[#F59E0B]">
            <SelectValue placeholder="Sắp xếp theo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Mới nhất</SelectItem>
            <SelectItem value="updated">Cập nhật gần đây</SelectItem>
            <SelectItem value="az">A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status */}
      <div>
        <Label className="font-semibold text-white mb-3 block">
          Trạng thái
        </Label>
        <RadioGroup
          value={selectedStatus}
          onValueChange={handleStatusChange}
          className="space-y-2"
        >
          {["", "ONGOING", "COMPLETED"].map((status) => (
            <div
              key={status}
              className="flex items-center space-x-2"
            >
              <RadioGroupItem
                value={status}
                id={`status-${status}`}
                className="border-[#F59E0B] text-[#F59E0B]"
              />
              <Label
                htmlFor={`status-${status}`}
                className="text-sm text-gray-300 hover:text-[#F59E0B] cursor-pointer"
              >
                {status === ""
                  ? "Tất cả"
                  : status === "ONGOING"
                  ? "Đang ra"
                  : "Hoàn thành"}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Genres */}
      <div>
        <Label className="font-semibold text-white mb-3 block">
          Thể loại{" "}
          {selectedGenres.length > 0 && `(${selectedGenres.length} đã chọn)`}
        </Label>
        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
          {genres.map((genre) => (
            <div
              key={genre.id}
              className="flex items-center space-x-2"
            >
              <Checkbox
                id={`genre-${genre.slug}`}
                checked={selectedGenres.includes(genre.slug)}
                onCheckedChange={() => handleGenreToggle(genre.slug)}
                className="border-[#374151] data-[state=checked]:bg-[#F59E0B] data-[state=checked]:border-[#F59E0B]"
              />
              <Label
                htmlFor={`genre-${genre.slug}`}
                className="text-sm text-gray-300 hover:text-[#F59E0B] cursor-pointer"
              >
                {genre.name}
              </Label>
            </div>
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
        className="lg:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 px-6 py-3 bg-[#F59E0B] text-[#0B0C10] rounded-full shadow-lg hover:bg-[#FBBF24] transition-colors font-semibold"
      >
        <Filter className="w-5 h-5" />
        Bộ lọc
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block sticky top-6">
        <div className="bg-[#1E293B] border border-[#374151] rounded-xl p-6 shadow-lg">
          {renderFilterContent()}
        </div>
      </div>

      {/* Mobile Slide-over Panel */}
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/60 z-40 transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Panel */}
          <div className="lg:hidden fixed inset-y-0 right-0 w-80 max-w-full bg-[#0B0C10] shadow-2xl z-50 overflow-y-auto transition-transform">
            {/* Close Button - Fixed at top */}
            <div className="sticky top-0 flex justify-end p-3 bg-[#0B0C10] border-b border-[#1F2937]">
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#1F2937] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">{renderFilterContent()}</div>
          </div>
        </>
      )}
    </>
  );
}
