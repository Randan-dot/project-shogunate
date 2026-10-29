import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SakuraPetals from "@/components/SakuraPetals";

export const metadata: Metadata = {
  title: {
    default: "Shogunate — A Japanese Culture Community",
    template: "%s · Shogunate",
  },
  description:
    "A community hub themed around Japanese culture and fandom — boards, realtime chat, and rank-based roles.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SakuraPetals />
        <Navbar />
        <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
