import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { SidebarProvider } from "@/contexts/sidebar-context";
import MainContent from "@/components/MainContent";
import { AuthProvider } from "@/contexts/auth-context";
import { MoodProvider } from "@/contexts/mood-context";

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
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased"
        style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif" }}
        suppressHydrationWarning
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
