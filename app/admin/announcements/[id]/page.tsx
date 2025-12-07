import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import AnnouncementForm from "@/components/admin/announcement-form";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditAnnouncementPage({ params }: PageProps) {
    const { id } = await params;

    const announcement = await db.announcement.findUnique({
        where: { id }
    });

    if (!announcement) {
        notFound();
    }

    return (
        <AnnouncementForm
            announcement={{
                id: announcement.id,
                title: announcement.title,
                content: announcement.content,
                startDate: announcement.startDate,
                endDate: announcement.endDate,
                isActive: announcement.isActive,
            }}
        />
    );
}
