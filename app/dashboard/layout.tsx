import { auth } from "@/auth";
import { redirect } from "next/navigation";
import MainHeader from "@/components/layout/main-header";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";

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
        <div className="min-h-screen bg-[#0B0C10] flex flex-col relative">
            {/* Textured Background Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-noise" style={{ zIndex: 0 }} />

            {/* Header */}
            <MainHeader />

            <div className="flex flex-1 relative z-10">
                {/* Collapsible Sidebar */}
                <DashboardSidebar
                    userRole={session.user.role}
                    user={{
                        name: session.user.name || "",
                        email: session.user.email || "",
                        image: session.user.image || null,
                        role: session.user.role,
                    }}
                />

                {/* Main Content - Fixed margin for sidebar */}
                <main className="flex-1 ml-64 p-8 mt-16 transition-all duration-300">
                    {children}
                </main>
            </div>
        </div>
    );
}
