"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import {
    Bold,
    Italic,
    Strikethrough,
    Underline as UnderlineIcon,
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
            // Extension hỗ trợ Underline
            Underline,
        ],
        content,
        editorProps: {
            attributes: {
                // Prose with proper text colors: black in light mode, white in dark mode
                class:
                    "prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[600px] px-8 py-6 text-foreground",
            },
            // Làm sạch HTML khi paste - loại bỏ các style inline rác nhưng giữ formatting
            transformPastedHTML(html) {
                // Parse HTML
                const doc = new DOMParser().parseFromString(html, "text/html");
                // Tìm tất cả các element
                const allElements = doc.querySelectorAll("*");
                allElements.forEach((element) => {
                    // Chỉ xóa các style attribute không mong muốn
                    // Giữ lại các tag như <b>, <i>, <u>, <strong>, <em> để preserve formatting
                    if (element.hasAttribute("style")) {
                        const style = element.getAttribute("style") || "";
                        // Loại bỏ background, color, font-family, font-size nhưng giữ font-weight, font-style, text-decoration
                        const cleanStyle = style
                            .split(";")
                            .filter(rule => {
                                const prop = rule.split(":")[0]?.trim().toLowerCase();
                                // Giữ các style liên quan đến formatting
                                return prop === "font-weight" || prop === "font-style" || prop === "text-decoration";
                            })
                            .join(";");

                        if (cleanStyle) {
                            element.setAttribute("style", cleanStyle);
                        } else {
                            element.removeAttribute("style");
                        }
                    }
                });
                // Trả về HTML đã được làm sạch
                return doc.body.innerHTML;
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
                "p-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300",
                isActive && "bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-slate-100",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            {children}
        </button>
    );

    return (
        <div className="bg-card shadow-md focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all rounded-xl overflow-hidden resize-y" style={{ minHeight: '400px' }}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/50">
                {/* Text Formatting */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive("bold")}
                    title="Bold (Ctrl+B)"
                >
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive("italic")}
                    title="Italic (Ctrl+I)"
                >
                    <Italic className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive("underline")}
                    title="Underline (Ctrl+U)"
                >
                    <UnderlineIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive("strike")}
                    title="Strikethrough"
                >
                    <Strikethrough className="w-4 h-4" />
                </ToolbarButton>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                {/* Headings */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive("heading", { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive("heading", { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive("heading", { level: 3 })}
                    title="Heading 3"
                >
                    <Heading3 className="w-4 h-4" />
                </ToolbarButton>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                {/* Lists */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive("bulletList")}
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive("orderedList")}
                    title="Numbered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive("blockquote")}
                    title="Quote"
                >
                    <Quote className="w-4 h-4" />
                </ToolbarButton>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                {/* Horizontal Rule */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    title="Horizontal Line"
                >
                    <Minus className="w-4 h-4" />
                </ToolbarButton>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                {/* Undo/Redo */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Undo (Ctrl+Z)"
                >
                    <Undo className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Redo (Ctrl+Y)"
                >
                    <Redo className="w-4 h-4" />
                </ToolbarButton>
            </div>

            {/* Editor Content */}
            <EditorContent editor={editor} />
        </div>
    );
}