import { auth } from "@/auth";
import { redirect } from "next/navigation";
import MainHeader from "@/components/layout/main-header";
import DashboardLayoutClient from "@/components/studio/dashboard-layout-client";

import { db } from "@/lib/db";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Protect route - require login only (all users can create content)
  if (!session?.user) {
    redirect("/login");
  }

  // Fetch wallet balance
  const wallet = await db.wallet.findUnique({
    where: { userId: session.user.id },
    select: { balance: true },
  });

  return (
    <div className="min-h-screen bg-[#0B0C10] flex flex-col relative">
      {/* Textured Background Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] bg-noise-pattern"
        style={{ zIndex: 0 }}
      />

      {/* Header */}
      <MainHeader />

      <DashboardLayoutClient
        userRole={session.user.role}
        user={{
          name: session.user.name || "",
          email: session.user.email || "",
          image: session.user.image || null,
          role: session.user.role,
        }}
        balance={wallet?.balance || 0}
      >
        {children}
      </DashboardLayoutClient>
    </div>
  );
}
