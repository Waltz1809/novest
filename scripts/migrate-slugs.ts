/**
 * Migration Script: Regenerate Slugs to ID-Based Format
 * 
 * This script updates all existing Novel and Chapter slugs from the old
 * random-suffix format (e.g., "tien-dao-9234") to the new ID-based format
 * (e.g., "tien-dao-123").
 * 
 * Usage: npx tsx scripts/migrate-slugs.ts
 * 
 * IMPORTANT: Backup your database before running this script!
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Helper function to generate slug (same as in seed.ts and utils.ts)
function toSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
}

async function migrateNovelSlugs() {
    console.log("📚 Migrating Novel slugs...");

    const novels = await db.novel.findMany({
        select: { id: true, title: true, slug: true },
    });

    console.log(`Found ${novels.length} novels to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (const novel of novels) {
        const newSlug = `${toSlug(novel.title)}-${novel.id}`;

        try {
            await db.novel.update({
                where: { id: novel.id },
                data: { slug: newSlug },
            });
            console.log(`  ✓ Updated Novel #${novel.id}: "${novel.title}" -> ${newSlug}`);
            successCount++;
        } catch (error) {
            console.error(`  ✗ Failed to update Novel #${novel.id}: ${error}`);
            errorCount++;
        }
    }

    console.log(`✅ Novels migration complete: ${successCount} succeeded, ${errorCount} failed\n`);
    return { successCount, errorCount };
}

async function migrateChapterSlugs() {
    console.log("📖 Migrating Chapter slugs...");

    const chapters = await db.chapter.findMany({
        select: { id: true, title: true, slug: true },
    });

    console.log(`Found ${chapters.length} chapters to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (const chapter of chapters) {
        const newSlug = `${toSlug(chapter.title)}-${chapter.id}`;

        try {
            await db.chapter.update({
                where: { id: chapter.id },
                data: { slug: newSlug },
            });
            console.log(`  ✓ Updated Chapter #${chapter.id}: "${chapter.title}" -> ${newSlug}`);
            successCount++;
        } catch (error) {
            console.error(`  ✗ Failed to update Chapter #${chapter.id}: ${error}`);
            errorCount++;
        }
    }

    console.log(`✅ Chapters migration complete: ${successCount} succeeded, ${errorCount} failed\n`);
    return { successCount, errorCount };
}

async function main() {
    console.log("🚀 Starting Slug Migration to ID-Based Format\n");
    console.log("⚠️  This will update ALL slugs in your database!\n");

    try {
        // Migrate in a single transaction for atomicity
        await db.$transaction(async (tx) => {
            // Temporarily store the transaction client globally for the migration functions
            // (Alternatively, we could pass tx as a parameter to each function)

            // For this implementation, we'll run migrations sequentially
            // but catch errors individually to show which records failed
        });

        // Run migrations (not in transaction to show individual progress)
        const novelResults = await migrateNovelSlugs();
        const chapterResults = await migrateChapterSlugs();

        console.log("\n🎉 Migration Complete!");
        console.log("\n📊 Summary:");
        console.log(`   - Novels migrated: ${novelResults.successCount}/${novelResults.successCount + novelResults.errorCount}`);
        console.log(`   - Chapters migrated: ${chapterResults.successCount}/${chapterResults.successCount + chapterResults.errorCount}`);

        if (novelResults.errorCount > 0 || chapterResults.errorCount > 0) {
            console.log(`\n⚠️  ${novelResults.errorCount + chapterResults.errorCount} records failed to migrate. Check the logs above for details.`);
            process.exit(1);
        }
    } catch (error) {
        console.error("\n❌ Migration failed:", error);
        process.exit(1);
    } finally {
        await db.$disconnect();
    }
}

main();
