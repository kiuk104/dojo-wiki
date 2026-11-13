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

### 표 두 개 + 처음 데이터 넣기 (v3 → v4) — 2026-11-13
플레이리스트를 만들면서 `playlists`, `playlist_items` 표 두 개와 `episodes.last_played_at` 칸을 한 번에 넣었어요. 그리고 **기본 스마트 목록 세 개**를 처음부터 들어 있게 했어요.
```dart
int get schemaVersion => 4;

MigrationStrategy get migration => MigrationStrategy(
  onCreate: (m) async {          // 앱을 처음 설치한 폰
    await m.createAll();
    await _addDefaultSmartLists();
  },
  onUpgrade: (m, from, to) async {   // 이미 깔린 폰
    ...
    if (from < 4) {
      await m.addColumn(episodes, episodes.lastPlayedAt);
      await m.createTable(playlists);
      await m.createTable(playlistItems);
      await _addDefaultSmartLists();   // 여기서도!
    }
  },
);
```
- **기본 데이터는 두 군데에 다 넣어야 해요.** 새로 설치한 폰은 `onCreate` 만, 업데이트한 폰은 `onUpgrade` 만 지나가요. 한쪽만 쓰면 "내 폰엔 기본 목록이 없어요" 가 돼요.
- `onCreate` 를 직접 쓰면 drift 가 해 주던 `createAll()` 도 내가 불러야 해요 (안 부르면 표가 하나도 안 생김).
- 3D 비유: 새 프로젝트 템플릿(onCreate)에도, 옛 파일 변환기(onUpgrade)에도 같은 기본 재질을 넣어 두는 것.
- 테스트는 v1·v2·v3 → v4 를 모두. 특히 **지금 폰에 있는 v3** 에서 위치·다 들음·설정이 그대로인지.

> 💡 꿀팁 테스트에 옛 표를 만드는 SQL 을 붙여 넣을 때, 따옴표(`''`)가 들어 있으면 다른 언어(파이썬 등)를 거쳐 옮기다 깨지기 쉬워요. 실제로 `DEFAULT ''` 가 `DEFAULT` 로 사라져서 테스트가 실패했어요(2026-11-13 에 또 한 번!). 이유: Dart 에서 `'...DEFAULT '', ...'` 는 작은따옴표 안의 `''` 가 "문자열 끝 + 새 문자열 시작" 으로 읽혀서, **나란히 붙은 두 문자열이 하나로 이어져요** (`'ab' 'cd'` = `'abcd'`). 그래서 `''` 가 감쪽같이 사라져요. 작은따옴표 문자열 안에서는 역슬래시를 붙여 `\'\'` 로 써야 해요. 이미 맞게 써 둔 줄을 그대로 복사하는 게 안전.

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

## release 서명 키스토어 — 만들기·지키기 {#release-keystore}

> 🏷️ `flutter` `android` `서명` `release` · 📅 2026-11-10

**한 줄 요약:** release APK 는 내 키스토어(.jks)로 서명한다. 이 파일과 비밀번호를 잃으면 **같은 앱으로 업데이트를 영영 못 하니** git 에는 넣지 말고 따로 백업한다.

### 문제 / 상황
지금까지 폰에 깐 건 디버그 앱. 디버그 키는 PC 마다 다르고(`~/.android/debug.keystore`), 실사용용으로는 내 키가 필요해요.

### 해결
1. 키스토어 만들기 (Android Studio 에 들어 있는 `keytool`):
```powershell
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkeypair `
  -keystore C:\Users\kiuk1\keystores\fokus-player\fokus-player-upload.jks `
  -storetype PKCS12 -alias upload -keyalg RSA -keysize 2048 -validity 10000
```
2. 비밀번호는 `android/key.properties` 에 (Flutter 기본 `.gitignore` 가 이미 제외):
```
storePassword=...
keyPassword=...
keyAlias=upload
storeFile=C:/Users/kiuk1/keystores/fokus-player/fokus-player-upload.jks
```
3. `android/app/build.gradle.kts` 의 release 가 이 파일을 읽어 서명하게 설정 → `flutter build apk --release`
4. 확인: `apksigner verify --print-certs app-release.apk` 에 `CN=Android Debug` 가 아니라 내 이름이 나오면 성공.

### 왜 그런가
- 안드로이드는 **같은 서명** 의 APK 만 업데이트로 받아 줘요. 서명이 다르면 "앱이 충돌합니다" 로 설치 거부 → 지우고 다시 깔아야 하고, 그러면 앱 데이터(이어듣기 위치 등)도 사라져요.
- 3D 비유: 키스토어는 **작가 낙관(도장)**. 같은 도장이 찍힌 작품만 "그 작가의 새 버전" 으로 인정돼요. 도장을 잃어버리면 새 작품은 남의 것으로 취급.
- 그래서 디버그 앱 → release 앱으로 바꿀 땐 **한 번은 지우고** 설치해야 해요. 그 뒤로는 release 끼리 덮어 설치(`adb install -r`)하면 데이터가 남아요.

