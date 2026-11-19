"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: ["Ranking Elo"] },
  { href: "/rankings-antigos", label: ["Rankings", "antigos"] },
  { href: "/pessoas", label: ["Pessoas"] },
  { href: "/partidas", label: ["Partidas"] },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="flex w-full items-center justify-between gap-1 whitespace-nowrap text-[13px] sm:w-auto sm:justify-end sm:gap-1.5 sm:text-sm">
      {LINKS.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-2 py-1.5 text-center leading-[1.15] font-medium transition sm:px-3.5 ${
              active
                ? "bg-[#f7f2e4] text-[#0c231b] shadow-sm"
                : "text-[#d6cfbc] hover:bg-white/10 hover:text-[#fdfbf3]"
            }`}
          >
            {link.label.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </Link>
        );
      })}
    </nav>
  );
}
