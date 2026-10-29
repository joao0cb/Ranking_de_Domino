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
    <div className="card px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
      {hint ? <p className="mt-0.5 truncate text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function RankBadge({ position }: { position: number }) {
  const styles =
    position === 1
      ? "bg-amber-100 text-amber-700"
      : position === 2
        ? "bg-slate-200 text-slate-600"
        : position === 3
          ? "bg-orange-100 text-orange-700"
          : "bg-slate-100 text-slate-500";

  return (
    <span className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-bold ${styles}`}>
      {position}
    </span>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="card flex flex-col items-center gap-1 px-6 py-12 text-center">
      <p className="font-semibold text-slate-700">{title}</p>
      {description ? <p className="text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}
