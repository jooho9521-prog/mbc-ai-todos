
import { GoogleGenAI, Type } from "@google/genai";

/**
 * AI 서비스 초기화
 * API 키는 환경 변수에서 직접 참조합니다.
 */
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * AI 하루 일과표(Timetable) 생성 서비스
 * 모델: gemini-3-flash-preview (빠른 응답과 JSON 구조 생성에 최적화)
 */
export const getDayPlanner = async (theme: string) => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `당신은 세계 최고의 시간 관리 전문가입니다. 
다음 테마와 목표에 가장 적합한 효율적인 하루 타임테이블을 한국어로 작성해 주세요. 
오전 09:00 시작을 기준으로 하며, 작업 사이의 적절한 휴식과 집중 시간을 고려하십시오.

테마: "${theme}"

출력 형식은 반드시 아래의 필드를 가진 JSON 배열이어야 합니다:
[{"time": "09:00 - 10:00", "task": "작업 내용"}]`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: { type: Type.STRING, description: '시간 범위 (예: 09:00 - 10:00)' },
              task: { type: Type.STRING, description: '구체적인 작업 내용' }
            },
            required: ['time', 'task']
          }
        },
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("AI가 응답을 생성하지 못했습니다.");
    }
    
    // JSON 응답 파싱 (MimeType 설정으로 인해 텍스트 자체가 JSON임)
    try {
      const data = JSON.parse(text);
      return data as { time: string, task: string }[];
    } catch (parseError) {
      console.error("JSON 파싱 에러:", text);
      throw new Error("생성된 데이터 형식이 올바르지 않습니다.");
    }
  } catch (error) {
    console.error("Gemini planner service error:", error);
    throw error; 
  }
};

/**
 * 심층 생산성 코칭 서비스
 * 모델: gemini-3-pro-preview (복잡한 추론에 최적화)
 */
export const getPriorityAdvice = async (todos: string[]) => {
  try {
    const ai = getAiClient();
    const systemInstruction = `당신은 세계적인 엘리트 생산성 파트너이자 전략 심리학 전문가입니다.
사용자는 이미 높은 수준의 자기관리 능력을 갖춘 숙련자입니다. 
불필요한 기호(#, *, - 등)를 제거하고 명확한 소제목과 단락으로만 전략적 조언을 작성하십시오.
사용자의 의지력을 존중하며, 실행력을 1% 더 끌어올리는 구체적인 전략에 집중하십시오.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `현재 할 일 목록: ${todos.join(', ')}`,
      config: {
        systemInstruction,
        temperature: 0.5,
      },
    });
    
    return response.text;
  } catch (error) {
    console.error("Gemini priority advice error:", error);
    return "데이터를 분석하는 도중 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
};