> ⚠️ 주의 키스토어 폴더는 **프로젝트 밖**에 두고, `.jks` + `key.properties` 두 파일을 같이 백업 (USB, 암호 걸린 압축 파일 등). 비밀번호는 비밀번호 관리자에도 적어 두기. git·채팅·공개 클라우드 폴더에 올리지 않기.

> 💡 꿀팁 `key.properties` 가 없을 때 release 빌드가 디버그 키로 몰래 서명되지 않게, 일부러 멈추도록 설정해 두면 실수를 막을 수 있어요.

### 관련
- 앱을 업데이트할 때 DB 표 바꾸기 (마이그레이션)

## 화면 꺼진 채 다음 곡으로 — stop() 대신 소스 바꾸기 {#background-next-track}

> 🏷️ `flutter` `audio_service` `android` `백그라운드` · 📅 2026-11-10

**한 줄 요약:** 백그라운드 재생 중에 다음 에피소드로 넘어갈 때 `player.stop()` 을 먼저 부르면 안 된다. 새 소스를 바로 `setAudioSource` 한다.

### 문제 / 상황
에피소드가 끝나면 다음 에피소드로 자동으로 넘어가게 만들면서, 처음엔 "지금 것 멈춤(`stop`) → 다음 것 열기 → 재생" 순서로 짜려고 했어요. 그런데 audio_service 소스를 읽어 보니:
```java
if (oldProcessingState != idle && processingState == idle) {
    stop();   // 백그라운드 서비스를 통째로 내림
}
```
`player.stop()` 을 부르면 상태가 **idle(멈춤)** 이 되고, 그 순간 백그라운드 서비스가 내려가요. 화면이 꺼진 채로 다시 재생하려면 서비스를 새로 띄워야 하는데, **안드로이드 12+ 는 백그라운드에서 서비스 시작을 막아요.** → 화면 끄고 들으면 다음 에피소드가 안 나올 수 있어요.

### 해결
```dart
await _savePosition(player.position);
// player.stop() 은 부르지 않음
await player.setAudioSource(AudioSource.uri(next), initialPosition: start);
player.play();
```
소스를 바로 바꾸면 상태가 `loading(불러오는 중) → ready` 만 거치고 idle 이 되지 않아서 서비스가 계속 살아 있어요.

### 왜 그런가
- 3D 비유: 렌더팜에서 다음 프레임을 걸 때 **렌더 서버를 껐다 켜는** 것과 **작업만 바꿔 넣는** 것의 차이. 껐다 켜려면 관리자 허락(=사용자가 화면을 켜고 앱을 누름)이 필요해요.
- 이런 건 문서보다 **라이브러리 소스를 직접 읽어서** 알게 되는 경우가 많아요. 패키지 소스는 `C:\Users\kiuk1\AppData\Local\Pub\Cache\hosted\pub.dev\<패키지-버전>\` 에 있어요.

### 관련
- await 했더니 안 돌아올 때 (just_audio 의 play)

## 차·이어폰 재생 버튼이 다른 앱으로 갈 때 (미디어 세션) {#media-button-routing}

> 🏷️ `flutter` `audio_service` `android` `블루투스` · 📅 2026-11-11

**한 줄 요약:** 안드로이드는 재생 버튼을 **마지막으로 살아 있던 미디어 세션** 앱으로 보낸다. 앱을 닫을 때 세션을 없애면 버튼이 다른 팟캐스트 앱으로 간다.

### 문제 / 상황
차에서 재생 버튼을 누르면 Fokus Player 가 아니라 안테나팟이 켜졌어요. Fokus Player 는 폰에서 직접 눌러야 다시 반응.

확인 방법 (폰을 PC 에 연결):
```powershell
adb shell dumpsys media_session
```
- `Media button session is ...` → 지금 버튼을 받는 앱
- `Last MediaButtonReceiver: ...` → 세션이 하나도 없을 때 버튼을 받는 앱
- `Sessions Stack` → 살아 있는 세션 목록

### 해결
- 최근 앱 목록에서 밀어 닫을 때 `stop()`(세션 없앰) 대신 `pause()`(세션 유지):
```dart
@override
Future<void> onTaskRemoved() => pause();
```
- 앱이 꺼진 상태에서 버튼으로 켜지면, 설정·마지막 에피소드를 다 읽은 뒤 재생하도록 기다림 (`Completer`).
- 안드로이드 '최근 미디어' 카드용으로 `getChildren('recent')` 에 마지막 에피소드를 돌려줌.

### 왜 그런가
- 미디어 세션 = 시스템에 "나 지금 소리 내는 앱이야" 하고 걸어 둔 **명패**. 차·이어폰·잠금화면 버튼은 명패가 걸린 앱으로 가요.
- 명패를 떼면(stop) 시스템은 "마지막으로 버튼을 받던 앱" 기록을 보고 고르는데, 그사이 다른 앱을 썼다면 그쪽이 뽑혀요.
- 3D 비유: 렌더팜 대기열에서 **작업 슬롯을 반납**하면 다음 차례 작업이 들어오는 것. 잠깐 쉬는 거면 슬롯은 쥐고 있어야 해요(pause).

> ⚠️ 주의 알림의 '정지' 버튼은 여전히 세션을 없애요. 그 뒤에는 다른 앱이 버튼을 가져갈 수 있어요.

## 앱 색을 토큰으로 — ThemeExtension {#theme-extension}

> 🏷️ `flutter` `테마` `디자인` · 📅 2026-11-11

**한 줄 요약:** 테마 색(배경·카드·강조…)을 `ThemeExtension` 한 벌로 두고, 화면 코드는 `context.fokus.c.gold` 처럼 **토큰 이름만** 쓴다. 테마를 바꾸면 화면 전체가 따라 바뀐다.

### 문제 / 상황
Fokus Player 에 Fokus Karten 과 같은 테마 7종(Classic Light·Dark, Paper, Neon, Forest, Lavender, Terminal)을 넣어야 했어요. 화면 곳곳에 `Colors.teal`, `colorScheme.primary` 같은 게 흩어져 있으면 테마마다 어디를 바꿔야 할지 알 수 없어요.

### 해결
```dart
class Fokus extends ThemeExtension<Fokus> {
  final FokusColors c;   // cream, card, border, ink, muted, gold, red, blue, green
  final bool square;     // Terminal 이면 모서리 0
  ...
}
extension FokusContext on BuildContext {
  Fokus get fokus => Theme.of(this).extension<Fokus>()!;
}

