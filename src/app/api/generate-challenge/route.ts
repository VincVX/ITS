// app/api/generate-challenge/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Use the env var if present, otherwise pick a cheap JSON-mode model:
const MODEL =
  process.env.OPENAI_MODEL ?? "gpt-4o-mini"; // ⬅︎ cheapest, supports JSON mode
// If you don't have access to 4o yet, fall back:
const FALLBACK_MODEL = "gpt-o3-mini";

/** Builds one challenge (prompt + constraint) */
async function buildChallenge() {
  const llmPrompt = `
      You are an AI assistant for a creative writing tutoring system.
      Generate a short, engaging writing prompt suitable for a beginner to intermediate writer.
      Also, generate a specific, actionable creative writing constraint that should be applied to this prompt.
      The constraint should be clearly evaluable by an AI.

      Examples of good constraint types:
      - Word count limits (e.g., "under 50 words", "exactly 100 words").
      - Use/avoid specific word types (e.g., "without using any adverbs", "use at least three adjectives describing sound").
      - Include specific literary devices (e.g., "include at least two similes", "use personification for an inanimate object").
      - Perspective (e.g., "write in the first person", "write in the third person limited").
      - Sentence structure (e.g., "start at least three sentences with a prepositional phrase").
      - Dialogue constraints (e.g., "a dialogue where one character only asks questions").

      Return ONLY a JSON object with two keys: "prompt" and "constraint". Do not include any other text or explanation.
      Example JSON:
      {
        "prompt": "A character finds a dusty old map in their grandparents' attic.",
        "constraint": "Describe what the character does next in 3 sentences, ensuring one sentence uses a metaphor."
      }
    `;

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: llmPrompt }],
      response_format: { type: "json_object" },
    });

    const jsonString = completion.choices[0].message?.content;
    if (!jsonString) throw new Error("LLM returned empty content");

    return JSON.parse(jsonString);
  } catch (err: any) {
    /** If the first model isn’t available to your account, transparently fall back. */
    if (err?.error?.code === "model_not_found" && MODEL !== FALLBACK_MODEL) {
      console.warn(`Model ${MODEL} not available; falling back to ${FALLBACK_MODEL}`);
      const fallback = await openai.chat.completions.create({
        model: FALLBACK_MODEL,
        messages: [{ role: "user", content: llmPrompt }],
        response_format: { type: "json_object" },
      });
      return JSON.parse(fallback.choices[0].message!.content!);
    }
    throw err; // re-throw – handler will log & turn into 500
  }
}

export async function GET() {
  try {
    const challenge = await buildChallenge();
    return NextResponse.json(challenge);
  } catch (err: any) {
    console.error("generate-challenge error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** Optional POST support (nice if you want to call with method:"POST") */
export async function POST() {
  return GET();
}
