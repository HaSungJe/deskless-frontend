# syntax=docker/dockerfile:1
# 운영 이미지 — deskless(쿠버네티스 · Helm 차트)가 이 파일로 빌드해 띄운다 (Node 24.22.3 — 로컬 .nvmrc · package.json engines 와 같은 버전)
# 환경변수
#  - 빌드: .env.production 을 BuildKit secret(dotenv)으로 잠깐 붙여 next build 가 읽는다 — 빌드에 남는 값은 basePath · 이미지 호스트뿐(공개 값 NEXT_PUBLIC_* 는 실행 때 읽어 이미지 하나로 모든 환경)
#  - 실행: deskless 차트가 넣는다(서버에서만 쓰는 값 · METRICS_PORT · METRICS_HOST) — 이미지 안에 .env 는 남지 않는다

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
# 빌드 값 해시 — secret 내용은 빌드 캐시 키에 들어가지 않아, 빌드 값(basePath · 이미지 호스트)이 바뀌면 이 값으로 빌드 층을 다시 만든다(deskless 가 넘긴다)
ARG DESKLESS_BUILD_ENV_HASH
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
