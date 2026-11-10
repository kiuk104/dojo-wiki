# Flutter · Dart 노트

> 📝 플러터 앱(Fokus Player 등)을 만들면서 막혔던 것과 알게 된 것을 모아 두는 곳이에요. 새 페이지는 `## 제목`으로 맨 아래에 이어 붙여요.

## 패키지 버전 충돌 (version solving failed) {#pub-version-solving}

> 🏷️ `flutter` `pub` `패키지` · 📅 2026-11-10

**한 줄 요약:** 최신 패키지가 내 Flutter 버전과 안 맞으면 `pubspec.yaml` 에서 버전 범위를 **한 단계 낮게** 적어 준다.

### 문제 / 상황
Fokus Player 에 DB 패키지 `drift` 를 넣었는데, 그다음 `drift_dev` 를 추가하자 이런 오류가 났어요.

```
because fokus_player depends on flutter from sdk which depends on meta 1.17.0,
drift >=2.35.0 is incompatible with drift_dev.
So, because fokus_player depends on both drift ^2.35.4 and drift_dev any, version solving failed.
```

### 해결
`pubspec.yaml` 에서 `drift` 를 최신(2.35)보다 아래 버전으로 묶고 다시 추가했어요.

```yaml
dependencies:
  drift: ">=2.30.0 <2.35.0"   # 원래 ^2.35.4
```

```powershell
flutter pub add --dev drift_dev build_runner
```

→ `drift 2.34.4` + `drift_dev 2.34.0` 으로 맞춰져서 해결.

### 왜 그런가
- 패키지는 서로 "나는 ○○ 버전 이상이 필요해" 하는 **조건**을 달고 있어요. `pub` 은 모든 조건을 동시에 만족하는 조합을 찾는데, 그런 조합이 없으면 `version solving failed`.
- 이번엔 최신 `drift` 가 `meta 1.18` 을 원했지만, **Flutter SDK 자체가 `meta 1.17` 로 고정**돼 있었어요. SDK 는 내가 고를 수 없으니 패키지 쪽을 낮춰야 해요.
- 3D 비유: 최신 플러그인이 "블렌더 4.3 이상 필요"인데 내 블렌더가 4.2 이면, 블렌더를 올리거나 플러그인의 예전 버전을 깔죠. 여기선 `flutter upgrade` 가 블렌더 올리기, 버전 범위 낮추기가 예전 플러그인 깔기.
- 오류 메시지는 **맨 아래 "So, because …" 줄부터** 읽으면 원인이 보여요.

> 💡 꿀팁 `^2.35.4` 는 "2.35.4 이상, 3.0 미만" 이라는 뜻. 범위를 직접 쓸 땐 따옴표로 감싸요: `">=2.30.0 <2.35.0"`

### 관련
- 플러터를 올려도 해결돼요(`flutter upgrade`). 다만 다른 플러터 프로젝트에도 영향이 가서 이번엔 패키지 쪽을 낮췄어요.

## 인터넷에서 받은 글의 한글이 깨질 때 (bodyBytes + utf8) {#http-utf8}

> 🏷️ `dart` `http` `한글` · 📅 2026-11-10

**한 줄 요약:** `http` 응답은 `res.body` 대신 `utf8.decode(res.bodyBytes)` 로 읽으면 한글이 안 깨진다.

### 문제 / 상황
팟캐스트 피드(XML)를 `http` 로 받아서 `res.body` 를 그대로 쓰면, 서버가 글자 방식(charset)을 안 알려 줄 때 `ì¤ë¸...` 처럼 한글이 깨질 수 있어요.

### 해결
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

