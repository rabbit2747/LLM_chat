# 의견: 이 환경을 다른 PC로 옮겨도 그대로 동작하게

작성: claude / 2026-06-01 / task=agent-chat-v1
대상 지시: "이 환경 자체를 다른 PC로 옮겨도 그대로 동작? 어떻게 설계? 지금 이대로 가능? 따로 설계 필요?"

## 결론 (선요약)
- **코드/경로층: 이미 이식 가능.** 방금 실측 - 서버·CLI·워처 전부 `__dirname`/`$PSScriptRoot` 기준 상대경로. 내 워처 2개의 마지막 절대경로도 직전에 제거함. -> 폴더째 옮기면 경로는 안 깨진다.
- **단, "그대로 즉시 동작"은 아니다.** 코드 밖 요소(런타임 설치/인증, 전송 수단, 부트스트랩) 미포장. 이 3개만 설계하면 "옮겨서 실행" 달성.

## 실측: 경로 처리 현황 (전부 상대)
- `agent-chat-server.cjs`: `const root = path.resolve(__dirname,'..')` + 시작 시 `agent_chat/`, `ui/`, `uploads/`, `messages.jsonl`, `tasks.json`, `state.json` **자동 생성**. 이식 친화적.
- `agent-chat.ps1`: `$Root = Resolve-Path (Join-Path $PSScriptRoot "..")`.
- `scripts/watch-agent-chat-codex.ps1`, `-strict.ps1`, `watch-claude-opinion-flag.ps1`: 모두 `$Root = ...PSScriptRoot..`.
- `opinion_claude/watch-channel.ps1`, `watch-codex.ps1`: 방금 PSScriptRoot 상대경로로 교체 완료.
- -> **저장소 내부에 남은 절대경로 = 0.**

## "그대로 동작"을 막는 코드 밖 요소
1. **런타임 전제(저장소에 없음)**: Node.js, PowerShell(5.1 또는 cross-OS면 pwsh), 그리고 에이전트 CLI들(Claude Code / Codex / 선택적 Gemini)이 대상 PC에 **설치+인증**돼 있어야 함. API 키는 저장소에 없음(정상) -> 새 PC에서 별도 설정.
2. **전송 수단 부재**: 현재 이 폴더엔 git이 없음(이전에 삭제). 다른 PC로 옮기는 깔끔한 방법 = `git init` 후 push/clone, 또는 zip. 이때 **코드/설정**(이식)과 **런타임 데이터**(messages.jsonl, state_*.json, tasks.json, uploads/, *.log, *.flag)를 분리할지 결정 필요.
3. **부트스트랩 부재**: 새 PC에서 "무엇을 깔고 어떻게 켜는지" 문서/스크립트가 없음.

## 제안 설계 (옮겨서 실행 가능하게)
### A) OS 범위 먼저 결정 (가장 중요한 분기)
- **다른 Windows PC만** 목표 -> 사실상 지금 스택 그대로 동작(PowerShell 5.1 + Node). 추가 작업 최소.
- **Mac/Linux 포함(완전 cross-OS)** -> .ps1 5개가 `pwsh`(PowerShell Core) 필요. Node 서버는 이미 cross-OS. 경로는 Join-Path/path.join이라 구분자 OK. 선택: (a) pwsh 요구(저비용) 또는 (b) .ps1을 Node/bash로 포팅(고비용).
- 권장: 우선 **Windows+pwsh 요구**로 잡고, 완전 OS중립은 후순위.

### B) 전송 = git + .gitignore (코드/데이터 분리)
- `git init` -> 원격(GitHub private 등)으로 push, 새 PC에서 clone.
- `.gitignore`: `agent_chat/messages.jsonl`, `agent_chat/state*.json`, `agent_chat/tasks.json`, `agent_chat/uploads/`, `*.log`, `*.flag`, `node_modules/`.
  - 이유: 채팅 로그/커서는 머신별 런타임 상태 -> 새 PC에선 빈 상태로 시작(서버가 자동 생성). 옮기고 싶으면 선택적 export로.
- 대안: git 없이 zip + 위 데이터 제외 스크립트.

### C) 부트스트랩 = `README.md` + `bootstrap.ps1`
- `bootstrap.ps1`: (1) Node/PowerShell 버전 체크 (2) 필요 디렉토리/빈 파일 보장(서버가 이미 함) (3) 서버 기동 `node scripts/agent-chat-server.cjs` (4) 각 에이전트 워처 무장 안내.
- `README.md`: 전제(Node/pwsh/CLI), 켜는 순서, 포트(127.0.0.1:3787), 각 에이전트를 이 폴더에서 여는 법, 데이터 초기화/이관 방법.

### D) 설정 외부화
- 서버 host/port를 env로: `PORT`, `HOST`(기본 127.0.0.1:3787). 포트 충돌/원격 PC 대응.
- (멀티모델 작업의 participants.json도 이 저장소에 들어가 자연히 이식됨 -> 두 작업은 상호보완.)

### E) 옮길 수 없는 머신 로컬 요소(문서화만)
- 에이전트 CLI 설치/인증, 그리고 Claude의 메모리(`~/.claude/...`)는 머신별 상태 -> 저장소에 안 들어감. 새 PC에선 새로 인증/메모리 생성. README에 명시.

## 역할분담 제안 (조율 대상)
- **Claude(나)**: `git init` + `.gitignore` + `README.md` + `bootstrap.ps1`(패키징/문서 계층).
- **Codex**: 신선한 checkout에서 서버·CLI 클린 기동 검증, 서버 host/port env화(서버 소유자), pwsh cross-OS 동작 점검.

## Codex에게 묻고 싶은 것
1. OS 범위: Windows-only로 먼저 잡고 갈까, 처음부터 cross-OS(pwsh) 목표로 갈까?
2. 런타임 데이터(messages.jsonl/state) - 새 PC에선 초기화 시작이 맞나, 아니면 이관 옵션도 1급으로 넣나?
3. 멀티모델 작업과 이식성 작업의 순서 - 어느 걸 먼저? (이식성을 먼저 깔면 이후 모든 작업이 옮겨다님)
