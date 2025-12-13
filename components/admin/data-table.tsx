"use client";

import { ChevronLeft, ChevronRight, Search, Loader2 } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

interface DataTableProps {
    columns: {
        header: string;
        className?: string;
    }[];
    children: React.ReactNode;
    searchPlaceholder?: string;
    metadata: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    isLoading?: boolean;
}

export function DataTable({
    columns,
    children,
    searchPlaceholder = "Search...",
    metadata,
    isLoading,
}: DataTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("search", term);
        } else {
            params.delete("search");
        }
        params.set("page", "1"); // Reset to page 1
        router.replace(`${pathname}?${params.toString()}`);
    }, 300);

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", newPage.toString());
        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                <div className="relative w-72">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        defaultValue={searchParams.get("search")?.toString()}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-foreground placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                </div>
                <div className="text-sm text-muted-foreground">
                    Total: <span className="font-medium text-foreground">{metadata.total}</span>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                {columns.map((col, i) => (
                                    <th
                                        key={i}
                                        className={`px-6 py-4 font-medium text-muted-foreground ${col.className || ""}`}
                                    >
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={columns.length} className="py-24 text-center">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-500" />
                                    </td>
                                </tr>
                            ) : (
                                children
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="text-sm text-muted-foreground">
                    Page {metadata.page} of {metadata.totalPages}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handlePageChange(metadata.page - 1)}
                        disabled={metadata.page <= 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-muted-foreground transition-colors hover:bg-gray-50 hover:text-foreground disabled:opacity-50"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => handlePageChange(metadata.page + 1)}
                        disabled={metadata.page >= metadata.totalPages}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-muted-foreground transition-colors hover:bg-gray-50 hover:text-foreground disabled:opacity-50"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
