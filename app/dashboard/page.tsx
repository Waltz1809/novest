import { auth } from "@/auth";
import { db } from "@/lib/db";
import StatCard from "@/components/dashboard/stat-card";
import ReadershipChart from "@/components/dashboard/readership-chart";
import CommentActivity from "@/components/dashboard/comment-activity";

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

    // 3. Recent Comments: Get latest 3 comments on user's novels
    const recentComments = await db.comment.findMany({
        where: {
            novel: {
                uploaderId: userId,
            },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: {
            user: {
                select: {
                    name: true,
                    nickname: true,
                },
            },
        },
    });

    // Format views for display (e.g., 1.2M)
    const formatViews = (count: number) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    // Format balance with commas
    const formatBalance = (amount: number) => {
        return amount.toLocaleString();
    };

    // Calculate time ago for comments
    const getTimeAgo = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    // Transform comments for CommentActivity component
    const commentsData = recentComments.map((comment) => ({
        id: comment.id,
        user: comment.user.nickname || comment.user.name || "Anonymous",
        text: comment.content,
        time: getTimeAgo(comment.createdAt),
    }));

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
                    Dashboard
                </h1>
                <p className="text-[#9CA3AF]">
                    Chào mừng quay lại, {session?.user?.name || session?.user?.nickname}
                </p>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Total Views Card */}
                <StatCard
                    title="Total Views"
                    value={formatViews(totalViews)}
                    badge={1}
                    miniChartData={viewsChartData}
                />

                {/* Revenue Card */}
                <StatCard
                    title="Revenue"
                    value={`${formatBalance(balance)} Xu`}
                    badge={2}
                    trend="up"
                    trendValue="+12%"
                />

                {/* New Comments Card */}
                <CommentActivity comments={commentsData} />
            </div>

            {/* Readership Growth Chart */}
            <ReadershipChart />
        </div>
    );
}
