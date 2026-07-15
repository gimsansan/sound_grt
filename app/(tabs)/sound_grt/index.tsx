import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, GestureResponderEvent } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useFocusEffect } from 'expo-router';
import { useAudioManager } from '../../../context/AudioManager';
import { INSTRUMENT_SOUNDS, InstrumentType, NoteInfo } from '../../../constants/instruments';

const WHITE_KEY_WIDTH = 70;
const BLACK_KEY_WIDTH = 46;
const KEYBOARD_HEIGHT = 250;
const BLACK_KEY_HEIGHT = 150;

// 악기별 테마 색상 및 라벨
const THEMES = {
  piano: { neon: '#E84393', label: '🎹 피아노', subLabel: '(전음역)' },
  bass: { neon: '#9B51E0', label: '🎸 베이스', subLabel: '(저음역)' },
  guitar: { neon: '#F2994A', label: '🎸 어쿠스틱 기타', subLabel: '(중음역)' },
  ukulele: { neon: '#1ABC9C', label: '🪕 우쿨렐레', subLabel: '(고음역)' },
};

// 개별 건반 컴포넌트 (멀티터치 대응)
// Pressable 대신 순수 View 사용 — 터치는 상위 keyboardWrapper가 일괄 처리하고,
// 눌림 여부는 pressed prop으로 전달받아 시각 효과만 담당한다.
const PianoKey = ({ note, pressed, neonColor }: { note: NoteInfo; pressed: boolean; neonColor: string }) => {
  const isBlack = note.type === 'black';

  return (
    <View
      pointerEvents="none"
      style={[
        isBlack ? styles.blackKey : styles.whiteKey,
        isBlack && note.blackOffset !== undefined && { left: note.blackOffset * WHITE_KEY_WIDTH - (BLACK_KEY_WIDTH / 2) },
        pressed && [
          isBlack ? styles.blackKeyPressed : styles.whiteKeyPressed,
          {
            borderColor: neonColor,
            shadowColor: neonColor,
          },
          !isBlack && { backgroundColor: `${neonColor}15` }, // 백건은 아주 연한 불빛 배경
          isBlack && { backgroundColor: neonColor } // 흑건은 강렬한 불빛 배경
        ]
      ]}
    >
      <Text style={[styles.keyLabel, isBlack && styles.blackKeyLabel]}>
        {note.label}
      </Text>
    </View>
  );
};

