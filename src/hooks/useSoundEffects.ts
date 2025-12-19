import { useRef, useCallback } from 'react';

interface SoundEffects {
  playClick: () => void;
  playSuccess: () => void;
  playError: () => void;
  playHover: () => void;
}

export const useSoundEffects = (): SoundEffects => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.1) => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch (error) {
      console.log("Audio not supported");
    }
  }, [getAudioContext]);

  const playClick = useCallback(() => {
    playTone(800, 0.1, 'sine', 0.08);
  }, [playTone]);

  const playSuccess = useCallback(() => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Play ascending chime
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'sine', 0.1), i * 80);
    });
  }, [getAudioContext, playTone]);

  const playError = useCallback(() => {
    playTone(200, 0.3, 'sawtooth', 0.08);
  }, [playTone]);

  const playHover = useCallback(() => {
    playTone(600, 0.05, 'sine', 0.03);
  }, [playTone]);

  return { playClick, playSuccess, playError, playHover };
};
