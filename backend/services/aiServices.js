const dotenv = require("dotenv");
const https = require("https");
const dns = require("dns");

dotenv.config();

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

let cachedModelList = [];
let modelCacheTimestamp = 0;
const MODEL_CACHE_TTL_MS = 60 * 60 * 1000;

const EXCLUDED_MODEL_KEYWORDS = [
  "whisper",
  "guard",
  "vision",
  "tts",
  "orpheus",
  "embed",
  "safeguard",
];

const httpsJsonRequest = (
  urlString,
  { method = "GET", headers = {}, body = null, timeoutMs = 25000, family = 4 } = {}
) => {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method,
      ...(family ? { family } : {}),
      headers: {
        ...headers,
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => {
        raw += chunk;
      });
      res.on("end", () => {
        try {
          const data = raw ? JSON.parse(raw) : {};
          resolve({
            status: res.statusCode,
            ok: res.statusCode >= 200 && res.statusCode < 300,
            data,
          });
        } catch (parseErr) {
          reject(
            new Error(
              `Invalid JSON response (HTTP ${res.statusCode}): ${raw.slice(0, 180)}`
            )
          );
        }
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Request timed out after ${timeoutMs}ms (ETIMEDOUT)`));
    });

    req.on("error", async (err) => {
      if (family === 4 && err.code === "ENETUNREACH") {
        try {
          const retryRes = await httpsJsonRequest(urlString, {
            method,
            headers,
            body,
            timeoutMs,
            family: undefined,
          });
          resolve(retryRes);
          return;
        } catch (retryErr) {
          reject(retryErr);
          return;
        }
      }
      const code = err.code || err.cause?.code || "";
      reject(new Error(code ? `${err.message} (${code})` : err.message));
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
};

const getGroqModels = async (apiKey) => {
  const isCacheValid =
    cachedModelList.length > 0 &&
    Date.now() - modelCacheTimestamp < MODEL_CACHE_TTL_MS;

  if (isCacheValid) return cachedModelList;

  try {
    const { ok, data } = await httpsJsonRequest(
      "https://api.groq.com/openai/v1/models",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
        timeoutMs: 15000,
      }
    );

    if (ok && Array.isArray(data.data) && data.data.length > 0) {
      const chatModels = data.data
        .map((m) => m.id)
        .filter(
          (id) =>
            !EXCLUDED_MODEL_KEYWORDS.some((kw) =>
              id.toLowerCase().includes(kw)
            )
        );

      const scoreModel = (id) => {
        const lower = id.toLowerCase();
        if (lower === "llama-3.3-70b-versatile") return 100;
        if (lower === "llama-3.1-8b-instant") return 95;
        if (lower.includes("llama-3.3")) return 90;
        if (lower.includes("llama")) return 80;
        if (lower.includes("qwen") || lower.includes("gpt-oss")) return 70;
        if (lower.includes("gemma")) return 60;
        return 10;
      };

      chatModels.sort((a, b) => scoreModel(b) - scoreModel(a));

      if (chatModels.length > 0) {
        cachedModelList = chatModels;
        modelCacheTimestamp = Date.now();
        console.log("[Groq Models Active]:", cachedModelList.slice(0, 4));
        return cachedModelList;
      }
    }
  } catch (err) {
    console.error("[Groq Model Fetch Error]:", err.message);
  }

  cachedModelList = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "meta-llama/llama-4-scout-17b-16e-instruct",
  ];
  modelCacheTimestamp = Date.now();
  return cachedModelList;
};

const callGroqAI = async (promptOrMessages, systemInstruction = "") => {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing from backend/.env");
  }

  const models = await getGroqModels(apiKey);

  const messages = [];
  if (systemInstruction) {
    messages.push({ role: "system", content: systemInstruction });
  }

  if (Array.isArray(promptOrMessages)) {
    messages.push(...promptOrMessages);
  } else {
    messages.push({ role: "user", content: String(promptOrMessages) });
  }

  let lastError = "Unknown Groq AI error";

  for (const model of models) {
    try {
      const { status, ok, data } = await httpsJsonRequest(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: {
            model,
            messages,
            temperature: 0.7,
            max_tokens: 1500,
          },
          timeoutMs: 25000,
        }
      );

      if (!ok || data.error) {
        const errMsg = data?.error?.message || `HTTP ${status}`;
        lastError = errMsg;

        if (status === 401) {
          throw new Error(`Groq Authentication Failed: ${errMsg}`);
        }

        console.log(`[Groq ${model} skipped]: ${errMsg}`);
        continue;
      }

      const content = data?.choices?.[0]?.message?.content?.trim();
      if (content) {
        return { text: content, model };
      }
    } catch (err) {
      if (err.message.includes("Authentication Failed")) {
        throw err;
      }
      lastError = err.message;
      console.error(`[Groq ${model} Error]:`, err.message);
    }
  }

  throw new Error(
    `AI is currently unavailable (${lastError}). Please try again.`
  );
};

const generateAIResponse = async (prompt) => {
  const systemInstruction =
    "You are VitalFit AI, a helpful, safe, and motivational fitness coach. Provide personalized fitness and nutrition analysis strictly based on the user's data provided. Do not diagnose medical conditions. Keep responses clear, well-structured, and actionable.";
  const { text } = await callGroqAI(prompt, systemInstruction);
  return text;
};

const generateChatResponse = async (
  userMessage,
  userStats = {},
  history = []
) => {
  const systemInstruction = `
You are VitalFit AI Coach inside an interactive fitness chat.
Always answer directly using the user's real telemetry and profile context below—never give generic placeholder replies.
Be encouraging, concise, and practical. Use clean bullet points (- item) for workouts, macros, or action steps. Do not give medical diagnoses.

User Live & 7-Day Telemetry:
${JSON.stringify(userStats)}
  `.trim();

  const chatMessages = [];

  if (Array.isArray(history)) {
    history.slice(-6).forEach((m) => {
      if (!m?.text || typeof m.text !== "string") return;
      const role =
        m.role === "assistant" || m.role === "bot" ? "assistant" : "user";
      chatMessages.push({ role, content: m.text.trim() });
    });
  }

  chatMessages.push({ role: "user", content: userMessage });

  return await callGroqAI(chatMessages, systemInstruction);
};

const generateWorkoutPlan = async ({ goal, level, minutes, equipment }) => {
  const prompt = `Create a ${minutes || 30}-minute ${
    level || "intermediate"
  } workout focused on ${goal || "general fitness"} using ${
    equipment || "bodyweight"
  }. Include warm-up, main exercises with sets/reps/rest, and cooldown.`;
  const systemInstruction =
    "You are VitalFit Strength & Conditioning AI. Build structured, practical workout plans with warm-up, exercises, sets, reps, and rest times.";
  return await callGroqAI(prompt, systemInstruction);
};

const generateNutritionAdvice = async ({
  calories,
  protein,
  carbs,
  fats,
  goal,
}) => {
  const prompt = `User intake/target: ${calories || 0} kcal (Protein: ${
    protein || 0
  }g, Carbs: ${carbs || 0}g, Fats: ${fats || 0}g). Goal: ${
    goal || "balanced nutrition"
  }. Review these macros and suggest 2 practical high-value meals or snacks.`;
  const systemInstruction =
    "You are VitalFit Nutrition AI. Give practical macro-friendly meal and hydration suggestions based on user goals. Avoid medical claims.";
  return await callGroqAI(prompt, systemInstruction);
};

module.exports = {
  generateAIResponse,
  generateChatResponse,
  generateWorkoutPlan,
  generateNutritionAdvice,
};