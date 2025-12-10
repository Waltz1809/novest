import NovelForm from "@/components/novel/novel-form";
import { getGenres } from "@/actions/search";
import { getMyGroups } from "@/actions/translation-group";

export default async function CreateNovelPage() {
    const genres = await getGenres();
    const userGroups = await getMyGroups();
    const groups = userGroups.map(g => ({ id: g.id, name: g.name }));

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground">Thêm truyện mới</h1>
                <p className="text-muted-foreground">Tạo một truyện mới để bắt đầu đăng tải các chương.</p>
            </div>
            <NovelForm genres={genres} groups={groups} />
        </div>
    );
}
