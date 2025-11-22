import NovelForm from "@/components/novel/novel-form";
import { getNovel } from "@/actions/novel";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditNovelPage({ params }: PageProps) {
    const { id } = await params;
    const novel = await getNovel(parseInt(id));

    if (!novel) {
        notFound();
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa truyện</h1>
                <p className="text-gray-500">Cập nhật thông tin cho truyện: {novel.title}</p>
            </div>
            <NovelForm initialData={novel} />
        </div>
    );
}
