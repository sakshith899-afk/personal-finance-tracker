import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Finance • Tracker",
  description: "Track daily expenses via Telegram. Clean analytics dashboard.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased bg-[#0a0b14]">
      <body className="min-h-full flex flex-col bg-[#0a0b14] text-[#f1f1f3]">{children}</body>
    </html>
  );
}
