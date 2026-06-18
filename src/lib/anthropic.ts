export const callAnthropicAPI = async (prompt: string, systemPrompt?: string) => {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('مفتاح Anthropic API (VITE_ANTHROPIC_API_KEY) غير موجود في إعدادات النظام.');
  }

  const messages = [{ role: 'user', content: prompt }];

  const requestBody: any = {
    model: 'claude-3-opus-20240229',
    max_tokens: 4096,
    messages
  };

  if (systemPrompt) {
    requestBody.system = systemPrompt;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerously-allow-browser': 'true'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error('Anthropic API Error:', errorData);
    throw new Error(errorData?.error?.message || `حدث خطأ في الاتصال بخوادم الذكاء الاصطناعي (رمز الخطأ: ${response.status})`);
  }

  const data = await response.json();
  return data.content[0].text;
};
