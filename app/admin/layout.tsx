import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // Allow ADMIN and MODERATOR to access admin panel
    const isAdminOrMod = session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";
    if (!session || !isAdminOrMod) {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-gray-50 text-foreground font-family-name:var(--font-be-vietnam-pro) selection:bg-primary/20">
            <AdminSidebar />
            <main className="pl-20 transition-all duration-300 peer-data-[state=expanded]:pl-64">
                <div className="container mx-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
