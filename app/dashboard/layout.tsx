import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, BookOpen, PenTool, LogOut } from "lucide-react";
import UserButton from "@/components/auth/user-button";
import MainHeader from "@/components/layout/main-header";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // Protect route
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TRANSLATOR")) {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <MainHeader />
            
            <div className="flex flex-1">
                {/* Sidebar */}
                <aside className="w-64 bg-card shadow-lg flex flex-col fixed h-full top-16">
                <div className="p-6">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-1.5 rounded-lg">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-foreground tracking-tight">
                            Novest Admin
                        </span>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-accent hover:text-indigo-600 rounded-lg transition-colors font-medium"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        Thống kê
                    </Link>
                    <Link
                        href="/dashboard/novels"
                        className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-accent hover:text-indigo-600 rounded-lg transition-colors font-medium"
                    >
                        <BookOpen className="w-5 h-5" />
                        Quản lý Truyện
                    </Link>
                    <Link
                        href="/dashboard/write"
                        className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-accent hover:text-indigo-600 rounded-lg transition-colors font-medium"
                    >
                        <PenTool className="w-5 h-5" />
                        Viết chương mới
                    </Link>
                </nav>

                <div className="p-4">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <UserButton />
                    </div>
                </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 ml-64 p-8 mt-16">
                    {children}
                </main>
            </div>
        </div>
    );
}
