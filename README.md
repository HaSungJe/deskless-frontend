# deskless-frontend

deskless 이용자 · 업체 관리자 · 관리자 화면 (Next.js 16 App Router · React 19).

화면 · API 지침은 [frontend/README.md](frontend/README.md), 코드 구조와 규칙은 [AGENTS.md](AGENTS.md).

## 로컬 개발

Node 24.22.3 (`.nvmrc` — nvm 을 쓰면 `nvm use`). 운영 이미지(`Dockerfile`)도 같은 버전이다.

```bash
cp .env.example .env.local   # 값 채우기
npm install
npm run dev                  # http://localhost:5000
```

## 배포

배포는 deskless 저장소(쿠버네티스 — k3s · Helm 차트)가 맡는다. 이 저장소는 앱 코드와 `Dockerfile` 만 갖고(compose 없음), deskless 가 이 `Dockerfile` 로 이미지를 빌드해 띄운다.

- 빌드: `.env.production` 을 빌드 secret `dotenv` 로 넘긴다 — 빌드 때 정해지는 값은 basePath · 이미지 호스트뿐이라 이미지 하나를 모든 환경(로컬 · 운영)이 같이 쓴다(빌드 인자 `DESKLESS_BUILD_ENV_HASH` — 빌드 값이 바뀌면 다시 빌드).
- 실행: 공개 값(`NEXT_PUBLIC_*` — 서버가 요청 때 읽어 브라우저로 넘긴다) · 서버 env(시크릿 · `METRICS_PORT` · `METRICS_HOST`)는 deskless 차트가 넣는다 — 값을 바꾸면 파드만 다시 띄운다. 앱 포트 5000.
- 지표 · 헬스 체크: 전용 포트(쿠버네티스 9464 · 로컬 9468)의 `/metrics` · `/health/live` · `/health/ready` — 공개 주소로는 열지 않고, 수집 · 프로브는 deskless 가 한다.
