export type ModelName = "gpt" | "claude" | "gemini" | "deepseek" | "grok" | "mistral";

export type Slot = "A" | "B" | "C" | "D";

export type PromptCategory =
  | "coding"
  | "writing"
  | "business"
  | "research"
  | "marketing"
  | "education"
  | "creativity";

export type VoteCategory = "overall" | "accuracy" | "creativity" | "helpfulness";

export type BattleVisibility = "private" | "public";

export type BattleStatus = "pending" | "running" | "completed" | "flagged" | "removed";

export interface ModelMeta {
  id: ModelName;
  label: string;
  vendor: string;
  color: "cyan" | "magenta" | "violet" | "amber" | "green" | "red";
}

export const MODEL_CATALOG: Record<ModelName, ModelMeta> = {
  gpt: { id: "gpt", label: "GPT", vendor: "OpenAI", color: "green" },
  claude: { id: "claude", label: "Claude", vendor: "Anthropic", color: "amber" },
  gemini: { id: "gemini", label: "Gemini", vendor: "Google", color: "cyan" },
  deepseek: { id: "deepseek", label: "DeepSeek", vendor: "DeepSeek", color: "violet" },
  grok: { id: "grok", label: "Grok", vendor: "xAI", color: "red" },
  mistral: { id: "mistral", label: "Mistral", vendor: "Mistral AI", color: "magenta" },
};

export const CATEGORY_CATALOG: { id: PromptCategory; label: string }[] = [
  { id: "coding", label: "Coding" },
  { id: "writing", label: "Writing" },
  { id: "business", label: "Business" },
  { id: "research", label: "Research" },
  { id: "marketing", label: "Marketing" },
  { id: "education", label: "Education" },
  { id: "creativity", label: "Creativity" },
];

export const VOTE_CATEGORIES: { id: VoteCategory; label: string; hint: string }[] = [
  { id: "overall", label: "Best Overall", hint: "Which response would you send as-is?" },
  { id: "accuracy", label: "Most Accurate", hint: "Which got the facts / logic right?" },
  { id: "creativity", label: "Most Creative", hint: "Which had the most original angle?" },
  { id: "helpfulness", label: "Most Helpful", hint: "Which best solved what you asked?" },
];

export interface ResponseRow {
  id: string;
  battle_id: string;
  model_name: ModelName;
  slot: Slot;
  response_text: string;
  latency_ms: number | null;
  tokens: number | null;
  error: string | null;
  created_at: string;
}

export interface BattleRow {
  id: string;
  prompt: string;
  category: PromptCategory;
  created_by: string | null;
  visibility: BattleVisibility;
  status: BattleStatus;
  model_slots: Partial<Record<Slot, ModelName>>;
  is_flagged: boolean;
  flagged_reason: string | null;
  view_count: number;
  created_at: string;
}

export interface VoteRow {
  id: string;
  battle_id: string;
  user_id: string | null;
  category: VoteCategory;
  selected_model: ModelName;
  created_at: string;
}

export interface LeaderboardRow {
  model_name: ModelName;
  category: VoteCategory;
  wins: number;
  losses: number;
  ties: number;
  elo_rating: number;
  updated_at: string;
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: "user" | "moderator" | "admin";
  is_banned: boolean;
  created_at: string;
}

export interface BattleWithResponses extends BattleRow {
  responses: ResponseRow[];
}
