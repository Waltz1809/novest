import { db } from "@/lib/db";
import { Users2, Calendar, BookOpen, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface GroupMember {
    groupId: string;
    userId: string;
    role: string;
    user: {
        id: string;
        name: string | null;
        nickname: string | null;
        image: string | null;
    };
}

interface GroupNovel {
    id: number;
    title: string;
    slug: string;
    coverImage: string | null;
}

export default async function AdminGroupsPage() {
    const groups = await db.translationGroup.findMany({
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            nickname: true,
                            image: true,
                        },
                    },
                },
            },
            novels: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    coverImage: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Users2 className="w-8 h-8 text-amber-500" />
                    Quản lý nhóm dịch
                </h1>
                <p className="text-gray-400 mt-1">
                    Xem và quản lý tất cả các nhóm dịch trên hệ thống.
                </p>
            </div>

            <div className="text-sm text-gray-400">
                Tổng cộng: <span className="text-amber-500 font-bold">{groups.length}</span> nhóm dịch
            </div>

            {groups.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    Chưa có nhóm dịch nào được tạo.
                </div>
            ) : (
                <div className="grid gap-4">
                    {groups.map((group) => {
                        // Find owner (role = OWNER)
                        const owner = group.members.find((m: GroupMember) => m.role === "OWNER");
                        const otherMembers = group.members.filter((m: GroupMember) => m.role !== "OWNER");
                        const novels = group.novels as GroupNovel[];

                        return (
                            <div
                                key={group.id}
                                className="bg-slate-900/50 rounded-xl border border-white/5 p-6 hover:border-amber-500/30 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-white">
                                                {group.name}
                                            </h3>
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-400">
                                                {group.members.length} thành viên
                                            </span>
                                        </div>

                                        {/* Owner */}
                                        {owner && (
                                            <div className="flex items-center gap-2 mb-3">
                                                <User className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm text-gray-500">Trưởng nhóm:</span>
                                                <div className="flex items-center gap-2">
                                                    {owner.user.image ? (
                                                        <Image
                                                            src={owner.user.image}
                                                            alt={owner.user.name || ""}
                                                            width={20}
                                                            height={20}
                                                            className="rounded-full"
                                                        />
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs text-gray-400">
                                                            {(owner.user.nickname || owner.user.name || "?").charAt(0)}
                                                        </div>
                                                    )}
                                                    <span className="text-sm text-white">
                                                        {owner.user.nickname || owner.user.name}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Created date */}
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Calendar className="w-3 h-3" />
                                            Tạo ngày {new Date(group.createdAt).toLocaleDateString("vi-VN")}
                                        </div>
                                    </div>

                                    {/* Novels */}
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <BookOpen className="w-4 h-4" />
                                            {novels.length} truyện
                                        </div>
                                        {novels.length > 0 && (
                                            <div className="flex -space-x-2">
                                                {novels.slice(0, 5).map((novel) => (
                                                    <Link
                                                        key={novel.id}
                                                        href={`/truyen/${novel.slug}`}
                                                        title={novel.title}
                                                        className="relative"
                                                    >
                                                        {novel.coverImage ? (
                                                            <Image
                                                                src={novel.coverImage}
                                                                alt={novel.title}
                                                                width={32}
                                                                height={40}
                                                                className="rounded border border-slate-700 hover:border-amber-500 transition-colors"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-10 rounded border border-slate-700 bg-slate-800 flex items-center justify-center text-xs text-gray-500">
                                                                ?
                                                            </div>
                                                        )}
                                                    </Link>
                                                ))}
                                                {novels.length > 5 && (
                                                    <div className="w-8 h-10 rounded border border-slate-700 bg-slate-800 flex items-center justify-center text-xs text-gray-400">
                                                        +{novels.length - 5}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Other Members */}
                                {otherMembers.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-white/5">
                                        <div className="text-xs text-gray-500 mb-2">Thành viên khác:</div>
                                        <div className="flex flex-wrap gap-2">
                                            {otherMembers.map((member: GroupMember) => (
                                                <div
                                                    key={member.userId}
                                                    className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 rounded-full"
                                                >
                                                    {member.user.image ? (
                                                        <Image
                                                            src={member.user.image}
                                                            alt={member.user.name || ""}
                                                            width={16}
                                                            height={16}
                                                            className="rounded-full"
                                                        />
                                                    ) : (
                                                        <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-gray-400">
                                                            {(member.user.nickname || member.user.name || "?").charAt(0)}
                                                        </div>
                                                    )}
                                                    <span className="text-xs text-gray-300">
                                                        {member.user.nickname || member.user.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
