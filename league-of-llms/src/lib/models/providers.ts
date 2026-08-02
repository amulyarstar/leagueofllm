import type { ModelName } from "@/types";

export interface ModelCallResult {
  text: string;
  latencyMs: number;
  tokens: number | null;
  error: string | null;
}

const TIMEOUT_MS = 30_000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await promise;
  } finally {
    clearTimeout(timer);
  }
}

/** Rough words-to-tokens estimate for providers that don't report usage directly. */
function estimateTokens(text: string): number {
  return Math.max(1, Math.round(text.split(/\s+/).length * 1.3));
}

async function callOpenAI(prompt: string): Promise<Omit<ModelCallResult, "latencyMs">> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content ?? "",
    tokens: data.usage?.total_tokens ?? null,
    error: null,
  };
}

async function callAnthropic(prompt: string): Promise<Omit<ModelCallResult, "latencyMs">> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = (data.content ?? []).map((b: { text?: string }) => b.text ?? "").join("\n");
  return {
    text,
    tokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0) || null,
    error: null,
  };
}

async function callGemini(prompt: string): Promise<Omit<ModelCallResult, "latencyMs">> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("") ?? "";
  return { text, tokens: data.usageMetadata?.totalTokenCount ?? null, error: null };
}

async function callDeepSeek(prompt: string): Promise<Omit<ModelCallResult, "latencyMs">> {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content ?? "",
    tokens: data.usage?.total_tokens ?? null,
    error: null,
  };
}

async function callGrok(prompt: string): Promise<Omit<ModelCallResult, "latencyMs">> {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-2-latest",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Grok ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content ?? "",
    tokens: data.usage?.total_tokens ?? null,
    error: null,
  };
}

async function callMistral(prompt: string): Promise<Omit<ModelCallResult, "latencyMs">> {
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral-large-latest",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Mistral ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content ?? "",
    tokens: data.usage?.total_tokens ?? null,
    error: null,
  };
}

const PROVIDERS: Record<
  ModelName,
  { key: string | undefined; call: (prompt: string) => Promise<Omit<ModelCallResult, "latencyMs">> }
> = {
  gpt: { key: process.env.OPENAI_API_KEY, call: callOpenAI },
  claude: { key: process.env.ANTHROPIC_API_KEY, call: callAnthropic },
  gemini: { key: process.env.GOOGLE_AI_API_KEY, call: callGemini },
  deepseek: { key: process.env.DEEPSEEK_API_KEY, call: callDeepSeek },
  grok: { key: process.env.XAI_API_KEY, call: callGrok },
  mistral: { key: process.env.MISTRAL_API_KEY, call: callMistral },
};

/** Clearly-labeled fallback so the app is fully demoable with zero API keys configured. */
function simulatedResponse(model: ModelName, prompt: string): string {
  return (
    `**[Simulated response — add an API key to enable live ${model.toUpperCase()} calls]**\n\n` +
    `This is a placeholder answer standing in for ${model} on the prompt:\n"${prompt.slice(0, 140)}"\n\n` +
    `Once \`${model.toUpperCase()}_API_KEY\` (see .env.example) is set, this card will show a real, ` +
    `live response from the provider instead of this notice.`
  );
}

export async function callModel(model: ModelName, prompt: string): Promise<ModelCallResult> {
  const provider = PROVIDERS[model];
  const start = Date.now();

  if (!provider.key) {
    // Simulate a small delay so loading states remain visible in demo mode.
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 900));
    return {
      text: simulatedResponse(model, prompt),
      latencyMs: Date.now() - start,
      tokens: estimateTokens(prompt),
      error: null,
    };
  }

  try {
    const result = await withTimeout(provider.call(prompt), TIMEOUT_MS);
    return {
      text: result.text || "(empty response)",
      latencyMs: Date.now() - start,
      tokens: result.tokens ?? estimateTokens(result.text),
      error: null,
    };
  } catch (err) {
    return {
      text: "",
      latencyMs: Date.now() - start,
      tokens: null,
      error: err instanceof Error ? err.message : "Unknown provider error",
    };
  }
}

export async function callAllModels(
  models: ModelName[],
  prompt: string
): Promise<Record<ModelName, ModelCallResult>> {
  const settled = await Promise.all(models.map((m) => callModel(m, prompt)));
  return Object.fromEntries(models.map((m, i) => [m, settled[i]])) as Record<ModelName, ModelCallResult>;
}
