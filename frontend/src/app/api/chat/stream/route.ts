import { NextRequest } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const SOCRATIC_PROMPT = `You are a Socratic tutor. Your goal is to help the student discover 
answers themselves through guided questioning.

Rules:
- NEVER give the answer directly unless the user explicitly gives up
- Always respond with a probing question or a small hint
- Acknowledge what the student got right before correcting mistakes
- Adapt your language to the selected difficulty level
- If the topic is CS, use code examples in markdown code blocks
- When the user clicks "I give up", switch to a clear, direct explanation`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, messages, topic, difficulty, mode } = body;

  const userMessages = messages || [{ role: "user", content: message }];

  const systemPrompt = `${SOCRATIC_PROMPT}

**Session context:** Subject: **${topic || "Math"}**. Difficulty: **${difficulty || "Intermediate"}**.
**Mode:** ${mode || "socratic"}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...userMessages,
      ],
      stream: true,
    }),
  });

  return new Response(response.body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}