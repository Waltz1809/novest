import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSearchIndex(
  ...args: (string | null | undefined)[]
): string {
  const text = args.filter(Boolean).join(" ");
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export function toSlug(str: string): string {
  return generateSearchIndex(str)
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

// Calculate word count from HTML content
export function calculateWordCount(content: string): number {
  if (!content) return 0;
  return content
    .replace(/<[^>]*>/g, " ") // Remove HTML tags
    .replace(/&nbsp;/g, " ") // Replace &nbsp;
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Convert text to Title Case (viết hoa chữ cái đầu mỗi từ)
 * Handles Vietnamese text properly
 * @param text Input text to convert
 * @returns Text with first letter of each word capitalized
 */
export function toTitleCase(text: string): string {
  if (!text) return "";

  return text
    .toLowerCase()
    .split(/\s+/)
    .map(word => {
      if (word.length === 0) return word;
      // Capitalize first character, keep rest lowercase
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

/**
 * Count words in Vietnamese text
 * Words are separated by whitespace
 * @param text Input text
 * @returns Number of words
 */
export function countVietnameseWords(text: string): number {
  if (!text || !text.trim()) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length;
}
