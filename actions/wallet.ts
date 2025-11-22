"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

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
}

export async function unlockChapter(chapterId: number, price: number) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;

    // Check balance
    const wallet = await db.wallet.findUnique({
        where: { userId },
    });

    if (!wallet || wallet.balance < price) {
        throw new Error("Không đủ tiền");
    }

    // Perform transaction
    await db.$transaction([
        // Deduct balance
        db.wallet.update({
            where: { userId },
            data: {
                balance: { decrement: price },
                transactions: {
                    create: {
                        amount: -price,
                        type: "UNLOCK",
                        description: `Unlock Chapter ${chapterId}`,
                    }
                }
            },
        }),
        // Create purchase record
        db.userPurchase.create({
            data: {
                userId,
                chapterId,
                price,
            },
        }),
    ]);

    revalidatePath("/");
}
