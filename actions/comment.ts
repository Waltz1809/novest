"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function voteComment(commentId: number, voteType: "UPVOTE" | "DOWNVOTE") {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    try {
        // Check existing vote
        const existingVote = await db.commentReaction.findUnique({
            where: {
                userId_commentId: {
                    userId,
                    commentId,
                },
            },
        });

        if (existingVote) {
            if (existingVote.type === voteType) {
                // Toggle off (remove vote)
                await db.commentReaction.delete({
                    where: { id: existingVote.id },
                });
            } else {
                // Change vote type
                await db.commentReaction.update({
                    where: { id: existingVote.id },
                    data: { type: voteType },
                });
            }
        } else {
            // Create new vote
            await db.commentReaction.create({
                data: {
                    userId,
                    commentId,
                    type: voteType,
                },
            });
        }

        revalidatePath("/truyen/[slug]", "page");
        return { success: true };
    } catch (error) {
        console.error("Error voting comment:", error);
        return { error: "Failed to vote" };
    }
}

export async function getCommentVotes(commentId: number) {
    const upvotes = await db.commentReaction.count({
        where: { commentId, type: "UPVOTE" },
    });
    const downvotes = await db.commentReaction.count({
        where: { commentId, type: "DOWNVOTE" },
    });

    return { upvotes, downvotes, score: upvotes - downvotes };
}
