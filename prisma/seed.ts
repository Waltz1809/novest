import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
    // 1. Tạo Genres
    const genres = [
        "Tiên Hiệp",
        "Huyền Huyễn",
        "Khoa Huyễn",
        "Võ Hiệp",
        "Đô Thị",
        "Đồng Nhân",
        "Lịch Sử",
        "Quân Sự",
        "Du Hí",
        "Cạnh Kỹ",
        "Linh Dị",
        "Ngôn Tình",
        "Đam Mỹ",
        "Bách Hợp",
        "Xuyên Không",
        "Trọng Sinh",
        "Trinh Thám",
        "Thám Hiểm",
        "Hệ Thống",
        "Sắc",
        "Ngược",
        "Sủng",
        "Cung Đấu",
        "Nữ Cường",
        "Gia Đấu",
        "Đông Phương",
        "Mạt Thế",
        "Khác",
    ];

    for (const name of genres) {
        const slug = name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[đĐ]/g, "d")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");

        await db.genre.upsert({
            where: { slug },
            update: {},
            create: {
                name,
                slug,
            },
        });
    }

    // 2. Tạo User Admin
    const admin = await db.user.upsert({
        where: { email: "admin@novest.com" },
        update: {},
        create: {
            email: "admin@novest.com",
            name: "Admin User",
            role: "ADMIN",
        },
    });

    // 3. Tạo Truyện Test
    const novel = await db.novel.upsert({
        where: { slug: "truyen-test" },
        update: {
            searchIndex: "truyen test tac gia test ten khac",
            uploaderId: admin.id,
        },
        create: {
            title: "Truyện Test",
            slug: "truyen-test",
            author: "Tác giả Test",
            description: "Mô tả truyện test",
            status: "ONGOING",
            searchIndex: "truyen test tac gia test ten khac",
            uploaderId: admin.id,
            genres: {
                connect: [{ slug: "tien-hiep" }, { slug: "huyen-huyen" }],
            },
        },
    });

    // 4. Tạo Volume
    const volume = await db.volume.create({
        data: {
            title: "Tập 1",
            order: 1,
            novelId: novel.id,
        },
    });

    // 5. Tạo Chapter
    await db.chapter.create({
        data: {
            title: "Chương 1: Mở đầu",
            slug: "c1",
            content: "<p>Nội dung chương 1...</p>",
            order: 1,
            volumeId: volume.id,
        },
    });

    console.log("Seeding completed!");
}

main()
    .then(async () => {
        await db.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await db.$disconnect();
        process.exit(1);
    });