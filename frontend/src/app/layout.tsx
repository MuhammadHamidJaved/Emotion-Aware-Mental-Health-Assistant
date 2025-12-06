import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { SidebarProvider } from "@/contexts/sidebar-context";
import MainContent from "@/components/MainContent";
import { AuthProvider } from "@/contexts/auth-context";
import { MoodProvider } from "@/contexts/mood-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EmotionAI - AI-Powered Emotional Wellness",
  description: "Track your emotions with AI-powered detection and get personalized wellness recommendations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <MoodProvider>
            <SidebarProvider>
              <Sidebar />
              <Header />
              <MainContent>{children}</MainContent>
            </SidebarProvider>
          </MoodProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
