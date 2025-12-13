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
            case "MODERATOR":
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Shield className="w-3 h-3" /> Điều Hành Viên
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-100 text-foreground font-sans selection:bg-primary/20">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-400/5 rounded-full blur-3xl" />
            </div>

            <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">
                {/* Profile Header Card */}
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-8 shadow-xl relative overflow-hidden mb-8">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="absolute -inset-2 bg-gradient-to-br from-primary to-emerald-500 rounded-full opacity-20 blur-md" />
                            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-50">
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">
                                    {user.nickname || "Vị Đạo Hữu Vô Danh"}
                                </h1>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                    <span className="text-muted-foreground text-sm font-sans">@{user.username || "unknown"}</span>
                                    {getRoleBadge(user.role)}
                                </div>
                            </div>

                            <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground">
                                <CalendarDays className="w-4 h-4" />
                                <span>Gia nhập: {new Date(user.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                        </div>

                        {/* Stats (Placeholder for now) */}
                        <div className="flex gap-6 md:border-l md:border-gray-200 md:pl-8">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">0</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Bình luận</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-emerald-500">0</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Đã đọc</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Badges Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            Huân Chương & Danh Hiệu
                        </h2>

                        {user.badges.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {user.badges.map(({ badge }) => (
                                    <div key={badge.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center text-center gap-3 hover:shadow-md transition-all group">
                                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-2xl shadow-inner">
                                            {/* Assuming icon is an emoji or we render an image if it's a URL */}
                                            {badge.icon.startsWith('http') ? (
                                                <Image src={badge.icon} alt={badge.name} width={32} height={32} />
                                            ) : (
                                                <span>{badge.icon}</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{badge.name}</div>
                                            <div className="text-xs text-muted-foreground mt-1">{badge.description}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-muted-foreground italic">
                                Chưa có huân chương nào được thu thập.
                            </div>
                        )}
                    </div>

                    {/* Uploaded Novels Section */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <PenTool className="w-5 h-5 text-emerald-500" />
                            Truyện Đã Đăng
                        </h2>

                        {user.novels && user.novels.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {user.novels.map((novel) => (
                                    <Link
                                        key={novel.id}
                                        href={`/truyen/${novel.slug}`}
                                        className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all hover:-translate-y-1"
                                    >
                                        <div className="aspect-3/4 relative bg-gray-50">
                                            {novel.coverImage ? (
                                                <Image
                                                    src={novel.coverImage}
                                                    alt={novel.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <BookOpen className="w-8 h-8 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                                                {novel.title}
                                            </h3>
                                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                                {novel.author}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-muted-foreground text-sm italic">
                                Chưa đăng truyện nào.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
