"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography"; // Thêm dòng này
import { Markdown } from "tiptap-markdown"; // Thêm dòng này
import {
    Bold,
    Italic,
    Strikethrough,
    List,
    ListOrdered,
    Quote,
    Heading1,
    Heading2,
    Heading3,
    Undo,
    Redo,
    Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({
    content,
    onChange,
    placeholder = "Nhập nội dung...",
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3], // Đảm bảo Heading được bật
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            // Extension giúp sửa dấu câu đẹp (ngoặc kép cong,...)
            Typography,
            // Extension hỗ trợ Paste/Input Markdown
            Markdown.configure({
                html: true, // Cho phép HTML
                transformPastedText: true, // QUAN TRỌNG: Paste mã markdown (# abc) sẽ tự convert thành Heading
                transformCopiedText: true, // Copy ra cũng là markdown (tuỳ chọn)
            }),
        ],
        content,
        editorProps: {
            attributes: {
                // Thêm class 'prose' để Heading hiển thị to rõ ràng
                class:
                    "prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[600px] px-8 py-6",
            },
        },
        onUpdate: ({ editor }) => {
            // Lưu dưới dạng HTML để hiển thị cho dễ, 
            // nếu bạn thích lưu DB dạng markdown thì dùng editor.storage.markdown.getMarkdown()
            onChange(editor.getHTML());
        },
        immediatelyRender: false,
    });

    if (!editor) {
        return null;
    }

    const ToolbarButton = ({
        onClick,
        isActive = false,
        disabled = false,
        children,
        title,
    }: {
        onClick: () => void;
        isActive?: boolean;
        disabled?: boolean;
        children: React.ReactNode;
        title?: string;
    }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={cn(
                "p-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300",
                isActive && "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            {children}
        </button>
    );

    return (
        <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                {/* ... (Phần nút bấm Toolbar giữ nguyên như cũ) ... */}
                {/* Bạn copy lại phần nút bấm ở file cũ vào đây nhé, logic không đổi */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive("heading", { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 className="w-4 h-4" />
                </ToolbarButton>
                {/* ... các nút khác ... */}
            </div>

            {/* Editor Content */}
            <EditorContent editor={editor} />
        </div>
    );
}