/** Hover or keyboard hint. Use for a short explanation, not for a required warning. */
export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="group relative inline-flex w-full">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-56 -translate-x-1/2 rounded-xl bg-ink px-3 py-2 text-left text-xs font-normal leading-relaxed text-paper shadow-lg group-hover:block group-focus-within:block"
      >
        {label}
      </span>
    </span>
  );
}