final res = await http.get(Uri.parse(url));
final text = utf8.decode(res.bodyBytes);   // res.body 대신
```

### 왜 그런가
- 인터넷으로 오는 건 글자가 아니라 **숫자(바이트) 덩어리**예요. 이걸 글자로 바꾸는 규칙(인코딩)이 여러 가지인데, 한글은 보통 **UTF-8**.
- `res.body` 는 서버가 규칙을 안 알려 주면 옛날 서양 규칙(latin1)으로 풀어 버려요 → 한글이 엉뚱한 글자로.
- `bodyBytes` 는 바이트 그대로라서, 내가 "이건 UTF-8 이야" 하고 직접 풀면 정확해요.
- 3D 비유: 텍스처 파일을 sRGB 로 읽어야 하는데 Linear 로 읽으면 색이 이상해지는 것과 같아요. 데이터는 같은데 **해석 규칙**이 틀린 것.

### 관련
- PowerShell 에서 한글이 든 명령 인자를 넘길 때도 비슷하게 깨질 수 있어요 (`flutter create --description "한글"` 이 깨졌던 일). 그땐 파일을 직접 고치는 게 빠름.

## await 했더니 안 돌아올 때 (just_audio 의 play) {#await-play}

> 🏷️ `dart` `async` `just_audio` · 📅 2026-11-10

**한 줄 요약:** `await player.play()` 는 **재생이 멈출 때까지** 기다린다. 재생만 시작하고 다음 줄로 가려면 `unawaited(player.play())`.

### 문제 / 상황
에피소드를 여는 함수 끝에서 `await player.play();` 를 하면, 그 함수를 부른 쪽(목록 화면)이 재생이 끝날 때까지 멈춰 있어요. 34분짜리 에피소드면 34분 동안이요.

### 해결
```dart
import 'dart:async';

await player.setAudioSource(source);   // 여는 건 기다림 (실패하면 여기서 오류)
unawaited(player.play());              // 재생은 시작만 시키고 바로 다음으로
```

### 왜 그런가
- `Future` 는 "나중에 끝나는 일"의 **영수증**이고, `await` 는 "그 일이 끝날 때까지 여기서 기다려"예요.
- 대부분의 함수는 일이 금방 끝나지만, `play()` 의 일은 "재생하기"라서 **재생이 멈춰야 끝나요**.
- 3D 비유: 렌더 버튼을 누르고 렌더가 다 끝날 때까지 화면 앞에 앉아 있는 게 `await`, 렌더를 걸어 두고 다른 작업하러 가는 게 `unawaited`.
- 그냥 `player.play();` 라고만 써도 동작은 같지만, 린트가 "Future 를 버렸다"고 경고할 수 있어서 `unawaited(...)` 로 **일부러 안 기다린다**고 표시해 둬요.

> ⚠️ 주의 기다려야 하는 것(파일 열기, DB 저장)까지 `unawaited` 로 하면 순서가 꼬여요. "끝나야 다음이 되는 일"인지 먼저 생각하기.

## 앱을 업데이트할 때 DB 표 바꾸기 (마이그레이션) {#drift-migration}

> 🏷️ `flutter` `drift` `DB` · 📅 2026-11-10

**한 줄 요약:** 이미 폰에 깔린 앱의 DB 에 표를 추가하려면 `schemaVersion` 을 올리고 `onUpgrade` 에 "옛 버전 → 새 버전" 바꾸는 법을 적는다.

### 문제 / 상황
Fokus Player 에 설정값(반복 횟수, 독일어만 듣기)을 저장할 `prefs` 표가 필요해졌어요. 그런데 폰에는 이미 1단계 앱이 깔려서 **표 2개짜리 DB** 가 있고, 거기엔 이어듣기 위치도 들어 있어요. 코드에 표만 추가하면 새로 설치한 폰에선 되지만, 이미 깔린 폰에선 `prefs` 표가 없어서 오류가 나요.

### 해결
```dart
@override
int get schemaVersion => 2;   // 1 → 2 로 올림

