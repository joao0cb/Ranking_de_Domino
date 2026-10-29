import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ranking de Dominó",
  description: "Placares, ranking de jogadores e duplas de dominó.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
              <span aria-hidden className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-lg text-white">🀄</span>
              <span className="text-lg tracking-tight">Ranking de Dominó</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm font-medium text-slate-600">
              <Link className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900" href="/">
                Rankings
              </Link>
              <Link className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900" href="/pessoas">
                Pessoas
              </Link>
              <Link className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900" href="/partidas">
                Partidas
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>

        <footer className="mx-auto w-full max-w-6xl px-4 pb-10 text-xs text-slate-400">
          Rankings calculados automaticamente a partir das partidas registradas.
        </footer>
      </body>
    </html>
  );
}
