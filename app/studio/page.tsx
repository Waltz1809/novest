import { auth } from "@/auth";
import { db } from "@/lib/db";
import StatCard from "@/components/studio/stat-card";

export default async function DashboardPage() {
    const session = await auth();

    // Fetch real data from database
    const userId = session?.user?.id;

    // 1. Total Views: Sum of viewCount from all user's novels
    const novels = await db.novel.findMany({
        where: { uploaderId: userId },
        select: { viewCount: true },
    });
    const totalViews = novels.reduce((sum, novel) => sum + novel.viewCount, 0);

    // 2. Revenue: Get user's wallet balance
    const wallet = await db.wallet.findUnique({
        where: { userId: userId },
        select: { balance: true },
    });
    const balance = wallet?.balance || 0;

    // Format views for display (e.g., 1.2M)
    const formatViews = (count: number) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}Tr`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}N`;
        return count.toString();
    };

    // Format balance with commas
    const formatBalance = (amount: number) => {
        return amount.toLocaleString("vi-VN");
    };

    // Mock data for mini chart (TODO: Replace with real historical data)
    const viewsChartData = [
        { value: Math.floor(totalViews * 0.6) },
        { value: Math.floor(totalViews * 0.7) },
        { value: Math.floor(totalViews * 0.65) },
        { value: Math.floor(totalViews * 0.8) },
        { value: Math.floor(totalViews * 0.9) },
        { value: Math.floor(totalViews * 0.85) },
        { value: totalViews },
    ];

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                    Bảng điều khiển
                </h1>
                <p className="text-[#9CA3AF]">
                    Chào mừng quay lại, {session?.user?.name || session?.user?.nickname}
                </p>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Total Views Card */}
                <StatCard
                    title="Tổng lượt xem"
                    value={formatViews(totalViews)}
                    badge={1}
                    miniChartData={viewsChartData}
                />

                {/* Revenue Card */}
                <StatCard
                    title="Doanh thu"
                    value={`${formatBalance(balance)} Xu`}
                    badge={2}
                    trend="up"
                    trendValue="+12%"
                />
            </div>
        </div>
    );
}
