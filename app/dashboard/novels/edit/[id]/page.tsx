import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import NovelForm from "@/components/novel/novel-form";
import { getGenres } from "@/actions/search";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VolumeManager from "@/components/dashboard/volume-manager";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditNovelPage({ params }: PageProps) {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const novel = await db.novel.findUnique({
        where: {
            id: parseInt(id),
        },
        include: {
            genres: true,
            volumes: {
                orderBy: {
                    order: "asc",
                },
                include: {
                    chapters: {
                        orderBy: {
                            order: "asc",
                        },
                    },
                },
            },
        },
    });

    if (!novel) {
        redirect("/dashboard/novels");
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "TRANSLATOR") {
        redirect("/dashboard/novels");
    }

    const genres = await getGenres();

    return (
        <div className="max-w-5xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Quản lý truyện</h1>
                <p className="text-gray-500 mt-2">Chỉnh sửa thông tin và quản lý các tập, chương của truyện.</p>
            </div>

            <Tabs defaultValue="info" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="info">Thông tin chung</TabsTrigger>
                    <TabsTrigger value="chapters">Danh sách chương</TabsTrigger>
                </TabsList>

                <TabsContent value="info">
                    <NovelForm initialData={novel} genres={genres} />
                </TabsContent>

                <TabsContent value="chapters">
                    <VolumeManager novelId={novel.id} volumes={novel.volumes} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
