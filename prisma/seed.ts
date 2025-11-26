import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Helper function to generate slug
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

// Random selection helper
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

// Vietnamese novel name generators
const titlePrefixes = [
    "Tiên", "Đại", "Thần", "Cửu", "Vô", "Thánh", "Huyền", "Ma",
    "Kiếm", "Đạo", "Vạn", "Thiên", "Bạch", "Hắc", "Hồng", "Tuyệt",
    "Hoàng", "Đế", "Vương", "Hoàng", "Long", "Phượng", "Minh", "Ám"
];

const titleSuffixes = [
    "Đạo", "Tôn", "Giới", "Vực", "Ký", "Truyện", "Đế", "Quân",
    "Kinh", "Lục", "Thần", "Ma", "Tiên", "Thánh", "Chí", "Sư",
    "Vương", "Hoàng", "Tông", "Môn", "Pháp", "Công", "Quyết"
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

async function main() {
    console.log("🌱 Starting database seeding...\n");

    // ============ 1. CLEANUP (Optional) ============
    console.log("🧹 Cleaning up existing data...");
    await db.readingHistory.deleteMany({});
    await db.rating.deleteMany({});
    await db.comment.deleteMany({});
    await db.chapter.deleteMany({});
    await db.volume.deleteMany({});
    await db.novel.deleteMany({});
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

    // ============ 3. CREATE USERS ============
    console.log("👥 Creating users...");

    const admin = await db.user.upsert({
        where: { email: "admin@novest.com" },
        update: {},
        create: {
            email: "admin@novest.com",
            name: "Admin User",
            nickname: "Quản Trị Viên",
            role: "ADMIN",
            password: await bcrypt.hash("admin123", 10),
        },
    });

    const readerNames = [
        { email: "reader1@test.com", name: "Nguyễn Văn A", nickname: "Độc Giả 1" },
        { email: "reader2@test.com", name: "Trần Thị B", nickname: "Độc Giả 2" },
        { email: "reader3@test.com", name: "Lê Văn C", nickname: "Độc Giả 3" },
        { email: "reader4@test.com", name: "Phạm Thị D", nickname: "Độc Giả 4" },
        { email: "reader5@test.com", name: "Hoàng Văn E", nickname: "Độc Giả 5" },
    ];

    const readers = [];
    for (const readerData of readerNames) {
        const reader = await db.user.upsert({
            where: { email: readerData.email },
            update: {},
            create: {
                ...readerData,
                role: "READER",
                password: await bcrypt.hash("123456", 10),
            },
        });
        readers.push(reader);
    }
    console.log(`✅ Created admin + ${readers.length} readers\n`);

    // ============ 4. CREATE 50 NOVELS ============
    console.log("📖 Creating 50 novels...");

    const allUsers = [admin, ...readers];

    for (let i = 1; i <= 50; i++) {
        const title = generateNovelTitle();
        const author = generateAuthorName();
        const description = generateDescription();
        const status = Math.random() < 0.7 ? "ONGOING" : "COMPLETED";

        const baseSlug = toSlug(title);
        const slug = `${baseSlug}-${randomInt(1000, 9999)}`;
        const searchIndex = toSlug(`${title} ${author}`);
        const uploader = randomChoice(allUsers);
        const novelGenres = randomChoices(genres, randomInt(1, 3));

        const novel = await db.novel.create({
            data: {
                title,
                slug,
                author,
                description,
                status,
                searchIndex,
                uploaderId: uploader.id,
                genres: {
                    connect: novelGenres.map(g => ({ id: g.id })),
                },
            },
        });

        console.log(`  ✓ [${i}/50] Created: "${title}" by ${author} (${status})`);

        // ============ 5. CREATE VOLUME & CHAPTERS ============
        const volume = await db.volume.create({
            data: {
                title: "Tập 1",
                order: 1,
                novelId: novel.id,
            },
        });

        const chapterCount = randomInt(10, 20);
        const chapters = [];

        for (let chNum = 1; chNum <= chapterCount; chNum++) {
            const isLocked = Math.random() < 0.1;
            const price = isLocked ? 100 : 0;

            const chapter = await db.chapter.create({
                data: {
                    title: `Chương ${chNum}`,
                    slug: `c${chNum}`,
                    content: `<p>Nội dung chương ${chNum} đang được cập nhật...</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>`,
                    order: chNum,
                    isLocked,
                    price,
                    volumeId: volume.id,
                },
            });
            chapters.push(chapter);
        }

        // ============ 6. CREATE RATINGS (UPSERT) ============
        const ratingCount = randomInt(2, 5);
        const raters = randomChoices(readers, ratingCount);

        for (const rater of raters) {
            const score = randomInt(3, 5);
            await db.rating.upsert({
                where: {
                    userId_novelId: {
                        userId: rater.id,
                        novelId: novel.id,
                    },
                },
                update: {
                    score,
                    content: score >= 4 ? "Truyện hay, rất đáng đọc!" : "Tạm ổn",
                },
                create: {
                    userId: rater.id,
                    novelId: novel.id,
                    score,
                    content: score >= 4 ? "Truyện hay, rất đáng đọc!" : "Tạm ổn",
                },
            });
        }

        // ============ 7. CREATE READING HISTORY (UPSERT) ============
        const viewCount = randomInt(5, 15);
        for (let v = 0; v < viewCount; v++) {
            const randomReader = randomChoice(allUsers);
            const randomChapter = randomChoice(chapters);

            await db.readingHistory.upsert({
                where: {
                    userId_novelId: {
                        userId: randomReader.id,
                        novelId: novel.id,
                    },
                },
                update: {
                    chapterId: randomChapter.id,
                    updatedAt: new Date(),
                },
                create: {
                    userId: randomReader.id,
                    novelId: novel.id,
                    chapterId: randomChapter.id,
                },
            });
        }
    }

    console.log("\n✅ All 50 novels created with chapters, ratings, and reading history!");
    console.log("\n🎉 Seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Genres: ${genres.length}`);
    console.log(`   - Users: ${allUsers.length} (1 admin + 5 readers)`);
    console.log(`   - Novels: 50`);
    console.log(`   - Chapters: ~700 (10-20 per novel)`);
    console.log(`   - Ratings: ~150-250`);
    console.log(`   - Reading History: ~500-750 records`);
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