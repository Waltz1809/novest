"use client";

import { useState, useTransition } from "react";
import { Users, ChevronDown } from "lucide-react";
import { setNovelGroup } from "@/actions/translation-group";
import { useRouter } from "next/navigation";

interface Group {
    id: string;
    name: string;
}

interface GroupSelectorProps {
    novelId: number;
    currentGroupId: string | null;
    groups: Group[];
}

export default function GroupSelector({ novelId, currentGroupId, groups }: GroupSelectorProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(currentGroupId);

    const selectedGroup = groups.find(g => g.id === selectedGroupId);
    const displayName = selectedGroup?.name || "Novest Official (Mặc định)";

    const handleSelect = (groupId: string | null) => {
        setSelectedGroupId(groupId);
        setIsOpen(false);

        startTransition(async () => {
            const result = await setNovelGroup(novelId, groupId);
            if (result.success) {
                router.refresh();
            } else {
                alert(result.error || "Có lỗi xảy ra");
                setSelectedGroupId(currentGroupId); // Revert on error
            }
        });
    };

    return (
        <div className="relative">
            <label className="text-xs text-[#9CA3AF] uppercase mb-2 block tracking-wide">
                Nhóm dịch
            </label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={isPending}
                className="w-full px-4 py-3 rounded-lg bg-[#0f172a] border border-white/10 text-left flex items-center justify-between hover:border-amber-500/30 transition-colors disabled:opacity-50"
            >
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span className="text-gray-100">{isPending ? "Đang lưu..." : displayName}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-[#1E293B] border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {/* Default option */}
                    <button
                        type="button"
                        onClick={() => handleSelect(null)}
                        className={`w-full px-4 py-3 text-left hover:bg-amber-500/10 transition-colors flex items-center gap-2 ${selectedGroupId === null ? 'bg-amber-500/20 text-amber-400' : 'text-gray-300'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        Novest Official (Mặc định)
                    </button>

                    {/* User's groups */}
                    {groups.map(group => (
                        <button
                            key={group.id}
                            type="button"
                            onClick={() => handleSelect(group.id)}
                            className={`w-full px-4 py-3 text-left hover:bg-amber-500/10 transition-colors flex items-center gap-2 ${selectedGroupId === group.id ? 'bg-amber-500/20 text-amber-400' : 'text-gray-300'
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            {group.name}
                        </button>
                    ))}

                    {groups.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500">
                            Bạn chưa có nhóm dịch nào. Tạo nhóm tại Studio → Nhóm dịch.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
