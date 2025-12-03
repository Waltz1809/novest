import Link from "next/link";

// Discord Icon Component
function DiscordIcon({ className }: { className?: string }) {
    return (
        <svg
            role="img"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            className={className}
        >
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 3.53 3.53 0 0 0-.59 1.227 18.355 18.355 0 0 0-5.526 0 3.53 3.53 0 0 0-.59-1.227.074.074 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.176 2.419 0 1.334-.955 2.419-2.176 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.176 2.419 0 1.334-.956 2.419-2.176 2.419z" />
        </svg>
    );
}

export default function MainFooter() {
    return (
        <footer className="w-full bg-[#0B0C10] border-t border-white/5 py-6 mt-auto">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-gray-500 text-sm font-family-name:var(--font-be-vietnam-pro)">
                    © 2025 <span className="text-white font-medium">Novest - LightNovel, WebNovel và hơn thế nữa</span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer font-family-name:var(--font-be-vietnam-pro)">
                        <span>Liên hệ:</span>
                        <span className="text-[#34D399]"></span>
                    </div>

                    <Link href="#" className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#5865F2] transition-colors font-family-name:var(--font-be-vietnam-pro)">
                        <DiscordIcon className="w-5 h-5" />
                        <span>Cộng đồng</span>
                    </Link>
                </div>
            </div>
        </footer>
    );
}