// 화면에서는
Text(german, style: TextStyle(color: context.fokus.c.blue));
```
- `ThemeData(extensions: [Fokus(...)])` 로 테마마다 한 벌씩 넣어요.
- 버튼·스위치 같은 기본 위젯도 맞추려면 `ColorScheme` 도 토큰으로 채워요 (primary = gold, surface = cream …).
- 테스트에서 Karten 의 `theme.css` 를 직접 읽어 값이 같은지 비교 → 한쪽만 바뀌면 테스트가 알려 줘요.

### 왜 그런가
- 3D 비유: 머티리얼마다 색을 직접 박아 두는 대신 **머티리얼 라이브러리의 공용 파라미터**(예: "Accent")를 연결해 두는 것. 파라미터 하나만 바꾸면 씬 전체가 바뀌어요.
- 이름이 Karten CSS 변수(`--gold` 등)와 같아서 두 앱을 오가며 고칠 때 헷갈리지 않아요.

> 💡 꿀팁 한글 글꼴은 한 벌에 6~8MB 라 앱에 넣을 때는 꼭 필요한 굵기(400·700)만. Google Fonts CSS 주소를 `curl` 로 그냥 받으면 굵기별 `.ttf` 주소가 나와요.

## 위젯 테스트가 끝나지 않을 때 (가짜 시계 + DB) {#widget-test-fake-async}

> 🏷️ `flutter` `테스트` · 📅 2026-11-11

**한 줄 요약:** `testWidgets` 안은 **가짜 시계**로 돈다. 탭으로 시작된 DB 저장이 거기서 멈춰 있으면, 마지막에 `runAsync` 로 DB 를 다시 읽는 순간 영원히 기다린다.

### 문제 / 상황
설정 화면 테스트에서 테마 카드를 탭 → 저장 → 마지막에 `tester.runAsync(() => DisplaySettings.load(db))` 로 다시 읽기. 테스트가 끝나지 않았어요. `print('STEP n')` 을 곳곳에 넣어 보니 마지막 다시 읽기에서 멈춤.

### 해결
- 저장이 잘 되는지는 **화면 없는 단위 테스트**(`test(...)`)에서 확인하고, 위젯 테스트는 화면에서 값이 바뀌는지만 봐요.
- 끝나지 않은 테스트 프로세스(`flutter_tester`)가 남아 파일을 잡고 있으면 다음 테스트가 `PathExistsException` 으로 죽어요 → 작업 관리자에서 그 프로세스를 끄기.

### 왜 그런가
- 위젯 테스트는 애니메이션을 빨리 돌리려고 시간을 흉내 내요. 진짜 시간이 필요한 일(파일·DB)은 그 안에서 반쯤 진행된 채 멈출 수 있어요.
- 3D 비유: 뷰포트 미리보기(가짜 시계)에서 시뮬레이션 캐시를 굽기 시작하고, 최종 렌더(진짜 시계)에서 그 캐시가 끝나길 기다리는 꼴.

### 비슷한 것: "A Timer is still pending" (2026-11-13)
설정 화면에 **DB 를 지켜보는 목록**(drift 의 `watch()` 스트림 → `StreamBuilder`)을 넣었더니, 멀쩡하던 설정 화면 테스트가 끝에서 이렇게 실패했어요.
```
A Timer is still pending even after the widget tree was disposed.
```
drift 는 스트림 구독이 끝나면 **조금 뒤에 정리하는 타이머**를 걸어요. 테스트가 끝나는 순간 그 타이머가 아직 남아 있어서 "치우지 않은 게 있다" 고 하는 것. 테스트 끝에 화면을 닫고 가짜 시계를 조금 돌려 주면 돼요.
```dart
await tester.pumpWidget(const SizedBox());           // 화면을 닫음 → 구독 끝
await tester.pump(const Duration(seconds: 1));        // 정리 타이머까지 흘려보냄
```
- 3D 비유: 렌더가 끝났는데 백그라운드에서 썸네일 저장이 아직 도는 상태로 프로그램을 닫으려는 것. 저장 끝날 때까지 1초 기다려 주기.

## 글자를 상자에 꼭 맞게 — TextPainter 로 재기 {#text-fit}

> 🏷️ `flutter` `글자` `레이아웃` · 📅 2026-11-11

**한 줄 요약:** `TextPainter` 로 "이 크기면 몇 줄, 몇 px 높이인지" 미리 재고, 들어가는 가장 큰 크기를 이분 탐색으로 고른다. 잴 때와 그릴 때 **글자 모양(자간 등)이 같아야** 한다.

### 문제 / 상황
가로 화면 '크게 보기'에서 독일어 문장을 최대한 크게, 길면 자동으로 줄여 한 화면에 넣고 싶었어요. `FittedBox` 는 글자를 줄바꿈 없이 한 줄로 늘어놓은 뒤 통째로 줄여서, 긴 문장이 개미만 해져요.

### 해결
```dart
double heightOf(String text, TextStyle style, double width) {
  final p = TextPainter(
    text: TextSpan(text: text, style: style),
    textDirection: TextDirection.ltr,
  )..layout(maxWidth: width);   // 이 너비로 줄바꿈했을 때
  return p.height;              // 높이가 얼마인지
}
// 18 ~ 72 사이에서 '들어가는 가장 큰 크기' 를 반씩 좁혀 찾기 (이분 탐색)
```
- 처음엔 테스트에서 **38px 넘침**. 원인: 잴 때는 내가 만든 스타일만, 그릴 때는 화면 기본 스타일(자간 0.25 등)이 섞여 들어감 → 글자가 조금 넓어져 줄이 하나 더 생김.
- 고침: `DefaultTextStyle.of(context).style.merge(내 스타일)` 로 **같은 스타일**로 재기 + 이 화면에선 시스템 글자 배율 끄기(`MediaQuery.withNoTextScaling`).

### 왜 그런가
- 3D 비유: 렌더 해상도를 정하려고 **미리보기 렌더**를 걸 때, 본 렌더와 같은 설정(샘플 수·색 공간)으로 걸어야 결과가 맞는 것과 같아요.
- 테스트 글꼴(FlutterTest)은 모든 글자가 정사각형이라, "30글자 × 20px = 600px" 처럼 계산이 딱 떨어져서 규칙을 확인하기 좋아요.

### 보충: 차 화면 앨범 아트를 꽉 채우기 (2026-11-12)
Android Auto 의 앨범 아트 칸이 작아서, 그림 속 글자를 칸에 꽉 차게 다시 짰어요.
- **줄은 내가 정함:** `TextPainter` 에 줄바꿈을 맡기지 않고, 띄어쓰기·하이픈(`Corona-` / `Pandemie`)에서만 줄을 나누는 규칙을 직접 짬. 큰 크기(한 변의 42%)에서 시작해 넘치면 0.94배씩 줄이고, 최대 4줄.
- **배치 규칙과 그리기를 다른 파일로:** 배치 규칙은 "글자 폭 재는 함수"를 받아서 계산만 해요. 테스트에서는 `글자 수 × 크기 × 0.6` 같은 가짜 자로 재서, 진짜 글꼴 없이 규칙을 확인 (판단과 동작 나누기와 같은 생각).
- **폭은 크기에 비례:** 100px 에서 한 번 재 두고 `폭 × 크기 / 100` 으로 계산하면, 크기를 수십 번 바꿔 봐도 빠름.
- **섞인 크기:** `TextSpan(children: [...])` 로 문법 표시(jdm., + Dat.)는 절반 크기·회색, 핵심 단어는 크고 흰색. 한 줄 안에서 크기가 달라도 글자 바닥선은 자동으로 맞음.
- **캐시 이름에 버전:** 그리는 방식이 바뀌면 `art_v2_…` 처럼 이름 앞 버전을 올려서 옛 그림을 쓰지 않고 지움. 이름은 `Object.hash` 대신 직접 계산한 해시(FNV)로 — `Object.hash` 는 앱을 다시 켜면 값이 바뀔 수 있어요.

## 안드로이드 기능을 직접 부르기 — MethodChannel {#method-channel}

> 🏷️ `flutter` `android` `kotlin` · 📅 2026-11-11

**한 줄 요약:** 패키지가 없거나 한 줄짜리 기능이면, `MainActivity.kt` 에 채널을 열고 Dart 에서 `invokeMethod` 로 부른다.

### 문제 / 상황
크게 보기 화면에서는 화면이 저절로 꺼지면 안 돼요. 안드로이드에선 창에 `FLAG_KEEP_SCREEN_ON` 한 줄만 켜면 되는데, 이것 때문에 패키지를 더 넣기는 아까웠어요.

### 해결
```kotlin
// MainActivity.kt
MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "fokus/screen")
    .setMethodCallHandler { call, result ->
        if (call.method == "keepOn") {
            if (call.arguments == true) window.addFlags(FLAG_KEEP_SCREEN_ON)
            else window.clearFlags(FLAG_KEEP_SCREEN_ON)
            result.success(null)
        } else result.notImplemented()
    }
