import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Be_Vietnam_Pro, Merriweather, Lora, Roboto, Noto_Sans, Nunito } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { auth } from "@/auth";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import FooterWrapper from "@/components/layout/footer-wrapper";
import { Toaster } from "sonner";

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Novest - LightNovel, WebNovel và hơn nữa",
  description: "Nền tảng đọc truyện chữ online hàng đầu Việt Nam. Cập nhật liên tục, giao diện tối ưu.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B0C10",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="vi" suppressHydrationWarning>
      {/* Google Analytics 4 - Only in production */}
      {process.env.NODE_ENV === "production" && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `}
          </Script>
        </>
      )}
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${beVietnamPro.variable} ${merriweather.variable} ${lora.variable} ${roboto.variable} ${notoSans.variable} ${nunito.variable} antialiased bg-background text-foreground flex flex-col min-h-screen overflow-x-hidden font-sans`}
      >
        <Providers session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
            <FooterWrapper />
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
