"use client";

import type { Difficulty, Topic } from "@/lib/types";

const TOPICS: Topic[] = ["Math", "CS", "History", "Science", "Language"];
const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Expert"];

type SidebarProps = {
  topic: Topic;
  difficulty: Difficulty;
  onTopicChange: (t: Topic) => void;
  onDifficultyChange: (d: Difficulty) => void;
};

export function Sidebar({
  topic,
  difficulty,
  onTopicChange,
  onDifficultyChange,
}: SidebarProps) {
  return (
    <aside className="flex w-full flex-col gap-8 border-b border-border bg-surface/40 p-6 lg:h-full lg:w-72 lg:shrink-0 lg:border-b-0 lg:border-r">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          Socratic Tutor
        </p>
        <h1 className="mt-1 text-lg font-semibold tracking-wide text-ink">
          Study session
        </h1>
        <p className="mt-2 text-sm text-muted">
          Pick a domain and level. The tutor asks guiding questions until you ask
          otherwise.
        </p>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
          Topic
        </p>
        <div className="flex flex-col gap-2">
          {TOPICS.map((t) => {
            const active = t === topic;
            return (
              <button
                key={t}
                type="button"
                onClick={() => onTopicChange(t)}
                className={`rounded-control border px-3 py-2 text-left text-sm font-medium transition-colors ${
                  active
                    ? "border-accent bg-accent/15 text-ink"
                    : "border-border bg-canvas text-muted hover:border-accent/50 hover:text-ink"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
          Difficulty
        </p>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((d) => {
            const active = d === difficulty;
            return (
              <button
                key={d}
                type="button"
                onClick={() => onDifficultyChange(d)}
                className={`rounded-control border px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-hint bg-hint/10 text-hint"
                    : "border-border bg-canvas text-muted hover:border-hint/40 hover:text-ink"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
