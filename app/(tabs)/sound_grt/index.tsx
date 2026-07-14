import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useFocusEffect } from 'expo-router';
import { useAudioManager } from '../../../context/AudioManager';
import { INSTRUMENT_SOUNDS, InstrumentType, NoteInfo } from '../../../constants/instruments';

const WHITE_KEY_WIDTH = 70;
const BLACK_KEY_WIDTH = 46;

// 악기별 테마 색상 및 라벨
const THEMES = {
  piano: { neon: '#E84393', label: '🎹 피아노', subLabel: '(전음역)' },
  bass: { neon: '#9B51E0', label: '🎸 베이스', subLabel: '(저음역)' },
  guitar: { neon: '#F2994A', label: '🎸 어쿠스틱 기타', subLabel: '(중음역)' },
  ukulele: { neon: '#1ABC9C', label: '🪕 우쿨렐레', subLabel: '(고음역)' },
};

// 개별 건반 컴포넌트
const PianoKey = ({ note, onPress, neonColor }: { note: NoteInfo; onPress: (note: NoteInfo) => void; neonColor: string }) => {
  const isBlack = note.type === 'black';

  return (
    <Pressable
      style={({ pressed }) => [
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
      onPressIn={() => onPress(note)}
    >
      <Text style={[styles.keyLabel, isBlack && styles.blackKeyLabel]}>
        {note.label}
      </Text>
    </Pressable>
  );
};

export default function SoundGrtScreen() {
  const audioManager = useAudioManager();
  // 현재 선택된 악기 상태 (기본값: 중음역 기타)
  const [currentInstrument, setCurrentInstrument] = useState<InstrumentType>('guitar');

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
              onPress={() => setCurrentInstrument(inst)}
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
      >
        <View style={styles.keyboardWrapper}>
          {/* 백건 레이어 */}
          <View style={styles.whiteKeysContainer}>
            {whiteNotes.map(note => (
              <PianoKey key={note.id} note={note} onPress={handlePlayNote} neonColor={theme.neon} />
            ))}
          </View>
          
          {/* 흑건 레이어 */}
          <View style={styles.blackKeysContainer} pointerEvents="box-none">
            {blackNotes.map(note => (
              <PianoKey key={note.id} note={note} onPress={handlePlayNote} neonColor={theme.neon} />
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
    height: 250, // 피아노 건반 전체 높이
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
    height: 250,
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
    height: 150, // 백건보다 짧게
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
