
import { GoogleGenAI, Type } from "@google/genai";

// API_KEY is handled by the environment as per instructions
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getSmartBreakdown = async (goal: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `당신은 생산성 전문가입니다. 다음 목표를 달성하기 위한 구체적이고 실행 가능한 하위 작업 3~5개를 한국어로 작성해 주세요. 목표: "${goal}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '한국어로 작성된 하위 작업 리스트'
            }
          },
          required: ['tasks']
        }
      }
    });

    const data = JSON.parse(response.text || '{"tasks": []}');
    return data.tasks as string[];
  } catch (error) {
    console.error("Gemini breakdown error:", error);
    return [];
  }
};

export const getPriorityAdvice = async (todos: string[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `다음 할 일 목록을 검토해 주세요: ${todos.join(', ')}. 오늘 가장 생산성을 높이기 위해 가장 먼저 집중해야 할 일은 무엇인가요? 그 이유와 함께 한국어로 친절하게 한 문장으로 조언해 주세요.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini priority advice error:", error);
    return "현재 목록에서 가장 중요해 보이는 일부터 차근차근 시작해 보세요! 할 수 있습니다.";
  }
};
