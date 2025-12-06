import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NovelsPageClient from "./novels-client";

export const revalidate = 0; // Dynamic

export default async function NovelsPage() {
    const session = await auth();
    if (!session?.user) return redirect("/");

    const where = session.user.role === "ADMIN" ? {} : { uploaderId: session.user.id };

    const novelsData = await db.novel.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
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
    }));

    return <NovelsPageClient novels={novels} />;
}
