"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { formatPrice } from "@/lib/pricing";

/**
 * Get user's wallet balance
 */
export async function getWalletBalance() {
    const session = await auth();
    if (!session?.user?.id) {
        return 0;
    }

    const wallet = await db.wallet.findUnique({
        where: { userId: session.user.id },
        select: { balance: true },
    });

    return wallet?.balance || 0;
}

/**
 * Check if user has purchased a specific chapter
 */
export async function hasUserPurchasedChapter(chapterId: number) {
    const session = await auth();
    if (!session?.user?.id) {
        return false;
    }

    const purchase = await db.userPurchase.findUnique({
        where: {
            userId_chapterId: {
                userId: session.user.id,
                chapterId,
            },
        },
    });

    return !!purchase;
}

/**
 * Add mock balance for testing (dev only)
 */
export async function addMockBalance() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;

    // Upsert wallet and add 1000 coins
    await db.wallet.upsert({
        where: { userId },
        create: {
            userId,
            balance: 1000,
            transactions: {
                create: {
                    amount: 1000,
                    type: "DEPOSIT",
                    description: "Mock Deposit",
                }
            }
        },
        update: {
            balance: { increment: 1000 },
            transactions: {
                create: {
                    amount: 1000,
                    type: "DEPOSIT",
                    description: "Mock Deposit",
                }
            }
        },
    });

    revalidatePath("/");
    return { success: true };
}

/**
 * Unlock a premium chapter
 */
export async function unlockChapter(chapterId: number) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Chưa đăng nhập" };
    }

    const userId = session.user.id;

    try {
        // Check if already purchased
        const existingPurchase = await db.userPurchase.findUnique({
            where: {
                userId_chapterId: {
                    userId,
                    chapterId,
                },
            },
        });

        if (existingPurchase) {
            return { error: "Bạn đã mở khóa chương này" };
        }

        // Get chapter details
        const chapter = await db.chapter.findUnique({
            where: { id: chapterId },
            select: {
                id: true,
                title: true,
                isLocked: true,
                price: true,
                volume: {
                    select: {
                        novel: {
                            select: {
                                title: true,
                                slug: true,
                            },
                        },
                    },
                },
            },
        });

        if (!chapter) {
            return { error: "Không tìm thấy chương" };
        }

        if (!chapter.isLocked || chapter.price === 0) {
            return { error: "Chương này miễn phí" };
        }

        // Check balance
        const wallet = await db.wallet.findUnique({
            where: { userId },
        });

        if (!wallet || wallet.balance < chapter.price) {
            return {
                error: `Không đủ vé. Cần ${formatPrice(chapter.price)}, bạn có ${formatPrice(wallet?.balance || 0)}`
            };
        }

        // Perform transaction
        await db.$transaction([
            // Deduct balance
            db.wallet.update({
                where: { userId },
                data: {
                    balance: { decrement: chapter.price },
                    transactions: {
                        create: {
                            amount: -chapter.price,
                            type: "UNLOCK",
                            description: `Mở khóa: ${chapter.title}`,
                        }
                    }
                },
            }),
            // Create purchase record
            db.userPurchase.create({
                data: {
                    userId,
                    chapterId,
                    price: chapter.price,
                },
            }),
        ]);

        revalidatePath(`/truyen/${chapter.volume.novel.slug}`);

        return { success: `Đã mở khóa chương "${chapter.title}"` };
    } catch (error) {
        console.error("Unlock chapter error:", error);
        return { error: "Lỗi khi mở khóa chương" };
    }
}

/**
 * Get user's purchase history
 */
export async function getPurchaseHistory() {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    const purchases = await db.userPurchase.findMany({
        where: { userId: session.user.id },
        include: {
            chapter: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    volume: {
                        select: {
                            novel: {
                                select: {
                                    id: true,
                                    title: true,
                                    slug: true,
                                    coverImage: true,
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    return purchases;
}

