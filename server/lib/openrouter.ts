import OpenAI from 'openai';

export function createOpenRouterClient() {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
  });
}

export function stripMarkdownCodeFences(text: string) {
  return text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
}

export async function transcribeAudioBase64(params: {
  audioBase64: string;
  audioFormat: string;
  model?: string;
}) {
  const openai = createOpenRouterClient();
  const modelToTry = params.model || 'google/gemini-2.5-flash';

  const makeRequest = async (model: string) => {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '아래 오디오를 한국어로 정확히 받아써 주세요. 불필요한 설명 없이 전사 텍스트만 출력하세요.',
            },
            {
              type: 'input_audio',
              input_audio: {
                data: params.audioBase64,
                format: params.audioFormat,
              },
            },
          ] as any,
        },
      ],
      temperature: 0,
      max_tokens: 1500,
    });

    return completion.choices[0]?.message?.content?.trim() || '';
  };

  try {
    const text = await makeRequest(modelToTry);
    return text;
  } catch (err) {
    // Fallback to a commonly audio-capable model if the chosen model doesn't accept audio.
    const fallbackModel = 'google/gemini-2.5-flash';
    if (modelToTry !== fallbackModel) {
      const text = await makeRequest(fallbackModel);
      return text;
    }
    throw err;
  }
}


