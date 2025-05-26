// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"; // Your existing ThemeProvider
import { Toaster as SonnerToaster } from "sonner"; // Your existing Sonner's Toaster
import { MainNav } from "@/components/ui/main-nav"; // Import the new MainNav component

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Creative Constraint Writing Coach",
  description: "Practice creative writing with AI feedback",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Main navigation added here, above the page content */}
          <MainNav />
          {children} {/* This is where your page content (home, library) will be rendered */}
          <SonnerToaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}