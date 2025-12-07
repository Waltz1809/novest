import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NovelsPageClient from "./novels-client";

export const revalidate = 0; // Dynamic

interface PageProps {
    searchParams: Promise<{ owner?: string }>;
}

export default async function NovelsPage({ searchParams }: PageProps) {
    const session = await auth();
    if (!session?.user) return redirect("/");

    const params = await searchParams;

    // Check if admin/mod
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";

    // Owner filter: "self" (default) = own novels, "all" = all novels
    // Regular users always see only their own novels
    const ownerFilter = params.owner || "self";

    // Build where clause
    let where: Record<string, unknown> = { approvalStatus: "APPROVED" };

    if (!isAdmin) {
        // Regular users always see only their own
        where.uploaderId = session.user.id;
    } else if (ownerFilter === "self") {
        // Admin/mod: default to their own novels
        where.uploaderId = session.user.id;
    }
    // If ownerFilter === "all" and isAdmin, no uploaderId filter (show all)

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

    return (
        <NovelsPageClient
            novels={novels}
            isAdmin={isAdmin}
            currentOwnerFilter={ownerFilter}
        />
    );
}
