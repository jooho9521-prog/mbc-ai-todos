
import { GoogleGenAI, Type } from "@google/genai";

/**
 * AI 서비스 초기화
 * API 키는 환경 변수에서 직접 참조합니다.
 */
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * AI 하루 일과표(Timetable) 생성 서비스
 * 모델: gemini-3-flash-preview (구조화된 데이터 생성에 최적화)
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
[{"time": "09:00 - 10:00", "task": "작업 내용"}, ...]`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: { type: Type.STRING, description: '시간 범위' },
              task: { type: Type.STRING, description: '구체적인 작업 내용' }
            },
            required: ['time', 'task']
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI 응답이 비어 있습니다.");
    
    const data = JSON.parse(text);
    return data as { time: string, task: string }[];
  } catch (error) {
    console.error("Gemini planner error:", error);
    throw error; // App.tsx에서 에러 처리를 위해 throw
  }
};

/**
 * 심층 생산성 코칭 서비스
 * 모델: gemini-3-pro-preview (복잡한 추론 및 분석에 최적화)
 */
export const getPriorityAdvice = async (todos: string[]) => {
  try {
    const ai = getAiClient();
    const systemInstruction = `당신은 세계적인 엘리트 생산성 파트너이자 전략 심리학 전문가입니다.
사용자는 이미 높은 수준의 자기관리 능력을 갖춘 숙련자입니다. 
사용자의 의지력을 의심하거나 가르치려 들지 마십시오. 대신, 고도로 훈련된 전문가의 성과를 1% 더 끌어올리는 전략적 조언에 집중하십시오.

[출력 규칙 - 반드시 준수]
1. 불필요한 기호(#, *, -, 등)를 최소화하십시오. 
2. 단락 구분과 명확한 소제목만 사용하여 미니멀하게 작성하십시오.
3. 무례한 추측이나 부정적인 예측을 금지합니다.
4. 품격 있고 정중한 전문 용어를 사용하십시오.

[답변 구조]
전략적 현상 분석: (할 일 목록의 구조적 배치를 분석)
심층 인사이트: (작업 간 인지적 전환 비용이나 에너지 효율에 대한 심리학적 근거)
마스터 실행 제안: (가장 먼저 타격해야 할 핵심 지점 제안)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `현재 구성된 할 일 목록입니다. 프로페셔널한 관점에서 전략적 조언을 부탁드립니다: ${todos.join(', ')}`,
      config: {
        systemInstruction,
        temperature: 0.5,
      },
    });
    
    return response.text;
  } catch (error) {
    console.error("Gemini priority advice error:", error);
    return "데이터를 정밀 분석하는 도중 일시적인 오류가 발생했습니다. 잠시 후 다시 파트너십을 가동하겠습니다.";
  }
};
