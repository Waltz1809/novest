import { getUserTickets } from "@/actions/ticket";
import { TICKET_TYPE_LABELS, TICKET_STATUS_LABELS } from "@/lib/ticket-types";
import TicketZone from "@/components/ticket/ticket-zone";
import Link from "next/link";
import {
    Ticket,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    ExternalLink,
    Plus
} from "lucide-react";

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
    OPEN: { bg: "bg-blue-100", text: "text-blue-600", icon: Clock },
    IN_PROGRESS: { bg: "bg-amber-100", text: "text-amber-600", icon: Loader2 },
    RESOLVED: { bg: "bg-green-100", text: "text-green-600", icon: CheckCircle2 },
    CLOSED: { bg: "bg-gray-100", text: "text-gray-500", icon: XCircle },
};

export default async function StudioTicketsPage() {
    const result = await getUserTickets();
    const tickets = result.tickets || [];

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Tickets của tôi</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Quản lý các yêu cầu hỗ trợ và báo cáo
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ticket List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-emerald-500" />
                        Lịch sử tickets ({tickets.length})
                    </h2>

                    {tickets.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                            <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">Chưa có ticket nào</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Gửi ticket khi bạn cần hỗ trợ hoặc muốn báo cáo vấn đề
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tickets.map((ticket) => {
                                const statusStyle = STATUS_COLORS[ticket.status] || STATUS_COLORS.OPEN;
                                const StatusIcon = statusStyle.icon;

                                return (
                                    <div
                                        key={ticket.id}
                                        className="bg-white rounded-xl border border-gray-200 p-4 hover:border-emerald-300 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-muted-foreground">
                                                        {TICKET_TYPE_LABELS[ticket.mainType] || ticket.mainType}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded ${statusStyle.bg} ${statusStyle.text} flex items-center gap-1`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {TICKET_STATUS_LABELS[ticket.status]}
                                                    </span>
                                                </div>
                                                <h3 className="font-medium text-foreground truncate">
                                                    {ticket.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                                    {ticket.description}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                    <span>
                                                        {new Date(ticket.createdAt).toLocaleDateString("vi-VN")}
                                                    </span>
                                                    {ticket.novel && (
                                                        <Link
                                                            href={`/truyen/${ticket.novel.slug}`}
                                                            className="flex items-center gap-1 hover:text-emerald-600"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            {ticket.novel.title}
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Create Ticket */}
                <div className="lg:col-span-1">
                    <h2 className="text-lg font-medium text-foreground flex items-center gap-2 mb-4">
                        <Plus className="w-5 h-5 text-emerald-500" />
                        Tạo ticket mới
                    </h2>
                    <TicketZone />
                </div>
            </div>
        </div>
    );
}
