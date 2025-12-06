"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/actions/user";
import ImageUpload from "@/components/novel/image-upload";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SettingsPage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [nickname, setNickname] = useState("");
    const [image, setImage] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }

        if (session?.user) {
            setNickname(session.user.nickname || "");
            setImage(session.user.image || "");
        }
    }, [session, status, router]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        const result = await updateProfile({ nickname, image });

        if (result.error) {
            setError(result.error);
            setIsLoading(false);
        } else if (result.success) {
            setSuccess(result.success);
            setIsLoading(false);
            // Update the session to reflect changes
            await update();
        }
    }

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/studio"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold">Profile Settings</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your account settings and preferences
                    </p>
                </div>

                {/* Settings Form */}
                <div className="bg-card border border-border rounded-lg shadow-sm p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-500/10 border border-green-500 text-green-700 dark:text-green-400 px-4 py-3 rounded-md text-sm">
                                {success}
                            </div>
                        )}

                        {/* Current User Info */}
                        <div className="pb-6 border-b border-border">
                            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
                            <div className="grid gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Name:</span>{" "}
                                    <span className="font-medium">{session.user.name}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Email:</span>{" "}
                                    <span className="font-medium">{session.user.email}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Role:</span>{" "}
                                    <span className="font-medium capitalize">{session.user.role.toLowerCase()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Profile Picture */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">
                                Profile Picture
                            </label>
                            <ImageUpload
                                value={image}
                                onChange={setImage}
                                disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground">
                                Upload a profile picture (max 4MB)
                            </p>
                        </div>

                        {/* Nickname */}
                        <div className="space-y-2">
                            <label htmlFor="nickname" className="block text-sm font-medium">
                                Nickname (Display Name)
                            </label>
                            <input
                                id="nickname"
                                name="nickname"
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                disabled={isLoading}
                                className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                                placeholder="Enter your display name"
                            />
                            <p className="text-xs text-muted-foreground">
                                If not set, your name will be displayed instead
                            </p>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-primary text-primary-foreground py-2 px-6 rounded-md font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setNickname(session.user.nickname || "");
                                    setImage(session.user.image || "");
                                }}
                                disabled={isLoading}
                                className="border border-input py-2 px-6 rounded-md font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
