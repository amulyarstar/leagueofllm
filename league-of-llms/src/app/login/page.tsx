"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Mail, Chrome } from "lucide-react";

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await signInWithEmail(email);
    setStatus(error ? "error" : "sent");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="glass p-8">
        <h1 className="text-center font-display text-2xl font-bold uppercase tracking-wide">Enter the arena</h1>
        <p className="mt-2 text-center text-sm text-ink-muted">
          Sign in to save battle history, favorite prompts, and publish to the public feed.
        </p>

        <button onClick={signInWithGoogle} className="btn-secondary mt-8 w-full">
          <Chrome size={18} aria-hidden="true" /> Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3 text-xs text-ink-faint">
          <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
        </div>

        {status === "sent" ? (
          <p className="rounded-lg border border-neon-green/30 bg-neon-green/10 p-4 text-center text-sm text-neon-green">
            Check {email} for a magic sign-in link.
          </p>
        ) : (
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-line bg-white/[0.03] px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-neon-violet/60 focus:outline-none"
            />
            <button type="submit" disabled={status === "sending"} className="btn-primary w-full">
              <Mail size={16} aria-hidden="true" /> {status === "sending" ? "Sending link…" : "Send magic link"}
            </button>
            {status === "error" && <p className="text-xs text-neon-red">Could not send the link. Please try again.</p>}
          </form>
        )}
      </div>
    </div>
  );
}
