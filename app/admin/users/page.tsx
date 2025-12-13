import { getUsers } from "@/actions/admin";
import { DataTable } from "@/components/admin/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserActionsDropdown } from "@/components/admin/user-actions-dropdown";

// Role display names in Vietnamese
const ROLE_LABELS: Record<string, string> = {
    ADMIN: "Quản trị viên",
    MODERATOR: "Điều hành viên",
    READER: "Độc giả",
};

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
        return <div className="text-red-500">Không thể tải danh sách người dùng</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground font-family-name:var(--font-be-vietnam-pro)">Người dùng</h1>
                <p className="text-muted-foreground font-family-name:var(--font-be-vietnam-pro)">Quản lý tài khoản và quyền hạn người dùng.</p>
            </div>

            <DataTable
                columns={[
                    { header: "Người dùng" },
                    { header: "Vai trò" },
                    { header: "Thống kê" },
                    { header: "Ngày tham gia" },
                    { header: "Hành động", className: "text-right" },
                ]}
                metadata={metadata}
            >
                {users.map((user) => (
                    <tr key={user.id} className="group transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border border-gray-200">
                                    <AvatarImage src={user.image || ""} />
                                    <AvatarFallback className="bg-emerald-100 text-emerald-600">
                                        {user.name?.[0] || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium text-foreground font-family-name:var(--font-be-vietnam-pro)">{user.name || "Không tên"}</div>
                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                    {user.username && (
                                        <div className="text-xs text-muted-foreground">@{user.username}</div>
                                    )}
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <Badge
                                variant="outline"
                                className={
                                    user.role === "ADMIN"
                                        ? "border-amber-200 bg-amber-100 text-amber-700"
                                        : user.role === "MODERATOR"
                                            ? "border-blue-200 bg-blue-100 text-blue-700"
                                            : "border-gray-200 bg-gray-100 text-gray-600"
                                }
                            >
                                {ROLE_LABELS[user.role] || user.role}
                            </Badge>
                            {user.isBanned && (
                                <Badge variant="destructive" className="ml-2">ĐÃ CẤM</Badge>
                            )}
                        </td>
                        <td className="px-6 py-4">
                            <div className="text-sm text-muted-foreground font-family-name:var(--font-be-vietnam-pro)">
                                {user._count.comments} bình luận
                            </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground font-family-name:var(--font-be-vietnam-pro)">
                            {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <UserActionsDropdown user={user} />
                        </td>
                    </tr>
                ))}
            </DataTable>
        </div>
    );
}
