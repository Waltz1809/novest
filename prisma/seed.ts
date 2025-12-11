import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { calculateChapterPrice } from "../lib/pricing";

const db = new PrismaClient();

// ============ HELPER FUNCTIONS ============

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

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

function randomChoices<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Generate realistic word count for a chapter (1500-4000 words)
function generateWordCount(): number {
    return randomInt(1500, 4000);
}

// Generate chapter content with approximate word count
function generateChapterContent(wordCount: number): string {
    const paragraph = `<p>Đây là nội dung chương mẫu được tạo tự động cho mục đích testing. Nội dung này được thiết kế để có số lượng từ gần đúng với wordCount đã chỉ định. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>`;
    const paragraphWords = 50; // Approximate words per paragraph
    const paragraphsNeeded = Math.ceil(wordCount / paragraphWords);
    return Array(paragraphsNeeded).fill(paragraph).join("\n");
}

// ============ NAME GENERATORS ============

const titlePrefixes = [
    "Tiên", "Đại", "Thần", "Cửu", "Vô", "Thánh", "Huyền", "Ma",
    "Kiếm", "Đạo", "Vạn", "Thiên", "Bạch", "Hắc", "Hồng", "Tuyệt",
    "Hoàng", "Đế", "Vương", "Long", "Phượng", "Minh", "Ám", "Ngọc"
];

const titleSuffixes = [
    "Đạo", "Tôn", "Giới", "Vực", "Ký", "Truyện", "Đế", "Quân",
    "Kinh", "Lục", "Thần", "Ma", "Tiên", "Thánh", "Chí", "Sư",
    "Vương", "Hoàng", "Tông", "Môn", "Pháp", "Công", "Quyết", "Thiên"
];

const titleMiddles = [
    "Chi", "Của", "Bất", "Vô", "Siêu", "Cực", "Chí", "Thiên",
    "Địa", "Huyền", "Hoàng", "Thượng", "Tối", "Đại", "Cửu", "Vạn"
];

const authorPrefixes = [
    "Lão", "Thiên", "Đường", "Mặc", "Kim", "Bạch", "Hắc", "Thanh",
    "Liễu", "Dạ", "Minh", "Tiêu", "Vân", "Ngọc", "Phong", "Sương"
];

const authorSuffixes = [
    "Trư", "Tằm", "Hương", "Gia", "Tử", "Lang", "Sinh", "Nhân",
    "Thần", "Tiên", "Ma", "Quỷ", "Sư", "Tông", "Môn", "Phái"
];

function generateNovelTitle(): string {
    const pattern = randomInt(1, 3);
    if (pattern === 1) {
        return `${randomChoice(titlePrefixes)} ${randomChoice(titleSuffixes)}`;
    } else if (pattern === 2) {
        return `${randomChoice(titlePrefixes)} ${randomChoice(titleMiddles)} ${randomChoice(titleSuffixes)}`;
    } else {
        return `${randomChoice(titlePrefixes)} ${randomChoice(titlePrefixes)} ${randomChoice(titleSuffixes)}`;
    }
}

function generateAuthorName(): string {
    return `${randomChoice(authorPrefixes)} ${randomChoice(authorSuffixes)}`;
}

function generateDescription(): string {
    const templates = [
        "Một câu chuyện huyền ảo về hành trình tu luyện đầy gian nan của nhân vật chính.",
        "Trong một thế giới đầy rẫy ma pháp và bí ẩn, anh ấy đã bước lên con đường trở thành cường giả.",
        "Câu chuyện về một thiên tài trẻ tuổi trong cuộc hành trình chinh phục đỉnh cao tu tiên.",
        "Sau khi trọng sinh, nhân vật chính quyết tâm thay đổi vận mệnh của bản thân.",
        "Một hành trình phiêu lưu đầy thú vị qua các thế giới khác nhau.",
        "Từ một kẻ bình thường, anh ta đã trở thành một trong những người mạnh nhất thiên hạ.",
        "Trong loạn thế, chỉ có sức mạnh mới là tất cả. Đây là câu chuyện về sự trỗi dậy của một huyền thoại."
    ];
    return randomChoice(templates);
}

// ============ MAIN SEED FUNCTION ============

