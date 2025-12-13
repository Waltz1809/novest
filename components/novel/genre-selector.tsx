"use client";

import { useState, useRef, useEffect } from "react";
import { X, Check, ChevronsUpDown } from "lucide-react";

interface Genre {
    id: number;
    name: string;
}

interface GenreSelectorProps {
    genres: Genre[];
    selectedValues: number[];
    onChange: (values: number[]) => void;
}

export default function GenreSelector({ genres, selectedValues, onChange }: GenreSelectorProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter genres based on query
    const filteredGenres = query === ""
        ? genres
        : genres.filter((genre) =>
            genre.name.toLowerCase().includes(query.toLowerCase())
        );

    const selectedGenres = genres.filter((g) => selectedValues.includes(g.id));

    const handleSelect = (id: number) => {
        if (selectedValues.includes(id)) {
            onChange(selectedValues.filter((v) => v !== id));
        } else {
            onChange([...selectedValues, id]);
        }
        setQuery("");
        inputRef.current?.focus();
    };

    const handleRemove = (id: number) => {
        onChange(selectedValues.filter((v) => v !== id));
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <div
                className="flex flex-wrap gap-2 p-2 min-h-[46px] w-full rounded-lg bg-gray-50 border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all cursor-text"
                onClick={() => {
                    inputRef.current?.focus();
                    setOpen(true);
                }}
            >
                {selectedGenres.map((genre) => (
                    <span
                        key={genre.id}
                        className="flex items-center gap-1 px-2 py-1 text-sm bg-primary/10 text-primary border border-primary/20 rounded-md animate-in fade-in zoom-in duration-200"
                    >
                        {genre.name}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(genre.id);
                            }}
                            className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    className="flex-1 bg-transparent outline-none min-w-[80px] text-sm text-foreground placeholder:text-muted-foreground"
                    placeholder={selectedGenres.length === 0 ? "Chọn thể loại..." : ""}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === "Backspace" && query === "" && selectedValues.length > 0) {
                            handleRemove(selectedValues[selectedValues.length - 1]);
                        }
                    }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronsUpDown className="w-4 h-4 text-primary/50" />
                </div>
            </div>

            {open && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                    <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                        {filteredGenres.length === 0 ? (
                            <div className="p-3 text-sm text-muted-foreground text-center">
                                Không tìm thấy thể loại.
                            </div>
                        ) : (
                            filteredGenres.map((genre) => {
                                const isSelected = selectedValues.includes(genre.id);
                                return (
                                    <div
                                        key={genre.id}
                                        onClick={() => handleSelect(genre.id)}
                                        className={`
                                            flex items-center justify-between px-3 py-2 rounded-md text-sm cursor-pointer transition-colors mb-0.5
                                            ${isSelected
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:bg-gray-50 hover:text-foreground"
                                            }
                                        `}
                                    >
                                        <span>{genre.name}</span>
                                        {isSelected && <Check className="w-4 h-4" />}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

