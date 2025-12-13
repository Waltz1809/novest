import { auth } from "@/auth";
import { redirect } from "next/navigation";
import StudioHeader from "@/components/layout/studio-header";
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
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      {/* Textured Background Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02] bg-noise-pattern"
        style={{ zIndex: 0 }}
      />

      {/* Simplified Studio Header */}
      <StudioHeader user={session.user} />

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
