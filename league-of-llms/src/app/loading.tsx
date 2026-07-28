export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex gap-1.5" role="status" aria-label="Loading">
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-neon-violet [animation-delay:-0.3s]" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-neon-cyan [animation-delay:-0.15s]" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-neon-magenta" />
      </div>
    </div>
  );
}
