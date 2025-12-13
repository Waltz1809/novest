import type { Metadata, Viewport } from "next";
import {
  Geist,
  Geist_Mono,
  Be_Vietnam_Pro,
  Merriweather,
  Lora,
  Roboto,
  Noto_Sans,
  Nunito,
} from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google';
import "./globals.css";
import { auth } from "@/auth";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import FooterWrapper from "@/components/layout/footer-wrapper";
import { Toaster } from "sonner";
import { BackToTop } from "@/components/ui/back-to-top";

const GA_MEASUREMENT_ID = "G-48LS4WPMK7";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

// Reading fonts with Vietnamese support
const merriweather = Merriweather({
  weight: ["300", "400", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-merriweather",
  display: "swap",
});

const lora = Lora({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-lora",
  display: "swap",
});

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-roboto",
  display: "swap",
});

const notoSans = Noto_Sans({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-noto-sans",
  display: "swap",
});

const nunito = Nunito({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: "Novest - LightNovel, WebNovel và hơn nữa",
  description:
    "Nền tảng đọc truyện chữ online hàng đầu Việt Nam. Cập nhật liên tục, giao diện tối ưu.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e0fbfc",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="vi"
      suppressHydrationWarning
    >
      {/* Google Analytics 4 - Using @next/third-parties for better integration */}
      {process.env.NODE_ENV === "production" && (
        <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
      )}
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${beVietnamPro.variable} ${merriweather.variable} ${lora.variable} ${roboto.variable} ${notoSans.variable} ${nunito.variable} antialiased bg-background`}
      >
        <Providers session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
            forcedTheme="light"
          >
            {children}
            <FooterWrapper />
            <BackToTop />
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
