import { getUsers, deleteUser, banUser, updateUserRole } from "@/actions/admin";
import { DataTable } from "@/components/admin/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, MoreVertical, Shield, Ban } from "lucide-react";
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

export default async function UsersPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; search?: string }>;
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const search = params.search || "";
    const { users, metadata, error } = await getUsers({ page, search });

    if (error || !users) {
        return <div className="text-red-500">Failed to load users</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white font-family-name:var(--font-be-vietnam-pro)">Users</h1>
                <p className="text-gray-400 font-family-name:var(--font-be-vietnam-pro)">Manage user accounts and permissions.</p>
            </div>

            <DataTable
                columns={[
                    { header: "User" },
                    { header: "Role" },
                    { header: "Stats" },
                    { header: "Joined" },
                    { header: "Actions", className: "text-right" },
                ]}
                metadata={metadata}
            >
                {users.map((user) => (
                    <tr key={user.id} className="group transition-colors hover:bg-white/2">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border border-white/10">
                                    <AvatarImage src={user.image || ""} />
                                    <AvatarFallback className="bg-amber-500/10 text-amber-500">
                                        {user.name?.[0] || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium text-white font-family-name:var(--font-be-vietnam-pro)">{user.name || "Unknown"}</div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                    {user.username && (
                                        <div className="text-xs text-gray-600">@{user.username}</div>
                                    )}
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <Badge
                                variant="outline"
                                className={
                                    user.role === "ADMIN"
                                        ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
                                        : user.role === "TRANSLATOR"
                                            ? "border-blue-500/20 bg-blue-500/10 text-blue-500"
                                            : "border-white/10 bg-white/5 text-gray-400"
                                }
                            >
                                {user.role}
                            </Badge>
                            {user.isBanned && (
                                <Badge variant="destructive" className="ml-2">BANNED</Badge>
                            )}
                        </td>
                        <td className="px-6 py-4">
                            <div className="text-sm text-gray-400 font-family-name:var(--font-be-vietnam-pro)">
                                {user._count.comments} comments
                            </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-family-name:var(--font-be-vietnam-pro)">
                            {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white" suppressHydrationWarning>
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#1E293B] border-white/10 text-gray-200">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-white/10" />

                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger className="hover:bg-white/5 focus:bg-white/5 cursor-pointer">
                                            <Shield className="mr-2 h-4 w-4" />
                                            <span>Change Role</span>
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent className="bg-[#1E293B] border-white/10 text-gray-200">
                                            {["READER", "TRANSLATOR", "ADMIN"].map((role) => (
                                                <form
                                                    key={role}
                                                    action={async () => {
                                                        "use server";
                                                        await updateUserRole(user.id, role);
                                                    }}
                                                >
                                                    <DropdownMenuItem asChild>
                                                        <button className="w-full cursor-pointer hover:bg-white/5 focus:bg-white/5 flex items-center px-2 py-1.5 text-sm outline-none">
                                                            {role}
                                                        </button>
                                                    </DropdownMenuItem>
                                                </form>
                                            ))}
                                        </DropdownMenuSubContent>
                                    </DropdownMenuSub>

                                    <form action={async () => {
                                        "use server";
                                        await banUser(user.id, "Admin Action");
                                    }}>
                                        <DropdownMenuItem asChild>
                                            <button className="w-full flex items-center text-red-500 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer px-2 py-1.5 text-sm outline-none">
                                                <Ban className="mr-2 h-4 w-4" />
                                                <span>Ban User</span>
                                            </button>
                                        </DropdownMenuItem>
                                    </form>

                                    <form action={async () => {
                                        "use server";
                                        await deleteUser(user.id);
                                    }}>
                                        <DropdownMenuItem asChild>
                                            <button className="w-full flex items-center text-red-500 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer px-2 py-1.5 text-sm outline-none">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>Delete User</span>
                                            </button>
                                        </DropdownMenuItem>
                                    </form>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </td>
                    </tr>
                ))}
            </DataTable>
        </div>
    );
}
