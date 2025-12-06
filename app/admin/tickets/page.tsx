import { getTickets, updateTicketStatus } from "@/actions/admin";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Clock } from "lucide-react";

// Type labels in Vietnamese
const TYPE_LABELS: Record<string, string> = {
    REPORT: "Báo cáo",
    BUG: "Báo lỗi",
    SUPPORT: "Hỗ trợ",
    FIX_CHAPTER: "Sửa chương",
    STATUS_CHANGE: "Đổi trạng thái",
};

// Status labels in Vietnamese
const STATUS_LABELS: Record<string, string> = {
    OPEN: "Mở",
    IN_PROGRESS: "Đang xử lý",
    RESOLVED: "Đã giải quyết",
    CLOSED: "Đã đóng",
};

export default async function TicketsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; status?: string }>;
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const status = params.status || "";
    const { tickets, metadata, error } = await getTickets({ page, status });

    if (error || !tickets) {
        return <div className="text-red-500">Không thể tải danh sách ticket</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white font-family-name:var(--font-be-vietnam-pro)">Ticket</h1>
                <p className="text-gray-400 font-family-name:var(--font-be-vietnam-pro)">Quản lý báo cáo và yêu cầu hỗ trợ.</p>
            </div>

            <DataTable
                columns={[
                    { header: "Tiêu đề", className: "w-[40%]" },
                    { header: "Loại" },
                    { header: "Người gửi" },
                    { header: "Trạng thái" },
                    { header: "Ngày tạo" },
                    { header: "Hành động", className: "text-right" },
                ]}
                metadata={metadata}
                searchPlaceholder="Lọc theo trạng thái..."
            >
                {tickets.map((ticket) => (
                    <tr key={ticket.id} className="group transition-colors hover:bg-white/2">
                        <td className="px-6 py-4">
                            <div>
                                <div className="font-medium text-white font-family-name:var(--font-be-vietnam-pro)">{ticket.title}</div>
                                <div className="text-xs text-gray-500 line-clamp-1 font-family-name:var(--font-be-vietnam-pro)">{ticket.description}</div>
                                {ticket.subType && (
                                    <div className="text-xs text-gray-600 mt-1">
                                        Phân loại: {ticket.subType}
                                    </div>
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <Badge variant="outline" className="border-white/10 bg-white/5 text-gray-400 font-family-name:var(--font-be-vietnam-pro)">
                                {TYPE_LABELS[ticket.mainType] || ticket.mainType}
                            </Badge>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6 border border-white/10">
                                    <AvatarImage src={ticket.user.image || ""} />
                                    <AvatarFallback className="text-[10px] bg-amber-500/10 text-amber-500">
                                        {ticket.user.name?.[0] || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-gray-400 font-family-name:var(--font-be-vietnam-pro)">
                                    {ticket.user.name}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <Badge
                                variant="outline"
                                className={
                                    ticket.status === "OPEN"
                                        ? "border-green-500/20 bg-green-500/10 text-green-500"
                                        : ticket.status === "IN_PROGRESS"
                                            ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
                                            : ticket.status === "RESOLVED"
                                                ? "border-blue-500/20 bg-blue-500/10 text-blue-500"
                                                : "border-gray-500/20 bg-gray-500/10 text-gray-500"
                                }
                            >
                                {STATUS_LABELS[ticket.status] || ticket.status}
                            </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 font-family-name:var(--font-be-vietnam-pro)">
                            {new Date(ticket.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                                {ticket.status === "OPEN" && (
                                    <form
                                        action={async () => {
                                            "use server";
                                            await updateTicketStatus(ticket.id, "IN_PROGRESS");
                                        }}
                                    >
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
                                            title="Đang xử lý"
                                        >
                                            <Clock className="h-4 w-4" />
                                        </Button>
                                    </form>
                                )}
                                {(ticket.status === "OPEN" || ticket.status === "IN_PROGRESS") && (
                                    <form
                                        action={async () => {
                                            "use server";
                                            await updateTicketStatus(ticket.id, "RESOLVED");
                                        }}
                                    >
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-green-500 hover:bg-green-500/10 hover:text-green-400"
                                            title="Đã giải quyết"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                        </Button>
                                    </form>
                                )}
                                <form
                                    action={async () => {
                                        "use server";
                                        await updateTicketStatus(ticket.id, "CLOSED");
                                    }}
                                >
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-500 hover:bg-gray-500/10 hover:text-gray-400"
                                        title="Đóng ticket"
                                    >
                                        <XCircle className="h-4 w-4" />
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
