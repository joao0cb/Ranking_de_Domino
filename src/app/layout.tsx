import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Inter, Outfit } from "next/font/google";
import { DominoLogo } from "@/components/domino-logo";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Liga do Dominó", template: "%s · Liga do Dominó" },
  description: "Ranking Elo, placares e estatísticas da Liga do Dominó.",
};

export const viewport: Viewport = {
  themeColor: "#0c231b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <header className="sticky top-0 z-40 border-b border-[#c9922f]/25 bg-[#0c231b]/95 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap sm:py-3.5">
            <Link href="/" className="group flex shrink-0 items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[#f7f2e4]/10 ring-1 ring-[#c9922f]/40 transition group-hover:bg-[#f7f2e4]/15">
                <DominoLogo className="size-7" />
              </span>
              <span className="font-display text-lg font-semibold tracking-tight text-[#faf6ea] sm:text-xl">
                Liga do Dominó
              </span>
            </Link>

            <SiteNav />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">{children}</main>
      </body>
    </html>
  );
}
