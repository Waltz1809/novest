"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Genre {
  id: number;
  name: string;
  slug: string;
}

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  genres: Genre[];
}

export default function AdvancedFilterModal({
  isOpen,
  onClose,
  genres,
}: AdvancedFilterModalProps) {
  const router = useRouter();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("all");

  const handleGenreToggle = (slug: string) => {
    setSelectedGenres((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSearch = () => {
    const params = new URLSearchParams();

    // Add selected genres
    if (selectedGenres.length > 0) {
      params.set("genres", selectedGenres.join(","));
    }

    // Add status filter
    if (status !== "all") {
      params.set("status", status);
    }

    // Navigate to search page
    const url = `/tim-kiem${params.toString() ? `?${params.toString()}` : ""}`;
    router.push(url);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-100">
          <DialogTitle className="text-2xl font-semibold text-primary">
            Tìm kiếm nâng cao
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh] overflow-y-auto touch-pan-y">
          <div className="px-6 py-6">
            {/* Status Filter */}
            <div className="mb-6">
              <Label className="block text-base font-medium text-foreground mb-2">
                Tình trạng
              </Label>

              <Select
                value={status}
                onValueChange={setStatus}
              >
                <SelectTrigger className="w-full bg-white border border-gray-300 text-foreground focus:ring-2 focus:ring-primary">
                  <SelectValue placeholder="Chọn tình trạng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="ONGOING">Đang ra</SelectItem>
                  <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Genres Filter */}
            <div>
              <Label className="block text-base font-medium text-foreground mb-6">
                Thể loại ({selectedGenres.length} đã chọn)
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {genres.map((genre) => (
                  <div
                    key={genre.id}
                    className="flex items-center gap-2 group"
                  >
                    <Checkbox
                      id={`genre-${genre.id}`}
                      checked={selectedGenres.includes(genre.slug)}
                      onCheckedChange={() => handleGenreToggle(genre.slug)}
                    />
                    <Label htmlFor={`genre-${genre.id}`}>{genre.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-gray-100 sm:justify-end gap-3">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Hủy
          </Button>
          <Button onClick={handleSearch}>Tìm kiếm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
