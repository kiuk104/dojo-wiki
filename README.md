# 🥋 Dojo Wiki

개인 코딩 위키 — 코딩을 배우며 막혔던 것과 알게 된 것. 코딩Dojo(`coding-classroom`)의 짝꿍.
배포 후 주소: https://kiuk104.github.io/dojo-wiki/

## 노트 쓰기 (이것만 기억하기)
1. `src\<분류>\guide.md` 를 VS Code로 연다. (`vscode` · `javascript` · `rules`)
2. 맨 아래에 `## 새 페이지 제목` 으로 이어 쓴다. 양식은 `src\_template\page.md`.
3. 미리 보고 싶으면 터미널에서 `python build.py` → `index.html` 더블클릭.
4. 올리기: `push_github.bat` 더블클릭 (또는 `python push.py -m "메시지"`).

자세한 구조는 [CLAUDE.md](CLAUDE.md).

## 처음 한 번만 — GitHub에 올리기
1. github.com 에서 새 저장소 `dojo-wiki` 만들기 (README 추가 체크 **하지 않기**)
2. 이 폴더에서 터미널을 열고:
   ```powershell
   git init -b main
   git add -A
   git commit -m "Dojo Wiki 시작"
   git remote add origin https://github.com/kiuk104/dojo-wiki.git
   git push -u origin main
   ```
3. 저장소 **Settings → Pages → Source** 를 **GitHub Actions** 로 바꾸기
4. 2~3분 뒤 https://kiuk104.github.io/dojo-wiki/ 열기 → 휴대폰에서 "홈 화면에 추가"
