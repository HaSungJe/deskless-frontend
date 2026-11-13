# conventions (archived)

> 2026-11-14 ship 에서 docs/conventions.md "컴포넌트 · 훅 안의 구조" · AGENTS.md Conventions · Checklist 로 정식 반영(대조 완료: 10개 조항). 복구용 — 어떤 단계도 읽지 않는다.

## 컴포넌트 · 커스텀 훅 안의 구조 — 영역 순서와 주석
- Rule: 컴포넌트 · 커스텀 훅 본문은 **변수 > 상태(useState) > 계산 값 > 효과(useEffect) > 함수 > return(JSX)** 순서로 둔다.
  - 변수 = props 로 만든 상수와 값을 돌려주는 훅(`useRef` · `useId` · `useRouter` · `useContext` · `useSearchParams` 등).
  - 계산 값 = state 로 계산하는 값과 `useMemo`. 함수 = 이벤트 처리 · 내부 함수 · `useCallback`.
  - 영역 사이는 빈 줄로 나눈다(필수). 비어 있는 영역은 쓰지 않는다.
  - 영역마다 맨 위에 한 줄 주석(필수) — `// 변수` · `// 상태` · `// 계산 값` · `// 효과` · `// 함수`.
  - 변수 · 상태 · 계산 값 영역은 한 줄마다 오른쪽에 역할 주석(필수) — `const dialogRef = useRef<HTMLDialogElement>(null); // <dialog> 요소`.
  - JSX 본문도 덩어리마다 간략 주석(필수) — 루트 요소 위는 `return (` 안의 `// …`, 안쪽 덩어리는 `{/* … */}`. 커스텀 훅은 JSX 가 없으니 이 항목만 빠진다.
- Scope: global — 컴포넌트 + 커스텀 훅. **새로 만드는 코드와 그때 고치는 파일부터 적용**하고, 손대지 않는 기존 파일을 한꺼번에 고치지 않는다(그 파일을 고칠 때 맞춘다).
- Rationale: User feedback 2026-11-14 — "변수 > useState > useEffecct > function 순으로 배치", "각 영역마다 줄바꿈으로 구분 필수", "분리된 영역마다 한줄 주석 필수", "변수, useState영역에는 각 변수나 훅마다 어떤 역할인지 간단하게 우측에 주석 필수", "html 본문 영역에도 간략 주석 필수" · 계산 값 영역 · 적용 범위(새 코드 + 고치는 파일) · 훅 포함은 같은 날 질문에 대한 답
- AGENTS.md application: unapplied — 초안 반영됨(docs/conventions.md "컴포넌트 · 훅 안의 구조", AGENTS.md Conventions · Checklist, draft 표시). ship 에서 확정되면 이 항목은 `_archived/` 로 옮긴다
- Priority: takes precedence over AGENTS.md/defaults
