// app/api/evaluate-text/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const FALLBACK_MODEL = "o3-mini";

export async function POST(request: Request) {
  try {
    const { prompt: originalPrompt, constraint: originalConstraint, userText } =
      await request.json();

    if (!originalPrompt || !originalConstraint || !userText) {
      return NextResponse.json(
        { error: "Missing prompt, constraint, or user text" },
        { status: 400 }
      );
    }

    const llmPrompt = `
      You are an AI assistant for a creative writing tutoring system.
      A user was given the following writing prompt: "${originalPrompt}"
      And the following constraint: "${originalConstraint}"
      The user wrote: "${userText}"

      Your task is to:
      1. Determine if the user's text successfully meets the specified constraint. State clearly: "Constraint Met", "Constraint Partially Met", or "Constraint Not Met".
      2. Provide specific, constructive, and encouraging feedback based ONLY on the adherence to the constraint.
         - If "Constraint Met": Briefly explain why and highlight an example from their text. Offer one small positive suggestion for enhancement if appropriate, still related to the constraint or general good writing practice that complements it.
         - If "Constraint Partially Met": Clearly point out which part of the constraint was met and which part was not. Provide a specific suggestion on how to fully meet the unmet part.
         - If "Constraint Not Met": Gently explain why the text did not meet the constraint. Offer a clear, actionable suggestion or an example of how they could revise their text to meet the constraint.
      3. Keep the feedback concise (2-4 sentences). Focus primarily on the constraint. Do not comment on other aspects like plot, character development, or general grammar unless directly tied to the constraint's fulfillment.

      Return ONLY a JSON object with a single key: "feedback_text". Do not include any other text or explanation.
      Example JSON for feedback_text: "Constraint Met. You successfully avoided adverbs while describing the action! To enhance it further, consider varying your sentence structure slightly."
      Another Example: "Constraint Not Met. The constraint was to write under 50 words, but your response is 72 words. Try to condense your ideas to fit the limit."
    `;

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: llmPrompt }],
      response_format: { type: "json_object" },
    });

    const jsonString = completion.choices[0].message?.content;
    if (!jsonString) throw new Error("LLM returned empty content");

    return NextResponse.json(JSON.parse(jsonString));
  } catch (err: any) {
    if (err?.error?.code === "model_not_found" && MODEL !== FALLBACK_MODEL) {
      console.warn(`Model ${MODEL} not available; retrying with ${FALLBACK_MODEL}`);
      /* --- retry once with fallback --- */
      const retry = await openai.chat.completions.create({
        model: FALLBACK_MODEL,
        messages: [{ role: "user", content: llmPrompt }],
        response_format: { type: "json_object" },
      });
      return NextResponse.json(JSON.parse(retry.choices[0].message!.content!));
    }

    console.error("evaluate-text error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
