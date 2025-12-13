import { getAdminStats } from "@/actions/admin";
import { Users, MessageSquare, BookOpen, TrendingUp } from "lucide-react";

export default async function AdminDashboardPage() {
    const stats = await getAdminStats();

    if ("error" in stats) {
        return (
            <div className="flex h-[50vh] items-center justify-center text-red-500">
                Không thể tải thống kê
            </div>
        );
    }

    const cards = [
        {
            title: "Tổng người dùng",
            value: stats.totalUsers,
            icon: Users,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
            border: "border-blue-400/20",
        },
        {
            title: "Tổng bình luận",
            value: stats.totalComments,
            icon: MessageSquare,
            color: "text-green-400",
            bg: "bg-green-400/10",
            border: "border-green-400/20",
        },
        {
            title: "Tổng truyện",
            value: stats.totalNovels,
            icon: BookOpen,
            color: "text-amber-400",
            bg: "bg-amber-400/10",
            border: "border-amber-400/20",
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-sans text-3xl font-bold text-foreground">Tổng quan</h1>
                <p className="text-muted-foreground">Chào mừng trở lại, Quản trị viên.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {cards.map((card) => (
                    <div
                        key={card.title}
                        className={`relative overflow-hidden rounded-xl border ${card.border} ${card.bg} p-6 transition-all hover:scale-[1.02]`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                                <h3 className="mt-2 font-sans text-3xl font-bold text-foreground">
                                    {card.value.toLocaleString()}
                                </h3>
                            </div>
                            <div className={`rounded-lg p-3 ${card.bg}`}>
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                        </div>
                        {/* Decorative glow */}
                        <div
                            className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${card.bg} blur-2xl`}
                        />
                    </div>
                ))}
            </div>

            {/* Trạng thái hệ thống */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h2 className="font-sans text-xl font-bold text-foreground">Trạng thái hệ thống</h2>
                </div>
                <p className="text-muted-foreground">Hệ thống hoạt động bình thường. Không phát hiện bất thường.</p>
            </div>
        </div>
    );
}
