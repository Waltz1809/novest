import { getNovels, deleteNovel } from "@/actions/admin";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, MessageSquare, Eye } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Status labels in Vietnamese
const STATUS_LABELS: Record<string, string> = {
    ONGOING: "Đang ra",
    COMPLETED: "Hoàn thành",
    HIATUS: "Tạm ngưng",
    DROPPED: "Ngưng cập nhật",
};

// Approval status labels
const APPROVAL_LABELS: Record<string, string> = {
    PENDING: "Chờ duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
};

// Nation labels
const NATION_LABELS: Record<string, string> = {
    CN: "Trung Quốc",
    JP: "Nhật Bản",
    KR: "Hàn Quốc",
};

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
        return <div className="text-red-500">Không thể tải danh sách truyện</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white font-family-name:var(--font-be-vietnam-pro)">Truyện</h1>
                <p className="text-gray-400 font-family-name:var(--font-be-vietnam-pro)">Quản lý nội dung trên nền tảng.</p>
            </div>

            <DataTable
                columns={[
                    { header: "Truyện", className: "w-[35%]" },
                    { header: "Người đăng" },
                    { header: "Trạng thái" },
                    { header: "Thống kê" },
                    { header: "Ngày tạo" },
                    { header: "Hành động", className: "text-right" },
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
                                            N/A
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
                            <div className="flex flex-col gap-1">
                                <Badge
                                    variant="outline"
                                    className={
                                        novel.approvalStatus === "APPROVED"
                                            ? "border-green-500/20 bg-green-500/10 text-green-500"
                                            : novel.approvalStatus === "PENDING"
                                                ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
                                                : "border-red-500/20 bg-red-500/10 text-red-500"
                                    }
                                >
                                    {APPROVAL_LABELS[novel.approvalStatus] || novel.approvalStatus}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                    {STATUS_LABELS[novel.status] || novel.status}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <div className="flex items-center gap-1" title="Bình luận">
                                    <MessageSquare className="h-3 w-3" />
                                    <span>{novel._count.comments}</span>
                                </div>
                                <div className="flex items-center gap-1" title="Lượt xem">
                                    <Eye className="h-3 w-3" />
                                    <span>{novel.viewCount?.toLocaleString() || 0}</span>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 font-family-name:var(--font-be-vietnam-pro)">
                            {new Date(novel.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <Link href={`/truyen/${novel.slug}`} target="_blank">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-500 hover:bg-white/5 hover:text-white"
                                        title="Xem truyện"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <form
                                    action={async () => {
                                        "use server";
                                        await deleteNovel(novel.id);
                                    }}
                                >
                                    <Button
                                        type="submit"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-500 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                                        title="Xóa truyện"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </td>
                    </tr>
                ))}
            </DataTable>
        </div>
    );
}
