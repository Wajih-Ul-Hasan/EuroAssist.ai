import OpenAI from "openai";

/**
 * This module supports two providers:
 * - OpenAI (default) via OPENAI_PROVIDER=openai
 * - Google Generative Language (Gemini) via OPENAI_PROVIDER=gemini
 *
 * For Gemini you must provide GOOGLE_API_KEY and optionally GOOGLE_MODEL (default gemini-flash-2.0).
 *
 * Keep the existing OpenAI behaviour if OPENAI_PROVIDER is not 'gemini'.
 */

const OPENAI_PROVIDER = (process.env.OPENAI_PROVIDER || "openai").toLowerCase();

const openai = new OpenAI({
  apiKey:
    process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key",
});

function sanitize(str: string) {
  return String(str || "").trim();
}

async function callGemini(promptText: string, maxOutputTokens = 512, temperature = 0.7) {
  const model = process.env.GOOGLE_MODEL || "gemini-flash-2.0";
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY must be set to use Gemini provider");
  }

  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generate?key=${apiKey}`;

  const body = {
    prompt: {
      text: promptText,
    },
    temperature,
    maxOutputTokens,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${text}`);
  }

  const json = await res.json();
  const candidate = json?.candidates?.[0]?.output || json?.candidates?.[0]?.content;
  if (!candidate) {
    throw new Error("Gemini returned no content");
  }
  return sanitize(candidate);
}

export async function generateUniversityResponse(userMessage: string): Promise<string> {
  const user = sanitize(userMessage);

  if (OPENAI_PROVIDER === "gemini") {
    const system = `You are EuroAssist.ai, a helpful assistant specializing in European university information.
You provide accurate, up-to-date info on:
- rankings and comparisons
- tuition fees & living costs
- scholarships & financial aid
- admission requirements & deadlines
- academic programs and student life

Be concise, structured, and helpful. Use markdown where appropriate.`;
    const promptText = `${system}\n\nUser: ${user}`;
    try {
      const out = await callGemini(promptText, 1024, 0.7);
      return out;
    } catch (err) {
      console.error("Gemini error:", err);
      throw new Error("Failed to generate AI response. Please try again later.");
    }
  }

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are EuroAssist.ai, a helpful AI assistant specializing in European university information. 
You provide accurate, up-to-date information about:
- University rankings and comparisons across Europe
- Tuition fees and living costs
- Scholarship opportunities and financial aid
- Admission requirements and application deadlines
- Academic programs and specializations
- Student life and campus information

Always provide specific, actionable information when possible. If you don't have current data, 
clearly state this and suggest where users might find the most recent information.

Format your responses in a clear, structured way using markdown when helpful.
Be encouraging and supportive to students planning their education journey.`,
        },
        {
          role: "user",
          content: user,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    return (
      response.choices?.[0]?.message?.content?.toString() ||
      "I apologize, but I couldn't generate a response. Please try asking your question again."
    );
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate AI response. Please try again later.");
  }
}

export async function generateChatTitle(userMessage: string): Promise<string> {
  const user = sanitize(userMessage);

  if (OPENAI_PROVIDER === "gemini") {
    const system = `Generate a concise descriptive title (max 50 characters) for a chat conversation based on the user's first message. Respond with only the title, no quotes or extra text.`;
    const promptText = `${system}\n\nUser: ${user}`;
    try {
      const out = await callGemini(promptText, 40, 0.3);
      const oneLine = out.split(/\r?\n/)[0].slice(0, 50).trim();
      return oneLine || "University Information";
    } catch (err) {
      console.error("Gemini title error:", err);
      return "University Information";
    }
  }

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-5",
      messages: [
        {
          role: "system",
          content:
            "Generate a concise, descriptive title (max 50 characters) for a chat conversation based on the user's first message. The title should capture the main topic they're asking about regarding European universities. Respond with only the title, no quotes or extra text.",
        },
        {
          role: "user",
          content: user,
        },
      ],
      max_tokens: 20,
      temperature: 0.3,
    });

    return (response.choices?.[0]?.message?.content?.trim() as string) || "University Information";
  } catch (error) {
    console.error("Error generating chat title:", error);
    return "University Information";
  }
}