import { db } from "../lib/db";

async function recalculateWordCounts() {
    console.log("Fetching all chapters...");

    const chapters = await db.chapter.findMany({
        select: {
            id: true,
            title: true,
            content: true,
            wordCount: true,
        }
    });

    console.log(`Found ${chapters.length} chapters to update`);

    for (const chapter of chapters) {
        // Count words by splitting on whitespace
        const wordCount = chapter.content
            .replace(/<[^>]*>/g, ' ')  // Remove HTML tags
            .replace(/&nbsp;/g, ' ')   // Replace &nbsp;
            .trim()
            .split(/\s+/)
            .filter(word => word.length > 0).length;

        if (chapter.wordCount !== wordCount) {
            await db.chapter.update({
                where: { id: chapter.id },
                data: { wordCount }
            });
            console.log(`Updated "${chapter.title}": ${chapter.wordCount} -> ${wordCount} words`);
        }
    }

    console.log("Done!");
}

recalculateWordCounts()
    .catch(console.error)
    .finally(() => db.$disconnect());