```
```dart
// Dart
await const MethodChannel('fokus/screen').invokeMethod('keepOn', true);
```
상태 표시줄 숨기기(몰입 모드)는 Flutter 에 이미 있어요: `SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky)`.

### 왜 그런가
- 채널 = Dart 와 안드로이드 사이의 **무전기 채널**. 같은 이름(`fokus/screen`)으로 맞춰야 서로 들려요.
- 테스트(PC)에는 안드로이드 쪽이 없어서 `MissingPluginException` 이 나요 → `try/catch` 로 조용히 넘기면 테스트도 안전.

### 나중에 패키지로 바꾼 이유 (2026-11-11)
화면 켜 두기가 "설정 세 가지 + 재생 중일 때만 + 일시정지 1분 뒤 해제 + 앱이 뒤로 가면 해제" 로 커지면서 `wakelock_plus` 패키지로 바꿨어요. 안쪽은 같은 `FLAG_KEEP_SCREEN_ON` 이에요.
- 직접 만든 채널과 패키지를 **같이 두지 않기** — 둘이 서로 켜고 끄면 누가 껐는지 알 수 없어요. 채널 코드는 지웠어요.
- "언제 켤지" 는 `shouldKeepAwake(...)` 라는 판단 함수로 떼어 내고, 1분 타이머는 `testWidgets` 의 가짜 시계로 `tester.pump(Duration(seconds: 61))` 해서 확인 (진짜로 1분 기다리지 않음).

## 같은 일을 여러 곳에서 겹쳐 부를 때 — 마지막 요청만 끝까지 {#latest-request-wins}

> 🏷️ `dart` `async` `just_audio` `경쟁 상태` · 📅 2026-11-12

**한 줄 요약:** 시간이 걸리는 일(에피소드 열기)을 여러 곳에서 동시에 부르면 서로 끊는다. "번호표"를 두고, 새 요청이 오면 앞의 것은 **조용히 버리고 마지막 요청만** 끝까지 가게 한다.

### 문제 / 상황
차(Android Auto)로 듣다가 연결을 끊고, 바로 폰에서 에피소드를 누르면 `Loading interrupted` 오류(just_audio 의 `PlayerInterruptedException`)가 화면에 떴어요.

just_audio 소스를 읽어 보니 이 오류는 딱 두 경우에 나요.
1. **불러오는 중에 새 불러오기**(`setAudioSource`)가 오면 → 앞의 것이 끊김
2. **불러오는 중에 `stop()`** 이 오면 → 불러오던 것이 끊김

앱에서 겹치던 곳:
- 차가 끊길 때 정지(`stop`)가 오면 "소리 안 열림" 상태가 됨
- 그 상태에서 목록의 에피소드를 누르면, 화면 이동 코드가 **"마지막 에피소드 열기(재생 안 함)"** 를 먼저 부르고, 바로 이어서 **"누른 에피소드 열기"** 를 또 부름 → 둘이 동시에 불러오다 앞의 것이 끊김 → 그 오류를 그대로 화면에 보여 줌
- 차가 보내는 `playFromMediaId`(목록에서 고르기), 에피소드가 끝나서 넘어가는 자동 다음 곡도 같은 함수를 부름

블루투스 이어폰만 끊으면(차 없이) 보통은 **재현되지 않아요.** 이어폰이 끊길 때 오는 신호(becomingNoisy)는 "일시정지"일 뿐이라 불러오기를 끊지 않거든요. 정지(stop)가 오거나 앱이 새로 켜진 상태에서 에피소드를 누를 때 겹쳐요.

### 해결
번호표 기계를 하나 만들어서 열기를 전부 그 안에서 돌렸어요.
```dart
final _opens = LatestOnly();

