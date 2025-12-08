"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    Heading5,
    ImageIcon,
    X
} from "lucide-react";
import { useState } from "react";

interface ChapterEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

export default function ChapterEditor({ content, onChange, placeholder = "Bắt đầu viết chương..." }: ChapterEditorProps) {
    const [showImageDialog, setShowImageDialog] = useState(false);
    const [imageUrl, setImageUrl] = useState("");

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4, 5],
                },
            }),
            Underline,
            Image.configure({
                inline: true,
                allowBase64: false,
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "prose prose-invert max-w-none focus:outline-none min-h-[500px] px-6 py-4",
            },
            // Strip all inline styles, backgrounds, and colors when pasting
            transformPastedHTML(html) {
                // Remove all style attributes, background colors, and font colors
                return html
                    .replace(/style="[^"]*"/gi, '')
                    .replace(/style='[^']*'/gi, '')
                    .replace(/background-color:[^;"]*/gi, '')
                    .replace(/background:[^;"]*/gi, '')
                    .replace(/color:[^;"]*/gi, '')
                    .replace(/font-family:[^;"]*/gi, '')
                    .replace(/font-size:[^;"]*/gi, '')
                    .replace(/<span[^>]*>/gi, '')
                    .replace(/<\/span>/gi, '');
            },
        },
    });

    if (!editor) {
        return null;
    }

    const addImage = () => {
        if (imageUrl) {
            editor.chain().focus().setImage({ src: imageUrl }).run();
            setImageUrl("");
            setShowImageDialog(false);
        }
    };

    const ToolbarButton = ({
        onClick,
        isActive,
        icon: Icon,
        tooltip
    }: {
        onClick: () => void;
        isActive?: boolean;
        icon: any;
        tooltip: string;
    }) => (
        <button
            onClick={onClick}
            className={`p-2 rounded transition-colors ${isActive
                ? "bg-[#F59E0B] text-[#0B0C10]"
                : "text-[#9CA3AF] hover:bg-[#1E293B] hover:text-white"
                }`}
            title={tooltip}
            type="button"
        >
            <Icon className="w-4 h-4" />
        </button>
    );

    return (
        <div className="bg-[#0f172a] border border-white/10 rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="sticky top-0 z-10 bg-[#1E293B] border-b border-white/10 p-2 flex flex-wrap gap-1">
                {/* Text Formatting */}
                <div className="flex gap-1 pr-2 border-r border-white/10">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive("bold")}
                        icon={Bold}
                        tooltip="Đậm (Ctrl+B)"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        isActive={editor.isActive("italic")}
                        icon={Italic}
                        tooltip="Nghiêng (Ctrl+I)"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        isActive={editor.isActive("underline")}
                        icon={UnderlineIcon}
                        tooltip="Gạch chân (Ctrl+U)"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        isActive={editor.isActive("strike")}
                        icon={Strikethrough}
                        tooltip="Gạch ngang"
                    />
                </div>

                {/* Headings */}
                <div className="flex gap-1 pr-2 border-r border-white/10">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        isActive={editor.isActive("heading", { level: 1 })}
                        icon={Heading1}
                        tooltip="Tiêu đề 1"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        isActive={editor.isActive("heading", { level: 2 })}
                        icon={Heading2}
                        tooltip="Tiêu đề 2"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        isActive={editor.isActive("heading", { level: 3 })}
                        icon={Heading3}
                        tooltip="Tiêu đề 3"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                        isActive={editor.isActive("heading", { level: 4 })}
                        icon={Heading4}
                        tooltip="Tiêu đề 4"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
                        isActive={editor.isActive("heading", { level: 5 })}
                        icon={Heading5}
                        tooltip="Tiêu đề 5"
                    />
                </div>

                {/* Lists */}
                <div className="flex gap-1 pr-2 border-r border-white/10">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        isActive={editor.isActive("bulletList")}
                        icon={List}
                        tooltip="Danh sách"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        isActive={editor.isActive("orderedList")}
                        icon={ListOrdered}
                        tooltip="Danh sách số"
                    />
                </div>

                {/* Image */}
                <div className="flex gap-1">
                    <ToolbarButton
                        onClick={() => setShowImageDialog(true)}
                        icon={ImageIcon}
                        tooltip="Chèn ảnh"
                    />
                </div>
            </div>

            {/* Editor Content with Scroll */}
            <div className="max-h-[60vh] overflow-y-auto">
                <EditorContent editor={editor} />
            </div>

            {/* Image URL Dialog */}
            {showImageDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#1E293B] border border-white/10 rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">Chèn ảnh từ URL</h3>
                            <button
                                onClick={() => {
                                    setShowImageDialog(false);
                                    setImageUrl("");
                                }}
                                className="text-[#9CA3AF] hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-[#9CA3AF] mb-2 block">
                                    URL ảnh công khai
                                </label>
                                <input
                                    type="url"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full px-4 py-2 bg-[#0f172a] border border-white/10 rounded-lg text-white placeholder:text-[#9CA3AF] focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 outline-none"
                                />
                            </div>

                            {imageUrl && (
                                <div className="border border-white/10 rounded-lg p-2 bg-[#0f172a]">
                                    <p className="text-xs text-[#9CA3AF] mb-2">Xem trước:</p>
                                    <img
                                        src={imageUrl}
                                        alt="Preview"
                                        className="max-h-48 mx-auto rounded"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}

                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => {
                                        setShowImageDialog(false);
                                        setImageUrl("");
                                    }}
                                    className="px-4 py-2 text-[#9CA3AF] hover:text-white transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={addImage}
                                    disabled={!imageUrl}
                                    className="px-4 py-2 bg-[#F59E0B] text-[#0B0C10] font-bold rounded-lg hover:bg-[#FBBF24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Chèn ảnh
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
