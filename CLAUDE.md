# Dojo Wiki — 개인 코딩 위키

GitHub Pages: https://kiuk104.github.io/dojo-wiki/ (main 브랜치 → Actions 빌드 → 배포)
로컬 사본: `E:\Coding\dojo-wiki`
`fokus-spiel`(개인 게임 위키)의 빌드 구조를 그대로 가져와 코딩 노트용으로 바꾼 것. 공통 코드(`shared/`, `templates/`, `build.py`)를 고칠 땐 fokus-spiel 과의 차이를 기억할 것.

## 구조
- `topics.json` — 분류 목록 (id, 이름, 허브 카드 문구). 허브 카드 순서 = `playing: true`("자주 봄") 먼저. (fokus-spiel 의 games.json 자리)
- `src/<id>/guide.md` — 분류별 원본 노트. **HTML을 직접 고치지 말고 md를 고친 뒤 빌드**한다.
- `src/_template/page.md` — 새 페이지 양식 (빌드 대상 아님).
- `templates/`, `shared/` — fokus-spiel 과 같은 틀·공통 CSS/JS (테마·검색·북마크·사이드바 목차·구글 로그인 동기화).
- `<id>/guide.html`, `index.html`, `sw.js`, `data/` — `build.py` 결과물. **git 에 없음**(Actions 가 만든다).

## fokus-spiel 과 다른 점
- 목록 파일 이름 `topics.json`, 카드 표시는 "페이지 N개"(= `## ` 개수), 배지는 "자주 봄".
- 코드 블록(```) 지원: `build.py` 가 `fenced_code` 확장을 쓰고 `<pre class="code">` 로 내보낸다. 글 속 `짧은 코드`는 fokus-spiel 처럼 `<kbd>`.
- 분류 강조색은 `shared/fokus.css` 의 `[data-game="vscode|javascript|rules"]` 블록 (게임 색 블록은 지움).
- 아이콘: 청록 바탕 + "D" + 금색 커서(`D_`). `icons/`.
- 저장 키 접두어 `dw-<id>-*`, 클라우드 필드 `dw_<id>` — 같은 도메인(kiuk104.github.io)의 fokus-spiel 과 겹치지 않게. Firebase 는 fokus-spiel 과 같은 `reddesert-checklist` 프로젝트를 쓴다.

## 노트 작성 규칙
- 파일 첫 줄 `# 제목`, 그 아래 `> 📝` 한 줄 소개.
- 페이지 = `## 제목 {#영문-주소}` (사이드바 큰 항목), 소제목 = `### …`. `{#…}` 를 붙이면 주소가 `guide.html#영문-주소` 로 고정된다 — 코딩Dojo `chapters/wiki-links.js` 가 이 주소로 링크하므로 **이미 붙인 이름은 바꾸지 말 것**.
- 페이지 머리: `> 🏷️ \`태그\` · 📅 날짜` 다음 줄에 `**한 줄 요약:** …`.
- 소제목 순서 권장: 문제/상황 → 해결 → 왜 그런가 → 관련.
- 인용 상자: `⚠️ 주의` 로 시작하면 경고색, `💡 꿀팁` 으로 시작하면 팁 색.
- 사용자는 코딩을 배우는 초보자(3D 모델러 출신). 설명은 쉬운 말로, 비유는 3D/디자인 쪽이 잘 통한다.
- md를 고치면 **항상 빌드 후 push**.

## 새 분류 추가
1. `topics.json` 에 항목 추가 (id는 영문 소문자-하이픈, keys/cloudField 는 `dw-<id>-*` / `dw_<id>`)
2. `src/<id>/guide.md` 작성
3. `shared/fokus.css` 에 `[data-game="<id>"]` 라이트/다크 색 3줄 추가 (기존 블록 복사)
4. `python build.py`

## 빌드 · 배포
```
pip install markdown
python build.py              # 전체 (로컬 미리보기)
python build.py vscode       # 한 분류만
python push.py -m "메시지"    # 커밋 + push  (push_github.bat 과 같음)
```

## Claude 데스크탑(원격 세션)에서 push 하기
기기 셸(device_bash)에는 GitHub 로그인이 없어서 `python push.py` 의 push 단계가 `could not read Username` 으로 실패한다. 이때:
1. 기기에서 md 수정 → `python build.py` → 커밋 (작성자: `git log -1` 의 이름/이메일을 GIT_AUTHOR_*/GIT_COMMITTER_* 로 넘김). `.git/index.lock` 이 남으면 삭제 권한 요청 후 지움.
2. `git format-patch origin/main -o <임시폴더>` → 패치를 클라우드로 stage.
3. 클라우드: `add_repo kiuk104/dojo-wiki (push)` → `git clone --depth 1` → `git am <패치>` → `git push origin main`.
4. 기기: `git pull --rebase origin main` 으로 맞춤 (같은 내용이라 깔끔히 합쳐짐).

