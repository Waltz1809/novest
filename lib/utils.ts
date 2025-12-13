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
