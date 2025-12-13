"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Link as LinkIcon,
    Image as ImageIcon,
    Smile,
    Send,
    Loader2,
    Undo,
    Redo,
    Paintbrush,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { forwardRef, useImperativeHandle, useState, useRef, useEffect } from "react";

interface CommentEditorProps {
    placeholder?: string;
    onSubmit?: (html: string) => void;
    disabled?: boolean;
    loading?: boolean;
    cooldown?: number;
    className?: string;
}

export interface CommentEditorRef {
    getHTML: () => string;
    clear: () => void;
    focus: () => void;
}

// Common emojis for quick access
const EMOJI_LIST = [
    "😀", "😂", "🤣", "😊", "😍", "🥰", "😘", "😎",
    "🤔", "🤗", "😅", "😆", "😏", "😢", "😭", "😤",
    "👍", "👎", "👏", "🙌", "💪", "🔥", "❤️", "💯",
    "🎉", "🎊", "✨", "⭐", "🌟", "💫", "🥺", "😱",
];

// Color palette for text
const COLOR_PALETTE = [
    { name: "Mặc định", value: "" },
    { name: "Đỏ", value: "#ef4444" },
    { name: "Cam", value: "#f97316" },
    { name: "Vàng", value: "#eab308" },
    { name: "Xanh lá", value: "#22c55e" },
    { name: "Xanh dương", value: "#3b82f6" },
    { name: "Tím", value: "#a855f7" },
    { name: "Hồng", value: "#ec4899" },
];

