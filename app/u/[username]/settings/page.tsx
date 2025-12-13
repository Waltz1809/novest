"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { updateProfile, checkUsernameAvailability, getUserBirthday, getUsernameStatus } from "@/actions/user";
import { getUserPreferences, saveUserPreferences, getAllGenres } from "@/actions/recommendation";
import ImageUpload from "@/components/novel/image-upload";
import Link from "next/link";
import { ArrowLeft, Save, User, AtSign, Loader2, CheckCircle2, XCircle, Sparkles, Globe, BookOpen } from "lucide-react";
import { clsx } from "clsx";

export default function SettingsPage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [nickname, setNickname] = useState("");
    const [username, setUsername] = useState("");
    const [image, setImage] = useState("");

    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [usernameMessage, setUsernameMessage] = useState("");
    const [showWelcome, setShowWelcome] = useState(false);
    const [isUsernameLocked, setIsUsernameLocked] = useState(false);
    const [initialUsername, setInitialUsername] = useState<string>(""); // Real username from DB

    // Birthday state
    const [birthDay, setBirthDay] = useState<string>("");
    const [birthMonth, setBirthMonth] = useState<string>("");
    const [birthYear, setBirthYear] = useState<string>("");
    const [isBirthdayLocked, setIsBirthdayLocked] = useState(false);
    const [savedBirthday, setSavedBirthday] = useState<Date | null>(null);

    // Recommendation preferences state
    const [selectedNations, setSelectedNations] = useState<string[]>([]);
    const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
    const [allGenres, setAllGenres] = useState<{ id: number; name: string; slug: string }[]>([]);
    const [loadingPreferences, setLoadingPreferences] = useState(false);
    const [preferencesSaved, setPreferencesSaved] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }

        if (session?.user) {
            setNickname(session.user.nickname || "");
            setImage(session.user.image || "");

            // Fetch REAL username and lock status from DB (bypasses stale session)
            getUsernameStatus().then((data) => {
                if (data) {
                    setUsername(data.username);
                    setInitialUsername(data.username); // Save the real DB username
                    setIsUsernameLocked(data.isLocked);
                } else {
                    // Fallback to session if server action fails
                    setUsername(session.user.username || "");
                    setInitialUsername(session.user.username || "");
                }
            });

            // Fetch birthday to check if locked
            getUserBirthday().then((birthday) => {
                if (birthday) {
                    setIsBirthdayLocked(true);
                    setSavedBirthday(birthday);
                    // Pre-fill the values
                    const bd = new Date(birthday);
                    setBirthDay(String(bd.getDate()).padStart(2, '0'));
                    setBirthMonth(String(bd.getMonth() + 1).padStart(2, '0'));
                    setBirthYear(String(bd.getFullYear()));
                }
            });

            // Fetch recommendation preferences
            setLoadingPreferences(true);
            Promise.all([getUserPreferences(), getAllGenres()]).then(([prefs, genresRes]) => {
                if (prefs) {
                    setSelectedNations(prefs.nations);
                    setSelectedGenres(prefs.genreIds);
                }
                setAllGenres(genresRes.genres);
                setLoadingPreferences(false);
            });
        }

        // Check for welcome param
        const params = new URLSearchParams(window.location.search);
        if (params.get("welcome") === "true") {
            setShowWelcome(true);
        }
    }, [session, status, router]);

    // Debounce username check (compare against initialUsername from DB, not stale session)
    useEffect(() => {
        const checkUsername = async () => {
            // Use initialUsername (from DB) instead of session.user.username to avoid stale data
            if (!username || !initialUsername || username === initialUsername) {
                setUsernameAvailable(null);
                setUsernameMessage("");
                return;
            }

            if (username.length < 3) {
                setUsernameAvailable(false);
                setUsernameMessage("Username must be at least 3 characters");
                return;
            }

            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                setUsernameAvailable(false);
                setUsernameMessage("Only letters, numbers, and underscores allowed");
                return;
            }

            setIsCheckingUsername(true);
            const isAvailable = await checkUsernameAvailability(username);
            setIsCheckingUsername(false);
            setUsernameAvailable(isAvailable);
            setUsernameMessage(isAvailable ? "Username is available" : "Username is already taken");
        };

        const timeoutId = setTimeout(checkUsername, 500);
        return () => clearTimeout(timeoutId);
    }, [username, initialUsername]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        if (usernameAvailable === false && username !== session?.user?.username) {
            setError("Please choose a valid available username");
            setIsLoading(false);
            return;
        }

        // Build birthday string if all parts are selected AND not already locked
        const birthday = !isBirthdayLocked && birthYear && birthMonth && birthDay
            ? `${birthYear}-${birthMonth}-${birthDay}`
            : undefined;

        const result = await updateProfile({ nickname, image, username, birthday });

        if (result.error) {
            setError(result.error);
            setIsLoading(false);
        } else if (result.success) {
            setSuccess(result.success);
            setIsLoading(false);
            // Pass updated data to trigger JWT callback to refresh session
            await update({
                user: {
                    nickname,
                    username,
                    image,
                }
            });
            // Redirect to new username path if username changed
            if (username !== session?.user?.username) {
                router.push(`/u/${username}/settings`);
            } else {
                router.refresh();
            }
        }
    }

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        );
    }

    if (!session) return null;

    const backLink = session.user.role === "ADMIN" || session.user.role === "TRANSLATOR" ? "/studio" : "/";

    return (
        <div className="min-h-screen bg-gray-50 text-foreground font-sans selection:bg-emerald-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
            </div>

            <div className="max-w-3xl mx-auto px-6 py-12 relative z-10">
                {/* Header */}
                <div className="mb-10">
                    <Link
                        href={backLink}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-emerald-600 transition-colors mb-6 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Trở về
                    </Link>
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-500 mb-2">
                        Thiết Lập Hồ Sơ
                    </h1>
                    <p className="text-muted-foreground">
                        Quản lý danh tính của bạn trong thế giới Novest.
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50" />

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Messages */}
                        {error && (
                            <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                <XCircle className="w-4 h-4" /> {error}
                            </div>
                        )}
                        {success && (
                            <div className="bg-emerald-100 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> {success}
                            </div>
                        )}

                        {/* Avatar Section */}
                        <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center pb-8 border-b border-gray-200">
                            <div className="relative group">
                                <div className="relative">
                                    <ImageUpload
                                        value={image}
                                        onChange={setImage}
                                        disabled={isLoading}
                                        variant="avatar"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-medium text-foreground">Ảnh Đại Diện</h3>
                                <p className="text-sm text-muted-foreground">
                                    Định dạng JPG, PNG hoặc GIF. Tối đa 4MB.<br />
                                    Hãy chọn một hình ảnh thể hiện khí chất của bạn.
                                </p>
                            </div>
                        </div>

                        {/* Identity Section */}
                        <div className="space-y-6">
                            {/* Nickname */}
                            <div className="space-y-2">
                                <label htmlFor="nickname" className="block text-sm font-medium text-foreground">
                                    Biệt Danh (Display Name)
                                </label>
                                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all">
                                    <div className="pl-3 flex items-center justify-center">
                                        <User className="w-4 h-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                    <input
                                        id="nickname"
                                        type="text"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        disabled={isLoading}
                                        className="w-full bg-transparent border-none py-2.5 pl-3 pr-4 text-foreground focus:ring-0 placeholder:text-muted-foreground"
                                        placeholder="Vị Đạo Hữu Vô Danh"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Tên này sẽ hiển thị trên các bình luận và trang cá nhân của bạn.
                                </p>
                            </div>

                            {/* Username */}
                            <div className="space-y-2">
                                <label htmlFor="username" className="block text-sm font-medium text-foreground">
                                    Định Danh (Unique Handle)
                                </label>
                                {isUsernameLocked ? (
                                    // Locked Username (Read-only display)
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <AtSign className="w-5 h-5 text-emerald-600" />
                                            <span className="text-lg font-sans text-emerald-600">{username}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Định danh của bạn đã được thiết lập và không thể thay đổi.
                                        </p>
                                        <p className="text-xs text-muted-foreground font-sans">
                                            novest.com/u/{username}
                                        </p>
                                    </div>
                                ) : (
                                    // Editable Username (Can be changed once)
                                    <>
                                        <div className={`flex items-center bg-gray-50 border rounded-lg transition-all relative ${usernameAvailable === true ? "border-emerald-500 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/20" :
                                            usernameAvailable === false ? "border-red-500 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/20" :
                                                "border-gray-200 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/50"
                                            }`}>
                                            <div className="pl-3 flex items-center justify-center">
                                                <AtSign className="w-4 h-4 text-muted-foreground pointer-events-none" />
                                            </div>
                                            <input
                                                id="username"
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                disabled={isLoading}
                                                className="w-full bg-transparent border-none py-2.5 pl-3 pr-10 text-foreground focus:ring-0 placeholder:text-muted-foreground"
                                                placeholder="dao_huu_123"
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                                {isCheckingUsername && (
                                                    <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                                                )}
                                                {!isCheckingUsername && usernameAvailable === true && (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                )}
                                                {!isCheckingUsername && usernameAvailable === false && (
                                                    <XCircle className="w-4 h-4 text-red-500" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-start">
                                            <p className={`text-xs transition-colors ${usernameAvailable === true ? "text-emerald-600" :
                                                usernameAvailable === false ? "text-red-600" :
                                                    "text-muted-foreground"
                                                }`}>
                                                {usernameMessage || "Định danh duy nhất dùng cho URL trang cá nhân của bạn. Bạn chỉ có thể thay đổi một lần."}
                                            </p>
                                            <span className="text-xs text-muted-foreground font-sans">
                                                novest.com/u/{username || "..."}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Birthday Section */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-linear-to-r from-emerald-600 to-emerald-500">Ngày Sinh</h2>
                            <div className="bg-gray-50 backdrop-blur-xs rounded-xl border border-gray-200 p-6">
                                {isBirthdayLocked ? (
                                    // Locked Birthday (Read-only display)
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">🎂</span>
                                            <span className="text-lg font-semibold text-emerald-600">
                                                {savedBirthday && new Date(savedBirthday).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Ngày sinh của bạn đã được thiết lập và không thể thay đổi.
                                        </p>
                                        <p className="text-sm text-emerald-600 flex items-center gap-2 mt-3">
                                            🎁 Novest sẽ gửi quà vào ngày sinh nhật của bạn!
                                        </p>
                                    </div>
                                ) : (
                                    // Editable Birthday (Can be set once)
                                    <>
                                        <div className="flex flex-wrap gap-3 mb-4">
                                            <select
                                                value={birthDay}
                                                onChange={(e) => setBirthDay(e.target.value)}
                                                className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-foreground focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none"
                                            >
                                                <option value="">Ngày</option>
                                                {Array.from({ length: 31 }, (_, i) => (
                                                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{i + 1}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={birthMonth}
                                                onChange={(e) => setBirthMonth(e.target.value)}
                                                className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-foreground focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none"
                                            >
                                                <option value="">Tháng</option>
                                                {[
                                                    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
                                                    "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
                                                    "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
                                                ].map((month, i) => (
                                                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{month}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={birthYear}
                                                onChange={(e) => setBirthYear(e.target.value)}
                                                className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-foreground focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none"
                                            >
                                                <option value="">Năm</option>
                                                {Array.from({ length: 100 }, (_, i) => {
                                                    const year = new Date().getFullYear() - i;
                                                    return <option key={year} value={year}>{year}</option>;
                                                })}
                                            </select>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            ⚠️ Bạn chỉ có thể đặt ngày sinh một lần duy nhất.
                                        </p>
                                        <p className="text-sm text-emerald-600 flex items-center gap-2">
                                            🎁 Novest sẽ gửi quà vào ngày sinh nhật của bạn!
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Recommendation Preferences Section */}
                        <div id="preferences" className="space-y-4">
                            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-linear-to-r from-emerald-600 to-emerald-500 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-emerald-500" />
                                Sở Thích Đề Xuất
                            </h2>
                            <div className="bg-gray-50 backdrop-blur-xs rounded-xl border border-gray-200 p-6 space-y-6">
                                {/* Nations */}
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-emerald-500" />
                                        Nguồn gốc truyện
                                    </h3>
                                    <div className="flex gap-3 flex-wrap">
                                        {[
                                            { code: "CN", label: "Trung Quốc", emoji: "🇨🇳" },
                                            { code: "JP", label: "Nhật Bản", emoji: "🇯🇵" },
                                            { code: "KR", label: "Hàn Quốc", emoji: "🇰🇷" },
                                        ].map((nation) => (
                                            <button
                                                key={nation.code}
                                                type="button"
                                                onClick={() => setSelectedNations(prev =>
                                                    prev.includes(nation.code)
                                                        ? prev.filter(n => n !== nation.code)
                                                        : [...prev, nation.code]
                                                )}
                                                className={clsx(
                                                    "flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all",
                                                    selectedNations.includes(nation.code)
                                                        ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                                                        : "border-gray-200 hover:border-gray-300 text-foreground"
                                                )}
                                            >
                                                <span>{nation.emoji}</span>
                                                <span className="text-sm font-medium">{nation.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Genres */}
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-emerald-500" />
                                        Thể loại yêu thích
                                    </h3>
                                    {loadingPreferences ? (
                                        <div className="flex justify-center py-4">
                                            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {allGenres.map((genre) => (
                                                <button
                                                    key={genre.id}
                                                    type="button"
                                                    onClick={() => setSelectedGenres(prev =>
                                                        prev.includes(genre.id)
                                                            ? prev.filter(g => g !== genre.id)
                                                            : [...prev, genre.id]
                                                    )}
                                                    className={clsx(
                                                        "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                                                        selectedGenres.includes(genre.id)
                                                            ? "bg-emerald-500 text-white"
                                                            : "bg-gray-100 text-foreground hover:bg-gray-200"
                                                    )}
                                                >
                                                    {genre.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Save Preferences Button */}
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const res = await saveUserPreferences(selectedNations, selectedGenres);
                                        if ('error' in res) {
                                            alert(res.error || 'Có lỗi xảy ra. Vui lòng thử lại.');
                                        } else {
                                            setPreferencesSaved(true);
                                            setTimeout(() => setPreferencesSaved(false), 2000);
                                        }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-600 hover:bg-emerald-200 transition-colors"
                                >
                                    {preferencesSaved ? (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            Đã lưu!
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Lưu sở thích
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-6 border-t border-gray-200 flex items-center gap-4">
                            <button
                                type="submit"
                                disabled={isLoading || (usernameAvailable === false && username !== initialUsername)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Lưu Thay Đổi
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setNickname(session.user.nickname || "");
                                    setUsername(session.user.username || "");
                                    setImage(session.user.image || "");
                                    setUsernameAvailable(null);
                                    setUsernameMessage("");
                                }}
                                disabled={isLoading}
                                className="px-6 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-muted-foreground transition-colors disabled:opacity-50"
                            >
                                Đặt Lại
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Welcome Modal */}
            {
                showWelcome && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
                            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-emerald-500 to-emerald-400" />
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-8 h-8 text-emerald-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-foreground">Chào mừng đạo hữu!</h2>
                                <p className="text-muted-foreground text-sm">
                                    Chào mừng bạn đến với Novest. Hệ thống đã tự động tạo cho bạn một định danh.
                                    Bạn có thể thay đổi nó ngay bây giờ hoặc để sau.
                                </p>

                                {/* Birthday Section in Welcome Modal */}
                                <div className="bg-gray-50 rounded-xl p-4 mt-4 text-left">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-xl">🎂</span>
                                        <h3 className="font-semibold text-emerald-600">Ngày sinh của bạn</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <select
                                            value={birthDay}
                                            onChange={(e) => setBirthDay(e.target.value)}
                                            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none flex-1 min-w-[70px]"
                                        >
                                            <option value="">Ngày</option>
                                            {Array.from({ length: 31 }, (_, i) => (
                                                <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{i + 1}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={birthMonth}
                                            onChange={(e) => setBirthMonth(e.target.value)}
                                            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none flex-1 min-w-[90px]"
                                        >
                                            <option value="">Tháng</option>
                                            {[
                                                "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
                                                "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
                                                "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
                                            ].map((month, i) => (
                                                <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{month}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={birthYear}
                                            onChange={(e) => setBirthYear(e.target.value)}
                                            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none flex-1 min-w-[80px]"
                                        >
                                            <option value="">Năm</option>
                                            {Array.from({ length: 100 }, (_, i) => {
                                                const year = new Date().getFullYear() - i;
                                                return <option key={year} value={year}>{year}</option>;
                                            })}
                                        </select>
                                    </div>
                                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                                        🎁 Novest sẽ gửi quà đặc biệt vào ngày sinh nhật của bạn!
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2 mt-4">
                                    <button
                                        onClick={async () => {
                                            if (birthYear && birthMonth && birthDay) {
                                                const birthday = `${birthYear}-${birthMonth}-${birthDay}`;
                                                await updateProfile({ birthday });
                                                setIsBirthdayLocked(true);
                                                setSavedBirthday(new Date(birthday));
                                            }
                                            setShowWelcome(false);
                                        }}
                                        disabled={!birthYear || !birthMonth || !birthDay}
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-500 text-white font-bold py-3 rounded-lg transition-colors disabled:cursor-not-allowed"
                                    >
                                        {birthYear && birthMonth && birthDay ? "Lưu và Tiếp Tục" : "Chọn ngày sinh để tiếp tục"}
                                    </button>
                                    <button
                                        onClick={() => setShowWelcome(false)}
                                        className="w-full text-muted-foreground hover:text-foreground py-2 text-sm transition-colors"
                                    >
                                        Bỏ qua, để sau
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