async function main() {
    console.log("🌱 Starting database seeding...\n");

    // ============ 1. CLEANUP ============
    console.log("🧹 Cleaning up existing data...");
    await db.ratingComment.deleteMany({});
    await db.notification.deleteMany({});
    await db.commentReaction.deleteMany({});
    await db.userBadge.deleteMany({});
    await db.library.deleteMany({});
    await db.readingHistory.deleteMany({});
    await db.userPurchase.deleteMany({});
    await db.rating.deleteMany({});
    await db.comment.deleteMany({});
    await db.chapterVersion.deleteMany({});
    await db.chapter.deleteMany({});
    await db.volume.deleteMany({});
    await db.novel.deleteMany({});
    await db.translationGroupMember.deleteMany({});
    await db.translationGroup.deleteMany({});
    await db.transaction.deleteMany({});
    await db.wallet.deleteMany({});
    await db.badge.deleteMany({});
    await db.announcement.deleteMany({});
    await db.adminLog.deleteMany({});
    await db.ticket.deleteMany({});
    await db.userPreference.deleteMany({});
    // Don't delete users to preserve OAuth accounts
    console.log("✅ Cleanup complete\n");

    // ============ 2. CREATE GENRES ============
    console.log("📚 Creating genres...");
    const genreNames = [
        "Tiên Hiệp", "Huyền Huyễn", "Khoa Huyễn", "Võ Hiệp", "Đô Thị",
        "Đồng Nhân", "Lịch Sử", "Quân Sự", "Du Hí", "Cạnh Kỹ",
        "Linh Dị", "Ngôn Tình", "Đam Mỹ", "Bách Hợp", "Xuyên Không",
        "Trọng Sinh", "Trinh Thám", "Thám Hiểm", "Hệ Thống", "Sắc",
        "Ngược", "Sủng", "Cung Đấu", "Nữ Cường", "Gia Đấu",
        "Đông Phương", "Mạt Thế", "Khác"
    ];

    const genres = [];
    for (const name of genreNames) {
        const slug = toSlug(name);
        const genre = await db.genre.upsert({
            where: { slug },
            update: {},
            create: { name, slug },
        });
        genres.push(genre);
    }
    console.log(`✅ Created ${genres.length} genres\n`);

    // ============ 3. CREATE BADGES ============
    console.log("🏅 Creating badges...");
    const badgeData = [
        { name: "VIP", description: "Thành viên VIP", icon: "crown", color: "#FFD700" },
        { name: "Tác Giả", description: "Người đăng truyện", icon: "pen-tool", color: "#4ADE80" },
        { name: "Mod", description: "Điều hành viên", icon: "shield", color: "#60A5FA" },
        { name: "Admin", description: "Quản trị viên", icon: "shield-alert", color: "#F87171" },
        { name: "Nhà Tài Trợ", description: "Đã nạp tiền ủng hộ", icon: "heart", color: "#F472B6" },
        { name: "Dịch Giả", description: "Thành viên nhóm dịch", icon: "languages", color: "#A78BFA" },
    ];

    const badges: Record<string, { id: string; name: string; description: string | null; icon: string; color: string | null; createdAt: Date; updatedAt: Date }> = {};
    for (const data of badgeData) {
        const badge = await db.badge.upsert({
            where: { id: toSlug(data.name) },
            update: data,
            create: { id: toSlug(data.name), ...data },
        });
        badges[data.name] = badge;
    }
    console.log(`✅ Created ${Object.keys(badges).length} badges\n`);

    // ============ 4. CREATE USERS ============
    console.log("👥 Creating users...");

    const admin = await db.user.upsert({
        where: { email: "admin@novest.com" },
        update: { username: "admin", nickname: "Quản Trị Viên" },
        create: {
            email: "admin@novest.com",
            name: "Admin User",
            nickname: "Quản Trị Viên",
            username: "admin",
            role: "ADMIN",
            password: await bcrypt.hash("Admin123!", 10),
            emailVerified: new Date(),
        },
    });

    const moderator = await db.user.upsert({
        where: { email: "mod@novest.com" },
        update: { username: "moderator", nickname: "Điều Hành Viên" },
        create: {
            email: "mod@novest.com",
            name: "Moderator User",
            nickname: "Điều Hành Viên",
            username: "moderator",
            role: "MODERATOR",
            password: await bcrypt.hash("Mod123!", 10),
            emailVerified: new Date(),
        },
    });

    const readerData = [
        { email: "reader1@test.com", name: "Nguyễn Văn A", nickname: "Tiểu Thư Họ Nguyễn", username: "nguyen_van_a" },
        { email: "reader2@test.com", name: "Trần Thị B", nickname: "Đạo Hữu Họ Trần", username: "tran_thi_b" },
        { email: "reader3@test.com", name: "Lê Văn C", nickname: "Công Tử Họ Lê", username: "le_van_c" },
        { email: "reader4@test.com", name: "Phạm Thị D", nickname: "Tiên Tử Họ Phạm", username: "pham_thi_d" },
        { email: "reader5@test.com", name: "Hoàng Văn E", nickname: "Ma Vương Họ Hoàng", username: "hoang_van_e" },
    ];

    const readers = [];
    for (const data of readerData) {
        const reader = await db.user.upsert({
            where: { email: data.email },
            update: { nickname: data.nickname, username: data.username },
            create: {
                ...data,
                role: "READER",
                password: await bcrypt.hash("Reader123!", 10),
                emailVerified: new Date(),
            },
        });
        readers.push(reader);
    }
    console.log(`✅ Created admin + moderator + ${readers.length} readers\n`);

    // ============ 5. CREATE WALLETS FOR ALL USERS ============
    console.log("💰 Creating wallets...");
    const allUsers = [admin, moderator, ...readers];
    for (const user of allUsers) {
        const balance = user.role === "ADMIN" ? 999999 : user.role === "MODERATOR" ? 10000 : 1000;
        await db.wallet.upsert({
            where: { userId: user.id },
            update: { balance },
            create: { userId: user.id, balance },
        });
    }
    console.log(`✅ Created wallets for ${allUsers.length} users\n`);

    // ============ 6. ASSIGN BADGES ============
    console.log("🎖️ Assigning badges...");
    await db.userBadge.upsert({
        where: { userId_badgeId: { userId: admin.id, badgeId: badges["Admin"].id } },
        update: {},
        create: { userId: admin.id, badgeId: badges["Admin"].id },
    });
    await db.userBadge.upsert({
        where: { userId_badgeId: { userId: moderator.id, badgeId: badges["Mod"].id } },
        update: {},
        create: { userId: moderator.id, badgeId: badges["Mod"].id },
    });
    console.log("✅ Assigned badges\n");

    // ============ 7. CREATE TRANSLATION GROUPS ============
    console.log("🌐 Creating translation groups...");
    const groupData = [
        { id: "nha-tho-truyen", name: "Nhà Thờ Truyện" },
        { id: "sky-team", name: "Sky Translation Team" },
        { id: "nguyet-ha", name: "Nguyệt Hạ Dịch Giả" },
    ];

    const translationGroups = [];
    for (const data of groupData) {
        const group = await db.translationGroup.upsert({
            where: { id: data.id },
            update: { name: data.name },
            create: data,
        });
        translationGroups.push(group);
    }
    // Add some readers to groups
    await db.translationGroupMember.upsert({
        where: { groupId_userId: { groupId: translationGroups[0].id, userId: readers[0].id } },
        update: {},
        create: { groupId: translationGroups[0].id, userId: readers[0].id, role: "OWNER" },
    });
    await db.translationGroupMember.upsert({
        where: { groupId_userId: { groupId: translationGroups[1].id, userId: readers[1].id } },
        update: {},
        create: { groupId: translationGroups[1].id, userId: readers[1].id, role: "OWNER" },
    });
    console.log(`✅ Created ${translationGroups.length} translation groups\n`);

    // ============ 8. CREATE ANNOUNCEMENTS ============
    console.log("📢 Creating announcements...");
    await db.announcement.upsert({
        where: { id: "welcome-announcement" },
        update: {},
        create: {
            id: "welcome-announcement",
            title: "Chào mừng đến với Novest!",
            content: "<p>🎉 <strong>Chào mừng bạn đến với Novest</strong> - nền tảng đọc truyện tiếng Việt!</p><p>Hãy khám phá hàng ngàn truyện hay và tham gia cộng đồng của chúng tôi.</p>",
            isActive: true,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
    });
    console.log("✅ Created announcements\n");

    // ============ 9. CREATE 50 NOVELS ============
    console.log("📖 Creating 50 novels...\n");

    const uploaders = [admin, ...readers]; // Admin and readers can upload

    for (let i = 1; i <= 50; i++) {
        const title = generateNovelTitle();
        const author = generateAuthorName();
        const description = generateDescription();
        const uploader = randomChoice(uploaders);
        const novelGenres = randomChoices(genres, randomInt(1, 3));
        const nation = randomChoice(["CN", "JP", "KR"]);
        const novelFormat = randomChoice(["WN", "LN"]);
        const viewCount = randomInt(1000, 1000000);

        // Determine special properties
        let approvalStatus = "APPROVED";
        let isR18 = false;
        let isLicensedDrop = false;
        let status = Math.random() < 0.7 ? "ONGOING" : "COMPLETED";

        // First 3 novels are R18
        if (i <= 3) {
            isR18 = true;
        }
        // Novels 4-8 are PENDING (for testing approval flow)
        else if (i >= 4 && i <= 8) {
            approvalStatus = "PENDING";
        }
        // Novels 9-10 are licensed drops
        else if (i >= 9 && i <= 10) {
            isLicensedDrop = true;
            status = "DROPPED";
        }

        // Assign translation group to some novels
        const translationGroupId = i <= 15 ? randomChoice(translationGroups).id : null;

        // Create novel with transaction for ID-based slug
        const novel = await db.$transaction(async (tx) => {
            const tempNovel = await tx.novel.create({
                data: {
                    title,
                    slug: `temp-${Date.now()}-${randomInt(1000, 9999)}`,
                    author,
                    description,
                    status,
                    searchIndex: toSlug(`${title} ${author}`),
                    viewCount,
                    uploaderId: uploader.id,
                    nation,
                    novelFormat,
                    approvalStatus,
                    isR18,
                    isLicensedDrop,
                    translationGroupId,
                    genres: { connect: novelGenres.map(g => ({ id: g.id })) },
                },
            });

            const finalSlug = `${toSlug(title)}-${tempNovel.id}`;
            return await tx.novel.update({
                where: { id: tempNovel.id },
                data: { slug: finalSlug },
            });
        });

        const novelTags = [
            isR18 ? "R18" : null,
            approvalStatus === "PENDING" ? "PENDING" : null,
            isLicensedDrop ? "DROPPED" : null,
        ].filter(Boolean).join(", ");

        console.log(`  ✓ [${i}/50] "${title}" by ${author} ${novelTags ? `(${novelTags})` : ""}`);

        // ============ CREATE VOLUMES & CHAPTERS ============
        const volumeCount = randomInt(1, 3);
        const createdChapters: { id: number; wordCount: number }[] = [];
        let totalWordCount = 0;

        for (let v = 1; v <= volumeCount; v++) {
            const volume = await db.volume.create({
                data: {
                    title: volumeCount > 1 ? `Tập ${v}` : "Tập 1",
                    order: v,
                    novelId: novel.id,
                },
            });

            const chaptersInVolume = randomInt(8, 15);

            for (let chNum = 1; chNum <= chaptersInVolume; chNum++) {
                const globalOrder = (v - 1) * 15 + chNum; // Approximate global order
                const wordCount = generateWordCount();
                totalWordCount += wordCount;
                const chapterTitle = `Chương ${globalOrder}`;

                const chapter = await db.$transaction(async (tx) => {
                    const tempChapter = await tx.chapter.create({
                        data: {
                            title: chapterTitle,
                            slug: `temp-ch-${Date.now()}-${randomInt(1000, 9999)}`,
                            content: generateChapterContent(wordCount),
                            order: globalOrder,
                            isLocked: false, // Will be updated later
                            price: 0,
                            volumeId: volume.id,
                            isDraft: false,
                            wordCount,
                        },
                    });

                    const finalSlug = `${toSlug(chapterTitle)}-${tempChapter.id}`;
                    return await tx.chapter.update({
                        where: { id: tempChapter.id },
                        data: { slug: finalSlug },
                    });
                });

                createdChapters.push({ id: chapter.id, wordCount: chapter.wordCount });
            }
        }

        // ============ SET PREMIUM CHAPTERS (LAST 3-5 CHAPTERS IF NOVEL HAS 50K+ WORDS) ============
        // Only set premium if novel has enough words and is not a licensed drop
        if (totalWordCount >= 50000 && !isLicensedDrop && approvalStatus === "APPROVED") {
            const premiumCount = randomInt(3, 5);
            const lastChapters = createdChapters.slice(-premiumCount);

            for (const ch of lastChapters) {
                // Only chapters with 1000+ words can be premium
                if (ch.wordCount >= 1000) {
                    const price = calculateChapterPrice(ch.wordCount, novelFormat);
                    await db.chapter.update({
                        where: { id: ch.id },
                        data: { isLocked: true, price },
                    });
                }
            }
        }

        // ============ CREATE RATINGS ============
        const ratingCount = randomInt(2, 5);
        const raters = randomChoices(readers, ratingCount);

        for (const rater of raters) {
            const score = Math.random() < 0.15 ? randomInt(1, 2) : randomInt(3, 5);
            await db.rating.upsert({
                where: { userId_novelId: { userId: rater.id, novelId: novel.id } },
                update: { score, content: score >= 4 ? "Truyện hay, rất đáng đọc!" : "Tạm ổn" },
                create: {
                    userId: rater.id,
                    novelId: novel.id,
                    score,
                    content: score >= 4 ? "Truyện hay, rất đáng đọc!" : "Tạm ổn",
                },
            });
        }

        // ============ CREATE READING HISTORY ============
        const historyCount = randomInt(5, 15);
        for (let h = 0; h < historyCount; h++) {
            const randomReader = randomChoice(allUsers);
            const randomChapter = randomChoice(createdChapters);

            await db.readingHistory.upsert({
                where: { userId_novelId: { userId: randomReader.id, novelId: novel.id } },
                update: { chapterId: randomChapter.id, updatedAt: new Date() },
                create: {
                    userId: randomReader.id,
                    novelId: novel.id,
                    chapterId: randomChapter.id,
                },
            });
        }

        // ============ CREATE COMMENTS (for first 10 novels) ============
        if (i <= 10) {
            const commentCount = randomInt(3, 8);
            for (let c = 0; c < commentCount; c++) {
                const commenter = randomChoice(readers);
                const comments = [
                    "Truyện hay quá! Mong tác giả ra chương mới sớm.",
                    "Nhân vật chính rất thú vị, tôi thích cách phát triển nhân vật.",
                    "Cốt truyện hấp dẫn, đọc không muốn dừng.",
                    "Một số đoạn hơi kéo dài nhưng tổng thể vẫn rất hay.",
                    "Thanks admin đã đăng truyện!",
                ];
                await db.comment.create({
                    data: {
                        content: randomChoice(comments),
                        userId: commenter.id,
                        novelId: novel.id,
                    },
                });
            }
        }
    }

    console.log("\n✅ All 50 novels created with chapters, ratings, and comments!");
    console.log("\n🎉 Seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Genres: ${genres.length}`);
    console.log(`   - Badges: ${Object.keys(badges).length}`);
    console.log(`   - Users: ${allUsers.length} (1 admin + 1 moderator + 5 readers)`);
    console.log(`   - Translation Groups: ${translationGroups.length}`);
    console.log(`   - Novels: 50 (3 R18, 5 PENDING, 2 Licensed Drop)`);
    console.log(`   - Chapters: ~600-750 (8-15 per volume, 1-3 volumes per novel)`);
    console.log(`   - Premium chapters: Based on 50K+ word novels, last 3-5 chapters`);
    console.log(`   - Pricing formula: (wordCount / 1000) * 5 vé, LN x1.2`);
}

main()
    .then(async () => {
        await db.$disconnect();
    })
    .catch(async (e) => {
        console.error("❌ Seeding failed:", e);
        await db.$disconnect();
        process.exit(1);
    });