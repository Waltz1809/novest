"use client";

import { useState, useEffect, useTransition } from "react";
import { Users, UserPlus, X, Search, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    getCollaboratorsAction,
    addCollaboratorAction,
    removeCollaboratorAction,
    searchUsersForCollaborator
} from "@/actions/collaborator";

interface User {
    id: string;
    name: string | null;
    nickname: string | null;
    username: string | null;
    image: string | null;
}

interface Collaborator {
    id: number;
    userId: string;
    addedAt: Date;
    user: User;
}

interface CollaboratorManagerProps {
    novelId: number;
    isOwner: boolean;
}

export function CollaboratorManager({ novelId, isOwner }: CollaboratorManagerProps) {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    // Add collaborator state
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Load collaborators
    useEffect(() => {
        async function load() {
            const result = await getCollaboratorsAction(novelId);
            if (result.collaborators) {
                setCollaborators(result.collaborators);
            }
            setIsLoading(false);
        }
        load();
    }, [novelId]);

    // Debounced search
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            const result = await searchUsersForCollaborator(novelId, searchQuery);
            setSearchResults(result.users || []);
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, novelId]);

    const handleAddCollaborator = async (user: User) => {
        if (!user.username) return;
        setError("");
        setSuccess("");

        startTransition(async () => {
            const result = await addCollaboratorAction(novelId, user.username!);
            if (result.error) {
                setError(result.error);
            } else {
                setSuccess(result.success || "Đã thêm phó thớt");
                setSearchQuery("");
                setSearchResults([]);
                setShowAddForm(false);
                // Refresh list
                const refreshed = await getCollaboratorsAction(novelId);
                setCollaborators(refreshed.collaborators || []);
            }
        });
    };

    const handleRemoveCollaborator = async (userId: string) => {
        if (!confirm("Xác nhận xóa phó thớt này?")) return;
        setError("");

        startTransition(async () => {
            const result = await removeCollaboratorAction(novelId, userId);
            if (result.error) {
                setError(result.error);
            } else {
                // Refresh list
                const refreshed = await getCollaboratorsAction(novelId);
                setCollaborators(refreshed.collaborators || []);
            }
        });
    };

    const displayName = (user: User) => user.nickname || user.name || user.username || "Unknown";

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Phó Thớt ({collaborators.length}/10)
                </h3>
                {isOwner && (
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        title="Thêm phó thớt"
                    >
                        <UserPlus className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Messages */}
            {error && (
                <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                    {error}
                </div>
            )}
            {success && (
                <div className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                    {success}
                </div>
            )}

            {/* Add Form */}
            {showAddForm && isOwner && (
                <div className="space-y-2">
                    <div className="relative flex items-center">
                        <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm theo username..."
                            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 outline-none"
                            disabled={isPending}
                        />
                        {isSearching && (
                            <Loader2 className="absolute right-3 w-4 h-4 text-primary animate-spin" />
                        )}
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 max-h-48 overflow-y-auto shadow-lg">
                            {searchResults.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => handleAddCollaborator(user)}
                                    disabled={isPending}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
                                >
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={user.image || ""} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                            {displayName(user)[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {displayName(user)}
                                        </p>
                                        {user.username && (
                                            <p className="text-xs text-muted-foreground">@{user.username}</p>
                                        )}
                                    </div>
                                    {isPending && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                                </button>
                            ))}
                        </div>
                    )}

                    {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                            Không tìm thấy người dùng
                        </p>
                    )}
                </div>
            )}

            {/* Collaborator List */}
            {collaborators.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                    Chưa có phó thớt nào
                </p>
            ) : (
                <div className="space-y-2">
                    {collaborators.map((collab) => (
                        <div
                            key={collab.id}
                            className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                        >
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={collab.user.image || ""} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {displayName(collab.user)[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                    {displayName(collab.user)}
                                </p>
                                {collab.user.username && (
                                    <p className="text-xs text-muted-foreground">@{collab.user.username}</p>
                                )}
                            </div>
                            {isOwner && (
                                <button
                                    onClick={() => handleRemoveCollaborator(collab.userId)}
                                    disabled={isPending}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                                    title="Xóa phó thớt"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
