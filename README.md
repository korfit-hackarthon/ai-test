# KORFIT 면접 시뮬레이터

한국 취업을 준비하는 외국인 유학생을 위한 AI 기반 면접 연습 플랫폼

## 주요 기능

### 1. 맞춤형 면접 세트 생성
- 직무(마케팅/영업/IT)와 레벨(인턴/신입) 선택
- AI가 자동으로 5개의 질문 조합 생성
  - 공통 질문 40% (자기소개, 지원동기 등)
  - 직무 질문 30% (선택한 직무 관련)
  - 외국인 특화 30% (외국인 지원자 단골 질문)

### 2. 실시간 AI 면접 진행
- 채팅 인터페이스로 자연스러운 면접 경험
- **압박 꼬리질문 기능**: 답변 분석 후 즉시 생성되는 심화 질문
- 스트리밍 응답으로 실시간 AI 피드백
- 5개 질문 순차 진행

### 3. 5각형 역량 진단 리포트
면접 완료 후 5가지 항목으로 상세 평가:
- **논리성**: 답변의 논리적 구조와 일관성
- **근거**: 구체적인 사례와 근거 제시
- **직무이해도**: 지원 직무에 대한 이해도
- **한국어 격식**: 비즈니스 한국어 사용 적절성
- **완성도**: 답변의 완성도와 충실성

### 4. 답변 노트
- 면접 답변을 저장하고 개선
- 1차/2차 피드백 기록
- 최종 모범답안 작성 및 관리
- 나만의 면접 답변 라이브러리 구축

### 5. 면접 기록
- 모든 면접 기록 조회
- 진행중인 면접 이어하기
- 완료된 면접 결과 다시 보기

## 기술 스택

### Backend
- **Hono.js**: 고성능 웹 프레임워크
- **Drizzle ORM**: TypeScript ORM
- **SQLite**: 경량 데이터베이스
- **OpenRouter**: AI 모델 라우팅 (OpenAI SDK 호환)
- **Bun**: 빠른 JavaScript 런타임

### Frontend
- **React**: UI 라이브러리
- **React Router**: 라우팅
- **shadcn/ui**: 모던한 UI 컴포넌트
- **Recharts**: 5각형 그래프 시각화
- **Sonner**: 토스트 알림
- **TailwindCSS**: 스타일링

## 설치 및 실행

### 환경 변수 설정
`.env` 파일 생성:
```env
OPENROUTER_API_KEY=your_openrouter_api_key
NODE_ENV=development
```

### 데이터베이스 마이그레이션
```bash
bun server/db/migrate.ts
```

### 개발 서버 실행
```bash
bun server/index.ts
```

서버가 `http://localhost:8000`에서 실행됩니다.

### 기본 계정
- Username: `admin`
- Password: `12345`

## 프로젝트 구조

```
.
├── server/
│   ├── db/
│   │   ├── schema/          # 데이터베이스 스키마
│   │   ├── migrations/      # 마이그레이션 파일
│   │   └── drizzle.ts       # Drizzle 설정
│   ├── routers/
│   │   ├── interview.ts     # 면접 API
│   │   ├── questions.ts     # 질문 관리 API
│   │   └── answer-notes.ts  # 답변 노트 API
│   └── hono/
│       └── index.ts         # Hono 앱 설정
├── src/
│   ├── pages/
│   │   ├── interview/       # 면접 관련 페이지
│   │   │   ├── start.tsx    # 면접 시작
│   │   │   ├── session.tsx  # 면접 진행
│   │   │   ├── result.tsx   # 결과 리포트
│   │   │   └── history.tsx  # 면접 기록
│   │   ├── answer-notes.tsx # 답변 노트
│   │   └── question-register.tsx # 질문 관리
│   └── components/ui/       # shadcn/ui 컴포넌트
└── public/                  # 정적 파일
```

## 주요 API 엔드포인트

### 면접 관련
- `POST /api/interview/sets` - 면접 세트 생성
- `GET /api/interview/sets/:id` - 면접 세트 조회
- `POST /api/interview/answers` - 답변 제출 (꼬리질문 생성)
- `POST /api/interview/follow-up-answers` - 꼬리질문 답변 제출
- `POST /api/interview/sets/:id/complete` - 면접 완료 및 평가 (스트리밍)

### 질문 관리
- `GET /api/questions` - 질문 목록
- `POST /api/questions` - 질문 등록
- `PUT /api/questions/:id` - 질문 수정
- `DELETE /api/questions/:id` - 질문 삭제

### 답변 노트
- `GET /api/answer-notes` - 노트 목록
- `POST /api/answer-notes` - 노트 생성
- `PUT /api/answer-notes/:id` - 노트 수정
- `DELETE /api/answer-notes/:id` - 노트 삭제

## 특징

### UX 최적화
- 스트리밍 응답으로 실시간 AI 피드백
- 압박 꼬리질문으로 실전 면접 경험
- 5각형 그래프로 직관적인 역량 시각화
- 모던하고 깔끔한 shadcn/ui 디자인

### AI 기능
- OpenRouter를 통한 다양한 AI 모델 지원
- 실시간 답변 분석 및 꼬리질문 생성
- 5가지 항목 상세 평가
- 구체적인 개선 제안

### 데이터 관리
- SQLite로 경량 데이터 저장
- Drizzle ORM으로 타입 안전성
- 면접 기록 및 답변 노트 영구 저장

## 라이선스

MIT
