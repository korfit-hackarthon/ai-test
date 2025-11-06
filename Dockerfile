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

# SQLite 데이터베이스 디렉토리 생성
RUN mkdir -p /app/data

ENV NODE_ENV=production

# 마이그레이션 실행 후 서버 시작
CMD ["sh", "-c", "bun server/db/migrate.ts && bun server/index.ts"]

EXPOSE 8000

# SQLite 데이터베이스 볼륨
VOLUME ["/app/data"]