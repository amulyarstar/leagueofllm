"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Swords, Trophy, Rss, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Arena", icon: Swords },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/feed", label: "Public Feed", icon: Rss },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-base/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-wide">
          <span className="grid h-8 w-8 place-items-center rounded-md border border-neon-violet/50 bg-neon-violet/10 text-neon-violet">
            LL
          </span>
          <span className="hidden sm:inline">
            League of <span className="text-neon-violet">LLMs</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-white",
                pathname === href && "bg-white/5 text-white"
              )}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {!loading && user ? (
            <>
              <Link href="/profile" className="btn-secondary !px-4 !py-2 text-xs">
                {user.user_metadata?.full_name ?? "Profile"}
              </Link>
              <button onClick={() => signOut()} className="text-xs text-ink-muted hover:text-white">
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-primary !px-5 !py-2 text-xs">
              Sign in
            </Link>
          )}
        </div>

        <button
          className="grid h-9 w-9 place-items-center rounded-md border border-line md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-line px-4 py-3 md:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-1">
            {LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-white/5 hover:text-white"
              >
                <Icon size={16} /> {label}
              </Link>
            ))}
            <Link
              href={user ? "/profile" : "/login"}
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-white/5 px-3 py-2 text-center text-sm font-semibold"
            >
              {user ? "Profile" : "Sign in"}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
