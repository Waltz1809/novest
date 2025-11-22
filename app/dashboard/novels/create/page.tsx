import NovelForm from "@/components/novel/novel-form";

export default function CreateNovelPage() {
    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Thêm truyện mới</h1>
                <p className="text-gray-500">Tạo một truyện mới để bắt đầu đăng tải các chương.</p>
            </div>
            <NovelForm />
        </div>
    );
}
