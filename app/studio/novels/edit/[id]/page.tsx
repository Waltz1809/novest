import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import EditNovelPageClient from "./edit-novel-client";
import { getMyGroups } from "@/actions/translation-group";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditNovelPage({ params }: PageProps) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const novel = await db.novel.findUnique({
        where: {
            id: parseInt(id),
        },
        include: {
            genres: true,
            translationGroup: {
                select: {
                    id: true,
                    name: true,
                }
            },
            volumes: {
                orderBy: {
                    order: "asc",
                },
                include: {
                    chapters: {
                        orderBy: {
                            order: "asc",
                        },
                    },
                },
            },
        },
    });

    if (!novel) {
        redirect("/studio/novels");
    }

    // Only uploader or admin/mod can edit
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
    const isUploader = session.user.id === novel.uploaderId;

    if (!isAdmin && !isUploader) {
        redirect("/studio/novels");
    }

    // Fetch user's groups for dropdown
    const userGroups = await getMyGroups();
    const groups = userGroups.map(g => ({ id: g.id, name: g.name }));

    return <EditNovelPageClient novel={novel} groups={groups} />;
}
