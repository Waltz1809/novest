/**
 * SQLite to PostgreSQL Migration Script
 * 
 * This script reads data from a SQLite backup file and inserts it into PostgreSQL.
 * Run with: npx tsx scripts/migrate-sqlite-to-postgres.ts
 */

import Database from "better-sqlite3";
import { PrismaClient } from "@prisma/client";

// ============ CONFIGURATION ============
const SQLITE_PATH = "C:\\Users\\Waltz\\backups\\prod_backup_20251211.db";

const db = new PrismaClient();
const sqlite = new Database(SQLITE_PATH, { readonly: true });

// Helper to check if table exists in SQLite
function tableExists(tableName: string): boolean {
    const result = sqlite.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
    ).get(tableName);
    return !!result;
}

// Helper to get all rows from a SQLite table
function getAll<T>(tableName: string): T[] {
    if (!tableExists(tableName)) {
        console.log(`  ⚠️ Table ${tableName} not found in SQLite, skipping...`);
        return [];
    }
    return sqlite.prepare(`SELECT * FROM ${tableName}`).all() as T[];
}

// Convert SQLite boolean (0/1) to JS boolean
function toBool(value: number | null): boolean {
    return value === 1;
}

// Convert SQLite date string to JS Date
function toDate(value: string | null): Date | null {
    if (!value) return null;
    return new Date(value);
}

