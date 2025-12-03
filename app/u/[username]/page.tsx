import { getUserProfile } from "@/actions/user";
import { notFound } from "next/navigation";
import Image from "next/image";
import { CalendarDays, Shield, PenTool, BookOpen } from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: "Hồ Sơ Thành Viên | Novest",
    description: "Thông tin thành viên cộng đồng Novest",
};

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const user = await getUserProfile(username);

    if (!user) {
        notFound();
    }

    // Role Badge Logic
    const getRoleBadge = (role: string) => {
        switch (role) {
            case "ADMIN":
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Shield className="w-3 h-3" /> Quản Trị Viên
                    </span>
                );
            case "TRANSLATOR":
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <PenTool className="w-3 h-3" /> Dịch Giả
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                        <BookOpen className="w-3 h-3" /> Độc Giả
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0C10] text-slate-200 font-sans selection:bg-amber-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />
            </div>

            <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">
                {/* Profile Header Card */}
                <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-8 shadow-2xl relative overflow-hidden mb-8">
                    <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-amber-500/50 to-transparent opacity-50" />

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="absolute -inset-2 bg-linear-to-br from-amber-500 to-emerald-500 rounded-full opacity-20 blur-md" />
                            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-slate-800 bg-slate-950">
                                <Image
                                    src={user.image || "/placeholder-avatar.png"}
                                    alt={user.nickname || user.name || "User Avatar"}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-100 mb-2">
                                    {user.nickname || "Vị Đạo Hữu Vô Danh"}
                                </h1>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                    <span className="text-slate-500 text-sm font-mono">@{user.username || "unknown"}</span>
                                    {getRoleBadge(user.role)}
                                </div>
                            </div>

                            <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-slate-400">
                                <CalendarDays className="w-4 h-4" />
                                <span>Gia nhập: {new Date(user.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                        </div>

                        {/* Stats (Placeholder for now) */}
                        <div className="flex gap-6 md:border-l md:border-white/5 md:pl-8">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-amber-500">0</div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider">Bình luận</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-emerald-500">0</div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider">Đã đọc</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Badges Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-amber-500" />
                            Huân Chương & Danh Hiệu
                        </h2>

                        {user.badges.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {user.badges.map(({ badge }) => (
                                    <div key={badge.id} className="bg-slate-900/30 border border-white/5 rounded-xl p-4 flex flex-col items-center text-center gap-3 hover:bg-slate-800/50 transition-colors group">
                                        <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center text-2xl shadow-inner">
                                            {/* Assuming icon is an emoji or we render an image if it's a URL */}
                                            {badge.icon.startsWith('http') ? (
                                                <Image src={badge.icon} alt={badge.name} width={32} height={32} />
                                            ) : (
                                                <span>{badge.icon}</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-300 text-sm group-hover:text-amber-400 transition-colors">{badge.name}</div>
                                            <div className="text-xs text-slate-500 mt-1">{badge.description}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-900/30 border border-white/5 rounded-xl p-8 text-center text-slate-500 italic">
                                Chưa có huân chương nào được thu thập.
                            </div>
                        )}
                    </div>

                    {/* Sidebar / Recent Activity Placeholder */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-200">Hoạt Động Gần Đây</h2>
                        <div className="bg-slate-900/30 border border-white/5 rounded-xl p-6 text-center text-slate-500 text-sm">
                            Tính năng đang phát triển...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