@override
MigrationStrategy get migration => MigrationStrategy(
  onUpgrade: (m, from, to) async {
    if (from < 2) await m.createTable(prefs);   // 2: 설정 표 추가
  },
);
```
테스트로 "옛 DB" 를 직접 만들어 확인:
```dart
NativeDatabase.memory(setup: (raw) {
  raw.execute('CREATE TABLE "episodes" (...)');   // 1버전 표 그대로
  raw.execute('PRAGMA user_version = 1');          // "나는 1버전 DB" 표시
})
```

### 왜 그런가
- DB 파일 안에는 **버전 번호**(`user_version`)가 적혀 있어요. 앱이 켜질 때 "파일은 1버전, 코드는 2버전" 이면 `onUpgrade(from: 1, to: 2)` 를 불러 줘요.
- 3D 비유: 블렌더 옛 버전 `.blend` 를 새 버전에서 열면 **자동 변환** 되잖아요. 그 변환 규칙을 내가 써 주는 것.
- `if (from < 2)` 처럼 쓰면 나중에 3, 4버전이 생겨도 1버전 폰은 2→3→4 를 차례로 다 거쳐요.

> ⚠️ 주의 표를 고친 뒤 `dart run build_runner build` 로 생성 코드(`database.g.dart`)도 다시 만들어야 해요.

### 칸 하나 추가하기 (v2 → v3)
'다 들음' 표시를 위해 `episodes` 표에 `finished` 칸을 넣었을 때:
```dart
BoolColumn get finished => boolean().withDefault(const Constant(false))();
...
if (from < 3) await m.addColumn(episodes, episodes.finished);   // 3: 다 들음
```
- `withDefault(false)` 가 중요해요. 이미 있는 에피소드 줄에도 칸이 생기는데, 그 값을 "안 들음" 으로 채워 줘요.
- **폰마다 DB 버전이 다를 수 있어요.** 1단계 앱만 깐 폰은 v1, 5단계 앱을 깐 폰은 v2. 그래서 테스트도 v1 → v3, v2 → v3 두 가지를 다 만들어요.

> 💡 꿀팁 테스트에 옛 표를 만드는 SQL 을 붙여 넣을 때, 따옴표(`''`)가 들어 있으면 다른 언어(파이썬 등)를 거쳐 옮기다 깨지기 쉬워요. 실제로 `DEFAULT ''` 가 `DEFAULT` 로 사라져서 테스트가 실패했어요. 이미 맞게 써 둔 줄을 그대로 복사하는 게 안전.

## 폰 없이 테스트하기 — 판단과 동작을 나누기 {#logic-separation}

> 🏷️ `flutter` `테스트` `설계` · 📅 2026-11-10

**한 줄 요약:** "어디로 이동할지 정하는 코드"와 "실제로 소리를 옮기는 코드"를 나누면, 판단 부분은 폰 없이 PC 에서 수백 번 시험할 수 있다.

### 문제 / 상황
묶음 반복(한 문장 3번)과 독일어만 듣기(한국어 건너뛰기)는 재생 중 0.1초마다 위치를 보고 판단해요. 이걸 오디오 플레이어 코드 안에 섞어 두면 확인할 방법이 **폰에 깔고 직접 듣기** 뿐이에요.

### 해결
- `StudyLogic` 클래스: 위치를 받으면 "여기로 이동해" 또는 "그대로" 만 대답. 소리는 모름.
- `PlayerHandler`: 0.1초마다 위치를 `StudyLogic` 에 물어보고, 대답대로 `seek`.
- 테스트에선 가짜 재생기(0.1초씩 위치를 늘리는 반복문)로 몇 분 분량을 순식간에 돌려 봄:
```dart
for (var i = 0; i < maxTicks && pos < until; i++) {
  final target = logic.onTick(pos);
  if (target != null) { pos = target; continue; }   // 이동하라면 이동
  heard.add(pos);                                    // 아니면 "들은 위치" 기록
  pos += const Duration(milliseconds: 100);
}
```
→ "3회 반복이면 각 문장이 3번 시작됐나", "독일어만이면 한국어 구간에서 들린 시간이 0인가" 를 숫자로 확인.

### 왜 그런가
- 3D 비유: 리그(뼈대·컨트롤러 계산)와 렌더를 따로 두면, 렌더 안 걸고도 뷰포트에서 포즈가 맞는지 바로 볼 수 있는 것과 같아요.
- 판단 코드에 화면·소리·인터넷이 없으면 입력 → 출력만 보면 되니까 테스트가 쉽고 빨라요. 실패하면 숫자로 바로 보여서, 이번엔 테스트 쪽 계산 실수 2개(위치 간격·틱 개수)를 금방 찾아 고쳤어요.
