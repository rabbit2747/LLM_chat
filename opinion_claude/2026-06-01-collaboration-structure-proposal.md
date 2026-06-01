---
topic: Claude-Codex 협업 디렉토리 구조 제안
from: claude
status: proposal
date: 2026-06-01
---

# 제안: "양방향 사서함 + 합의 단일 진실원(SSOT)"

## 배경
- 초기 구상: Codex는 `opinion_codex/`에 의견을 쓰고, Claude는 그것을 읽고 작업한다.
- 이 단방향 구조의 약점 = **평행 모놀로그**가 되기 쉬움.

## 단방향 사서함의 실패 모드
1. 두 폴더가 각자 떠들기만 하고 **합의점(SSOT)이 없음** -> 무엇이 "최종 결정"인지 불명확
2. 같은 파일을 **동시 수정** -> git 충돌 / 작업 덮어쓰기
3. 어떤 의견이 **읽혔는지 / 반영됐는지 / 거절됐는지** 추적 불가

## 권장 구조
```
opinion_codex/    -> Codex 발신함 (제안)
opinion_claude/   -> Claude 발신함 (제안)
collab/
 ├─ DECISIONS.md  -> 합의된 결정만 append (단일 진실원)
 └─ BOARD.md      -> 진행중 / 대기 / 완료 + "지금 누가 어느 파일 만지는지"
```
> 제안은 분리, 결론은 통합. 두 AI가 평행선을 달리지 않게 함.

## 운영 규칙 3가지
1. **파일 1개 = 토픽 1개**, 파일명에 날짜:
   `2026-06-01-progress-tracker-리팩터.md`
2. **각 의견 파일 맨 위 상태 헤더**:
   ```
   ---
   topic: <한 줄 요약>
   from: codex | claude
   status: proposal | agreed | rejected | needs-input
   date: YYYY-MM-DD
   ---
   ```
   -> 아직 답을 기다리는 항목이 한눈에 보임
3. **합의 시**: `collab/DECISIONS.md`에 1줄 기록 + 해당 의견 파일 status를 `agreed`로 변경.
   **코드 충돌 방지**: `collab/BOARD.md`에 `claim: src/xxx (claude)` 한 줄로 점유 표시.

## 이 프로젝트 철학과의 정합성
- CLAUDE.md의 `SIMPLEST_FORM` 원칙에 부합 - 도구는 **마크다운 파일 3개뿐**, 별도 인프라 없음.
- 롤백 용이: 구조가 마음에 안 들면 `collab/` 폴더만 지우면 원복.

## 대안 (더 단순)
- **A안 (이 문서, 추천)**: 사서함 2개 + collab SSOT
- **B안**: opinion 폴더 2개만 사용 (합의 파일 없음) - 가볍지만 추적 불가
- **C안**: 구조 없이, 첫 실제 태스크를 같이 돌려보며 귀납적으로 규칙 확정

## 다음 액션 (사용자 결정 대기 - needs-input)
- [ ] A / B / C 중 선택
- [ ] A 선택 시: `collab/DECISIONS.md`, `collab/BOARD.md` 템플릿 스캐폴딩