Future<void> openEpisode(Episode ep) =>
    _opens.run((t) => _open(ep, t));       // 새 요청이 오면 앞의 t 에 "그만" 신호

Future<void> _open(Episode ep, Ticket t) async {
  final fresh = await db.episodeById(ep.id);
  t.check();                                // 그만두라고 했으면 여기서 조용히 멈춤
  await t.guard(player.setAudioSource(...)); // 기다리는 중에 신호가 와도 바로 멈춤
  ...
}
```
- `run` 은 앞의 일이 정리될 때까지 기다렸다가 다음 일을 시작 → **한 번에 하나만**
- 앞의 일은 `check()` / `guard()` 지점에서 `Superseded`(밀려남) 예외로 멈추고, `run` 이 그걸 **삼켜서** 오류로 보이지 않음
- `guard` 는 버려진 일이 나중에 실패해도(끊긴 불러오기의 오류) 조용히 받아 줌
- 정지 버튼은 `_opens.cancel()` 로 여는 중인 일을 그만두게 함
- 진짜 실패만 한국어 오류로: "오디오를 불러오지 못했습니다" + **다시 시도** 버튼. 실패하면 재생 버튼·대본 안내가 "불러오는 중"에 남지 않게 되돌림

덤으로 찾은 버그: 여는 중에 일시정지가 오면 **옛 에피소드의 위치가 새 에피소드에 저장**될 수 있었어요(소리는 아직 옛 것인데 "지금 에피소드"는 새 것). 여는 중엔 위치를 저장하지 않는 깃발(`_loading`)로 막음.

### 왜 그런가
- `await` 하는 동안 다른 코드가 끼어들 수 있어요. 한 함수가 "DB 읽기 → 불러오기"를 하는 사이, 같은 함수가 또 시작되면 두 개가 **번갈아** 진행돼요. 이걸 **경쟁 상태**(race condition)라고 해요.
- 3D 비유: 렌더 큐에 같은 장면을 두 번 넣으면 서로 렌더 슬롯을 뺏어요. 새 렌더를 넣을 때 **앞의 렌더를 취소하고 마지막 것만 뽑는** 규칙을 두면 결과가 하나로 정해져요.
- "밀려남"은 실패가 아니라 정상적인 흐름이라, 사용자에게 보여 줄 오류와 **종류(예외 클래스)를 나눠** 두는 게 중요해요. `on Superseded { … } catch (e) { … }` 처럼 `on 종류` 로 먼저 걸러요.

### 테스트: 겹치는 상황을 일부러 만들기
폰 없이 겹침을 재현하려고, just_audio 는 진짜를 쓰고 **소리 엔진(플랫폼)만 가짜**로 바꿨어요(`JustAudioPlatform.instance = FakeJustAudio()`). 가짜 엔진은 "불러오기 붙잡기"가 돼서:
1. a 를 불러오는 중에 붙잡아 둠
2. 그 사이 b 열기를 끼워 넣음
3. 풀어 줌 → b 만 재생되고, 두 요청 모두 오류 없이 끝나는지 확인

### 덤: MP3 주소가 바뀌었을 때 (HEAD 요청)
피드에서 MP3 를 다시 만들면 주소가 바뀌어요(예: `-n16.mp3`). 재생 전에 `http.head(주소)` 로 **내용 없이 머리만** 물어보고, 404 면 피드를 새로고침해서 새 주소로 다시 시도. GitHub 은 HEAD 에도 제대로 답해요(있으면 200, 없으면 404). 인터넷이 끊겨 확인을 못 하면 그냥 재생을 시도해요.

### 관련
- await 했더니 안 돌아올 때 (just_audio 의 play)
- 화면 꺼진 채 다음 곡으로 — stop() 대신 소스 바꾸기
- 폰 없이 테스트하기 — 판단과 동작을 나누기

## 릴리스 빌드에서도 기록 남기기 — 최근 200줄 기록장 {#in-app-log}

> 🏷️ `flutter` `디버깅` `로그` `release` · 📅 2026-11-12

**한 줄 요약:** `debugPrint` 는 개발용(debug) 빌드에서만 보인다. 폰에 깔아 쓰는 release 빌드에서 "가끔만 생기는" 문제를 잡으려면, 앱 안에 **최근 N줄만 들고 있는 기록장**을 두고 파일에 저장해서 나중에 꺼내 본다.

### 문제 / 상황
차 연결을 끊은 직후 가끔 재생이 멈췄는데, 앱을 다시 켜니 풀렸고 다시 해 보면 재현이 안 됐어요. 재생기 기록은 `if (kDebugMode) debugPrint(...)` 로만 남기고 있어서 release 빌드에서는 **아무것도 안 남았어요.** 증거가 없으니 원인을 추측만 하게 돼요.

### 해결
```dart
class PlayLog {
  static final instance = PlayLog();
  final maxLines = 200;
  final _lines = <String>[];

