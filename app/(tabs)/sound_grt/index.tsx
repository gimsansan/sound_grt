import React, { useContext } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAudioManager } from '../../../context/AudioManager';
import { StarContext } from '../../../context/StarContext';
import { COLORS } from '../../../constants/colors';

export default function SoundGrtScreen() {
  // AudioManager와 StarContext 연동 준비
  const audioManager = useAudioManager();
  const starContext = useContext(StarContext);

  const handlePress = () => {
    // 예시: 버튼을 눌렀을 때의 동작
    console.log("Button pressed - ready for sound generation");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sound Generator</Text>
      <Text style={styles.subtitle}>빈 도화지가 준비되었습니다!</Text>
      
      <Pressable style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>테스트 버튼</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 30,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
