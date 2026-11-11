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
