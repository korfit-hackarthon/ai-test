FROM oven/bun AS build

WORKDIR /app

COPY package.json bun.lock* ./

RUN bun install

COPY ./src ./src
COPY ./public ./public
COPY ./server ./server
COPY ./bunfig.toml ./bunfig.toml
COPY ./tsconfig.json ./tsconfig.json
COPY ./build.ts ./build.ts
COPY ./drizzle.config.ts ./drizzle.config.ts
COPY ./components.json ./components.json
COPY ./check-and-seed.js ./check-and-seed.js

# SQLite 데이터베이스 디렉토리 생성
RUN mkdir -p /app/data

# 간단한 entrypoint 스크립트 생성
RUN echo '#!/bin/sh\n\
set -e\n\
\n\
echo "🚀 Starting production server..."\n\
\n\
# 마이그레이션 실행\n\
echo "📦 Running database migrations..."\n\
bun server/db/migrate.ts\n\
\n\
# 데이터베이스가 비어있는지 확인하고 시드 실행\n\
echo "🌱 Checking if database needs seeding..."\n\
if bun check-and-seed.js; then\n\
  echo "Database is empty, running seed..."\n\
  bun server/db/seed.ts\n\
else\n\
  echo "Database already has data, skipping seed"\n\
fi\n\
\n\
# 서버 시작\n\
echo "🌐 Starting server..."\n\
exec bun server/index.ts\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

ENV NODE_ENV=production

# Entrypoint 스크립트 사용
ENTRYPOINT ["/app/entrypoint.sh"]

EXPOSE 8000

# SQLite 데이터베이스 볼륨
VOLUME ["/app/data"]