import { MODEL_CATALOG } from "@/types";

const SHOWCASE = ["Mistral", "Gemini"] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-10 pt-16 text-center sm:px-6 sm:pt-24 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <span className="chip mx-auto mb-6 inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-neon-green" />
          2 models · live blind battles
        </span>

        <h1 className="text-balance font-display text-4xl font-black uppercase leading-[1.05] tracking-tight sm:text-6xl">
          Same Prompt.
          <br />
          <span className="text-neon-cyan">Multiple AIs.</span>
          <br />
          <span className="text-neon-magenta">One Winner.</span>
        </h1>

<p className="mx-auto mt-6 max-w-xl text-balance text-base text-ink-muted sm:text-lg">
  Send one prompt into the arena. Watch two anonymized models answer blind.
  Vote for the best, then reveal who was really behind Model A and B.
</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {SHOWCASE.map((id) => {
            const m = MODEL_CATALOG[id as keyof typeof MODEL_CATALOG];
            return (
              <span key={id} className="chip">
                {m.label}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
