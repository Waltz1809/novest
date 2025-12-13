import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import ChapterEditForm from "@/components/novel/chapter-edit-form";

interface PageProps {
    params: Promise<{
        novelId: string;
        chapterId: string;
    }>;
}

export default async function EditChapterPage({ params }: PageProps) {
    const { novelId, chapterId } = await params;
    const nId = parseInt(novelId);
    const cId = parseInt(chapterId);

    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    if (isNaN(nId) || isNaN(cId)) {
        notFound();
    }

    const chapter = await db.chapter.findUnique({
        where: { id: cId },
    });

    if (!chapter) {
        notFound();
    }

    const novel = await db.novel.findUnique({
        where: { id: nId },
        include: {
            collaborators: {
                select: { userId: true }
            },
            volumes: {
                orderBy: { order: "asc" },
                select: {
                    id: true,
                    title: true,
                    order: true,
                },
            },
        },
    });

    if (!novel) {
        notFound();
    }

    // Permission Check
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
    const isUploader = session.user.id === novel.uploaderId;
    const isCollaborator = novel.collaborators.some(c => c.userId === session.user.id);

    if (!isAdmin && !isUploader && !isCollaborator) {
        redirect("/studio/novels");
    }

    return (
        <div className="max-w-4xl mx-auto">
            <ChapterEditForm
                novelId={nId}
                novelSlug={novel.slug}
                chapter={chapter}
                volumes={novel.volumes}
            />
        </div>
    );
}
