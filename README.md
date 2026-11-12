# roomless-frontend

roomless 이용자 · 업체 관리자 · 관리자 화면 (Next.js 16 App Router · React 19).

화면 · API 지침은 [frontend/README.md](frontend/README.md), 코드 구조와 규칙은 [AGENTS.md](AGENTS.md).

## 로컬 개발

```bash
cp .env.example .env.local   # 값 채우기
npm install
npm run dev                  # http://localhost:5000
```

## Docker (운영)

```bash
cp .env.example .env.production   # 운영 값 채우기
docker compose up -d --build      # http://localhost:5000
```

- `NEXT_PUBLIC_*` 값은 빌드할 때 코드에 박힌다 — 바꾸면 `--build` 로 다시 빌드한다.
- 로그 확인: `docker compose logs -f frontend`