async function main() {
    console.log("🚀 Starting SQLite to PostgreSQL migration...\n");
    console.log(`📂 Source: ${SQLITE_PATH}`);
    console.log(`🐘 Target: PostgreSQL (from DATABASE_URL)\n`);

    // ============ CLEANUP EXISTING DATA ============
    console.log("🧹 Cleaning up existing PostgreSQL data...");

    // Delete in correct order (respecting foreign keys)
    await db.ratingComment.deleteMany({});
    await db.adminLog.deleteMany({});
    await db.notification.deleteMany({});
    await db.commentReaction.deleteMany({});
    await db.comment.deleteMany({});
    await db.rating.deleteMany({});
    await db.userPurchase.deleteMany({});
    await db.readingHistory.deleteMany({});
    await db.library.deleteMany({});
    await db.chapterVersion.deleteMany({});
    await db.ticket.deleteMany({});
    await db.chapter.deleteMany({});
    await db.volume.deleteMany({});
    await db.novel.deleteMany({});
    await db.translationGroupMember.deleteMany({});
    await db.translationGroup.deleteMany({});
    await db.userBadge.deleteMany({});
    await db.badge.deleteMany({});
    await db.transaction.deleteMany({});
    await db.wallet.deleteMany({});
    await db.userPreference.deleteMany({});
    await db.announcement.deleteMany({});
    await db.session.deleteMany({});
    await db.account.deleteMany({});
    await db.verificationToken.deleteMany({});
    await db.user.deleteMany({});
    await db.genre.deleteMany({});

    console.log("✅ Cleanup complete\n");

    // ============ MIGRATE USERS ============
    console.log("👥 Migrating users...");
    interface SQLiteUser {
        id: string;
        name: string | null;
        email: string | null;
        emailVerified: string | null;
        image: string | null;
        password: string | null;
        nickname: string | null;
        role: string;
        createdAt: string;
        username: string | null;
        isBanned: number;
        banReason: string | null;
        birthday: string | null;
    }

    const users = getAll<SQLiteUser>("User");
    for (const user of users) {
        await db.user.create({
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                emailVerified: toDate(user.emailVerified),
                image: user.image,
                password: user.password,
                nickname: user.nickname,
                role: user.role || "READER",
                createdAt: toDate(user.createdAt) || new Date(),
                username: user.username,
                isBanned: toBool(user.isBanned),
                banReason: user.banReason,
                birthday: toDate(user.birthday),
            },
        });
    }
    console.log(`✅ Migrated ${users.length} users\n`);

    // ============ MIGRATE ACCOUNTS (OAuth) ============
    console.log("🔐 Migrating accounts...");
    interface SQLiteAccount {
        id: string;
        userId: string;
        type: string;
        provider: string;
        providerAccountId: string;
        refresh_token: string | null;
        access_token: string | null;
        expires_at: number | null;
        token_type: string | null;
        scope: string | null;
        id_token: string | null;
        session_state: string | null;
    }

    const accounts = getAll<SQLiteAccount>("Account");
    for (const acc of accounts) {
        await db.account.create({
            data: {
                id: acc.id,
                userId: acc.userId,
                type: acc.type,
                provider: acc.provider,
                providerAccountId: acc.providerAccountId,
                refresh_token: acc.refresh_token,
                access_token: acc.access_token,
                expires_at: acc.expires_at,
                token_type: acc.token_type,
                scope: acc.scope,
                id_token: acc.id_token,
                session_state: acc.session_state,
            },
        });
    }
    console.log(`✅ Migrated ${accounts.length} accounts\n`);

    // ============ MIGRATE GENRES ============
    console.log("📚 Migrating genres...");
    interface SQLiteGenre {
        id: number;
        name: string;
        slug: string;
    }

    const genres = getAll<SQLiteGenre>("Genre");
    for (const genre of genres) {
        await db.genre.create({
            data: {
                id: genre.id,
                name: genre.name,
                slug: genre.slug,
            },
        });
    }
    console.log(`✅ Migrated ${genres.length} genres\n`);

    // ============ MIGRATE WALLETS ============
    console.log("💰 Migrating wallets...");
    interface SQLiteWallet {
        id: string;
        userId: string;
        balance: number;
    }

    const wallets = getAll<SQLiteWallet>("Wallet");
    for (const wallet of wallets) {
        await db.wallet.create({
            data: {
                id: wallet.id,
                userId: wallet.userId,
                balance: wallet.balance || 0,
            },
        });
    }
    console.log(`✅ Migrated ${wallets.length} wallets\n`);

    // ============ MIGRATE TRANSLATION GROUPS ============
    console.log("🌐 Migrating translation groups...");
    interface SQLiteTranslationGroup {
        id: string;
        name: string;
        createdAt: string;
    }

    const groups = getAll<SQLiteTranslationGroup>("TranslationGroup");
    for (const group of groups) {
        await db.translationGroup.create({
            data: {
                id: group.id,
                name: group.name,
                createdAt: toDate(group.createdAt) || new Date(),
            },
        });
    }
    console.log(`✅ Migrated ${groups.length} translation groups\n`);

    // ============ MIGRATE NOVELS ============
    console.log("📖 Migrating novels...");
    interface SQLiteNovel {
        id: number;
        title: string;
        slug: string;
        author: string;
        artist: string | null;
        description: string | null;
        status: string;
        coverImage: string | null;
        viewCount: number;
        alternativeTitles: string | null;
        originalName: string | null;
        searchIndex: string | null;
        nation: string;
        novelFormat: string;
        approvalStatus: string;
        rejectionReason: string | null;
        rejectionCount: number;
        discountPercent: number;
        isR18: number;
        isLicensedDrop: number;
        createdAt: string;
        updatedAt: string;
        uploaderId: string;
        translationGroupId: string | null;
    }

    const novels = getAll<SQLiteNovel>("Novel");

    // Get novel-genre relationships
    interface SQLiteNovelGenre {
        A: number; // genreId
        B: number; // novelId
    }
    const novelGenres = getAll<SQLiteNovelGenre>("_GenreToNovel");

    for (const novel of novels) {
        const genreIds = novelGenres
            .filter(ng => ng.B === novel.id)
            .map(ng => ({ id: ng.A }));

        await db.novel.create({
            data: {
                id: novel.id,
                title: novel.title,
                slug: novel.slug,
                author: novel.author,
                artist: novel.artist,
                description: novel.description,
                status: novel.status || "ONGOING",
                coverImage: novel.coverImage,
                viewCount: novel.viewCount || 0,
                alternativeTitles: novel.alternativeTitles,
                originalName: novel.originalName,
                searchIndex: novel.searchIndex,
                nation: novel.nation || "CN",
                novelFormat: novel.novelFormat || "WN",
                approvalStatus: novel.approvalStatus || "PENDING",
                rejectionReason: novel.rejectionReason,
                rejectionCount: novel.rejectionCount || 0,
                discountPercent: novel.discountPercent || 0,
                isR18: toBool(novel.isR18),
                isLicensedDrop: toBool(novel.isLicensedDrop),
                createdAt: toDate(novel.createdAt) || new Date(),
                updatedAt: toDate(novel.updatedAt) || new Date(),
                uploaderId: novel.uploaderId,
                translationGroupId: novel.translationGroupId,
                genres: { connect: genreIds },
            },
        });
    }
    console.log(`✅ Migrated ${novels.length} novels\n`);

    // ============ MIGRATE VOLUMES ============
    console.log("📕 Migrating volumes...");
    interface SQLiteVolume {
        id: number;
        title: string;
        order: number;
        novelId: number;
    }

    const volumes = getAll<SQLiteVolume>("Volume");
    for (const volume of volumes) {
        await db.volume.create({
            data: {
                id: volume.id,
                title: volume.title,
                order: volume.order,
                novelId: volume.novelId,
            },
        });
    }
    console.log(`✅ Migrated ${volumes.length} volumes\n`);

    // ============ MIGRATE CHAPTERS ============
    console.log("📄 Migrating chapters...");
    interface SQLiteChapter {
        id: number;
        title: string;
        slug: string;
        content: string;
        order: number;
        isLocked: number;
        price: number;
        volumeId: number;
        isDraft: number;
        publishAt: string | null;
        createdAt: string;
        wordCount: number;
    }

    const chapters = getAll<SQLiteChapter>("Chapter");
    let chapterCount = 0;

    for (const chapter of chapters) {
        try {
            await db.chapter.create({
                data: {
                    id: chapter.id,
                    title: chapter.title,
                    slug: chapter.slug,
                    content: chapter.content || "",
                    order: chapter.order,
                    isLocked: toBool(chapter.isLocked),
                    price: chapter.price || 0,
                    volumeId: chapter.volumeId,
                    isDraft: toBool(chapter.isDraft),
                    publishAt: toDate(chapter.publishAt),
                    createdAt: toDate(chapter.createdAt) || new Date(),
                    wordCount: chapter.wordCount || 0,
                },
            });
            chapterCount++;
        } catch (error) {
            console.log(`  ⚠️ Skipped chapter ${chapter.id}: ${(error as Error).message}`);
        }
    }
    console.log(`✅ Migrated ${chapterCount} chapters\n`);

    // ============ MIGRATE COMMENTS ============
    console.log("💬 Migrating comments...");
    interface SQLiteComment {
        id: number;
        content: string;
        createdAt: string;
        updatedAt: string;
        isPinned: number;
        pinnedAt: string | null;
        pinnedBy: string | null;
        userId: string;
        novelId: number;
        chapterId: number | null;
        paragraphId: number | null;
        parentId: number | null;
    }

    const comments = getAll<SQLiteComment>("Comment");

    // First pass: create comments without parentId
    for (const comment of comments.filter(c => !c.parentId)) {
        await db.comment.create({
            data: {
                id: comment.id,
                content: comment.content,
                createdAt: toDate(comment.createdAt) || new Date(),
                updatedAt: toDate(comment.updatedAt) || new Date(),
                isPinned: toBool(comment.isPinned),
                pinnedAt: toDate(comment.pinnedAt),
                pinnedBy: comment.pinnedBy,
                userId: comment.userId,
                novelId: comment.novelId,
                chapterId: comment.chapterId,
                paragraphId: comment.paragraphId,
            },
        });
    }

    // Second pass: create replies
    for (const comment of comments.filter(c => c.parentId)) {
        try {
            await db.comment.create({
                data: {
                    id: comment.id,
                    content: comment.content,
                    createdAt: toDate(comment.createdAt) || new Date(),
                    updatedAt: toDate(comment.updatedAt) || new Date(),
                    isPinned: toBool(comment.isPinned),
                    pinnedAt: toDate(comment.pinnedAt),
                    pinnedBy: comment.pinnedBy,
                    userId: comment.userId,
                    novelId: comment.novelId,
                    chapterId: comment.chapterId,
                    paragraphId: comment.paragraphId,
                    parentId: comment.parentId,
                },
            });
        } catch {
            // Parent might not exist, skip
        }
    }
    console.log(`✅ Migrated ${comments.length} comments\n`);

    // ============ MIGRATE RATINGS ============
    console.log("⭐ Migrating ratings...");
    interface SQLiteRating {
        userId: string;
        novelId: number;
        score: number;
        content: string | null;
        createdAt: string;
        updatedAt: string | null;
    }

    const ratings = getAll<SQLiteRating>("Rating");
    for (const rating of ratings) {
        await db.rating.create({
            data: {
                userId: rating.userId,
                novelId: rating.novelId,
                score: rating.score,
                content: rating.content,
                createdAt: toDate(rating.createdAt) || new Date(),
                updatedAt: toDate(rating.updatedAt),
            },
        });
    }
    console.log(`✅ Migrated ${ratings.length} ratings\n`);

    // ============ MIGRATE LIBRARY ============
    console.log("📚 Migrating library entries...");
    interface SQLiteLibrary {
        userId: string;
        novelId: number;
        createdAt: string;
    }

    const libraryEntries = getAll<SQLiteLibrary>("Library");
    for (const entry of libraryEntries) {
        try {
            await db.library.create({
                data: {
                    userId: entry.userId,
                    novelId: entry.novelId,
                    createdAt: toDate(entry.createdAt) || new Date(),
                },
            });
        } catch {
            // Skip duplicates
        }
    }
    console.log(`✅ Migrated ${libraryEntries.length} library entries\n`);

    // ============ MIGRATE READING HISTORY ============
    console.log("📖 Migrating reading history...");
    interface SQLiteReadingHistory {
        userId: string;
        novelId: number;
        chapterId: number;
        updatedAt: string;
    }

    const history = getAll<SQLiteReadingHistory>("ReadingHistory");
    for (const entry of history) {
        try {
            await db.readingHistory.create({
                data: {
                    userId: entry.userId,
                    novelId: entry.novelId,
                    chapterId: entry.chapterId,
                    updatedAt: toDate(entry.updatedAt) || new Date(),
                },
            });
        } catch {
            // Skip if chapter doesn't exist
        }
    }
    console.log(`✅ Migrated ${history.length} reading history entries\n`);

    // ============ MIGRATE NOTIFICATIONS ============
    console.log("🔔 Migrating notifications...");
    interface SQLiteNotification {
        id: string;
        userId: string;
        actorId: string | null;
        type: string;
        resourceId: string;
        resourceType: string;
        message: string;
        isRead: number;
        createdAt: string;
    }

    const notifications = getAll<SQLiteNotification>("Notification");
    for (const notif of notifications) {
        await db.notification.create({
            data: {
                id: notif.id,
                userId: notif.userId,
                actorId: notif.actorId,
                type: notif.type,
                resourceId: notif.resourceId,
                resourceType: notif.resourceType,
                message: notif.message,
                isRead: toBool(notif.isRead),
                createdAt: toDate(notif.createdAt) || new Date(),
            },
        });
    }
    console.log(`✅ Migrated ${notifications.length} notifications\n`);

    // ============ RESET SEQUENCES ============
    console.log("🔄 Resetting PostgreSQL sequences...");

    // Get max IDs and reset sequences
    const maxNovelId = novels.length > 0 ? Math.max(...novels.map(n => n.id)) : 0;
    const maxVolumeId = volumes.length > 0 ? Math.max(...volumes.map(v => v.id)) : 0;
    const maxChapterId = chapters.length > 0 ? Math.max(...chapters.map(c => c.id)) : 0;
    const maxGenreId = genres.length > 0 ? Math.max(...genres.map(g => g.id)) : 0;
    const maxCommentId = comments.length > 0 ? Math.max(...comments.map(c => c.id)) : 0;

    await db.$executeRawUnsafe(`ALTER SEQUENCE "Novel_id_seq" RESTART WITH ${maxNovelId + 1}`);
    await db.$executeRawUnsafe(`ALTER SEQUENCE "Volume_id_seq" RESTART WITH ${maxVolumeId + 1}`);
    await db.$executeRawUnsafe(`ALTER SEQUENCE "Chapter_id_seq" RESTART WITH ${maxChapterId + 1}`);
    await db.$executeRawUnsafe(`ALTER SEQUENCE "Genre_id_seq" RESTART WITH ${maxGenreId + 1}`);
    await db.$executeRawUnsafe(`ALTER SEQUENCE "Comment_id_seq" RESTART WITH ${maxCommentId + 1}`);

    console.log("✅ Sequences reset\n");

    // ============ SUMMARY ============
    console.log("🎉 Migration completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Accounts: ${accounts.length}`);
    console.log(`   - Genres: ${genres.length}`);
    console.log(`   - Novels: ${novels.length}`);
    console.log(`   - Volumes: ${volumes.length}`);
    console.log(`   - Chapters: ${chapterCount}`);
    console.log(`   - Comments: ${comments.length}`);
    console.log(`   - Ratings: ${ratings.length}`);
    console.log(`   - Library: ${libraryEntries.length}`);
    console.log(`   - Reading History: ${history.length}`);
    console.log(`   - Notifications: ${notifications.length}`);
}

main()
    .then(async () => {
        sqlite.close();
        await db.$disconnect();
    })
    .catch(async (e) => {
        console.error("❌ Migration failed:", e);
        sqlite.close();
        await db.$disconnect();
        process.exit(1);
    });
