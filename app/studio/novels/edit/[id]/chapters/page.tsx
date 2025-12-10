import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ChapterManagementClient from "./chapter-management-client";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ChaptersPage({ params }: PageProps) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const novel = await db.novel.findUnique({
        where: {
            id: parseInt(id),
        },
        select: {
            id: true,
            title: true,
            slug: true,
            approvalStatus: true,
            uploaderId: true,
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

    return <ChapterManagementClient novel={novel} />;
}
