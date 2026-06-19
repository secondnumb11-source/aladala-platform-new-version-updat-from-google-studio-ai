import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

async function main() {
  const params = {
    messages: [
      { role: "system", content: "System prompt" },
      { role: "user", content: "Hello" }
    ]
  };

  const system = params.messages.find((m: any) => m.role === 'system')?.content || '';
  const msgs = params.messages.filter((m: any) => m.role !== 'system').map((m: any) => ({ role: m.role, content: m.content }));
  
  const formattedMsgs = msgs.map((m: any) => `${m.role === 'user' ? 'User' : 'Model'}: ${m.content}`).join('\n\n');
  const prompt = `${system ? `System: ${system}\n\n` : ''}${formattedMsgs}`;
  
  console.log("PROMPT IS:");
  console.log(prompt);
  
  try {
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
