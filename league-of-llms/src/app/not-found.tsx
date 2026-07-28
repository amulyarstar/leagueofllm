import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-6xl font-black text-neon-violet">404</p>
      <h1 className="mt-4 font-display text-xl font-bold uppercase tracking-wide">This arena is empty</h1>
      <p className="mt-2 text-sm text-ink-muted">The battle you&apos;re looking for doesn&apos;t exist or was removed.</p>
      <Link href="/" className="btn-primary mt-6">
        Back to the arena
      </Link>
    </div>
  );
}
