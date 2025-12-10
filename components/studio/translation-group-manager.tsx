"use client";

import { useState, useTransition } from "react";
import { Users, Plus, Crown, Shield, User, X, Search, UserPlus, Trash2 } from "lucide-react";
import { createTranslationGroup, addGroupMember, removeGroupMember, searchUsersForGroup } from "@/actions/translation-group";
import { useRouter } from "next/navigation";

interface GroupMember {
    userId: string;
    role: string;
    user: {
        id: string;
        name: string | null;
        nickname: string | null;
        image: string | null;
    };
}

interface TranslationGroup {
    id: string;
    name: string;
    myRole: string;
    members: GroupMember[];
    _count?: {
        novels: number;
    };
}

interface Props {
    groups: TranslationGroup[];
}

export default function TranslationGroupManager({ groups: initialGroups }: Props) {
    const router = useRouter();
    const [groups, setGroups] = useState(initialGroups);
    const [isPending, startTransition] = useTransition();

    // Create group modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");

    // Manage members modal
    const [managingGroup, setManagingGroup] = useState<TranslationGroup | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "OWNER": return <Crown className="w-4 h-4 text-amber-400" />;
            case "ADMIN": return <Shield className="w-4 h-4 text-blue-400" />;
            default: return <User className="w-4 h-4 text-gray-400" />;
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;

        startTransition(async () => {
            const result = await createTranslationGroup(newGroupName.trim());
            if (result.success) {
                setShowCreateModal(false);
                setNewGroupName("");
                router.refresh();
            } else {
                alert(result.error || "Có lỗi xảy ra");
            }
        });
    };

    const handleSearchUsers = async () => {
        if (!searchQuery.trim() || !managingGroup) return;

        setIsSearching(true);
        const results = await searchUsersForGroup(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
    };

    const handleAddMember = async (userId: string) => {
        if (!managingGroup) return;

        startTransition(async () => {
            const result = await addGroupMember(managingGroup.id, userId);
            if (result.success) {
                router.refresh();
                setSearchResults([]);
                setSearchQuery("");
            } else {
                alert(result.error || "Có lỗi xảy ra");
            }
        });
    };

    const handleRemoveMember = async (userId: string) => {
        if (!managingGroup) return;

        if (!confirm("Xác nhận xóa thành viên này?")) return;

        startTransition(async () => {
            const result = await removeGroupMember(managingGroup.id, userId);
            if (result.success) {
                router.refresh();
            } else {
                alert(result.error || "Có lỗi xảy ra");
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Users className="w-7 h-7 text-amber-500" />
                        Nhóm dịch của tôi
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Quản lý các nhóm dịch bạn tham gia
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-[#0B0C10] font-bold rounded-lg hover:bg-[#FBBF24] transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Tạo nhóm mới
                </button>
            </div>

            <div className="bg-[#0B0C10] rounded-xl border border-white/10 p-4">
                <p className="text-gray-400 text-sm">
                    <strong className="text-amber-400">💡 Mặc định:</strong> Truyện không thuộc nhóm nào sẽ hiển thị là "Novest Official"
                </p>
            </div>

            {groups.length === 0 ? (
                <div className="bg-[#1E293B] rounded-xl border border-white/10 p-8 text-center">
                    <Users className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                    <h3 className="text-white font-medium mb-2">Bạn chưa tham gia nhóm dịch nào</h3>
                    <p className="text-gray-400 text-sm mb-4">
                        Tạo nhóm mới hoặc được mời vào nhóm để bắt đầu
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-[#0B0C10] font-bold rounded-lg hover:bg-[#FBBF24] transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Tạo nhóm đầu tiên
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {groups.map((group) => (
                        <div
                            key={group.id}
                            className="bg-[#1E293B] rounded-xl border border-white/10 p-6 hover:border-amber-500/30 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                                        <Users className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold">{group.name}</h3>
                                        <p className="text-sm text-gray-400">
                                            {group.members?.length || 0} thành viên • {group._count?.novels || 0} truyện
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        {getRoleIcon(group.myRole)}
                                        <span className="text-sm text-gray-400">{group.myRole}</span>
                                    </div>
                                    {(group.myRole === "OWNER" || group.myRole === "ADMIN") && (
                                        <button
                                            onClick={() => setManagingGroup(group)}
                                            className="px-3 py-1.5 text-sm bg-[#0B0C10] text-amber-400 rounded-lg hover:bg-amber-500/10 transition-colors"
                                        >
                                            Quản lý
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Members Preview */}
                            <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
                                {group.members?.slice(0, 5).map((member) => (
                                    <div
                                        key={member.userId}
                                        className="flex items-center gap-1 px-2 py-1 bg-[#0B0C10] rounded text-sm"
                                    >
                                        {getRoleIcon(member.role)}
                                        <span className="text-gray-300">
                                            {member.user?.nickname || member.user?.name || "Unknown"}
                                        </span>
                                    </div>
                                ))}
                                {(group.members?.length || 0) > 5 && (
                                    <span className="text-gray-400 text-sm px-2 py-1">
                                        +{group.members.length - 5} khác
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1E293B] rounded-xl w-full max-w-md p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Tạo nhóm dịch mới</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Tên nhóm dịch..."
                            className="w-full px-4 py-3 rounded-lg bg-[#0B0C10] border border-white/10 text-gray-100 placeholder:text-gray-500 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 outline-none mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreateGroup}
                                disabled={isPending || !newGroupName.trim()}
                                className="flex-1 px-4 py-2 bg-[#F59E0B] text-[#0B0C10] font-bold rounded-lg disabled:opacity-50 hover:bg-[#FBBF24] transition-all"
                            >
                                {isPending ? "Đang tạo..." : "Tạo nhóm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Members Modal */}
            {managingGroup && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1E293B] rounded-xl w-full max-w-lg p-6 border border-white/10 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Quản lý: {managingGroup.name}</h2>
                            <button
                                onClick={() => {
                                    setManagingGroup(null);
                                    setSearchQuery("");
                                    setSearchResults([]);
                                }}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Add Member */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-400 mb-2">Thêm thành viên</h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm user theo tên hoặc username..."
                                    className="flex-1 px-4 py-2 rounded-lg bg-[#0B0C10] border border-white/10 text-gray-100 placeholder:text-gray-500 focus:border-[#F59E0B] outline-none"
                                    onKeyDown={(e) => e.key === "Enter" && handleSearchUsers()}
                                />
                                <button
                                    onClick={handleSearchUsers}
                                    disabled={isSearching}
                                    className="px-4 py-2 bg-[#0B0C10] text-amber-400 rounded-lg hover:bg-amber-500/10 transition-colors"
                                >
                                    <Search className="w-5 h-5" />
                                </button>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="mt-2 space-y-2">
                                    {searchResults.map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center justify-between px-3 py-2 bg-[#0B0C10] rounded-lg"
                                        >
                                            <span className="text-gray-300">
                                                {user.nickname || user.name} (@{user.username})
                                            </span>
                                            <button
                                                onClick={() => handleAddMember(user.id)}
                                                className="text-emerald-400 hover:text-emerald-300"
                                            >
                                                <UserPlus className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Current Members */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-400 mb-2">Thành viên hiện tại</h3>
                            <div className="space-y-2">
                                {managingGroup.members?.map((member) => (
                                    <div
                                        key={member.userId}
                                        className="flex items-center justify-between px-3 py-2 bg-[#0B0C10] rounded-lg"
                                    >
                                        <div className="flex items-center gap-2">
                                            {getRoleIcon(member.role)}
                                            <span className="text-gray-300">
                                                {member.user?.nickname || member.user?.name}
                                            </span>
                                            <span className="text-xs text-gray-500">({member.role})</span>
                                        </div>
                                        {member.role !== "OWNER" && managingGroup.myRole === "OWNER" && (
                                            <button
                                                onClick={() => handleRemoveMember(member.userId)}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