export default function SoundGrtScreen() {
  const audioManager = useAudioManager();
  // 현재 선택된 악기 상태 (기본값: 중음역 기타)
  const [currentInstrument, setCurrentInstrument] = useState<InstrumentType>('guitar');

  // [멀티터치] 현재 눌려 있는 건반 id 집합 (시각 효과용)
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  // [멀티터치] 건반 터치 중에는 가로 스크롤을 잠가 연주와 스크롤 제스처가 싸우지 않게 함
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // [멀티터치] 손가락(identifier) → 건반 id 매핑 (뗄 때 어느 건반인지 찾기 위함)
  const activeTouchesRef = useRef<Map<string, string>>(new Map());
  // [멀티터치] 건반 래퍼의 화면상 좌표 (pageX/Y를 건반 내부 좌표로 변환하는 기준점)
  const wrapperRef = useRef<View>(null);
  const wrapperOriginRef = useRef({ x: 0, y: 0 });

  const remeasureWrapper = () => {
    wrapperRef.current?.measureInWindow((x, y) => {
      wrapperOriginRef.current = { x, y };
    });
  };

  // 화면 진입 시 가로 모드로 고정 (Landscape)
  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      return () => {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
      };
    }, [])
  );

  const handlePlayNote = (note: NoteInfo) => {
    if (note.soundFile) {
      audioManager.playSound(note.id, note.soundFile);
    }
  };

  const currentNotes = INSTRUMENT_SOUNDS[currentInstrument];
  const whiteNotes = currentNotes.filter(n => n.type === 'white');
  const blackNotes = currentNotes.filter(n => n.type === 'black');
  const theme = THEMES[currentInstrument];

  // [멀티터치] 건반 내부 좌표 → 건반 매핑
  // 흑건이 위 레이어(zIndex 10)라는 사실을 수학으로 재현: 흑건 높이 범위면 흑건 x 범위를 먼저 검사
  const noteFromPoint = (x: number, y: number): NoteInfo | null => {
    if (y < 0 || y > KEYBOARD_HEIGHT) return null;
    if (x < 0 || x >= whiteNotes.length * WHITE_KEY_WIDTH) return null;

    if (y <= BLACK_KEY_HEIGHT) {
      for (const note of blackNotes) {
        if (note.blackOffset === undefined) continue;
        const left = note.blackOffset * WHITE_KEY_WIDTH - (BLACK_KEY_WIDTH / 2);
        if (x >= left && x <= left + BLACK_KEY_WIDTH) return note;
      }
    }

    const idx = Math.floor(x / WHITE_KEY_WIDTH);
    return whiteNotes[idx] ?? null;
  };

  // [멀티터치] 새로 닿은 모든 손가락을 각각 건반에 매핑해 동시에 재생
  const handleTouchStart = (e: GestureResponderEvent) => {
    setScrollEnabled(false);

    const newlyPressed: string[] = [];
    for (const t of e.nativeEvent.changedTouches) {
      const x = t.pageX - wrapperOriginRef.current.x;
      const y = t.pageY - wrapperOriginRef.current.y;
      const note = noteFromPoint(x, y);
      if (note) {
        activeTouchesRef.current.set(String(t.identifier), note.id);
        newlyPressed.push(note.id);
        handlePlayNote(note);
      }
    }

    if (newlyPressed.length > 0) {
      setPressedKeys(prev => {
        const next = new Set(prev);
        newlyPressed.forEach(id => next.add(id));
        return next;
      });
    }
  };

  // [멀티터치] 떨어진 손가락의 건반만 눌림 해제, 모든 손가락이 떨어지면 스크롤 재개
  const handleTouchEnd = (e: GestureResponderEvent) => {
    const released: string[] = [];
    for (const t of e.nativeEvent.changedTouches) {
      const noteId = activeTouchesRef.current.get(String(t.identifier));
      if (noteId) {
        released.push(noteId);
        activeTouchesRef.current.delete(String(t.identifier));
      }
    }

    if (released.length > 0) {
      setPressedKeys(prev => {
        const next = new Set(prev);
        released.forEach(id => next.delete(id));
        return next;
      });
    }

    // 마지막 손가락까지 떨어졌으면 상태 초기화 및 스크롤 재개 (안전망 포함)
    if (e.nativeEvent.touches.length === 0) {
      activeTouchesRef.current.clear();
      setPressedKeys(new Set());
      setScrollEnabled(true);
    }
  };

  const handleSelectInstrument = (inst: InstrumentType) => {
    if (inst === currentInstrument) return;
    // 악기 전환 시 눌림 상태 초기화 (터치 잔상 방지)
    activeTouchesRef.current.clear();
    setPressedKeys(new Set());
    setScrollEnabled(true);
    setCurrentInstrument(inst);
  };

  return (
    <View style={styles.container}>
      {/* 상단 악기 선택 탭 */}
      <View style={styles.tabContainer}>
        {(Object.keys(THEMES) as InstrumentType[]).map((inst) => {
          const isSelected = currentInstrument === inst;
          return (
            <Pressable
              key={inst}
              style={[
                styles.tabButton,
                isSelected && { backgroundColor: THEMES[inst].neon, borderColor: THEMES[inst].neon }
              ]}
              onPress={() => handleSelectInstrument(inst)}
            >
              <Text style={[styles.tabText, isSelected && styles.tabTextSelected]}>
                {THEMES[inst].label} {THEMES[inst].subLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        bounces={false}
        scrollEnabled={scrollEnabled}
        scrollEventThrottle={32}
        onScroll={remeasureWrapper}
        onMomentumScrollEnd={remeasureWrapper}
        onContentSizeChange={remeasureWrapper}
      >
        <View
          ref={wrapperRef}
          style={styles.keyboardWrapper}
          onLayout={remeasureWrapper}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          {/* 백건 레이어 */}
          <View style={styles.whiteKeysContainer} pointerEvents="none">
            {whiteNotes.map(note => (
              <PianoKey key={note.id} note={note} pressed={pressedKeys.has(note.id)} neonColor={theme.neon} />
            ))}
          </View>

          {/* 흑건 레이어 */}
          <View style={styles.blackKeysContainer} pointerEvents="none">
            {blackNotes.map(note => (
              <PianoKey key={note.id} note={note} pressed={pressedKeys.has(note.id)} neonColor={theme.neon} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E24', // 모던 다크 테마 배경
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#2A2A35',
    borderRadius: 30,
    padding: 5,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'transparent',
    marginHorizontal: 5,
  },
  tabText: {
    color: '#8A8A9A',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tabTextSelected: {
    color: '#FFFFFF',
  },
  scrollContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 20,
  },
  keyboardWrapper: {
    position: 'relative',
    height: KEYBOARD_HEIGHT, // 피아노 건반 전체 높이
    flexDirection: 'row',
  },
  whiteKeysContainer: {
    flexDirection: 'row',
  },
  blackKeysContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  whiteKey: {
    width: WHITE_KEY_WIDTH,
    height: KEYBOARD_HEIGHT,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#444',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 25,
  },
  blackKey: {
    position: 'absolute',
    width: BLACK_KEY_WIDTH,
    height: BLACK_KEY_HEIGHT, // 백건보다 짧게
    backgroundColor: '#222222',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
    zIndex: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 5 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
  },
  whiteKeyPressed: {
    borderBottomWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
  },
  blackKeyPressed: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },
  keyLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#666',
    textAlign: 'center',
  },
  blackKeyLabel: {
    color: '#8A8A9A',
  }
});
