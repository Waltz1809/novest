import { getAdminLogs, getLogActionTypes } from "@/actions/admin-log"
import { Shield, Search, Filter } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    APPROVE_NOVEL: { label: "Duyệt truyện", color: "text-green-500 bg-green-500/10" },
    REJECT_NOVEL: { label: "Từ chối truyện", color: "text-red-500 bg-red-500/10" },
    DELETE_NOVEL: { label: "Xóa truyện", color: "text-red-600 bg-red-600/10" },
    DELETE_COMMENT: { label: "Xóa bình luận", color: "text-orange-500 bg-orange-500/10" },
    DELETE_CHAPTER: { label: "Xóa chương", color: "text-orange-600 bg-orange-600/10" },
    BAN_USER: { label: "Cấm người dùng", color: "text-red-500 bg-red-500/10" },
    UNBAN_USER: { label: "Bỏ cấm người dùng", color: "text-green-500 bg-green-500/10" },
    CHANGE_ROLE: { label: "Đổi quyền", color: "text-blue-500 bg-blue-500/10" },
    PIN_ANNOUNCEMENT: { label: "Ghim thông báo", color: "text-amber-500 bg-amber-500/10" },
}

interface SearchParams {
    page?: string
    action?: string
}

export default async function AdminLogsPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>
}) {
    const params = await searchParams
    const page = parseInt(params.page || "1")
    const action = params.action || ""

    const { logs, metadata } = await getAdminLogs({ page, action })
    const actionTypes = await getLogActionTypes()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <Shield className="w-8 h-8 text-emerald-500" />
                    Nhật ký hoạt động
                </h1>
                <p className="text-muted-foreground mt-1">
                    Theo dõi các hành động của Admin/Mod trên hệ thống.
                </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Lọc theo:</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Link
                        href="/admin/logs"
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${!action
                            ? "bg-emerald-500 text-white font-medium"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        Tất cả
                    </Link>
                    {actionTypes.map((type) => (
                        <Link
                            key={type}
                            href={`/admin/logs?action=${type}`}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${action === type
                                ? "bg-emerald-500 text-white font-medium"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            {ACTION_LABELS[type]?.label || type}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-left px-6 py-4 text-xs text-muted-foreground uppercase tracking-wide">
                                Thời gian
                            </th>
                            <th className="text-left px-6 py-4 text-xs text-muted-foreground uppercase tracking-wide">
                                Người thực hiện
                            </th>
                            <th className="text-left px-6 py-4 text-xs text-muted-foreground uppercase tracking-wide">
                                Hành động
                            </th>
                            <th className="text-left px-6 py-4 text-xs text-muted-foreground uppercase tracking-wide">
                                Chi tiết
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-12 text-muted-foreground">
                                    Chưa có hoạt động nào được ghi lại.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => {
                                const actionInfo = ACTION_LABELS[log.action] || {
                                    label: log.action,
                                    color: "text-gray-600 bg-gray-100",
                                }
                                return (
                                    <tr
                                        key={log.id}
                                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            {new Date(log.createdAt).toLocaleString("vi-VN")}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {log.user.image ? (
                                                    <Image
                                                        src={log.user.image}
                                                        alt={log.user.name || ""}
                                                        width={32}
                                                        height={32}
                                                        className="rounded-full"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm text-muted-foreground">
                                                        {(log.user.nickname || log.user.name || "?").charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm text-foreground font-medium">
                                                        {log.user.nickname || log.user.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{log.user.role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 py-1 rounded-md text-xs font-medium ${actionInfo.color}`}
                                            >
                                                {actionInfo.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                                            {log.details || "-"}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {metadata.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    {page > 1 && (
                        <Link
                            href={`/admin/logs?page=${page - 1}${action ? `&action=${action}` : ""}`}
                            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Trước
                        </Link>
                    )}
                    <span className="text-muted-foreground text-sm">
                        Trang {page} / {metadata.totalPages}
                    </span>
                    {page < metadata.totalPages && (
                        <Link
                            href={`/admin/logs?page=${page + 1}${action ? `&action=${action}` : ""}`}
                            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Sau
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}
