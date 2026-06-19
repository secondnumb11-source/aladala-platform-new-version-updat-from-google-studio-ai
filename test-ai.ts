import 'dotenv/config'; // Make sure process.env runs
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "System: Test\n\nUser: Test message"
    });
    console.log("Success:", !!response.text);
  } catch (err) {
    console.error("Error from AI generateContent:", err.message);
  }
}

main();
