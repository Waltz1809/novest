import { notFound } from "next/navigation";
import { db } from "@/lib/db";
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
