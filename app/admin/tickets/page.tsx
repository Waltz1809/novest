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
                <h1 className="text-3xl font-bold text-foreground font-family-name:var(--font-be-vietnam-pro)">Ticket</h1>
                <p className="text-muted-foreground font-family-name:var(--font-be-vietnam-pro)">Quản lý báo cáo và yêu cầu hỗ trợ.</p>
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
                    <tr key={ticket.id} className="group transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4">
                            <div>
                                <div className="font-medium text-foreground font-family-name:var(--font-be-vietnam-pro)">{ticket.title}</div>
                                <div className="text-xs text-muted-foreground line-clamp-1 font-family-name:var(--font-be-vietnam-pro)">{ticket.description}</div>
                                {ticket.subType && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Phân loại: {ticket.subType}
                                    </div>
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <Badge variant="outline" className="border-gray-200 bg-gray-100 text-gray-600 font-family-name:var(--font-be-vietnam-pro)">
                                {TYPE_LABELS[ticket.mainType] || ticket.mainType}
                            </Badge>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6 border border-gray-200">
                                    <AvatarImage src={ticket.user.image || ""} />
                                    <AvatarFallback className="text-[10px] bg-emerald-100 text-emerald-600">
                                        {ticket.user.name?.[0] || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-muted-foreground font-family-name:var(--font-be-vietnam-pro)">
                                    {ticket.user.name}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <Badge
                                variant="outline"
                                className={
                                    ticket.status === "OPEN"
                                        ? "border-green-200 bg-green-100 text-green-700"
                                        : ticket.status === "IN_PROGRESS"
                                            ? "border-amber-200 bg-amber-100 text-amber-700"
                                            : ticket.status === "RESOLVED"
                                                ? "border-blue-200 bg-blue-100 text-blue-700"
                                                : "border-gray-200 bg-gray-100 text-gray-600"
                                }
                            >
                                {STATUS_LABELS[ticket.status] || ticket.status}
                            </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground font-family-name:var(--font-be-vietnam-pro)">
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
                                            type="submit"
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
                                            type="submit"
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
                                        type="submit"
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
