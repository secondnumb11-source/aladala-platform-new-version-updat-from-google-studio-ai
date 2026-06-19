import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

async function main() {
  const system = "أنت المستشار القانوني والمرافع المسؤول بمكتب العدالة للمحاماة والاستشارات القانونية بالمملكة العربية السعودية. تحلى بالدقة والموضوعية مستنداً إلى الأنظمة واللوائح السعودية الصادرة مرخراً.";
  const prompt = `System: ${system}\n\nUser: test`;
  
  try {
    console.log("Calling Gemini with Arabic system prompt...");
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    console.log("Success! Response is:", response.text);
  } catch (err: any) {
    console.error(`Gemini API Error: ${err.message}`);
  }
}

main();
