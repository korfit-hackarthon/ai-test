import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import OpenAI from 'openai';

const app = new Hono();

// 직무 카테고리 및 역할 ENUM
const JOB_CATEGORIES_ROLES = {
  IT_DEVELOPMENT: [
    'SOFTWARE_ENGINEER',
    'WEB_DEVELOPER',
    'BACKEND_DEVELOPER',
    'FRONTEND_DEVELOPER',
    'JAVA_DEVELOPER',
    'C_CPP_DEVELOPER',
    'PYTHON_DEVELOPER',
    'MACHINE_LEARNING_ENGINEER',
    'DEVOPS_ENGINEER',
    'DATA_ENGINEER',
    'NODEJS_DEVELOPER',
    'SYSTEM_NETWORK_ADMIN',
    'ANDROID_DEVELOPER',
    'IOS_DEVELOPER',
    'EMBEDDED_DEVELOPER',
    'TECH_SUPPORT',
    'QA_TEST_ENGINEER',
    'DATA_SCIENTIST',
    'SECURITY_ENGINEER',
    'BIGDATA_ENGINEER',
    'HARDWARE_ENGINEER',
    'BLOCKCHAIN_ENGINEER',
    'CROSS_PLATFORM_APP_DEVELOPER',
    'DBA',
    'PHP_DEVELOPER',
    'DOTNET_DEVELOPER',
    'GRAPHICS_ENGINEER',
    'AR_VR_ENGINEER',
    'RUBY_ON_RAILS_DEVELOPER',
  ],
  BUSINESS_MANAGEMENT: [
    'PM_PO',
    'PROJECT_MANAGER',
    'STRATEGY_PLANNER',
    'OPERATIONS_MANAGER',
    'DATA_ANALYST',
    'BRAND_MANAGER',
    'GLOBAL_BUSINESS_DEVELOPER',
    'CONSULTANT',
    'PURCHASING_MANAGER',
    'BUSINESS_INNOVATOR',
    'AGILE_COACH',
  ],
  MARKETING_ADVERTISING: [
    'MARKETING_MANAGER',
    'DIGITAL_MARKETER',
    'CONTENT_MARKETER',
    'PERFORMANCE_MARKETER',
    'BRAND_MARKETER',
    'GLOBAL_MARKETING_MANAGER',
    'SNS_MARKETER',
    'PR_SPECIALIST',
    'GROWTH_HACKER',
    'MARKETING_DIRECTOR',
    'MARKET_RESEARCHER',
  ],
  DESIGN: [
    'UI_UX_DESIGNER',
    'WEB_DESIGNER',
    'GRAPHIC_DESIGNER',
    'SPACE_DESIGNER',
    'MOTION_DESIGNER',
    'FASHION_DESIGNER',
    'ART_DIRECTOR',
    'INDUSTRIAL_DESIGNER',
    'FURNITURE_DESIGNER',
    'LANDSCAPE_DESIGNER',
  ],
  SALES: [
    'INTERNATIONAL_SALES',
    'TECHNICAL_SALES',
    'SOLUTION_CONSULTANT',
    'MEDIA_SALES',
    'CUSTOMER_SUCCESS_MANAGER',
    'SALES_ENGINEER',
  ],
  CUSTOMER_SERVICE_RETAIL: [
    'GLOBAL_CS_MANAGER',
    'RETAIL_MD',
    'CUSTOMER_SUPPORT',
    'FASHION_MD',
    'CRM_SPECIALIST',
    'RECEPTIONIST',
    'TRAVEL_AGENT',
    'FLIGHT_ATTENDANT',
    'STORE_CLERK',
    'TOURISM_WORKER',
  ],
  TRANSLATION_INTERPRETATION: [
    'INTERPRETER',
    'TRANSLATOR',
    'LOCALIZATION_SPECIALIST',
  ],
  MEDIA: [
    'CONTENT_CREATOR',
    'VIDEO_EDITOR',
    'VIDEO_PRODUCER',
    'WRITER',
    'PHOTOGRAPHER',
    'JOURNALIST',
    'CURATOR',
  ],
  ENGINEERING_DESIGN: [
    'ELECTRICAL_ENGINEER',
    'ROBOTICS_AUTOMATION_ENGINEER',
    'MECHANICAL_ENGINEER',
    'CAD_3D_DESIGNER',
    'ELECTRIC_ENGINEER',
    'CONTROL_ENGINEER',
    'PRODUCT_ENGINEER',
    'ELECTROMECHANICAL_ENGINEER',
    'EQUIPMENT_ENGINEER',
    'QA_ENGINEER',
    'INDUSTRIAL_ENGINEER',
    'RF_ENGINEER',
    'CHEMICAL_ENGINEER',
    'AEROSPACE_ENGINEER',
    'IC_ENGINEER',
    'MATERIAL_ENGINEER',
    'PLANT_ENGINEER',
    'PLASTIC_ENGINEER',
    'QC_ENGINEER',
    'STRUCTURAL_ENGINEER',
    'CONSTRUCTION_ENGINEER',
    'CIVIL_ENGINEER',
    'ENVIRONMENTAL_ENGINEER',
    'PRODUCTION_ENGINEER',
    'RND_RESEARCHER',
  ],
  HR: [
    'GLOBAL_HR_MANAGER',
    'RECRUITER',
    'HR_CONSULTANT',
    'TECH_TRAINER',
    'INHOUSE_TRAINER',
  ],
  GAME_PRODUCTION: [
    'GAME_PLANNER',
    'GAME_ARTIST',
    'GAME_CLIENT_DEVELOPER',
    'UNITY_DEVELOPER',
    'GAME_GRAPHIC_DESIGNER',
    'GAME_SERVER_DEVELOPER',
    'MOBILE_GAME_DEVELOPER',
    'UNREAL_DEVELOPER',
  ],
  FINANCE: ['INVESTMENT_BANKER', 'ASSET_MANAGER', 'FINANCIAL_ENGINEER'],
  MANUFACTURING_PRODUCTION: [
    'MACHINE_TECHNICIAN',
    'MANUFACTURING_TEST_ENGINEER',
    'MANUFACTURING_ENGINEER',
    'MANUFACTURING_CHEMIST',
    'SEMICONDUCTOR_DISPLAY_ENGINEER',
    'PRODUCTION_WORKER',
  ],
  EDUCATION: ['INSTRUCTOR', 'LANGUAGE_EDUCATOR'],
  HEALTHCARE_PHARMA_BIO: [
    'BIOTECH_RESEARCHER',
    'CLINICAL_RESEARCHER',
    'MICROBIOLOGIST',
    'HOSPITAL_COORDINATOR',
    'PHARMACEUTICAL_CHEMIST',
    'GENETIC_ENGINEER',
    'CAREGIVER',
  ],
  LOGISTICS_TRADE: [
    'LOGISTICS_MANAGER',
    'LOGISTICS_ANALYST',
    'EXPORT_IMPORT_OFFICER',
    'TRADE_OFFICER',
    'BUYER_MANAGER',
    'AIR_TRANSPORT_AGENT',
    'MARINE_TRANSPORT_AGENT',
    'LOGISTICS_FIELD_WORKER',
  ],
  FOOD_BEVERAGE: [
    'FOOD_SERVICE_WORKER',
    'CHEF',
    'MENU_DEVELOPER',
    'BARTENDER',
    'SOMMELIER',
    'FOOD_STYLIST',
  ],
  CONSTRUCTION_FACILITIES: [
    'ARCHITECT',
    'CONSTRUCTION_SUPERVISOR',
    'MAINTENANCE_MANAGER',
    'CONSTRUCTION_WORKER',
    'WELDER',
    'CARPENTER',
    'HEAVY_EQUIPMENT_TECHNICIAN',
  ],
  ENTERTAINMENT: ['MODEL', 'ACTOR', 'SHOW_HOST'],
};

