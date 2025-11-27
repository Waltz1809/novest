"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface NovelDescriptionProps {
    description: string;
    className?: string;
}

export default function NovelDescription({ description, className }: NovelDescriptionProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Simple check to see if description is long enough to warrant a toggle
    // This is a rough approximation, ideally we'd measure height
    const isLong = description.length > 300;

    return (
        <div className={cn("relative", className)}>
            <div
                className={cn(
                    "prose prose-invert max-w-none text-gray-300 leading-relaxed text-sm md:text-base transition-all duration-300",
                    !isExpanded && "line-clamp-3 md:line-clamp-4"
                )}
            >
                <div className="whitespace-pre-line">{description}</div>
            </div>

            {isLong && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-2 flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider"
                >
                    {isExpanded ? (
                        <>
                            Thu gọn <ChevronUp className="w-3 h-3" />
                        </>
                    ) : (
                        <>
                            Xem thêm <ChevronDown className="w-3 h-3" />
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
