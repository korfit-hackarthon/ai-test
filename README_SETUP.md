# AI 가상 면접 시스템 설정 가이드

## 🚀 설치 및 실행

### 1. 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# OpenRouter API Key
# https://openrouter.ai/ 에서 API 키를 발급받아 사용하세요
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 2. 의존성 설치

```bash
bun install
```

### 3. 데이터베이스 마이그레이션

```bash
bun server/db/migrate.ts
```

### 4. 개발 서버 실행

```bash
bun dev
```

서버가 실행되면 브라우저에서 `http://localhost:3000` (또는 표시된 포트)로 접속하세요.

## 📋 주요 기능

### 1. 질문 관리 (`/question-register`)
- 면접 질문과 모범답안 등록
- 등록된 질문 수정 및 삭제

### 2. AI 가상 면접 (`/ai/qanda`)
- 면접 질문 선택
- AI 모델 선택 (GPT-4, Claude, Gemini 등)
- 답변 작성 및 제출
- 즉각적인 AI 평가 및 피드백
- 연습 기록 확인

### 3. 사용 설명 (`/`)
- 사용 방법 안내

## 🤖 지원 AI 모델

- **OpenAI**: GPT-4o, GPT-4o Mini
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Haiku
- **Google**: Gemini 2.0 Flash
- **Meta**: Llama 3.3 70B

## 🛠️ 기술 스택

- **Frontend**: React 19, shadcn/ui, Tailwind CSS
- **Backend**: Hono.js (Bun 런타임)
- **Database**: SQLite with Drizzle ORM
- **AI**: OpenRouter (OpenAI SDK 호환)

## 📁 프로젝트 구조

```
.
├── src/
│   ├── pages/
│   │   ├── ai/qanda.tsx          # AI 학습 평가 페이지
│   │   ├── question-register.tsx  # 질문 관리 페이지
│   │   └── explanation.tsx        # 사용 설명 페이지
│   └── config/menu.tsx            # 메뉴 구성
├── server/
│   ├── db/
│   │   ├── schema/index.ts        # 데이터베이스 스키마
│   │   ├── drizzle.ts             # Drizzle 설정
│   │   └── migrate.ts             # 마이그레이션 스크립트
│   ├── routers/
│   │   └── questions.ts           # 질문 API 라우터
│   └── hono/index.ts              # Hono 앱 설정
└── database.db                    # SQLite 데이터베이스 (자동 생성)
```

## 🎨 디자인

- shadcn/ui 컴포넌트 사용
- 모던하고 깔끔한 인터페이스
- 다크모드 지원
- 반응형 디자인

## 💡 사용 팁

1. **다양한 모델 활용**: 같은 답변을 여러 AI 모델로 평가받아 다각적인 피드백을 받아보세요.
2. **반복 연습**: 같은 질문에 여러 번 답변하며 점수 향상을 목표로 연습하세요.
3. **피드백 활용**: AI가 제공하는 피드백을 참고하여 답변을 개선하세요.

## 🔧 트러블슈팅

### "no such table" 에러
마이그레이션이 실행되지 않았을 수 있습니다:
```bash
bun server/db/migrate.ts
```

### OpenRouter API 에러
`.env` 파일에 올바른 API 키가 설정되어 있는지 확인하세요.

### 포트 충돌
다른 애플리케이션이 포트를 사용 중일 수 있습니다. 서버 설정에서 포트를 변경하세요.

## 📝 라이센스

MIT

