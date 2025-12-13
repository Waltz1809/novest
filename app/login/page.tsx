"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { registerUser } from "@/actions/user";
import { Mail, Lock, User, Github, BookOpen } from "lucide-react";

export default function LoginPage() {
    const searchParams = useSearchParams();
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Check for OAuth errors in URL
    useEffect(() => {
        const errorParam = searchParams.get("error");
        if (errorParam === "OAuthAccountNotLinked") {
            setError("Email này đã được đăng ký với phương thức khác. Vui lòng đăng nhập bằng phương thức đã dùng trước đó.");
        } else if (errorParam === "OAuthSignin") {
            setError("Lỗi khi đăng nhập với OAuth. Vui lòng thử lại.");
        } else if (errorParam) {
            setError("Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại.");
        }
    }, [searchParams]);

    // Sign In Handler
    async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
                callbackUrl: "/",
            });

            if (result?.error) {
                setError("Email hoặc mật khẩu không đúng");
            } else if (result?.ok) {
                window.location.href = "/";
            }
        } catch (err) {
            setError("Đã xảy ra lỗi. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    }

    // Sign Up Handler
    async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            password: formData.get("password") as string,
        };

        const result = await registerUser(data);

        if (result.error) {
            setError(result.error);
            setIsLoading(false);
        } else if (result.success && result.autoSignIn) {
            // Auto-signin with the credentials
            setSuccess("Tài khoản đã tạo! Đang đăng nhập...");

            const signInResult = await signIn("credentials", {
                email: result.email,
                password: result.password,
                redirect: false,
            });

            if (signInResult?.error) {
                setError("Đã tạo tài khoản nhưng không thể tự động đăng nhập. Vui lòng đăng nhập thủ công.");
                setIsLoading(false);
                setIsSignUp(false);
            } else {
                // Redirect to welcome/onboarding page
                window.location.href = "/welcome";
            }
        }
    }

    // Social Login Handler
    const handleSocialLogin = (provider: string) => {
        signIn(provider, { callbackUrl: "/" });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-indigo-50 px-4 py-8 relative overflow-hidden">
            {/* Background Ambient Glow */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-[100px]" />

            <div className="relative w-full max-w-4xl min-h-[600px] bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 flex flex-col lg:block">

                {/* Mobile Toggle Header (Visible only on mobile) */}
                <div className="lg:hidden flex p-2 bg-gray-50">
                    <button
                        onClick={() => setIsSignUp(false)}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${!isSignUp ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Đăng nhập
                    </button>
                    <button
                        onClick={() => setIsSignUp(true)}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${isSignUp ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Đăng ký
                    </button>
                </div>

                {/* Sign In Form Container */}
                <div
                    className={`
                        w-full lg:absolute lg:top-0 lg:left-0 lg:w-1/2 lg:h-full 
                        flex items-center justify-center p-8 md:p-12 
                        transition-all duration-500
                        ${/* Mobile Logic */ ''}
                        ${!isSignUp ? 'block opacity-100' : 'hidden lg:flex lg:opacity-0 lg:pointer-events-none'}
                    `}
                >
                    <div className="w-full max-w-sm space-y-6">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">Đăng nhập</h2>
                            <p className="text-muted-foreground text-sm">Chào mừng trở lại với Novest</p>
                        </div>

                        {/* Social Login */}
                        <div className="flex justify-center gap-4">
                            <button onClick={() => handleSocialLogin("google")} className="w-12 h-12 rounded-full bg-white border border-gray-200 hover:border-primary transition-all flex items-center justify-center group shadow-sm">
                                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            </button>
                            <button onClick={() => handleSocialLogin("discord")} className="w-12 h-12 rounded-full bg-white border border-gray-200 hover:border-primary transition-all flex items-center justify-center text-[#5865F2] group shadow-sm">
                                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                                </svg>
                            </button>
                            <button onClick={() => handleSocialLogin("github")} className="w-12 h-12 rounded-full bg-white border border-gray-200 hover:border-primary transition-all flex items-center justify-center text-gray-800 group shadow-sm">
                                <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-muted-foreground">Hoặc tiếp tục với</span>
                            </div>
                        </div>

                        <form onSubmit={handleSignIn} className="space-y-4">
                            {error && !isSignUp && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="relative flex items-center group">
                                <Mail className="absolute left-3 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    required
                                    disabled={isLoading}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                                />
                            </div>

                            <div className="relative flex items-center group">
                                <Lock className="absolute left-3 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Mật khẩu"
                                    required
                                    disabled={isLoading}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
                            >
                                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Sign Up Form Container */}
                <div
                    className={`
                        w-full lg:absolute lg:top-0 lg:right-0 lg:w-1/2 lg:h-full 
                        flex items-center justify-center p-8 md:p-12 
                        transition-all duration-500
                        ${/* Mobile Logic */ ''}
                        ${isSignUp ? 'block opacity-100' : 'hidden lg:flex lg:opacity-0 lg:pointer-events-none'}
                    `}
                >
                    <div className="w-full max-w-sm space-y-6">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">Tạo tài khoản</h2>
                            <p className="text-muted-foreground text-sm">Bắt đầu hành trình của bạn</p>
                        </div>

                        {/* Social Login */}
                        <div className="flex justify-center gap-4">
                            <button onClick={() => handleSocialLogin("google")} className="w-12 h-12 rounded-full bg-white border border-gray-200 hover:border-primary transition-all flex items-center justify-center group shadow-sm">
                                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            </button>
                            <button onClick={() => handleSocialLogin("discord")} className="w-12 h-12 rounded-full bg-white border border-gray-200 hover:border-primary transition-all flex items-center justify-center text-[#5865F2] group shadow-sm">
                                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                                </svg>
                            </button>
                            <button onClick={() => handleSocialLogin("github")} className="w-12 h-12 rounded-full bg-white border border-gray-200 hover:border-primary transition-all flex items-center justify-center text-gray-800 group shadow-sm">
                                <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-muted-foreground">Hoặc đăng ký với</span>
                            </div>
                        </div>

                        <form onSubmit={handleSignUp} className="space-y-4">
                            {error && isSignUp && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-lg text-sm">
                                    {success}
                                </div>
                            )}

                            <div className="relative flex items-center group">
                                <User className="absolute left-3 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Tên hiển thị"
                                    required
                                    disabled={isLoading}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                                />
                            </div>

                            <div className="relative flex items-center group">
                                <Mail className="absolute left-3 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    required
                                    disabled={isLoading}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                                />
                            </div>

                            <div className="relative flex items-center group">
                                <Lock className="absolute left-3 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Mật khẩu"
                                    required
                                    disabled={isLoading}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
                            >
                                {isLoading ? "Đang tạo..." : "Đăng ký"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Desktop Sliding Overlay (Hidden on mobile) */}
                <div
                    className={`hidden lg:block absolute top-0 w-1/2 h-full bg-gradient-to-br from-primary to-rose-600 text-white transition-transform duration-500 ease-in-out z-10 left-0 ${isSignUp ? "translate-x-0" : "translate-x-full"
                        }`}
                >
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519681393784-d120267933ba')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>

                    <div className="flex items-center justify-center h-full p-12 relative">
                        <div className="text-center space-y-6">
                            {!isSignUp ? (
                                <>
                                    <h2 className="text-4xl font-bold text-white">Chào mừng tới Novest!</h2>
                                    <p className="text-lg text-white/90">
                                        Đăng ký để bắt đầu hành trình đọc truyện tại Novest ngay hôm nay
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSignUp(true);
                                            setError("");
                                            setSuccess("");
                                        }}
                                        className="px-8 py-3 bg-white text-foreground rounded-lg font-bold hover:bg-gray-100 transition-all shadow-lg"
                                    >
                                        Đăng ký
                                    </button>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-4xl font-bold text-white">Chào mừng trở lại!</h2>
                                    <p className="text-lg text-white/90">
                                        Đăng nhập để tiếp tục hành trình với các tựa truyện yêu thích của bạn tại Novest.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSignUp(false);
                                            setError("");
                                            setSuccess("");
                                        }}
                                        className="px-8 py-3 bg-white text-foreground rounded-lg font-bold hover:bg-gray-100 transition-all shadow-lg"
                                    >
                                        Đăng nhập
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
