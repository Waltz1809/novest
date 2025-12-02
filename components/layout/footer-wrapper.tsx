"use client";

import { usePathname } from "next/navigation";
import MainFooter from "@/components/layout/main-footer";

export default function FooterWrapper() {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith("/dashboard");
    // Check for reader page: /truyen/[slug]/[chapter-slug]
    // We can check if it starts with /truyen and has at least 3 segments (truyen, slug, chapter-slug)
    const isReader = pathname?.startsWith("/truyen/") && pathname.split("/").length >= 4;

    if (isDashboard || isReader) {
        return null;
    }

    return <MainFooter />;
}
