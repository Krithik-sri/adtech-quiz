import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
// Note: In a real production app, ensure this is behind a backend proxy or 
// restricted by referral in Google Cloud Console.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIExplanation = async (topic: string, userError: string): Promise<string> => {
  try {
    const model = "gemini-3-flash-preview"; 
    
    const prompt = `
      You are an expert AdTech professor. A student is taking a quiz based on "The AdTech Book".
      The student answered a question about "${topic}" incorrectly.
      The specific context is: ${userError}.
      
      Please provide a concise (max 3 sentences), witty, and encouraging explanation of the concept. 
      Use a "fun fact" or a simple analogy (like comparing AdTech to a stock market or a supermarket) to help them understand.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "The AI is currently offline, but remember: AdTech is all about the right ad, right time, right person!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The AdTech servers are busy! Check the explanation below the question for now.";
  }
};