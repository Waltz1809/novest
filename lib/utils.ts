// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// 1. Hàm gộp class (AI dùng cái này để style giao diện)
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// 2. Hàm tạo Slug tiếng Việt (Quan trọng cho SEO)
export function toSlug(str: string): string {
    if (!str) return "";
    str = str.toLowerCase();
    str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Xóa dấu
    str = str.replace(/[đĐ]/g, "d");
    str = str.replace(/([^0-9a-z-\s])/g, ""); // Xóa ký tự đặc biệt
    str = str.replace(/(\s+)/g, "-"); // Thay khoảng trắng bằng gạch ngang
    str = str.replace(/^-+|-+$/g, ""); // Xóa gạch dư
    return str;
}

// 3. Tạo Search Index (Cho tìm kiếm nhanh)
export function generateSearchIndex(title: string, author: string, alternativeTitles: string = ""): string {
    const combined = `${title} ${author} ${alternativeTitles}`;
    return toSlug(combined).replace(/-/g, " "); // Giữ lại khoảng trắng để tìm kiếm like
}

// 4. Calculate Word Count from HTML content
export function calculateWordCount(content: string): number {
    if (!content) return 0;
    return content
        .replace(/<[^>]*>/g, ' ')  // Remove HTML tags
        .replace(/&nbsp;/g, ' ')   // Replace &nbsp;
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0).length;
}

// 5. Convert string to Title Case (Viết hoa chữ cái đầu mỗi từ)
export function toTitleCase(str: string): string {
    if (!str) return "";
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}