  void add(String message) {
    _lines.add('${stamp(DateTime.now())} $message'); // 11-12 22:35:07.123 …
    if (_lines.length > maxLines) {
      _lines.removeRange(0, _lines.length - maxLines); // 오래된 것부터 버림
    }
    _scheduleSave(); // 0.3초 모았다가 파일에 한 번에
  }
}
```
- **최근 200줄만:** 넘치면 가장 오래된 줄부터 버려요. 계속 써도 크기가 일정해요.
- **파일에 저장:** 앱 전용 폴더(`getApplicationSupportDirectory()`)에 저장하고, 앱을 켤 때 지난 기록을 앞에 붙여요. 문제가 나서 **앱을 껐다 켜도 직전 기록이 남아요.**
- **무엇을 적나:** 에피소드 열기 요청 / 열림 / 취소됨 / 실패, 재생·일시정지·정지, 차의 `playFromMediaId`, 블루투스 끊김, 그리고 잡히지 않은 오류(`FlutterError.onError`, `PlatformDispatcher.instance.onError`).
- **꺼내기:** 설정 화면 **기록 복사** 버튼 → `Clipboard.setData(...)` 로 버전·빌드 시각과 함께 복사. 메신저에 붙여 넣어 보내면 돼요.

### 왜 그런가
- 3D 비유: 실행 취소(Undo) 기록과 같아요. 최근 몇 단계만 들고 있고, 넘치면 가장 오래된 단계부터 지워요. 이런 모양을 **링 버퍼**(고리 모양 목록)라고 해요.
- "가끔만 생기는" 문제는 대부분 **순서(타이밍)** 문제라서, 각 줄에 **밀리초까지** 시각을 찍어 두면 "정지가 열기보다 0.2초 먼저 왔다" 같은 걸 읽을 수 있어요.
- 파일 쓰기를 줄마다 하지 않고 잠깐 모았다가 쓰는 건, 디스크를 덜 쓰고 앱을 느리게 하지 않으려고요.

> 💡 꿀팁 기록 문구는 나중에 내가 읽을 거라 **한국어로 짧게**. 개인 정보(이메일 등)는 적지 않기.

### 관련
- 같은 일을 여러 곳에서 겹쳐 부를 때 — 마지막 요청만 끝까지
- 안드로이드 기능을 직접 부르기 — MethodChannel

## 부모 클래스에 이미 있는 이름 — 이름이 겹칠 때 {#inherited-name-clash}

> 🏷️ `dart` `클래스` `extends` `audio_service` · 📅 2026-11-13

**한 줄 요약:** `extends` 로 물려받은 클래스에는 내가 안 만든 이름도 들어 있어서, 같은 이름을 새로 만들면 부딪힌다 → 겹치지 않는 이름으로.

### 문제 / 상황
Fokus Player 재생 엔진(`PlayerHandler extends BaseAudioHandler`)에 "지금 듣는 플레이리스트" 를 담을 칸을 `queue` 라는 이름으로 만들었더니, 오류가 한꺼번에 30개 났어요.
```
The getter 'smart' isn't defined for the type 'List<MediaItem>'
A value of type 'PlayQueue?' can't be assigned to a variable of type 'List<MediaItem>'
```
내가 만든 `queue` 는 `PlayQueue` 인데, Dart 는 자꾸 `List<MediaItem>` 이라고 해요.

### 해결
```dart
// ✗ 부모(BaseAudioHandler)에 이미 queue 가 있음
final queue = ValueNotifier<PlayQueue?>(null);

