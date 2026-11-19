export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="card px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7a6d]">{label}</p>
      <p className="font-display mt-1 text-xl font-semibold text-[#10231c]">{value}</p>
      {hint ? <p className="mt-0.5 truncate text-xs text-[#8d9a8c]">{hint}</p> : null}
    </div>
  );
}

export function RankBadge({ position }: { position: number }) {
  const styles =
    position === 1
      ? "bg-[#f7e5b8] text-[#7a5410] ring-1 ring-[#c9922f]/40"
      : position === 2
        ? "bg-[#eef1f3] text-[#4b5563] ring-1 ring-[#9aa5ad]/40"
        : position === 3
          ? "bg-[#f8e3d1] text-[#8a4d1e] ring-1 ring-[#c8834a]/40"
          : "bg-[#10231c]/5 text-[#5b6b5e] ring-1 ring-[#10231c]/10";

  return (
    <span
      className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-bold tabular-nums ${styles}`}
    >
      {position}
    </span>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="mb-1 flex gap-1.5" aria-hidden>
        <span className="size-2 rounded-full bg-[#c9922f]/60" />
        <span className="size-2 rounded-full bg-[#0f5b43]/50" />
        <span className="size-2 rounded-full bg-[#c9922f]/60" />
      </span>
      <p className="font-display font-semibold text-[#16322a]">{title}</p>
      {description ? <p className="text-sm text-[#6b7a6d]">{description}</p> : null}
    </div>
  );
}
