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
            <label className="text-xs text-muted-foreground uppercase mb-2 block tracking-wide">
                Nhóm dịch
            </label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={isPending}
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-left flex items-center justify-between hover:border-primary/30 transition-colors disabled:opacity-50"
            >
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-foreground">{isPending ? "Đang lưu..." : displayName}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {/* Default option */}
                    <button
                        type="button"
                        onClick={() => handleSelect(null)}
                        className={`w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors flex items-center gap-2 ${selectedGroupId === null ? 'bg-primary/10 text-primary' : 'text-foreground'
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
                            className={`w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors flex items-center gap-2 ${selectedGroupId === group.id ? 'bg-primary/10 text-primary' : 'text-foreground'
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            {group.name}
                        </button>
                    ))}

                    {groups.length === 0 && (
                        <div className="px-4 py-3 text-sm text-muted-foreground">
                            Bạn chưa có nhóm dịch nào. Tạo nhóm tại Studio → Nhóm dịch.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
