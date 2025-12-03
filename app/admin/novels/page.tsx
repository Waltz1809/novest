import { getNovels, deleteNovel } from "@/actions/admin";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Trash2, BookOpen, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function NovelsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; search?: string }>;
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const search = params.search || "";
    const { novels, metadata, error } = await getNovels({ page, search });

    if (error || !novels) {
        return <div className="text-red-500">Failed to load novels</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white font-family-name:var(--font-be-vietnam-pro)">Novels</h1>
                <p className="text-gray-400 font-family-name:var(--font-be-vietnam-pro)">Manage platform content.</p>
            </div>

            <DataTable
                columns={[
                    { header: "Novel", className: "w-[40%]" },
                    { header: "Uploader" },
                    { header: "Stats" },
                    { header: "Created" },
                    { header: "Actions", className: "text-right" },
                ]}
                metadata={metadata}
            >
                {novels.map((novel) => (
                    <tr key={novel.id} className="group transition-colors hover:bg-white/2">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-8 shrink-0 overflow-hidden rounded bg-gray-800">
                                    {novel.coverImage ? (
                                        <img
                                            src={novel.coverImage}
                                            alt={novel.title}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
                                            No Img
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="font-medium text-white line-clamp-1 font-family-name:var(--font-be-vietnam-pro)">{novel.title}</div>
                                    <div className="text-xs text-gray-500 line-clamp-1">{novel.author}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6 border border-white/10">
                                    <AvatarImage src={""} />
                                    <AvatarFallback className="text-[10px] bg-amber-500/10 text-amber-500">
                                        {novel.uploader.name?.[0] || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-gray-400 font-family-name:var(--font-be-vietnam-pro)">
                                    {novel.uploader.nickname || novel.uploader.name}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <div className="flex items-center gap-1" title="Comments">
                                    <MessageSquare className="h-3 w-3" />
                                    <span>{novel._count.comments}</span>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 font-family-name:var(--font-be-vietnam-pro)">
                            {new Date(novel.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <form
                                action={async () => {
                                    "use server";
                                    await deleteNovel(novel.id);
                                }}
                            >
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-500 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </form>
                        </td>
                    </tr>
                ))}
            </DataTable>
        </div>
    );
}
