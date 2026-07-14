# App Foundation Context & Content Generation Prompt

**설명**: 현재 애플리케이션에 새로운 기능, 미니게임, 또는 화면을 추가하고자 할 때 AI에게 지시하기 위한 프롬프트 템플릿입니다.

---

## 🎯 생성 프롬프트

아래의 텍스트를 복사하여 AI 어시스턴트에게 붙여넣기 하세요:

> 기존의 교육/상호작용형 React Native 앱에 새로운 콘텐츠(예: 새로운 게임, 화면, 기능 등)를 추가하려고 합니다. 아래는 현재 앱의 기반 환경과 아키텍처 정보입니다. 새로 생성하는 코드는 반드시 이 환경에 맞추어 작성되어야 하며, 기존의 Context와 라이브러리를 활용하고 확립된 패턴을 따라야 합니다.
> 
> ### 🛠 기술 스택 및 라이브러리
> - **프레임워크**: React Native 0.86, Expo SDK 57 (네비게이션: `expo-router`)
> - **애니메이션 및 그래픽**: `react-native-reanimated` (v4), `@shopify/react-native-skia`, `rive-react-native`
> - **저장소**: `@react-native-async-storage/async-storage`
> - **상태 관리 (Context)**: 
>   - `StarContext`: 별/점수 획득 상태 관리
>   - `ClearContext`: 레벨/게임 클리어 상태 관리
>   - `AudioManager`: 효과음 및 배경음악 등 전역 오디오 관리
> 
> ### 📂 앱 아키텍처 및 폴더 구조
> - **`app/`**: 파일 기반 라우팅 (`expo-router`)을 사용합니다. 루트 레이아웃(`app/_layout.tsx`)에서 앱 전체를 `StarProvider`, `ClearProvider`, `AudioManagerProvider`로 감싸고 있습니다.
> - **`components/`**: 재사용 가능한 UI 및 게임 메커니즘 컴포넌트가 위치합니다. (예: `ParticleVisualizer.tsx`, `FallingNoteTrack.tsx`, `ScoreProgressBar.tsx`)
> - **`hooks/`**: 게임 로직을 분리하기 위한 커스텀 훅이 위치합니다. (예: `useWordGameLogic.ts`, `useDrumLogic.ts`) 새로운 게임 로직도 훅으로 분리하는 패턴을 사용하세요.
> - **`constants/`**: `colors.ts`, `layout.ts` 같은 디자인 테마나 `drumSounds.ts`, `animalSounds.ts` 같은 매핑 설정이 저장됩니다.
> 
> ### 📜 새로운 콘텐츠 생성 가이드라인
> 1. **컴포넌트 구조**: TypeScript를 사용하는 함수형 컴포넌트로 작성하세요. 복잡한 게임 로직은 `hooks/` 디렉터리에 커스텀 훅으로 분리하세요.
> 2. **애니메이션**: 부드러운 UI 전환에는 `react-native-reanimated`를 사용하고, 파티클 효과나 복잡한 2D 그래픽에는 `react-native-skia`를 활용하세요.
> 3. **오디오**: 효과음이나 배경음악을 재생할 때는 새 인스턴스를 무작위로 만들지 말고, 기존의 `AudioManager` Context를 활용하세요.
> 4. **라우팅**: 화면 간 이동이나 모달 호출에는 `expo-router` 방식을 사용하세요.
> 5. **스타일링**: `StyleSheet.create`를 기본으로 사용하며, 색상 및 레이아웃 값은 `constants/colors.ts` 및 `constants/layout.ts`를 참조하세요.
> 
> **요청 사항**:
> [여기에 구체적인 요청 사항을 입력하세요 - 예: "FallingNoteTrack 컴포넌트와 StarContext를 활용하여 떨어지는 사과를 터치하는 새로운 리듬 미니게임을 만들어줘."]
