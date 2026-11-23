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

## Docker (운영)

```bash
cp .env.example .env.production   # 운영 값 채우기
npm run docker:up                 # 빌드 + 올리기(docker compose up -d --build) — http://localhost:5000
npm run docker:down               # 내리기(docker compose down — 백엔드 모니터링 망은 그대로)
```

- `NEXT_PUBLIC_*` 값은 빌드할 때 코드에 박힌다 — `docker:up` 이 매번 다시 빌드한다.
- 백엔드 모니터링 망(`deskless-monitoring`)이 있어야 뜬다 — 백엔드 묶음(`npm run docker:up`)을 먼저 한 번 띄운 서버에서 실행한다.
- 로그 확인: `docker compose logs -f web`
