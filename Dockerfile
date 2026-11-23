# syntax=docker/dockerfile:1
# 운영 이미지 — npm run docker:up(docker compose up -d --build) · 내리기 npm run docker:down (Node 24.22.3 — 로컬 .nvmrc · package.json engines 와 같은 버전)
# 환경변수는 .env.production 하나로 관리한다
#  - 빌드: BuildKit secret 으로 잠깐 붙여 next build 가 읽는다(NEXT_PUBLIC_* · basePath · 이미지 호스트는 빌드할 때 코드에 박힌다)
#  - 실행: docker-compose.yml 의 env_file 로 넘긴다(서버에서만 쓰는 값)

FROM node:24.22.3-alpine AS base

# 의존성 설치
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# 빌드
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN --mount=type=secret,id=dotenv,target=/app/.env.production,required=true npm run build

# 실행
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=5000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 5000
CMD ["node", "server.js"]
