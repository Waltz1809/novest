import NovelForm from "@/components/novel/novel-form";
import { getGenres } from "@/actions/search"; // 1. Import hành động lấy thể loại

// 2. Thêm từ khóa async vào component
export default async function CreateNovelPage() {
    // 3. Lấy dữ liệu thể loại
    const genres = await getGenres();

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground">Thêm truyện mới</h1>
                <p className="text-muted-foreground">Tạo một truyện mới để bắt đầu đăng tải các chương.</p>
            </div>
            {/* 4. Truyền genres vào form */}
            <NovelForm genres={genres} />
        </div>
    );
}