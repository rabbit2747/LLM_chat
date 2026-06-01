# START HERE - New-PC setup for LLM_Chat

새 PC에서 이 프로젝트를 그대로 돌리기 위한 단일 진입점 문서.

사용법(요약): 새 PC에서 `git clone` 후, Claude Code 와 Codex 를 각각 이 폴더에서 열고
아래 한 줄만 입력하면 각 에이전트가 이 문서를 읽고 자기 환경세팅을 자동으로 수행한다.

```
START_HERE.md 읽고 그대로 환경세팅 진행해
```

---

## 0. 사용자가 먼저 준비 (이건 자동화 안 됨)

이 항목들은 머신/계정 레벨이라 에이전트가 대신 설치할 수 없다. 미리 해둘 것:

- **Node.js >= 18** (필수, 포터블 런타임 베이스라인)
- **git**
- **Claude Code** 설치 + 로그인
- **Codex CLI** 설치 + 로그인
- (선택) UI 디자인 작업에 쓰는 skill / MCP 서버 / settings 는 6번 참조 (앱 구동 자체엔 불필요)

## 1. 코드 가져오기

```
git clone https://github.com/rabbit2747/LLM_chat.git
cd LLM_chat
```

## 2. 두 에이전트 열고 킥오프

Claude Code 와 Codex 를 각각 `LLM_chat` 폴더에서 연다. 각 창에 입력:

```
START_HERE.md 읽고 그대로 환경세팅 진행해
```

그러면 각 에이전트는 아래 자기 런북(3, 4번)을 실행한다.

---

## 3. Claude 에이전트 런북 (Claude 가 이 문서를 읽으면 이대로 수행)

1. Node 버전 확인 후 워크스페이스 준비:
   ```
   node scripts/bootstrap.cjs
   ```
2. 서버 기동(백그라운드) + 헬스체크:
   ```
   node scripts/start-agent-chat.cjs
   node scripts/healthcheck.cjs
   ```
   UI: http://127.0.0.1:3787 (host/port override: AGENT_CHAT_HOST / AGENT_CHAT_PORT)
3. (선택, UI 디자인 작업 시) taste-skill 설치:
   ```
   npx skills add https://github.com/Leonxlnx/taste-skill
   ```
   `.agents/` 는 git-ignore 대상이며 `skills-lock.json` 이 설치 셋을 고정한다.
4. 백로그-safe 워처 무장 (continuous monitoring):
   ```
   powershell -NoProfile -ExecutionPolicy Bypass -File opinion_claude/watch-channel.ps1 -Baseline <지금까지 처리한 messages.jsonl 라인 수>
   powershell -NoProfile -ExecutionPolicy Bypass -File opinion_claude/watch-codex.ps1
   ```
   - 매 wake 마다 unread 전체 처리 후 `-Baseline` 갱신하여 재무장. 메시지 감지든 timeout 이든 활성 중이면 항상 재무장. 무감시(silent unarmed) 금지.
   - 워처는 Windows PowerShell 용. (앱/서버/CLI 는 cross-OS Node)
5. 준비 완료를 채널에 보고:
   ```
   node scripts/agent-chat.cjs send --from claude --to user --type status --text "Claude 환경세팅 완료, 모니터링 armed"
   ```

## 4. Codex 에이전트 런북 (Codex 가 이 문서를 읽으면 이대로 수행)

1. 워크스페이스 준비: `node scripts/bootstrap.cjs`
2. (서버가 안 떠 있으면) `node scripts/start-agent-chat.cjs` + `node scripts/healthcheck.cjs`
3. main-Codex 직접 모니터 시작 (continuous monitoring):
   ```
   node scripts/direct-monitor.cjs codex
   ```
   메시지를 잡으면: 직접 읽기(`node scripts/agent-chat.cjs unread --for codex`) -> 판단 -> `node scripts/agent-chat.cjs read --for codex` -> 액션 -> 즉시 monitor 재시작. 메시지 처리 후든 timeout 후든 활성 중이면 항상 재시작. 무감시 금지.
4. 준비 완료 보고:
   ```
   node scripts/agent-chat.cjs send --from codex --to user --type status --text "Codex 환경세팅 완료, 직접 모니터링 시작"
   ```

자세한 모니터링 헌법: `agent_chat/work_protocol.md` 의 "Continuous Monitoring Is Required" 참조.

---

## 5. 채팅 데이터 (대화 기록)

- **fresh 시작**: 아무것도 안 해도 서버가 빈 `messages.jsonl` / `state` / `tasks` 를 자동 생성한다.
- **이관(기존 대화 가져오기)**: 구 PC 에서
  ```
  node scripts/export-runtime.cjs            # -> ./runtime-export
  ```
  생성된 `runtime-export/` 폴더를 새 PC 로 복사 후:
  ```
  node scripts/import-runtime.cjs ./runtime-export
  ```
  `import` 은 기존 파일을 `--force` 없이는 덮어쓰지 않는다.

## 6. 자동화 안 되는 머신-로컬 항목 (사용자 수동)

git 으로 따라오지 않는다. 새 PC 에서 다시 설정:

- **에이전트 CLI 인증**: Claude Code / Codex 로그인 (필요시 Gemini 등)
- **MCP 서버**: 예) `claude mcp add ghidra ...`, `jadx`, `burp` (보안/리버싱 도구; 명령/경로/토큰은 머신-로컬, repo 에 없음)
- **Claude settings / 플러그인 / skills**: `~/.claude/settings.json` 의 enabledPlugins, 사용자 skills
- 전체 매니페스트와 재현 절차: `docs/ENVIRONMENT_v1.0.md` (v1.1 섹션 포함), Codex 측은 `docs/CODEX_ENVIRONMENT_v1.0.md`
- 이식/이관 메커니즘 상세: `docs/PORTABILITY.md`

## 7. 검증 체크리스트

- [ ] `node scripts/healthcheck.cjs` 통과
- [ ] UI 가 http://127.0.0.1:3787 에서 열림
- [ ] `node scripts/agent-chat.cjs send ... --type status` 로 양 에이전트가 "준비 완료" 보고
- [ ] Claude 워처 armed / Codex direct-monitor 실행 중
- [ ] (커밋 작업 시) `node scripts/check-encoding.cjs` 통과

이 문서대로 끝나면 새 PC 에서 v1.1 환경이 그대로 동작한다 (대화 내용은 fresh 또는 이관 선택).
