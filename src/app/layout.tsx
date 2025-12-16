import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import Navbar from "@/components/layout/Navbar/Navbar";
import Footer from "@/components/layout/Footer";
import Script from "next/script";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { getServerSession } from "@/lib/auth/server/getServerSession";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Frontend Boilerplate",
  description: "Reusable boilerplate for portfolio apps",
};

const themeInitCode = `
  (function() {
    try {
      var STORAGE_KEY = 'app:theme';
      var stored = localStorage.getItem(STORAGE_KEY) || 'system';
      var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var effective = stored === 'system'
        ? (systemDark ? 'dark' : 'light')
        : stored;

      var root = document.documentElement;
      root.dataset.theme = effective;

      if (effective === 'dark') {
        root.style.setProperty('--background', '#0a0a0a');
        root.style.setProperty('--foreground', '#e5e5e5');
      } else {
        root.style.setProperty('--background', '#fafafa');
        root.style.setProperty('--foreground', '#1a1a1a');
      }

      // keep cookie in sync so SSR can match on next request
      document.cookie = 'app_theme=' + effective + '; path=/; max-age=31536000; samesite=lax';
    } catch (e) {
      // fail silently
    }
  })(); 
`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();

  const themeCookie = cookieStore.get("app_theme")?.value;
  const effectiveTheme = themeCookie === "dark" ? "dark" : "light";

  const { user } = await getServerSession();

  const isLoggedIn = Boolean(user);
  const isAdmin = user?.role === "admin";

  return (
    <html lang="en" suppressHydrationWarning data-theme={effectiveTheme}>
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitCode }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <Navbar isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
