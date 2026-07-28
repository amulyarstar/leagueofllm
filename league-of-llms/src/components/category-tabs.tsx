"use client";

import { CATEGORY_CATALOG } from "@/types";
import type { PromptCategory } from "@/types";
import { cn } from "@/lib/utils";

export function CategoryTabs({
  value,
  onChange,
}: {
  value: PromptCategory;
  onChange: (category: PromptCategory) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Prompt category">
      {CATEGORY_CATALOG.map((cat) => (
        <button
          key={cat.id}
          role="tab"
          aria-selected={value === cat.id}
          onClick={() => onChange(cat.id)}
          className={cn("chip", value === cat.id && "chip-active")}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
