import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // Strict Role Check
    if (!session || session.user.role !== "ADMIN") {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-[#0B0C10] text-gray-100 font-family-name:var(--font-be-vietnam-pro) selection:bg-amber-500/30">
            <AdminSidebar />
            <main className="pl-20 transition-all duration-300 peer-data-[state=expanded]:pl-64">
                <div className="container mx-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
