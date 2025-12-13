import { getNovels, deleteNovel } from "@/actions/admin";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Eye } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NovelActionsDropdown } from "@/components/admin/novel-actions-dropdown";

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

// Filter tabs config
const STATUS_TABS = [
    { value: "", label: "Tất cả", color: "text-foreground" },
    { value: "PENDING", label: "Chờ duyệt", color: "text-amber-600" },
    { value: "APPROVED", label: "Đã duyệt", color: "text-green-600" },
    { value: "REJECTED", label: "Từ chối", color: "text-red-600" },
];

export default async function NovelsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const search = params.search || "";
    const status = params.status || "";
    const { novels, metadata, error } = await getNovels({ page, search, status });

    if (error || !novels) {
        return <div className="text-red-500">Không thể tải danh sách truyện</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground font-family-name:var(--font-be-vietnam-pro)">Truyện</h1>
                <p className="text-muted-foreground font-family-name:var(--font-be-vietnam-pro)">Quản lý nội dung trên nền tảng.</p>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-4">
                {STATUS_TABS.map((tab) => (
                    <Link
                        key={tab.value}
                        href={`/admin/novels${tab.value ? `?status=${tab.value}` : ""}${search ? `&search=${search}` : ""}`}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === tab.value
                            ? `bg-gray-100 ${tab.color} border border-gray-200`
                            : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                            }`}
                    >
                        {tab.label}
                    </Link>
                ))}
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
                    <tr key={novel.id} className="group transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-8 shrink-0 overflow-hidden rounded bg-gray-100">
                                    {novel.coverImage ? (
                                        <img
                                            src={novel.coverImage}
                                            alt={novel.title}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                            N/A
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="font-medium text-foreground line-clamp-1 font-family-name:var(--font-be-vietnam-pro)">{novel.title}</div>
                                    <div className="text-xs text-muted-foreground line-clamp-1">{novel.author}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6 border border-gray-200">
                                    <AvatarImage src={""} />
                                    <AvatarFallback className="text-[10px] bg-emerald-100 text-emerald-600">
                                        {novel.uploader.name?.[0] || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-muted-foreground font-family-name:var(--font-be-vietnam-pro)">
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
                                            ? "border-green-200 bg-green-100 text-green-700"
                                            : novel.approvalStatus === "PENDING"
                                                ? "border-amber-200 bg-amber-100 text-amber-700"
                                                : "border-red-200 bg-red-100 text-red-700"
                                    }
                                >
                                    {APPROVAL_LABELS[novel.approvalStatus] || novel.approvalStatus}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {STATUS_LABELS[novel.status] || novel.status}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                        <td className="px-6 py-4 text-sm text-muted-foreground font-family-name:var(--font-be-vietnam-pro)">
                            {new Date(novel.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <NovelActionsDropdown
                                novelId={novel.id}
                                novelSlug={novel.slug}
                                novelTitle={novel.title}
                                approvalStatus={novel.approvalStatus}
                            />
                        </td>
                    </tr>
                ))}
            </DataTable>
        </div>
    );
}

