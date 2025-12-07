import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/**
 * One-time migration script to set approvalStatus for existing novels.
 * Run this via: npx tsx scripts/fix-approval-status.ts
 */
async function migrateExistingNovelsApprovalStatus() {
    // Update all novels that have PENDING status to APPROVED
    // This is for seed data that was created before we had the approval workflow
    const result = await db.novel.updateMany({
        where: {
            approvalStatus: "PENDING",
        },
        data: {
            approvalStatus: "APPROVED",
        },
    });

    console.log(`Updated ${result.count} novels from PENDING to APPROVED status`);
    return { updated: result.count };
}

// Run the migration
migrateExistingNovelsApprovalStatus()
    .then(() => {
        console.log("Migration completed successfully");
        process.exit(0);
    })
    .catch((e) => {
        console.error("Migration failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });

