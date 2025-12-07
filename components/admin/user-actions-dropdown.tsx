"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MoreVertical, Shield, Ban, UserCheck, Loader2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { banUser, unbanUser, updateUserRole } from "@/actions/admin";

// Role display names in Vietnamese
const ROLE_LABELS: Record<string, string> = {
    ADMIN: "Quản trị viên",
    MODERATOR: "Điều hành viên",
    READER: "Độc giả",
};

interface User {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    username: string | null;
    role: string;
    isBanned: boolean;
    createdAt: Date;
    _count: {
        comments: number;
    };
}

interface UserActionsDropdownProps {
    user: User;
}

export function UserActionsDropdown({ user }: UserActionsDropdownProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    const handleRoleChange = (role: string) => {
        startTransition(async () => {
            const result = await updateUserRole(user.id, role);
            if (result.success) {
                console.log("✅", result.success);
                alert(result.success); // Simple feedback for now
            } else if (result.error) {
                console.error("❌", result.error);
                alert(result.error);
            }
            setOpen(false);
            router.refresh();
        });
    };

    const handleBan = () => {
        startTransition(async () => {
            const result = await banUser(user.id, "Vi phạm quy định");
            if (result.success) {
                console.log("✅", result.success);
            } else if (result.error) {
                console.error("❌", result.error);
                alert(result.error);
            }
            setOpen(false);
            router.refresh();
        });
    };

    const handleUnban = () => {
        startTransition(async () => {
            const result = await unbanUser(user.id);
            if (result.success) {
                console.log("✅", result.success);
            } else if (result.error) {
                console.error("❌", result.error);
                alert(result.error);
            }
            setOpen(false);
            router.refresh();
        });
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white" disabled={isPending}>
                    {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <MoreVertical className="h-4 w-4" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1E293B] border-white/10 text-gray-200">
                <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="hover:bg-white/5 focus:bg-white/5 cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Đổi vai trò</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-[#1E293B] border-white/10 text-gray-200">
                        {/* Note: ADMIN can only be assigned via database directly */}
                        {(["READER", "MODERATOR"] as const).map((role) => (
                            <DropdownMenuItem
                                key={role}
                                onClick={() => handleRoleChange(role)}
                                className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
                                disabled={isPending || user.role === role}
                            >
                                {ROLE_LABELS[role]}
                                {user.role === role && " ✓"}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                {user.isBanned ? (
                    <DropdownMenuItem
                        onClick={handleUnban}
                        className="text-green-500 hover:bg-green-500/10 focus:bg-green-500/10 cursor-pointer"
                        disabled={isPending}
                    >
                        <UserCheck className="mr-2 h-4 w-4" />
                        <span>Bỏ cấm</span>
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem
                        onClick={handleBan}
                        className="text-red-500 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer"
                        disabled={isPending}
                    >
                        <Ban className="mr-2 h-4 w-4" />
                        <span>Cấm người dùng</span>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
