import type { Metadata } from "next";
import { Orbitron, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const display = Orbitron({ subsets: ["latin"], weight: ["600", "700", "800", "900"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// The whole app reads auth/session state on every request (Navbar, protected pages),
// so it's rendered dynamically rather than statically prerendered at build time.
// This also means `npm run build` succeeds even before Supabase env vars are configured.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "League of LLMs — Same Prompt. Multiple AIs. One Winner.",
    template: "%s · League of LLMs",
  },
  description:
    "Enter one prompt, watch GPT, Claude, Gemini, DeepSeek, Grok and Mistral battle blind, then vote for the best overall, most accurate, most creative and most helpful response.",
  keywords: [
    "AI comparison", "LLM battle", "GPT vs Claude", "AI leaderboard", "compare AI models", "prompt battle",
  ],
  openGraph: {
    title: "League of LLMs — Same Prompt. Multiple AIs. One Winner.",
    description: "Blind AI battles, community voting, and a live model leaderboard.",
    url: SITE_URL,
    siteName: "League of LLMs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "League of LLMs",
    description: "Same Prompt. Multiple AIs. One Winner.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} dark`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-neon-violet focus:px-4 focus:py-2 focus:text-base focus:text-black"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
