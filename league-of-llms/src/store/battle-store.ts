import { create } from "zustand";
import type { ModelName, PromptCategory, VoteCategory, Slot } from "@/types";

interface BattleStoreState {
  prompt: string;
  category: PromptCategory;
  selectedModels: ModelName[];
  votes: Partial<Record<VoteCategory, Slot>>;
  revealed: boolean;

  setPrompt: (prompt: string) => void;
  setCategory: (category: PromptCategory) => void;
  toggleModel: (model: ModelName) => void;
  setSelectedModels: (models: ModelName[]) => void;
  castVote: (category: VoteCategory, slot: Slot) => void;
  reveal: () => void;
  reset: () => void;
}

const DEFAULT_MODELS: ModelName[] = ["gemini", "mistral"];

export const useBattleStore = create<BattleStoreState>((set) => ({
  prompt: "",
  category: "writing",
  selectedModels: DEFAULT_MODELS,
  votes: {},
  revealed: false,

  setPrompt: (prompt) => set({ prompt }),
  setCategory: (category) => set({ category }),
  toggleModel: (model) =>
    set((state) => {
      const has = state.selectedModels.includes(model);
      if (has) {
        if (state.selectedModels.length <= 2) return state; // need at least 2 to battle
        return { selectedModels: state.selectedModels.filter((m) => m !== model) };
      }
      if (state.selectedModels.length >= 4) return state; // A/B/C/D max
      return { selectedModels: [...state.selectedModels, model] };
    }),
  setSelectedModels: (models) => set({ selectedModels: models }),
  castVote: (category, slot) =>
    set((state) => ({ votes: { ...state.votes, [category]: slot } })),
  reveal: () => set({ revealed: true }),
  reset: () => set({ prompt: "", votes: {}, revealed: false }),
}));
