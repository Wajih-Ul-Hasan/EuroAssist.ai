import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function extractText(result: any): string {
  const parts = result?.response?.candidates?.[0]?.content?.parts;
  return parts?.map((p: any) => p.text).join("\n").trim() || "";
}

export async function generateUniversityResponse(userMessage: string, stream = false): Promise<any> {
  const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });

  const systemInstruction = `You are EuroAssist.ai, a helpful AI assistant specializing in European university information.
                             Provide accurate, up-to-date details on rankings, tuition, scholarships, deadlines, programs, and student life.`;

  const prompt = `${systemInstruction}\n\nUser Question: ${userMessage}`;

  if (stream) {
    return await model.generateContentStream(prompt);
  }

  const result = await model.generateContent(prompt);
  const text = extractText(result);
  return text || "I couldn’t generate a response.";
}

export async function generateChatTitle(userMessage: string): Promise<string> {
  try {
    const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt =
      "Generate a concise, descriptive title (max 50 characters) for a chat conversation based on the user's first message. " +
      "Respond with only the title, no quotes or extra text.\n\nUser Message: " +
      userMessage;

    const result = await model.generateContent(prompt);
    const text = extractText(result);

    return text || "University Information";
  } catch (error) {
    console.error("Error generating chat title:", error);
    return "University Information";
  }
}

