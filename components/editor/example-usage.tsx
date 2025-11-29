// Example usage of ChapterEditor component

import ChapterEditor from "@/components/editor/chapter-editor";
import { useState } from "react";

export default function ExamplePage() {
    const [content, setContent] = useState("<p>Nội dung chương...</p>");

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-white mb-4">Viết Chương Mới</h1>

            <ChapterEditor
                content={content}
                onChange={setContent}
                placeholder="Bắt đầu viết chương của bạn..."
            />

            {/* Save button example */}
            <div className="mt-4">
                <button
                    onClick={() => {
                        console.log("Saving content:", content);
                        // Call your save API here
                    }}
                    className="px-6 py-3 bg-[#F59E0B] text-[#0B0C10] font-bold rounded-lg hover:bg-[#FBBF24] transition-colors"
                >
                    Lưu chương
                </button>
            </div>
        </div>
    );
}