const COMPANY_TYPES = [
  'LARGE_CORPORATION',
  'MIDSIZE_COMPANY',
  'SMALL_MEDIUM_ENTERPRISE',
  'MICRO_BUSINESS',
  'SOLE_PROPRIETOR',
  'CORPORATION',
  'SOCIAL_ENTERPRISE',
  'COOPERATIVE',
  'ETC',
];

const CONTRACT_TYPES = [
  'INTERN',
  'EXPERIENCED',
  'CONTRACT',
  'NEWCOMER',
  'REGULAR',
];

const WORK_TYPES = ['ONSITE', 'REMOTE', 'HYBRID', 'ETC'];

const WORK_DAY_TYPES = [
  'WEEKDAYS',
  'WEEKENDS',
  'FULL_WEEK',
  'SIX_DAYS',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
  'ETC',
];

const SALARY_TYPES = ['ANNUAL', 'DAILY', 'WEEKLY', 'HOURLY', 'MONTHLY', 'ETC'];

const LANGUAGE_TYPES = [
  'ENGLISH',
  'KOREAN',
  'CHINESE',
  'JAPANESE',
  'SPANISH',
  'FRENCH',
  'GERMAN',
  'VIETNAMESE',
  'THAI',
  'INDONESIAN',
  'OTHER',
];

