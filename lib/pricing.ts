/**
 * Pricing utilities for the economy system
 * 
 * Pricing Formula:
 * - Base price per 1000 words: 5 tickets
 * - Format multiplier: WN x1.0, LN x1.2
 * - Completed novel discount: User-defined 10-100% off
 * - Minimum word count for premium: 50,000 words (novel total)
 */

// Constants
export const BASE_PRICE_PER_1000_WORDS = 150; // 150đ per 1000 words
export const MIN_WORDS_FOR_APPROVAL = 5000; // 5k words minimum to submit for approval
export const MIN_WORDS_FOR_VIP = 50000; // 50k words minimum for VIP status
export const MIN_WORDS_FOR_PREMIUM = 50000; // 50k words minimum for a novel to have premium chapters
export const MIN_CHAPTER_WORDS_FOR_PREMIUM = 1000; // Minimum words for a chapter to be premium

// Format multipliers
export const FORMAT_MULTIPLIERS: Record<string, number> = {
    WN: 1.0,  // Web Novel
    LN: 1.2,  // Light Novel (higher quality, more editing)
};

/**
 * Calculate the price for a chapter based on word count and novel format
 * @param wordCount - Chapter word count
 * @param novelFormat - 'WN' or 'LN'
 * @param discountPercent - Discount percentage (0-100) for completed novels
 * @returns Price in tickets (rounded to nearest integer)
 */
export function calculateChapterPrice(
    wordCount: number,
    novelFormat: string = "WN",
    discountPercent: number = 0
): number {
    // Base calculation: (words / 1000) * base price
    const basePrice = (wordCount / 1000) * BASE_PRICE_PER_1000_WORDS;

    // Apply format multiplier
    const multiplier = FORMAT_MULTIPLIERS[novelFormat] || 1.0;
    const priceWithFormat = basePrice * multiplier;

    // Apply discount (for completed novels)
    const validDiscount = Math.max(0, Math.min(100, discountPercent));
    const discountedPrice = priceWithFormat * (1 - validDiscount / 100);

    // Round to nearest integer, minimum 1 ticket if chapter is premium
    return Math.max(1, Math.round(discountedPrice));
}

/**
 * Check if a novel qualifies for premium chapters
 * @param totalWordCount - Total word count of the novel
 * @returns Boolean indicating if novel can have premium chapters
 */
export function canHavePremiumChapters(totalWordCount: number): boolean {
    return totalWordCount >= MIN_WORDS_FOR_PREMIUM;
}

/**
 * Check if a chapter qualifies to be set as premium
 * @param chapterWordCount - Word count of the chapter
 * @returns Boolean indicating if chapter can be premium
 */
export function canChapterBePremium(chapterWordCount: number): boolean {
    return chapterWordCount >= MIN_CHAPTER_WORDS_FOR_PREMIUM;
}

/**
 * Calculate suggested price range for a chapter
 * @param wordCount - Chapter word count
 * @param novelFormat - 'WN' or 'LN'
 * @returns Object with min, suggested, and max prices
 */
export function getSuggestedPriceRange(
    wordCount: number,
    novelFormat: string = "WN"
): { min: number; suggested: number; max: number } {
    const suggested = calculateChapterPrice(wordCount, novelFormat);

    return {
        min: Math.max(1, Math.floor(suggested * 0.5)), // 50% of suggested
        suggested,
        max: Math.ceil(suggested * 1.5), // 150% of suggested
    };
}

/**
 * Format price for display
 * @param price - Price in tickets
 * @returns Formatted string
 */
export function formatPrice(price: number): string {
    if (price === 0) return "Miễn phí";
    return `${price} vé`;
}

/**
 * Calculate total cost for unlocking multiple chapters
 * @param chapters - Array of chapters with their prices
 * @returns Total cost
 */
export function calculateBulkUnlockCost(chapters: { price: number }[]): number {
    return chapters.reduce((total, ch) => total + ch.price, 0);
}

/**
 * Check if user can afford to unlock chapters
 * @param userBalance - User's ticket balance
 * @param chapters - Array of chapters with their prices
 * @returns Boolean indicating if user can afford
 */
export function canAffordChapters(
    userBalance: number,
    chapters: { price: number }[]
): boolean {
    const totalCost = calculateBulkUnlockCost(chapters);
    return userBalance >= totalCost;
}

/**
 * Get discount tier based on percentage
 * @param discountPercent - Discount percentage
 * @returns Tier info with name and color
 */
export function getDiscountTier(discountPercent: number): { name: string; color: string } {
    if (discountPercent >= 50) {
        return { name: "Đại giảm giá", color: "text-red-400" };
    }
    if (discountPercent >= 30) {
        return { name: "Giảm giá lớn", color: "text-orange-400" };
    }
    if (discountPercent >= 10) {
        return { name: "Giảm giá", color: "text-amber-400" };
    }
    return { name: "", color: "" };
}

/**
 * Calculate savings from discount
 * @param originalPrice - Original price without discount
 * @param discountedPrice - Price after discount
 * @returns Savings amount
 */
export function calculateSavings(originalPrice: number, discountedPrice: number): number {
    return Math.max(0, originalPrice - discountedPrice);
}