// ✓ 겹치지 않는 이름
final playQueue = ValueNotifier<PlayQueue?>(null);
```

### 왜 그런가
- `extends` = 부모 클래스의 칸과 기능을 **전부 물려받기**. audio_service 의 `BaseAudioHandler` 에는 원래 "재생 대기열" 용 `queue`(타입 `List<MediaItem>` 스트림)가 들어 있어요. 문서를 안 보면 있는지 모르죠.
- 같은 이름을 다시 만들면 부모 것을 **덮어쓰려는**(override) 것처럼 보이는데 타입이 달라서 엉켜요. 오류 문구에 **내가 쓴 적 없는 타입**(`List<MediaItem>`)이 나오면 이걸 의심하면 돼요.
- 3D 비유: 리깅된 캐릭터를 가져왔는데 이미 `Root` 라는 본이 있는 상태에서 내가 또 `Root` 를 만든 것. 이름이 같으면 프로그램은 어느 쪽인지 헷갈려요.

> 💡 꿀팁 VS Code 에서 클래스 이름(`BaseAudioHandler`)을 Ctrl+클릭하면 부모 클래스 코드로 가서 어떤 이름이 이미 있는지 볼 수 있어요.

### 관련
- 화면 꺼진 채 다음 곡으로 — stop() 대신 소스 바꾸기

## 목록을 저장할까, 조건을 저장할까 — 스마트 재생목록 {#smart-playlist-rule}

> 🏷️ `flutter` `설계` `JSON` `drift` · 📅 2026-11-13

**한 줄 요약:** 에피소드를 담아 두는 대신 **고르는 조건**을 저장하고, 열 때마다 다시 계산하면 새 에피소드가 저절로 들어오는 "스마트 목록" 이 된다.

### 문제 / 상황
Fokus Player 에 "안 들은 단어편", "듣던 것 이어서" 같은 목록이 필요했어요. 에피소드를 직접 담아 두면, 새 에피소드가 올라오거나 다 듣고 나면 내가 일일이 넣고 빼야 해요.

### 해결
플레이리스트 표에 `smart_rule` 칸을 두고, 조건을 **JSON 글자**로 저장해요. 칸이 비어 있으면 일반 플레이리스트(직접 담기), 있으면 스마트 목록.
```json
{"kind":"vocab","status":"unplayed","days":null,"limit":null,"sort":"newest"}
```
열 때마다 전체 에피소드에 조건을 걸러서(`where`) 정렬(`sort`)하고 자르기(`take`):
```dart
List<Episode> apply(List<Episode> all) {
  final out = all.where((e) => kindMatches(kind, e) && statusMatches(status, e)).toList();
  out.sort(_comparator(sort));
  return limit == null ? out : out.take(limit!).toList();
}
```
읽을 때는 깨진 JSON·모르는 값이 와도 멈추지 않게 **기본값으로** 돌려요 (`try` / `on FormatException`).

### 왜 그런가
- 3D 비유: 일반 플레이리스트 = **모디파이어를 적용(Apply)해 굳힌 메시**, 스마트 목록 = **모디파이어 스택을 그대로 둔 것**. 원본(에피소드)이 바뀌면 결과가 저절로 다시 계산돼요.
- 대신 "재생을 시작한 다음" 에는 순서를 **굳혀요**(시작할 때 결과의 id 목록을 저장). 다 들은 에피소드가 '안 들음' 조건에서 빠지면서 다음 순서가 흔들리면 안 되니까요. 계산할 땐 살아 있게, 재생할 땐 굳혀서.
- 조건을 고르는 화면에서 바꿀 때마다 `setState` → `apply` 를 다시 불러서 **미리보기가 바로** 바뀌어요. 계산이 가벼워서 가능한 방법.

### 관련
- 앱을 업데이트할 때 DB 표 바꾸기 (마이그레이션)
- 폰 없이 테스트하기 — 판단과 동작을 나누기

## 옮겨 간 데이터 — 지우고 새로 만들지 말고 옮기기 {#move-not-recreate}

> 🏷️ `flutter` `drift` `DB` `설계` · 📅 2026-11-13

**한 줄 요약:** 같은 물건을 알아보는 이름표(guid)가 있으면, 다른 곳으로 옮겨 갔을 때 줄을 지우고 새로 만들지 말고 **그 줄의 소속만 바꾼다.** 그리고 "사라졌다" 싶어도 바로 지우지 말고 잠깐 기다린다.

### 문제 / 상황
Fokus Player 가 피드를 하나 → 셋(독일어·영어·한국어)으로 늘렸어요. 그런데 독일어 피드에 있던 한국어 📖 에피소드 3개가 한국어 피드로 **이사**를 가요 (guid 는 그대로).
예전 방식대로라면:
1. 독일어 피드를 새로 받음 → 📖 가 없음 → **지움** (듣던 위치·다 들음·플레이리스트 항목도 같이 사라짐)
2. 한국어 피드를 받음 → 📖 가 있음 → **새 줄로** 만듦 (위치 0, 안 들음)

화면에는 똑같이 보이지만 내 기록은 날아가요.

### 해결
에피소드를 **guid 로** 알아봐요. 피드가 달라도 guid 가 같으면 같은 에피소드:
```dart
final here = existing.where((e) => e.feedId == feed.id).firstOrNull;
final moved = here ?? existing.firstOrNull;   // 다른 피드에 있던 같은 guid 의 줄
if (moved != null) {
  // 제목·주소만 고쳐 쓰고 feedId 를 바꿈. 위치·다 들음은 data 에 없으니 그대로 남음
  await (db.update(db.episodes)..where((e) => e.id.equals(moved.id))).write(data);
} else {
  await db.into(db.episodes).insert(...);     // 정말 처음 보는 것만 새 줄
}
```
줄 번호(id)가 그대로라서, 그 id 로 연결된 플레이리스트 항목도 저절로 따라와요.

그리고 **"없어졌다" 고 바로 지우지 않아요.** 독일어 피드는 새 내용인데 한국어 피드는 인터넷 캐시 때문에 몇 분 늦게 바뀌거나, 받기에 실패할 수 있어요. 그 사이에 지우면 1번 문제가 그대로 생겨요. 그래서:
- 어디에도 없으면 '지울 후보' 로 적어 두기 (언제 처음 빠졌는지)
- **1시간 넘게** 지난 다음 새로고침에서도 없으면 그때 지우기
- 그 사이 다른 피드에 나타나면 옮기기

### 왜 그런가
- 3D 비유: 오브젝트를 다른 컬렉션으로 옮길 때 **지우고 다시 만들면** 붙어 있던 재질·모디파이어·애니메이션 키가 다 사라져요. 컬렉션만 바꾸면(Move to Collection) 다 따라오죠. DB 의 줄도 똑같아요.
- '이름표' 가 중요해요. 제목이나 오디오 주소는 바뀔 수 있어서 같은 에피소드인지 알 수 없어요. guid 는 그 에피소드가 끝까지 들고 다니는 고유 번호.
- '바로 지우지 않기' 는 휴지통과 같은 생각이에요. 되돌릴 수 없는 일(지우기)은 확실할 때까지 미뤄요. 대가: 정말 내려간 에피소드도 목록에 1시간쯤 더 보여요.

> 💡 꿀팁 이런 규칙은 테스트로 "이사" 를 직접 흉내 내 보면 확실해요. 가짜 피드 두 개를 만들고, 첫 새로고침에선 독일어에, 두 번째엔 한국어에만 넣은 뒤 **id·위치·다 들음이 그대로인지** 확인. 캐시가 늦는 경우는 시간을 직접 넘겨서(`now: t0.add(Duration(hours: 3))`) 확인해요.

### 관련
- 앱을 업데이트할 때 DB 표 바꾸기 (마이그레이션)
- 목록을 저장할까, 조건을 저장할까 — 스마트 재생목록

