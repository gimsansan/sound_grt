# sound_grt 독립 프로젝트 생성 계획

사용자님의 의도에 맞게, 기존 `0708` 폴더에서 구축했던 '소리 생성기'의 기반 코드를 현재 작업 폴더인 `d:\Projects\sound_grt`로 모두 복사해 와서, **완전히 독립된 형태의 새로운 앱 프로젝트**로 세팅합니다.

## Proposed Changes

### 1. 파일 이관 (Copy)
`d:\0708`에 있는 핵심 소스 코드 및 설정 파일들을 `d:\Projects\sound_grt` 폴더로 복사합니다.
- **복사 대상**: `app`, `assets`, `components`, `constants`, `context`, `hooks`, `services`, `types`, `package.json`, `app.json`, `babel.config.js`, `tsconfig.json`, `metro.config.js`, 기타 필수 설정 파일
- **제외 대상**: 용량이 크고 재설치가 필요한 의존성 폴더들(`.git`, `node_modules`, `android`, `.expo`) 및 임시 폴더.

### 2. 패키지 정보 업데이트
- `package.json`과 `app.json` 내부의 앱 이름 및 식별자를 기존 앱과 겹치지 않게 `sound_grt`로 변경하여 독립된 앱으로 만듭니다.

### 3. 패키지 재설치 (npm install)
- 현재 폴더(`sound_grt`)에서 `npm install`을 실행하여 모든 라이브러리(Expo, Reanimated, Skia 등)를 정상적으로 다시 설치합니다.

## Verification Plan

- [ ] 복사된 폴더에 `app/(tabs)/sound_grt/index.tsx` 등 앞서 만들었던 기반 파일들이 잘 존재하는지 확인합니다.
- [ ] `npm install` 완료 후 타입 검사(`tsc`)가 정상 통과하는지 터미널에서 확인합니다.
