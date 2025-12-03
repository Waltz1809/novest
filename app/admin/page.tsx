import { getAdminStats } from "@/actions/admin";
import { Users, MessageSquare, BookOpen, TrendingUp } from "lucide-react";

export default async function AdminDashboardPage() {
    const stats = await getAdminStats();

    if ("error" in stats) {
        return (
            <div className="flex h-[50vh] items-center justify-center text-red-500">
                Failed to load stats
            </div>
        );
    }

    const cards = [
        {
            title: "Total Users",
            value: stats.totalUsers,
            icon: Users,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
            border: "border-blue-400/20",
        },
        {
            title: "Total Comments",
            value: stats.totalComments,
            icon: MessageSquare,
            color: "text-green-400",
            bg: "bg-green-400/10",
            border: "border-green-400/20",
        },
        {
            title: "Total Novels",
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
                <h1 className="font-serif text-3xl font-bold text-white">Dashboard Overview</h1>
                <p className="text-gray-400">Welcome back, Administrator.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {cards.map((card) => (
                    <div
                        key={card.title}
                        className={`relative overflow-hidden rounded-xl border ${card.border} ${card.bg} p-6 transition-all hover:scale-[1.02]`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-400">{card.title}</p>
                                <h3 className="mt-2 font-serif text-3xl font-bold text-white">
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

            {/* Placeholder for charts or recent activity */}
            <div className="rounded-xl border border-white/5 bg-white/2 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-amber-500" />
                    <h2 className="font-serif text-xl font-bold text-white">System Status</h2>
                </div>
                <p className="text-gray-400">System is running smoothly. No anomalies detected.</p>
            </div>
        </div>
    );
}
