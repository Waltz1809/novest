
import { PrismaClient } from "@prisma/client";
import { JSDOM } from "jsdom";

const db = new PrismaClient();

function stripHtml(html: string) {
    const dom = new JSDOM(html);
    return dom.window.document.body.textContent || "";
}

function countWords(text: string) {
    return text.trim().split(/\s+/).length;
}

async function main() {
    console.log("Starting word count backfill...");

    const chapters = await db.chapter.findMany({
        select: {
            id: true,
            content: true,
            title: true
        }
    });

    console.log(`Found ${chapters.length} chapters.`);

    for (const chapter of chapters) {
        const plainText = stripHtml(chapter.content);
        const wordCount = countWords(plainText);

        await db.chapter.update({
            where: { id: chapter.id },
            data: { wordCount }
        });

        console.log(`Updated chapter ${chapter.id}: ${chapter.title} - ${wordCount} words`);
    }

    console.log("Backfill complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
