export function LoadingDots({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2" role="status" aria-live="polite">
      <span className="flex gap-1">
        <span className="h-2 w-2 animate-bounce rounded-full bg-neon-violet [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-neon-cyan [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-neon-magenta" />
      </span>
      {label && <span className="text-xs text-ink-muted">{label}</span>}
    </div>
  );
}

export function ResponseSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="skeleton-line w-4/5" />
      <div className="skeleton-line w-full" />
      <div className="skeleton-line w-11/12" />
      <div className="skeleton-line w-3/5" />
      <div className="skeleton-line w-full" />
      <div className="skeleton-line w-2/3" />
    </div>
  );
}
