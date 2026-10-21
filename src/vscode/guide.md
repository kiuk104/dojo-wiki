# VS Code · 터미널 노트

> 📝 VS Code와 터미널(PowerShell)을 쓰다가 막혔던 것과 해결법을 모아 두는 곳이에요. 새 페이지는 `## 제목`으로 맨 아래에 이어 붙여요.

## VS Code로 폴더 열기 {#open-folder}

> 🏷️ `vscode` `탐색기` · 📅 2026-10-21

**한 줄 요약:** 탐색기 주소창에 `code .` 입력하면 지금 폴더가 VS Code로 열린다.

### 방법
**1) 탐색기 주소창 (가장 빠름)**

1. 탐색기에서 원하는 폴더로 이동
2. 주소창 클릭 → `code .` → Enter (`.` = "현재 폴더")

**2) 터미널에서** — 폴더 빈 곳 우클릭 → **터미널에서 열기** → `code .`

**3) VS Code 안에서** — **파일 → 폴더 열기** → 폴더 선택

> ⚠️ 주의: 우클릭 메뉴의 **"Visual Studio로 열기"**(보라색)는 VS Code가 아니라 다른 프로그램이다.

### 우클릭 메뉴에 "Code(으)로 열기" 추가 (한 번만)
1. code.visualstudio.com 에서 설치 파일 받아 다시 설치 (설정 유지됨)
2. "추가 작업 선택"에서 체크
    - ☑ "Code(으)로 열기" — 파일 상황에 맞는 메뉴
    - ☑ "Code(으)로 열기" — 디렉터리 상황에 맞는 메뉴
    - ☑ PATH에 추가
3. 안 보이면 우클릭 메뉴 맨 아래 **"추가 옵션 표시"** 안 확인

### 문제 해결
| 증상 | 원인 | 해결 |
|---|---|---|
| `code`는 인식되지 않는 명령 | 설치 때 PATH 추가 빠짐 | 다시 설치하며 **PATH에 추가** 체크 |

### 왜 파일이 아니라 폴더를 여나
폴더를 열면 터미널이 그 폴더에서 시작한다 → 위치 헷갈리는 실수가 대부분 사라진다.

## 터미널 기본기 {#terminal-basics}

> 🏷️ `vscode` `powershell` `터미널` · 📅 2026-10-21

**한 줄 요약:** 명령이 안 될 땐 코드보다 **지금 위치(`PS E:\...>`)** 부터 의심하자.

### 자주 쓰는 것
| 하고 싶은 것 | 입력 |
|---|---|
| 터미널 열기 | `Ctrl + ~` (백틱 키) |
| 지금 위치 확인 | `pwd` |
| 폴더 안 목록 | `ls` |
| 폴더로 이동 | `cd 폴더이름` |
| 한 칸 위로 | `cd ..` |
| 자동완성 | 몇 글자 + `Tab` |
| 이전 명령 | `↑` |
| JS 파일 실행 | `node 파일이름.js` |

### 예시
```powershell
PS E:\Coding\dojo-practice> cd ch00-vscode-clinic
PS E:\Coding\dojo-practice\ch00-vscode-clinic> node ch00-l07-terminal-location.js
```

### 자주 보는 에러 — ENOENT
`ENOENT` = "그런 파일 없음" → 위치가 틀렸거나 파일 이름 오타.

```
npm ERR! enoent Could not read package.json
```

→ `package.json`이 있는 폴더로 `cd` 하고 다시 실행.

### 저장 실수 막기
> 💡 꿀팁: **파일 → 자동 저장** 켜기 → 저장 깜빡하고 옛 코드 실행하는 실수 방지.

## 자꾸 뜨는 빈 창 (PowerToys Peek) {#powertoys-peek}

> 🏷️ `windows` `powertoys` `단축키` · 📅 2026-10-21

**한 줄 요약:** 탐색기에서 `Ctrl + Space` → PowerToys **Peek**(파일 미리보기)가 뜬다.

### 증상
- 제목 표시줄에 `PowerToys.Peek.UI`
- 빈 창 가운데 "Search in Microsoft Store"만 보임 (폴더처럼 미리 볼 수 없는 걸 선택했을 때)

### 해결
- **지금 닫기:** `Esc` 또는 ✕
- **다시 안 뜨게:** 트레이의 **PowerToys** → 설정 → **Peek**
    - **Peek 사용 끄기**, 또는
    - **활성화 바로 가기**를 `Ctrl + Shift + Space` 등으로 변경

### 왜 신경 써야 하나
VS Code에서도 `Ctrl + Space` = **자동완성** 단축키라 코딩하면서 자주 누르게 된다.
