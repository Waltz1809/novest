import { getComments, deleteComment } from "@/actions/admin";
import { DataTable } from "@/components/admin/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2, MessageSquare, BookOpen } from "lucide-react";
import Link from "next/link";

export default async function CommentsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; search?: string }>;
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const search = params.search || "";
    const { comments, metadata, error } = await getComments({ page, search });

    if (error || !comments) {
        return <div className="text-red-500">Failed to load comments</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-sans text-3xl font-bold text-white">Comments</h1>
                <p className="text-gray-400">Moderate user discussions.</p>
            </div>

            <DataTable
                columns={[
                    { header: "Content", className: "w-[40%]" },
                    { header: "Author" },
                    { header: "Context" },
                    { header: "Date" },
                    { header: "Actions", className: "text-right" },
                ]}
                metadata={metadata}
            >
                {comments.map((comment) => (
                    <tr key={comment.id} className="group transition-colors hover:bg-white/2">
                        <td className="px-6 py-4">
                            <div className="line-clamp-2 text-sm text-gray-300">
                                {comment.content}
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6 border border-white/10">
                                    <AvatarImage src={comment.user.image || ""} />
                                    <AvatarFallback className="text-[10px]">
                                        {comment.user.name?.[0] || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-gray-400">
                                    {comment.user.nickname || comment.user.name}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 text-xs text-amber-500">
                                    <BookOpen className="h-3 w-3" />
                                    <span>{comment.novel.title}</span>
                                </div>
                                {comment.chapter && (
                                    <div className="text-xs text-gray-500">
                                        Ch. {comment.chapter.title}
                                    </div>
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <form
                                action={async () => {
                                    "use server";
                                    await deleteComment(comment.id);
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
