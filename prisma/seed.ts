// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    // Xóa dữ liệu cũ
    await prisma.chapter.deleteMany()
    await prisma.volume.deleteMany()
    await prisma.novel.deleteMany()

    // Tạo mới - KHÔNG ĐIỀN ID, để tự tăng
    const novel = await prisma.novel.create({
        data: {
            title: 'Truyện Test',
            slug: 'truyen-test',
            author: 'Tester',
            status: 'ONGOING',
            volumes: {
                create: {
                    title: 'Quyển 1',
                    order: 1,
                    chapters: {
                        create: {
                            title: 'Chương 1',
                            content: 'Nội dung...',
                            order: 1
                        }
                    }
                }
            }
        }
    })

    console.log('Seed success! Novel ID:', novel.id)
}

main()
    .then(async () => await prisma.$disconnect())
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })