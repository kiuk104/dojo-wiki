# 나의 코딩 규칙

> 📝 폴더 구조, 파일 이름처럼 스스로 정한 약속을 모아 두는 곳이에요.

## 연습 폴더 구조 {#practice-folder}

> 🏷️ `규칙` `폴더` · 📅 2026-10-21

**한 줄 요약:** 연습은 `E:\Coding\dojo-practice`, 앱 원본은 `coding-classroom`, 노트는 `dojo-wiki` — **섞지 않는다.**

### 왜 분리하나
- `coding-classroom`은 GitHub에 push하면 **Firebase에 자동 배포**된다.
- 거기에 연습 파일을 두면 `push.bat` 한 번에 사이트까지 올라간다.
- 3D 작업에서 원본 .blend와 테스트 씬을 따로 두는 것과 같다.

### 구조
```
E:\Coding\
├─ coding-classroom\     ← 코딩Dojo 앱 (건드리지 않기)
├─ dojo-practice\        ← 연습 파일
│   ├─ ch00-vscode-clinic\
│   │   └─ ch00-l07-terminal-location.js
│   └─ ch01-podcast-extension\
└─ dojo-wiki\            ← 이 위키
    └─ src\<분류>\guide.md   ← 노트는 여기만 고친다
```

## 예제 파일 이름 짓기 {#file-naming}

> 🏷️ `규칙` `이름` · 📅 2026-10-21

**한 줄 요약:** 앱 화면의 `CH0-L7.JS`와 짝이 맞게 → `ch00-l07-짧은-영어-설명.js`

### 형식
```
ch00-l07-terminal-location.js
│    │   └ 짧은 영어 설명
│    └ 레슨 번호
└ 챕터 번호
```

### 코딩Dojo에서 바로 복사하기
레슨 제목 바로 아래에 **📄 예제 파일** 이 나온다. 이름을 누르면 복사된다.

```
📄 예제 파일  dojo-practice\ch00-vscode-clinic\  ch00-l07-terminal-location.js
```

VS Code 탐색기에서 해당 폴더 우클릭 → **새 파일** → `Ctrl + V` → Enter.
(이름 목록은 `coding-classroom\chapters\file-names.js` — 새 레슨이 생기면 여기에 한 줄 추가)

### 규칙 6가지
1. **숫자 앞에 0** — `l7` ❌ → `l07` ✅ (0이 없으면 `l1, l10, l11, l2 …` 순서로 정렬된다)
2. **띄어쓰기 대신 -** — `node terminal location.js` ❌ → `node terminal-location.js` ✅
3. **전부 소문자** — `Ch00` / `ch00` 섞이면 오타
4. **파일 이름은 영어** — `Tab` 자동완성 때 한/영 전환이 끼어들지 않게. 한글 설명은 파일 첫 줄 주석에.
5. **짧게** — `ch00-l07-` 뒤에 단어 2~3개
6. **다시 풀 땐 -v2** — 처음 풀이와 비교하게 원본은 남긴다.

```js
// 0장 레슨 7 · 지금 터미널은 어디에 있지?
```

```
ch00-l07-terminal-location.js
ch00-l07-terminal-location-v2.js
```
