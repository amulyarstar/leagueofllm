import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-line py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-ink-faint sm:flex-row sm:px-6 lg:px-8">
        <p>&copy; {new Date().getFullYear()} League of LLMs. Not affiliated with OpenAI, Anthropic, Google, DeepSeek, xAI, or Mistral AI.</p>
        <div className="flex gap-4">
          <Link href="/feed" className="hover:text-ink-muted">Public Feed</Link>
          <Link href="/leaderboard" className="hover:text-ink-muted">Leaderboard</Link>
          <Link href="/admin" className="hover:text-ink-muted">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
