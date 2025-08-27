import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function generateUniversityResponse(userMessage: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
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
          Be encouraging and supportive to students planning their education journey.`
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try asking your question again.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate AI response. Please try again later.");
  }
}

export async function generateChatTitle(userMessage: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "Generate a concise, descriptive title (max 50 characters) for a chat conversation based on the user's first message. The title should capture the main topic they're asking about regarding European universities. Respond with only the title, no quotes or extra text."
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      max_tokens: 20,
      temperature: 0.3,
    });

    return response.choices[0].message.content?.trim() || "University Information";
  } catch (error) {
    console.error("Error generating chat title:", error);
    return "University Information";
  }
}