const VISA_TYPES = [
  'A1',
  'A2',
  'A3',
  'B1',
  'B2',
  'C1',
  'C2',
  'C3',
  'C4',
  'D1',
  'D2',
  'D3',
  'D4',
  'D5',
  'D6',
  'D7',
  'D8',
  'D9',
  'D10',
  'E1',
  'E2',
  'E3',
  'E4',
  'E5',
  'E6',
  'E7',
  'E8',
  'E9',
  'E10',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'G1',
  'H1',
  'H2',
];

// PDF 분석 요청 스키마
const analyzeSchema = z.object({
  pdfBase64: z.string().min(1),
  companyImageUrl: z.string().url(),
  directInputApplicationMethod: z.string().url(),
});

// 공고 등록 API 호출
async function registerRecruit(recruitData: any): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const response = await fetch('https://api.korfit.co.kr/api/v2/recruit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recruitData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `API 오류 (${response.status}): ${errorText}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

// 직무 카테고리 목록 조회
app.get('/job-categories', async (c) => {
  return c.json(JOB_CATEGORIES_ROLES);
});

// 개별 공고 등록 엔드포인트 (CORS 우회용 프록시)
app.post('/register', async (c) => {
  try {
    const recruitData = await c.req.json();
    console.log('[register] 공고 등록 요청:', recruitData.title || '제목 없음');

    const result = await registerRecruit(recruitData);

    if (result.success) {
      console.log('[register] ✅ 등록 성공:', recruitData.title);
      return c.json(result);
    } else {
      console.error('[register] ❌ 등록 실패:', result.error);
      return c.json(result, 400);
    }
  } catch (error) {
    console.error('[register] ❌ 요청 처리 오류:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      500
    );
  }
});

// 스트리밍 PDF 미리보기 (분석만)
app.post('/preview-stream', zValidator('json', analyzeSchema), async (c) => {
  console.log('[preview-stream] ========== 요청 수신 ==========');
  const { pdfBase64, companyImageUrl, directInputApplicationMethod } =
    c.req.valid('json');

  return streamSSE(c, async (stream) => {
    const sendEvent = async (type: string, data: any, id?: string) => {
      console.log(`[preview-stream] 이벤트 전송: ${type}`);
      await stream.writeSSE({
        data: JSON.stringify({ type, ...data }),
        event: type,
        id: id || Date.now().toString(),
      });
    };

    try {
      console.log('[preview-stream] 🚀 스트리밍 미리보기 시작');
      console.log('[preview-stream] PDF Base64 길이:', pdfBase64.length);
      console.log('[preview-stream] 회사 이미지 URL:', companyImageUrl);

      await sendEvent('start', {
        message: '📄 PDF 분석을 시작합니다...',
        timestamp: new Date().toISOString(),
      });

      console.log('[preview-stream] OpenAI 클라이언트 초기화...');
      const openai = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY,
      });
      console.log(
        '[preview-stream] API 키 존재 여부:',
        !!process.env.OPENROUTER_API_KEY
      );

      const jobCategoriesInfo = Object.entries(JOB_CATEGORIES_ROLES)
        .map(([cat, roles]) => `${cat}: ${roles.join(', ')}`)
        .join('\n');

      const prompt = `당신은 채용 공고 분석 전문가입니다. 주어진 PDF 채용 공고 내용을 분석하여 JSON 형식으로 변환해주세요.

중요 규칙:
1. 공고에 여러 직무가 있으면 각 직무별로 별도의 JSON 객체를 만들어야 합니다.
2. 모든 ENUM 값은 반드시 아래 목록에서 선택해야 합니다.
3. 정보가 없는 필드는 합리적인 기본값을 사용하세요.
4. 날짜 형식은 YYYY-MM-DD 입니다.
5. 시간 형식은 HH:mm 입니다 (예: 09:00, 18:00).
6. 여러 직무가 존재한다면 모든 직무를 빠뜨리지 않고 모든 직무별 json 객체를 전부 만들어야 합니다.

직무 카테고리 및 역할 ENUM:
${jobCategoriesInfo}

회사 유형 ENUM: ${COMPANY_TYPES.join(', ')}
계약 유형 ENUM: ${CONTRACT_TYPES.join(', ')}
근무 형태 ENUM: ${WORK_TYPES.join(', ')}
근무일 유형 ENUM: ${WORK_DAY_TYPES.join(', ')}
급여 유형 ENUM: ${SALARY_TYPES.join(', ')}
언어 ENUM: ${LANGUAGE_TYPES.join(', ')}
비자 ENUM: ${VISA_TYPES.join(', ')}

각 직무에 대해 다음 JSON 형식으로 응답하세요:
{
  "title": "채용 공고 제목 (직무명 포함)",
  "companyImageUrl": "${companyImageUrl}",
  "companyName": "회사명",
  "zipcode": "우편번호 (없으면 빈 문자열)",
  "address1": "주소1",
  "address2": "상세주소 (없으면 빈 문자열)",
  "companyType": "ENUM 값",
  "representativeName": "대표자명 (없으면 빈 문자열)",
  "establishedDate": "2025-12-03 (없으면 null)",
  "businessType": "업종",
  "jobRoles": ["해당 직무의 ENUM 값들"],
  "languageTypes": ["필요 언어 ENUM 값들"],
  "visas": ["가능 비자 ENUM 값들 (없으면 빈 배열)"],
  "isAlwaysRecruiting": false,
  "recruitStartDate": "채용 시작일(ex, 2025-12-03)",
  "recruitEndDate": "채용 종료일(ex, 2025-12-03)",
  "contractType": "ENUM 값",
  "directInputContractType": "",
  "jobCategories": ["해당 카테고리 ENUM 값"],
  "workType": "ENUM 값",
  "directInputWorkType": "",
  "workDayType": "ENUM 값",
  "directInputWorkDayType": "",
  "workStartTime": "09:00",
  "workEndTime": "18:00",
  "directInputWorkTime": "",
  "salaryType": "ENUM 값",
  "salary": 숫자 (연봉/월급 등, 없으면 0),
  "directInputSalaryType": "",
  "posterImageUrl": "",
  "mainTasks": "주요 업무 내용",
  "qualifications": "자격 요건",
  "preferences": "우대 사항",
  "others": "기타 사항",
  "applicationMethod": "WEBSITE",
  "directInputApplicationMethod": "${directInputApplicationMethod}",
  "recruitPublishStatus": "PUBLISHED"
}

companyImageUrl
directInputApplicationMethod
이 두개는 내가 위에 입력한 그대로 입력해주면 돼.

여러 직무가 있으면 JSON 배열로 응답하세요: [{ ... }, { ... }]
단일 직무면 배열 안에 하나만: [{ ... }]

정확히 위에 json 형식대로만 답변해줘야돼.
절대로 다른 컬럼을 추가하거나 빼면 안돼.

반드시 유효한 JSON 배열만 응답하세요. 다른 텍스트는 포함하지 마세요.`;

      await sendEvent('progress', {
        message: '🤖 AI 분석 중... (스트리밍 시작)',
        step: 'ai_analysis',
      });

      console.log('[preview-stream] 🔄 OpenAI API 스트리밍 호출 시작...');

      // Keep-alive 타이머 시작 (AI 응답 대기 중 연결 유지)
      let keepAliveCount = 0;
      const keepAliveInterval = setInterval(async () => {
        keepAliveCount++;
        console.log(`[preview-stream] 💓 Keep-alive #${keepAliveCount}`);
        try {
          await sendEvent('keepalive', {
            message: `⏳ AI가 PDF를 분석하고 있습니다... (${keepAliveCount * 3}초 경과)`,
            elapsed: keepAliveCount * 3,
          });
        } catch (e) {
          console.log('[preview-stream] Keep-alive 전송 실패, 연결 끊김');
          clearInterval(keepAliveInterval);
        }
      }, 3000); // 3초마다 keep-alive 전송

      // 스트리밍으로 AI 응답 받기
      let streamResponse: AsyncIterable<any>;
      try {
        streamResponse = (await openai.chat.completions.create({
          model: 'google/gemini-3-pro-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                },
                {
                  type: 'file',
                  file: {
                    filename: 'recruit.pdf',
                    file_data: `data:application/pdf;base64,${pdfBase64}`,
                  },
                },
              ],
            },
          ],
          plugins: [
            {
              id: 'file-parser',
              pdf: {
                engine: 'mistral-ocr',
              },
            },
          ],
          temperature: 0.3,
          max_tokens: 300000,
          stream: true,
        } as any)) as unknown as AsyncIterable<any>;
        console.log('[preview-stream] ✅ OpenAI API 스트리밍 연결 성공');
      } catch (apiError) {
        clearInterval(keepAliveInterval); // keep-alive 중지
        console.error('[preview-stream] ❌ OpenAI API 호출 실패');
        console.error(
          '[preview-stream] 에러 타입:',
          apiError instanceof Error
            ? apiError.constructor.name
            : typeof apiError
        );
        console.error(
          '[preview-stream] 에러 메시지:',
          apiError instanceof Error ? apiError.message : apiError
        );
        if (apiError && typeof apiError === 'object') {
          console.error(
            '[preview-stream] 에러 상세:',
            JSON.stringify(apiError, null, 2)
          );
        }
        throw apiError;
      }

      // 스트리밍 시작되면 keep-alive 중지
      clearInterval(keepAliveInterval);
      console.log('[preview-stream] 💓 Keep-alive 중지 (스트리밍 시작됨)');

      let fullResponse = '';
      let chunkCount = 0;

      console.log('[preview-stream] 📡 스트리밍 응답 수신 시작...');

      // 스트리밍 응답 처리
      try {
        for await (const chunk of streamResponse) {
          const content = chunk.choices?.[0]?.delta?.content || '';
          if (content) {
            fullResponse += content;
            chunkCount++;

            // 매 청크마다 실시간 전송
            await sendEvent('chunk', {
              content,
              chunkIndex: chunkCount,
              currentLength: fullResponse.length,
            });
          }
        }
        console.log('[preview-stream] ✅ 스트리밍 응답 수신 완료');
        console.log('[preview-stream] 총 청크 수:', chunkCount);
        console.log('[preview-stream] 총 응답 길이:', fullResponse.length);
      } catch (streamError) {
        console.error('[preview-stream] ❌ 스트리밍 응답 수신 중 오류');
        console.error('[preview-stream] 에러:', streamError);
        throw streamError;
      }

      await sendEvent('progress', {
        message: '✅ AI 분석 완료! JSON 파싱 중...',
        step: 'parsing',
        totalChunks: chunkCount,
        totalLength: fullResponse.length,
      });

      console.log('[preview-stream] 🔄 JSON 파싱 시작...');
      console.log(
        '[preview-stream] 응답 미리보기 (처음 300자):',
        fullResponse.substring(0, 300)
      );

      // JSON 파싱
      const cleaned = fullResponse
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      console.log(
        '[preview-stream] 정제된 JSON 미리보기 (처음 300자):',
        cleaned.substring(0, 300)
      );

      let recruitDataList: any[];
      try {
        const parsed = JSON.parse(cleaned);
        recruitDataList = Array.isArray(parsed) ? parsed : [parsed];
        console.log(
          '[preview-stream] ✅ JSON 파싱 성공, 항목 수:',
          recruitDataList.length
        );
      } catch (parseError) {
        console.error('[preview-stream] ❌ JSON 파싱 실패');
        console.error('[preview-stream] 에러:', parseError);
        console.error(
          '[preview-stream] 원본 응답 (처음 1000자):',
          fullResponse.substring(0, 1000)
        );
        await sendEvent('error', {
          message: '❌ JSON 파싱 실패',
          error:
            parseError instanceof Error ? parseError.message : 'Unknown error',
          rawResponse: fullResponse.substring(0, 500) + '...',
        });
        return;
      }

      await sendEvent('complete', {
        message: `🎉 분석 완료! ${recruitDataList.length}개의 채용 공고를 발견했습니다.`,
        count: recruitDataList.length,
        data: recruitDataList,
      });
    } catch (error) {
      console.error('[preview-stream] ========== 오류 발생 ==========');
      console.error(
        '[preview-stream] 에러 타입:',
        error instanceof Error ? error.constructor.name : typeof error
      );
      console.error(
        '[preview-stream] 에러 메시지:',
        error instanceof Error ? error.message : error
      );
      if (error instanceof Error && error.stack) {
        console.error('[preview-stream] 스택 트레이스:', error.stack);
      }
      if (error && typeof error === 'object') {
        try {
          console.error(
            '[preview-stream] 에러 상세:',
            JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
          );
        } catch {
          console.error('[preview-stream] 에러 객체:', error);
        }
      }
      await sendEvent('error', {
        message: '❌ 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      });
    }
  });
});

export default app;
