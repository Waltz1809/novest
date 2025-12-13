import { db } from "../lib/db";

async function main() {
    // Add updatedAt column with default value
    await db.$executeRawUnsafe(`
        ALTER TABLE "Chapter" 
        ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    // Add vipStatus column with default value
    await db.$executeRawUnsafe(`
        ALTER TABLE "Novel" 
        ADD COLUMN IF NOT EXISTS "vipStatus" TEXT NOT NULL DEFAULT 'NONE'
    `);

    console.log("Columns added successfully!");
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());
