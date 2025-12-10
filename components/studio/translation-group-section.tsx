"use client";

import { useState, useEffect, useTransition } from "react";
import { Users, Plus, X, Crown, Shield, User, ChevronDown, Search, Loader2 } from "lucide-react";
import {
    getMyGroups,
    createTranslationGroup,
    setNovelGroup,
    addGroupMember,
    removeGroupMember,
    searchUsersForGroup,
} from "@/actions/translation-group";

interface TranslationGroupSectionProps {
    novelId: number;
    currentGroupId: string | null;
    isUploader: boolean;
}

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

interface Group {
    id: string;
    name: string;
    myRole: string;
    members: GroupMember[];
    _count: { novels: number };
}

export default function TranslationGroupSection({
    novelId,
    currentGroupId,
    isUploader,
}: TranslationGroupSectionProps) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(currentGroupId);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        loadGroups();
    }, []);

    async function loadGroups() {
        const result = await getMyGroups();
        setGroups(result as Group[]);
    }

    async function handleCreateGroup() {
        if (!newGroupName.trim()) return;

        startTransition(async () => {
            const result = await createTranslationGroup(newGroupName);
            if (result.error) {
                setMessage({ type: "error", text: result.error });
            } else {
                setMessage({ type: "success", text: "Đã tạo nhóm dịch thành công!" });
                setNewGroupName("");
                setShowCreateModal(false);
                await loadGroups();
            }
        });
    }

    async function handleGroupChange(groupId: string | null) {
        if (!isUploader) return;

        startTransition(async () => {
            const result = await setNovelGroup(novelId, groupId);
            if (result.error) {
                setMessage({ type: "error", text: result.error });
            } else {
                setSelectedGroupId(groupId);
                setMessage({ type: "success", text: "Đã cập nhật nhóm dịch!" });
            }
        });
    }

    async function handleSearchUsers(query: string) {
        setSearchQuery(query);
        if (query.length >= 2) {
            const results = await searchUsersForGroup(query);
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    }

    async function handleAddMember(userId: string) {
        if (!selectedGroupId) return;

        startTransition(async () => {
            const result = await addGroupMember(selectedGroupId, userId);
            if (result.error) {
                setMessage({ type: "error", text: result.error });
            } else {
                setMessage({ type: "success", text: "Đã thêm thành viên!" });
                setSearchQuery("");
                setSearchResults([]);
                await loadGroups();
            }
        });
    }

    async function handleRemoveMember(userId: string) {
        if (!selectedGroupId) return;

        startTransition(async () => {
            const result = await removeGroupMember(selectedGroupId, userId);
            if (result.error) {
                setMessage({ type: "error", text: result.error });
            } else {
                setMessage({ type: "success", text: "Đã xóa thành viên!" });
                await loadGroups();
            }
        });
    }

    const selectedGroup = groups.find(g => g.id === selectedGroupId);
    const canManageMembers = selectedGroup && (selectedGroup.myRole === "OWNER" || selectedGroup.myRole === "ADMIN");

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "OWNER": return <Crown className="w-4 h-4 text-amber-400" />;
            case "ADMIN": return <Shield className="w-4 h-4 text-blue-400" />;
            default: return <User className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <div className="p-4 bg-[#1E293B] rounded-lg border border-white/10">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-500" />
                    Nhóm dịch
                </h3>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded hover:bg-amber-500/30 transition-colors flex items-center gap-1"
                >
                    <Plus className="w-3 h-3" />
                    Tạo nhóm
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`mb-4 p-2 rounded text-sm ${message.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {message.text}
                </div>
            )}

            {/* Group Selector */}
            {isUploader && (
                <div className="mb-4">
                    <label className="text-sm text-gray-400 mb-1 block">Gán nhóm dịch cho truyện</label>
                    <select
                        value={selectedGroupId || ""}
                        onChange={(e) => handleGroupChange(e.target.value || null)}
                        disabled={isPending}
                        className="w-full px-3 py-2 bg-[#0B0C10] border border-white/10 rounded-lg text-white focus:border-amber-500 outline-none"
                    >
                        <option value="">Không có nhóm</option>
                        {groups.map((group) => (
                            <option key={group.id} value={group.id}>
                                {group.name} ({group.members.length} thành viên)
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Selected Group Info */}
            {selectedGroup && (
                <div className="p-3 bg-[#0B0C10] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{selectedGroup.name}</span>
                        {canManageMembers && (
                            <button
                                onClick={() => setShowMembersModal(true)}
                                className="text-xs text-amber-400 hover:underline"
                            >
                                Quản lý thành viên
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {selectedGroup.members.slice(0, 5).map((member) => (
                            <div
                                key={member.userId}
                                className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-sm"
                            >
                                {getRoleIcon(member.role)}
                                <span className="text-gray-300">
                                    {member.user.nickname || member.user.name || "Unknown"}
                                </span>
                            </div>
                        ))}
                        {selectedGroup.members.length > 5 && (
                            <span className="text-gray-400 text-sm">+{selectedGroup.members.length - 5} khác</span>
                        )}
                    </div>
                </div>
            )}

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70" onClick={() => setShowCreateModal(false)} />
                    <div className="relative bg-[#1E293B] rounded-xl border border-white/10 p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-amber-500" />
                            Tạo nhóm dịch mới
                        </h3>
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Tên nhóm dịch..."
                            className="w-full px-4 py-2 bg-[#0B0C10] border border-white/10 rounded-lg text-white mb-4 focus:border-amber-500 outline-none"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreateGroup}
                                disabled={isPending || !newGroupName.trim()}
                                className="flex-1 px-4 py-2 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                Tạo nhóm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Members Management Modal */}
            {showMembersModal && selectedGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70" onClick={() => setShowMembersModal(false)} />
                    <div className="relative bg-[#1E293B] rounded-xl border border-white/10 p-6 w-full max-w-md max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">Quản lý thành viên</h3>
                            <button onClick={() => setShowMembersModal(false)}>
                                <X className="w-5 h-5 text-gray-400 hover:text-white" />
                            </button>
                        </div>

                        {/* Add Member Search */}
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => handleSearchUsers(e.target.value)}
                                    placeholder="Tìm người dùng..."
                                    className="w-full pl-10 pr-4 py-2 bg-[#0B0C10] border border-white/10 rounded-lg text-white focus:border-amber-500 outline-none"
                                />
                            </div>
                            {searchResults.length > 0 && (
                                <div className="mt-2 bg-[#0B0C10] rounded-lg border border-white/10 max-h-40 overflow-y-auto">
                                    {searchResults.map((user) => (
                                        <button
                                            key={user.id}
                                            onClick={() => handleAddMember(user.id)}
                                            disabled={isPending}
                                            className="w-full px-3 py-2 hover:bg-white/5 flex items-center justify-between text-left"
                                        >
                                            <span className="text-white">{user.nickname || user.name}</span>
                                            <Plus className="w-4 h-4 text-amber-400" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Current Members */}
                        <div className="flex-1 overflow-y-auto space-y-2">
                            {selectedGroup.members.map((member) => (
                                <div
                                    key={member.userId}
                                    className="flex items-center justify-between p-3 bg-[#0B0C10] rounded-lg"
                                >
                                    <div className="flex items-center gap-2">
                                        {getRoleIcon(member.role)}
                                        <span className="text-white">
                                            {member.user.nickname || member.user.name || "Unknown"}
                                        </span>
                                        <span className="text-xs text-gray-500">{member.role}</span>
                                    </div>
                                    {member.role !== "OWNER" && canManageMembers && (
                                        <button
                                            onClick={() => handleRemoveMember(member.userId)}
                                            disabled={isPending}
                                            className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
