import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NovelsPageClient from "../novels-client";

export const revalidate = 0; // Dynamic

export default async function PendingNovelsPage() {
    const session = await auth();
    if (!session?.user) return redirect("/");

    // For admins/mods: show ALL pending novels
    // For regular users: show only their own pending novels
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";

    const where = isAdmin
        ? { approvalStatus: "PENDING" }
        : { uploaderId: session.user.id, approvalStatus: "PENDING" };

    const novelsData = await db.novel.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            slug: true,
            author: true,
            coverImage: true,
            status: true,
            approvalStatus: true,
            viewCount: true,
            volumes: {
                select: {
                    _count: {
                        select: { chapters: true }
                    }
                }
            }
        },
    });

    // Type cast the novels to match the expected interface
    const novels = novelsData.map(novel => ({
        ...novel,
        status: novel.status as "ONGOING" | "COMPLETED" | "HIATUS",
        approvalStatus: novel.approvalStatus as "PENDING" | "APPROVED" | "REJECTED",
    }));

    return <NovelsPageClient novels={novels} pageTitle="Truyện chờ duyệt" />;
}