const CommentEditor = forwardRef<CommentEditorRef, CommentEditorProps>(({
    placeholder = "Viết bình luận...",
    onSubmit,
    disabled = false,
    loading = false,
    cooldown = 0,
    className,
}, ref) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [showImageInput, setShowImageInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [hasContent, setHasContent] = useState(false);
    const emojiRef = useRef<HTMLDivElement>(null);
    const colorRef = useRef<HTMLDivElement>(null);
    const linkRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLDivElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
                blockquote: false,
                bulletList: false,
                orderedList: false,
                codeBlock: false,
                horizontalRule: false,
            }),
            Placeholder.configure({
                placeholder: cooldown > 0 ? `Chờ ${cooldown}s...` : placeholder,
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-amber-500 underline hover:text-amber-400',
                },
            }),
            TextStyle,
            Color,
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded max-w-full h-auto my-2',
                },
            }),
        ],
        content: "",
        editorProps: {
            attributes: {
                class: "min-h-[60px] max-h-[200px] overflow-y-auto px-3 py-2 text-sm focus:outline-none",
            },
        },
        onUpdate: ({ editor }) => {
            // Track if editor has content for reactive button state
            const text = editor.getText().trim();
            setHasContent(text.length > 0);
        },
        immediatelyRender: false,
    });

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
                setShowEmojiPicker(false);
            }
            if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
                setShowColorPicker(false);
            }
            if (linkRef.current && !linkRef.current.contains(e.target as Node)) {
                setShowLinkInput(false);
            }
            if (imageRef.current && !imageRef.current.contains(e.target as Node)) {
                setShowImageInput(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useImperativeHandle(ref, () => ({
        getHTML: () => editor?.getHTML() || "",
        clear: () => {
            editor?.commands.clearContent();
            setHasContent(false);
        },
        focus: () => editor?.commands.focus(),
    }));

    if (!editor) {
        return null;
    }

    const isDisabled = disabled || loading || cooldown > 0;

    const handleSubmit = () => {
        if (!hasContent || isDisabled) return;
        const html = editor.getHTML();
        onSubmit?.(html);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const insertEmoji = (emoji: string) => {
        editor.chain().focus().insertContent(emoji).run();
        setShowEmojiPicker(false);
    };

    const setTextColor = (color: string) => {
        if (color) {
            editor.chain().focus().setColor(color).run();
        } else {
            editor.chain().focus().unsetColor().run();
        }
        setShowColorPicker(false);
    };

    const setLink = () => {
        if (linkUrl) {
            const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
            editor.chain().focus().setLink({ href: url }).run();
        }
        setLinkUrl("");
        setShowLinkInput(false);
    };

    const removeLink = () => {
        editor.chain().focus().unsetLink().run();
        setShowLinkInput(false);
    };

    const insertImage = () => {
        if (imageUrl) {
            const url = imageUrl.startsWith('http') ? imageUrl : `https://${imageUrl}`;
            editor.chain().focus().setImage({ src: url }).run();
            setHasContent(true);
        }
        setImageUrl("");
        setShowImageInput(false);
    };

    const ToolbarButton = ({
        onClick,
        isActive = false,
        children,
        title,
    }: {
        onClick: () => void;
        isActive?: boolean;
        children: React.ReactNode;
        title?: string;
    }) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            disabled={isDisabled}
            className={cn(
                "p-1 rounded transition-colors",
                isActive
                    ? "bg-amber-100 text-amber-600"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                isDisabled && "opacity-50 cursor-not-allowed"
            )}
        >
            {children}
        </button>
    );

    return (
        <div
            className={cn(
                "rounded-xl border border-gray-200 bg-white overflow-hidden",
                "focus-within:border-amber-500 transition-colors",
                isDisabled && "opacity-60",
                className
            )}
            onKeyDown={handleKeyDown}
        >
            {/* Editor Content */}
            <EditorContent
                editor={editor}
                className="prose prose-sm max-w-none [&_.ProseMirror]:min-h-[60px] [&_.ProseMirror]:max-h-[200px] [&_.ProseMirror]:overflow-y-auto"
            />

            {/* Toolbar + Submit */}
            <div className="flex items-center justify-between px-2 py-1.5 border-t border-gray-100 bg-gray-50 flex-wrap gap-1">
                <div className="flex items-center gap-0.5 flex-wrap">
                    {/* Emoji Picker */}
                    <div className="relative" ref={emojiRef}>
                        <ToolbarButton
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            isActive={showEmojiPicker}
                            title="Emoji"
                        >
                            <Smile className="w-3.5 h-3.5" />
                        </ToolbarButton>
                        {showEmojiPicker && (
                            <div className="absolute bottom-full left-0 mb-1 p-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 w-64">
                                <div className="grid grid-cols-8 gap-1">
                                    {EMOJI_LIST.map((emoji) => (
                                        <button
                                            key={emoji}
                                            onClick={() => insertEmoji(emoji)}
                                            className="text-lg hover:bg-gray-100 rounded p-1 transition-colors"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-px h-4 bg-gray-200 mx-1" />

                    {/* Undo/Redo */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().undo().run()}
                        title="Hoàn tác (Ctrl+Z)"
                    >
                        <Undo className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().redo().run()}
                        title="Làm lại (Ctrl+Y)"
                    >
                        <Redo className="w-3.5 h-3.5" />
                    </ToolbarButton>

                    <div className="w-px h-4 bg-gray-200 mx-1" />

                    {/* Text Formatting */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive("bold")}
                        title="Bold (Ctrl+B)"
                    >
                        <Bold className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        isActive={editor.isActive("italic")}
                        title="Italic (Ctrl+I)"
                    >
                        <Italic className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        isActive={editor.isActive("underline")}
                        title="Underline (Ctrl+U)"
                    >
                        <UnderlineIcon className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        isActive={editor.isActive("strike")}
                        title="Strikethrough"
                    >
                        <Strikethrough className="w-3.5 h-3.5" />
                    </ToolbarButton>

                    <div className="w-px h-4 bg-gray-200 mx-1" />

                    {/* Text Color */}
                    <div className="relative" ref={colorRef}>
                        <ToolbarButton
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            isActive={showColorPicker}
                            title="Màu chữ"
                        >
                            <Paintbrush className="w-3.5 h-3.5" />
                        </ToolbarButton>
                        {showColorPicker && (
                            <div className="absolute bottom-full left-0 mb-1 p-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                                <div className="flex gap-1">
                                    {COLOR_PALETTE.map((color) => (
                                        <button
                                            key={color.name}
                                            onClick={() => setTextColor(color.value)}
                                            title={color.name}
                                            className={cn(
                                                "w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform",
                                                !color.value && "bg-gray-400"
                                            )}
                                            style={{ backgroundColor: color.value || undefined }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Link */}
                    <div className="relative" ref={linkRef}>
                        <ToolbarButton
                            onClick={() => setShowLinkInput(!showLinkInput)}
                            isActive={editor.isActive("link") || showLinkInput}
                            title="Chèn link"
                        >
                            <LinkIcon className="w-3.5 h-3.5" />
                        </ToolbarButton>
                        {showLinkInput && (
                            <div className="absolute bottom-full left-0 mb-1 p-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 w-64">
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={linkUrl}
                                        onChange={(e) => setLinkUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="flex-1 px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded text-foreground placeholder:text-gray-400 focus:outline-none focus:border-amber-500"
                                        onKeyDown={(e) => e.key === "Enter" && setLink()}
                                    />
                                    <button
                                        onClick={setLink}
                                        className="px-2 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600"
                                    >
                                        OK
                                    </button>
                                    {editor.isActive("link") && (
                                        <button
                                            onClick={removeLink}
                                            className="p-1 text-red-500 hover:text-red-600"
                                            title="Xóa link"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Image */}
                    <div className="relative" ref={imageRef}>
                        <ToolbarButton
                            onClick={() => setShowImageInput(!showImageInput)}
                            isActive={showImageInput}
                            title="Chèn ảnh (URL)"
                        >
                            <ImageIcon className="w-3.5 h-3.5" />
                        </ToolbarButton>
                        {showImageInput && (
                            <div className="absolute bottom-full left-0 mb-1 p-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 w-72">
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        placeholder="https://i.imgur.com/..."
                                        className="flex-1 px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded text-foreground placeholder:text-gray-400 focus:outline-none focus:border-amber-500"
                                        onKeyDown={(e) => e.key === "Enter" && insertImage()}
                                    />
                                    <button
                                        onClick={insertImage}
                                        className="px-2 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600"
                                    >
                                        OK
                                    </button>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Chỉ hỗ trợ link ảnh public (imgur, i.postimg, ...)
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!hasContent || isDisabled}
                    className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        !hasContent || isDisabled
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-amber-600 hover:bg-amber-100"
                    )}
                    title="Gửi (Enter)"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                </button>
            </div>
        </div>
    );
});

CommentEditor.displayName = "CommentEditor";

export default CommentEditor;
