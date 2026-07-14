import React, { createContext, useContext, useRef, useEffect, useMemo } from 'react';
import { Audio } from '../services/audioCompat';

interface PoolItem {
  id: string;
  sound: Audio.Sound;
  isIdle: boolean;
  lastPlayedAt: number;
  backupTimer: ReturnType<typeof setTimeout> | null;
}

interface AudioManagerContextType {
  playSound: (soundKey: string, source: any) => Promise<void>;
  playSoundWithCallback: (soundKey: string, source: any, onComplete?: () => void) => Promise<void>;
  stopAllSounds: () => Promise<void>;
  getCurrentTab: () => string;
  setCurrentTab: (tab: string) => void;
  isPlaying: (soundKey: string) => boolean;
}

const AudioManagerContext = createContext<AudioManagerContextType | null>(null);

export function AudioManagerProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  // soundsRef 대신 다중 객체를 담는 soundsPoolRef 사용 (Lazy Pooling)
  const soundsPoolRef = useRef<Map<string, PoolItem[]>>(new Map());
  const currentTabRef = useRef<string>('');
  
  // 큐잉 시스템을 위한 상태
  const playQueueRef = useRef<Array<{key: string, source: any, onComplete?: () => void}>>([]);
  const generationRef = useRef<number>(0);
  const stealCountRef = useRef<number>(0);

  // [3단계 검증용 계측] 풀 상태 요약 — 동작에는 영향 없음
  const getPoolStats = () => {
    let total = 0;
    let active = 0;
    for (const pArray of soundsPoolRef.current.values()) {
      total += pArray.length;
      active += pArray.filter(i => !i.isIdle).length;
    }
    return { total, active, idle: total - active };
  };

  // 수정된 모든 오디오 정리 함수 (백그라운드 처리)
  const stopAllSounds = async () => {
    console.log('🎵 AudioManager: 모든 오디오 정리 (백그라운드 진행)');

    // 세대 카운터 증가 및 큐 비우기 (고아 플레이어 회수 및 미처리 요청 차단)
    generationRef.current += 1;
    playQueueRef.current = [];

    // 현재 재생 중인 풀을 별도로 복사하고, 원본 맵은 즉시 비움
    const poolsToUnload = Array.from(soundsPoolRef.current.values());
    soundsPoolRef.current.clear();

    // 비동기로 각 사운드의 메모리를 해제만 하도록 던져둠
    poolsToUnload.forEach(poolArray => {
      poolArray.forEach(item => {
        // 타이머 메모리 해제
        if (item.backupTimer) {
          clearTimeout(item.backupTimer);
          item.backupTimer = null;
        }
        item.sound.unloadAsync().catch(error => {
          console.warn(`AudioManager: 정리 실패:`, error);
        });
      });
    });

    console.log('✅ AudioManager: 모든 오디오 정리 요청 완료');
  };

  // 탭(악기) 변경 시 자동 정리 (동기 방식으로 변경)
  const setCurrentTab = (newTab: string) => {
    if (currentTabRef.current !== newTab) {
      console.log(`🔄 AudioManager: 탭 변경 ${currentTabRef.current} → ${newTab}`);
      
      // 기존 사운드 정리는 백그라운드로 실행되게 던져둠 (await 제거)
      stopAllSounds(); 
      
      // 즉시 탭 상태 업데이트
      currentTabRef.current = newTab;
    }
  };

  // [수정 ④] 어떤 경로(신규/재사용/재활용)로 재생되든 "이번 호출"의 onComplete와 item을
  // 참조하도록 리스너와 백업 타이머를 재등록하는 공통 함수
  const attachLifecycle = (item: PoolItem, soundKey: string, onComplete?: () => void) => {
    // (a) didJustFinish 리스너 재등록 — audioCompat이 기존 구독을 제거하고 교체함
    item.sound.setOnPlaybackStatusUpdate((status: any) => {
      if (status.isLoaded && status.didJustFinish) {
        if (item.backupTimer) {
          clearTimeout(item.backupTimer);
          item.backupTimer = null;
        }
        if (!item.isIdle) {
          item.isIdle = true;
          console.log(`🧹 AudioManager: ${soundKey} Idle 상태로 복귀`);
          onComplete?.();
        }
      }
    });

    // (b) 기존 백업 타이머 취소 후 재예약 (유령 타이머 방지)
    if (item.backupTimer) {
      clearTimeout(item.backupTimer);
      item.backupTimer = null;
    }
    item.backupTimer = setTimeout(() => {
      if (!item.isIdle) {
        item.isIdle = true;
        item.backupTimer = null;
        console.log(`⏰ AudioManager: ${soundKey} 백업 Idle 전환`);
        onComplete?.();
      }
    }, 3500);
  };

  // 단일 오디오 재생 (Lazy Pooling 적용)
  const playSingleSound = async (soundKey: string, source: any, onComplete?: () => void) => {
    try {
      const MAX_PLAYERS = 25; // [수정 ②] 동시 "활성" 재생 상한 (idle 제외)
      const TOTAL_POOL_LIMIT = 25; // [수정 ②] 네이티브 플레이어 총량 상한 (idle 포함)
      const USE_REPLACE_RECYCLING = true; // Android에서 replace()가 무음/오작동 시 false로 폴백
      const currentGeneration = generationRef.current; // 호출 시점의 세대 기억

      if (!soundsPoolRef.current.has(soundKey)) {
        soundsPoolRef.current.set(soundKey, []);
      }
      const pool = soundsPoolRef.current.get(soundKey)!;

      // 1. 현재 키의 풀에서 쉬고 있는(Idle) 객체 찾기
      const idleItem = pool.find(item => item.isIdle);
      if (idleItem) {
        // 유령 백업 타이머 제거 (기존에 예약된 타이머 취소)
        if (idleItem.backupTimer) {
          clearTimeout(idleItem.backupTimer);
          idleItem.backupTimer = null;
        }

        idleItem.isIdle = false;
        idleItem.lastPlayedAt = Date.now();
        // [수정 ④] 이번 호출의 onComplete로 리스너·타이머 재등록
        attachLifecycle(idleItem, soundKey, onComplete);
        // 딜레이 없이 즉시 재사용
        await idleItem.sound.replayAsync();
        const rs = getPoolStats();
        console.log(`♻️ AudioManager: ${soundKey} 재사용됨 (Pooling) [활성 ${rs.active} / 전체 ${rs.total}]`);
        return;
      }

      // 2. [수정 ②-B] 슬롯 확보 필요 여부 판정 — "활성" 수와 "총량"을 분리해서 검사
      const stats = getPoolStats();
      let victim: { item: PoolItem, poolKey: string } | null = null;

      if (stats.active >= MAX_PLAYERS) {
        // (가) 활성 포화: 1순위 idle 객체(모든 키), 2순위 가장 오래전에 연주된 객체
        for (const [pKey, pArray] of soundsPoolRef.current.entries()) {
          const v = pArray.find(i => i.isIdle);
          if (v) {
            victim = { item: v, poolKey: pKey };
            break;
          }
        }
        if (!victim) {
          let oldest: PoolItem | null = null;
          let oldestPoolKey = '';
          for (const [pKey, pArray] of soundsPoolRef.current.entries()) {
            for (const item of pArray) {
              if (!oldest || item.lastPlayedAt < oldest.lastPlayedAt) {
                oldest = item;
                oldestPoolKey = pKey;
              }
            }
          }
          if (oldest) {
            victim = { item: oldest, poolKey: oldestPoolKey };
          }
        }
      } else if (stats.total >= TOTAL_POOL_LIMIT) {
        // (나) 총량 포화(활성은 여유): 가장 오래된 idle을 재활용 — total > active이므로 반드시 존재
        let oldestIdle: PoolItem | null = null;
        let oldestIdleKey = '';
        for (const [pKey, pArray] of soundsPoolRef.current.entries()) {
          for (const item of pArray) {
            if (item.isIdle && (!oldestIdle || item.lastPlayedAt < oldestIdle.lastPlayedAt)) {
              oldestIdle = item;
              oldestIdleKey = pKey;
            }
          }
        }
        if (oldestIdle) {
          victim = { item: oldestIdle, poolKey: oldestIdleKey };
        }
      }

      // victim을 원래 풀에서 분리하고 타이머 정리 (재활용/파괴 공통)
      if (victim) {
        const vPool = soundsPoolRef.current.get(victim.poolKey);
        if (vPool) {
          const index = vPool.findIndex(i => i.id === victim!.item.id);
          if (index !== -1) {
            vPool.splice(index, 1);
          }
        }
        if (victim.item.backupTimer) {
          clearTimeout(victim.item.backupTimer);
          victim.item.backupTimer = null;
        }
      }

      // 3. [수정 ②-C] 스틸링을 "파괴 후 신규 생성" 대신 "replace 재활용"으로 처리
      if (victim && USE_REPLACE_RECYCLING) {
        try {
          await victim.item.sound.replaceAsync(source);

          // await 중 탭 전환(세대 변경) 검사 — 고아 회수
          if (currentGeneration !== generationRef.current) {
            victim.item.sound.unloadAsync().catch(e => console.warn(`AudioManager: Orphan unload failed`, e));
            console.log(`🧹 AudioManager: 탭 전환으로 재활용 플레이어 즉시 회수됨 (${soundKey})`);
            return;
          }

          // PoolItem 갱신 후 새 soundKey의 풀로 이동
          victim.item.id = `${soundKey}_${Date.now()}_${Math.random()}`;
          victim.item.isIdle = false;
          victim.item.lastPlayedAt = Date.now();
          pool.push(victim.item);
          attachLifecycle(victim.item, soundKey, onComplete);

          stealCountRef.current += 1;
          const ss = getPoolStats();
          console.log(`♻️🔪 AudioManager: 재활용 스틸링 #${stealCountRef.current} (${victim.poolKey} → ${soundKey}) [활성 ${ss.active} / 전체 ${ss.total}]`);
          return;
        } catch (e) {
          // replace 실패 시 폴백: 파괴 후 아래 신규 생성 경로로 진행
          console.warn(`AudioManager: replace 실패 → 신규 생성 폴백`, e);
          victim.item.sound.unloadAsync().catch(err => {
            console.warn(`AudioManager: 폴백 unload failed`, err);
          });
        }
      } else if (victim) {
        // 플래그 OFF: 기존 방식 (파괴 후 신규 생성)
        victim.item.sound.unloadAsync().catch(e => {
          console.warn(`AudioManager: Voice Stealing unload failed`, e);
        });
        stealCountRef.current += 1;
        console.log(`🔪 AudioManager: Voice Stealing #${stealCountRef.current} (${victim.poolKey} 강제 종료) [활성 ${stats.active}/${MAX_PLAYERS}, 전체 ${stats.total}/${TOTAL_POOL_LIMIT}]`);
      }

      // 4. 새로운 객체 생성
      const uniqueId = `${soundKey}_${Date.now()}_${Math.random()}`;
      const { sound } = await Audio.Sound.createAsync(source, {
        shouldPlay: true,
        volume: 1,
        isLooping: false,
      });

      // 5. 고아 플레이어(Orphan) 회수 - await 중에 탭이 바뀌었는지 세대 카운터로 확인
      if (currentGeneration !== generationRef.current) {
        sound.unloadAsync().catch(e => console.warn(`AudioManager: Orphan unload failed`, e));
        console.log(`🧹 AudioManager: 탭 전환으로 고아 플레이어 즉시 회수됨 (${soundKey})`);
        return;
      }

      const newItem: PoolItem = {
        id: uniqueId,
        sound,
        isIdle: false,
        lastPlayedAt: Date.now(),
        backupTimer: null,
      };
      
      // 풀에 추가 (세대 검사를 통과했으므로 풀은 유효함)
      pool.push(newItem);
      
      const cs = getPoolStats();
      console.log(`🎵 AudioManager: ${soundKey} 새로 생성됨 (${currentTabRef.current} 탭) [활성 ${cs.active} / 전체 ${cs.total}]`);

      // 6~7. [수정 ④] 리스너 등록 + 백업 타이머 예약 (공통 함수)
      attachLifecycle(newItem, soundKey, onComplete);

    } catch (error) {
      console.error(`AudioManager: ${soundKey} 재생 실패:`, error);
      // 에러 시에도 콜백 실행
      onComplete?.();
    }
  };

  // 수정된 큐 처리 함수 (동시 다발적 재생 지원)
  const processQueue = () => {
    // 큐가 비어있으면 종료
    if (playQueueRef.current.length === 0) return;

    // 현재 큐에 있는 모든 요청을 복사하고 큐를 비움 (빠른 연속 입력 처리)
    const itemsToProcess = [...playQueueRef.current];
    playQueueRef.current = [];

    // 쌓인 모든 음을 await 없이 즉시 병렬로 재생 시작 (화음 및 빠른 연주 대응)
    itemsToProcess.forEach(({ key, source, onComplete }) => {
      // catch를 달아 에러 시 앱이 죽지 않도록 방어
      playSingleSound(key, source, onComplete).catch((error) => {
        console.error(`AudioManager: Queue processing error for ${key}:`, error);
      });
    });
  };

  // 큐잉된 소리 재생 함수 수정 (비동기 락 제거)
  const playSound = async (soundKey: string, source: any) => {
    playQueueRef.current.push({ key: soundKey, source });
    processQueue(); // 딜레이 없이 즉시 호출
  };

  // 콜백이 있는 큐잉된 소리 재생 (게임용)
  const playSoundWithCallback = async (soundKey: string, source: any, onComplete?: () => void) => {
    playQueueRef.current.push({ key: soundKey, source, onComplete });
    processQueue();
  };

  // 특정 소리 재생 상태 확인
  const isPlaying = (soundKey: string): boolean => {
    const pool = soundsPoolRef.current.get(soundKey);
    if (!pool) return false;
    // 하나라도 쉬고 있지 않은 객체가 있다면 재생 중인 것으로 간주
    return pool.some(item => !item.isIdle);
  };

  // 앱 초기화 시 안드로이드 오디오 모드 설정 및 앱 종료 시 정리
  useEffect(() => {
    // 안드로이드에서 미디어가 스피커로 정상 출력되도록 설정
    Audio.setAudioModeAsync({
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    }).catch(err => console.warn('오디오 모드 설정 실패:', err));

    return () => {
      console.log('🏁 AudioManager: 앱 종료 - 최종 정리');
      stopAllSounds();
    };
  }, []);

  const value = useMemo(() => ({
    playSound,
    playSoundWithCallback,
    stopAllSounds,
    getCurrentTab: () => currentTabRef.current,
    setCurrentTab,
    isPlaying,
  }), [playSound, playSoundWithCallback, stopAllSounds, setCurrentTab, isPlaying]);

  return (
    <AudioManagerContext.Provider value={value}>
      {children}
    </AudioManagerContext.Provider>
  );
}

export function useAudioManager() {
  const context = useContext(AudioManagerContext);
  if (!context) {
    throw new Error('useAudioManager must be used within AudioManagerProvider');
  }
  return context;
}
