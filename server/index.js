import "dotenv/config";
import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import { buildContext, applyGuardrail } from "./context.js";
import { offlineDecision } from "./offline.js";

const PORT = process.env.PORT || 8787;
const MODEL = process.env.CLAUDIA_MODEL || "claude-haiku-5-5"; // fast = good for voice

// Which brain to use. Claude if an Anthropic key is set, otherwise Gemini (free tier).
// Force one with LLM_PROVIDER=anthropic|gemini in .env
const PROVIDER =
  process.env.LLM_PROVIDER || (process.env.ANTHROPIC_API_KEY ? "anthropic" : "gemini");
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const SYSTEM_PROMPT = `You are Claudia, a warm, honest financial buddy for people with irregular income (students on hourly pay, freelancers, gig workers).

Philosophy: most finance apps just say "spend less". You help people spend MORE on the things that actually matter to THEM, and less on what doesn't.

Rules:
- Use ONLY the numbers in the USER FACTS below. They are computed by the app and are authoritative. Never invent or recalculate balances, bills or forecasts.
- Judge every purchase against the user's own priorities (their weights show what matters to them), not generic frugality.
- If it fits safe-to-spend AND matches a top priority, encourage it genuinely, with no guilt.
- If it threatens bills or a likely shortfall, say so kindly and suggest an alternative or better timing (verdict "wait" or "swap").
- If it matches none of their priorities and isn't needed, gently suggest "skip".
- If the user names no price, estimate a typical UK price, say it's an estimate, and put that figure in "price".
- For goals (e.g. a trip), say how the purchase or saving moves the goal.
- Be conversational and brief: 1-3 sentences, plain words, no lectures, never shame. Use £.
- You give friendly guidance, not regulated financial advice.
- If the message is not a spending question (chat, advice), answer helpfully and set verdict "info" and price 0.`;

const DECIDE_TOOL = {
  name: "decide",
  description: "Give Claudia's verdict and reply to the user's message.",
  input_schema: {
    type: "object",
    properties: {
      verdict: { type: "string", enum: ["buy", "wait", "skip", "swap", "info"] },
      reply: { type: "string", description: "What Claudia says, 1-3 friendly sentences." },
      price: { type: "number", description: "Price in GBP being considered, 0 if no purchase." },
      matchedPriority: {
        type: "string",
        description: "The user's priority this relates to (e.g. wellness, travel, food, money) or 'none'.",
      },
      alternative: { type: "string", description: "Optional cheaper or better-timed alternative." },
    },
    required: ["verdict", "reply", "price", "matchedPriority"],
  },
};

// ---- Claude ----
async function decideWithClaude(system, messages) {
  if (!client) throw new Error("ANTHROPIC_API_KEY is not set in server/.env");
  const result = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    system,
    tools: [DECIDE_TOOL],
    tool_choice: { type: "tool", name: "decide" },
    messages,
  });
  return result.content.find((b) => b.type === "tool_use")?.input;
}

// ---- Gemini (free tier fallback) ----
const GEMINI_SCHEMA = {
  type: "OBJECT",
  properties: {
    verdict: { type: "STRING", enum: ["buy", "wait", "skip", "swap", "info"] },
    reply: { type: "STRING" },
    price: { type: "NUMBER" },
    matchedPriority: { type: "STRING" },
    alternative: { type: "STRING" },
  },
  required: ["verdict", "reply", "price", "matchedPriority"],
};

// Gemini wants roles user/model, starting with user, and alternating.
export function toGeminiContents(messages) {
  const out = [];
  for (const m of messages) {
    const role = m.role === "assistant" ? "model" : "user";
    if (!out.length && role === "model") continue;
    if (out.length && out[out.length - 1].role === role) {
      out[out.length - 1].parts[0].text += "\n" + m.content;
    } else {
      out.push({ role, parts: [{ text: m.content }] });
    }
  }
  return out;
}

async function decideWithGemini(system, messages) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set in server/.env");
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: toGeminiContents(messages),
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: GEMINI_SCHEMA,
          temperature: 0.7,
        },
      }),
    }
  );
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const data = await r.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

app.get("/health", (_req, res) =>
  res.json({ ok: true, provider: PROVIDER, model: PROVIDER === "gemini" ? GEMINI_MODEL : MODEL })
);

app.post("/context", (req, res) => {
  try {
    res.json(buildContext(req.body.userData ?? {}));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/claudia", async (req, res) => {
  try {
    const { messages = [], userData = {} } = req.body;
    if (!messages.length) return res.status(400).json({ error: "messages required" });

    const ctx = buildContext(userData);
    const system = `${SYSTEM_PROMPT}\n\nUSER FACTS (authoritative):\n${JSON.stringify(ctx, null, 2)}`;
    const msgs = messages.map((m) => ({ role: m.role, content: String(m.content) }));
    const lastUser = [...msgs].reverse().find((m) => m.role === "user")?.content ?? "";
    let decision;
    let source = "ai";
    try {
      if (PROVIDER === "offline") throw new Error("offline mode");
      decision =
        PROVIDER === "gemini" ? await decideWithGemini(system, msgs) : await decideWithClaude(system, msgs);
      if (!decision) throw new Error("No decision returned");
    } catch (e) {
      // AI unreachable (network, key, quota...). Fall back to the rule-based brain so the app never breaks.
      if (PROVIDER !== "offline") console.warn("AI failed, using offline brain:", e.cause?.code || e.message);
      decision = offlineDecision(lastUser, ctx);
      source = "offline";
    }

    res.json({ ...applyGuardrail(decision, ctx), source });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Claudia server on http://localhost:${PORT} using ${PROVIDER} (${PROVIDER === "gemini" ? GEMINI_MODEL : MODEL})`)
);
