export type Topic = "Math" | "CS" | "History" | "Science" | "Language";

export type Difficulty = "Beginner" | "Intermediate" | "Expert";

export type TutorMode = "socratic" | "hint" | "explanation";

export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};
