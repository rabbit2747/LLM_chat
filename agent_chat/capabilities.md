# Agent Capabilities Manifest

> 두 에이전트가 서로 무엇을 잘하는지 알고 작업을 위임하기 위한 공유 목록.
> 같은 PC 기준: **설치=공유(한 번)**, **연결 설정=에이전트별(각자 1회)**.
> 갱신: 각자 자기 섹션만 수정. (2026-06-01 시작)

## 🟦 Claude (Claude Code, Opus 4.8)

### 환경 / 설정 위치
- MCP 설정: 프로젝트 `.mcp.json` + `.claude/settings.json` (권한·env)
- 규칙 파일: `CLAUDE.md` (자동 로드)
- 메모리: `~/.claude/projects/<proj>/memory/`

### 연결된 MCP 서버 (현재 세션)
- `ghidra` — 바이너리 디컴파일/디스어셈블, 함수·xref·문자열 분석 (RE)
- `jadx` — 안드로이드 APK 디컴파일, manifest·클래스·메서드·smali (안드로이드 RE)
- `burp` — 웹 트래픽 가로채기/분석 (웹 보안)
- `context7` — 라이브러리 최신 공식 문서 조회
- `playwright` / Claude-in-Chrome — 브라우저 자동화·스냅샷·네트워크 검사

### 주요 Skills (위임 후보)
- `hs-security-scan` — HS 방법론 보안 스캔/제로데이 추론
- `ios-diagnostics` — iOS 앱/기기 진단 (인가 범위)
- `deep-research` — 다출처 웹 리서치 + 교차검증 리포트
- `frontend-design` — 고품질 프론트엔드 UI 생성
- `code-review` / `security-review` / `simplify` — 변경 리뷰·보안 점검·정리
- 문서: `pptx` / `docx` / `xlsx` / `pdf` — 오피스 문서 생성·편집
- `pptx-format-transfer` — 템플릿 포맷에 데이터 주입

### 강점 (제안)
- 보안 RE/웹 분석(MCP 도구 보유), 프론트엔드 UI, 문서 산출물, 심층 리서치, 코드 리뷰.

### 한계 / 주의
- 일부 MCP(ghidra/jadx/burp)는 GUI 앱에 붙는 단일 클라이언트일 수 있음 → 동시 접속 충돌 주의, 누가 운전할지 조율 필요.
- 백그라운드 워처는 이 세션 수명에 묶임.

## 🟧 Codex
> Codex가 채움: 자기 설정 위치(`~/.codex/config.toml`), 연결 MCP, 능력/강점, 한계.

- 설정 위치: _TBD_
- 연결 MCP: _TBD_
- 강점: _TBD_
- 한계: _TBD_

## 🤝 공유 설치 항목 (PC 1회, 담당 합의)
- [ ] node / npm, 프로젝트 `npm install`
- [ ] python + 필요 라이브러리
- [ ] MCP 서버 패키지/바이너리 (ghidra·jadx·burp·context7·playwright 등)
- [ ] 담당: _합의 후 기입 (제안: Codex가 설치, 각자 자기 config 작성)_

## 🔑 공유 규칙 (양쪽 동일 플레이북)
- Claude는 `CLAUDE.md`, Codex는 `AGENTS.md` 자동 로드 → **핵심 규칙을 AGENTS.md에 미러**해 한 플레이북으로.
- 사용자 권한 절대, 상대 파일 무단수정 금지, 핑퐁 종료조건(질의 2R/설계 3R) — PROTOCOL 준수.
