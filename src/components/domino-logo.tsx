export function DominoLogo({ className = "size-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Liga do Dominó">
      <rect x="12.5" y="3.5" width="23" height="41" rx="6.5" fill="#f7f2e4" stroke="#c9922f" strokeWidth="2" />
      <line x1="15" y1="24" x2="33" y2="24" stroke="#0c231b" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="24" cy="13.5" r="2.7" fill="#0c231b" />
      <circle cx="19" cy="31.5" r="2.7" fill="#0c231b" />
      <circle cx="29" cy="38.5" r="2.7" fill="#0c231b" />
    </svg>
  );
}
