import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { TopBar } from "@/components/TopBar";
import { loadDashboard } from "@/lib/data";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Minimise — AIOS Dashboard",
  description: "What's automated inside Minimise's AI-Operating-System.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const data = await loadDashboard();

  return (
    <html lang="en" className={`${jakarta.variable} h-full`}>
      <body className="font-sans bg-surface text-ink min-h-full flex flex-col">
        <TopBar logoText={data.instance.logo_text} />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
