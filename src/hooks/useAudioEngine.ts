import { useState, useEffect, useCallback } from 'react';
import { soundEngine, AudioEngineState } from '../utils/audioEngine';

export function useAudioEngine() {
  const [audioState, setAudioState] = useState<AudioEngineState>(soundEngine.getState());

  useEffect(() => {
    const unsub = soundEngine.subscribe((state) => {
      setAudioState(state);
    });
    return () => unsub();
  }, []);

  const setPadVolume = useCallback((val: number) => {
    soundEngine.setPadVolume(val, true);
  }, []);

  const setVideoVolume = useCallback((val: number) => {
    soundEngine.setVideoVolume(val, true);
  }, []);

  const setMasterVolume = useCallback((val: number) => {
    soundEngine.setMasterVolume(val);
  }, []);

  const setCrossfader = useCallback((val: number) => {
    soundEngine.setCrossfader(val);
  }, []);

  const toggleLinkedMode = useCallback(() => {
    soundEngine.setLinkedMode(!audioState.linkedMode);
  }, [audioState.linkedMode]);

  const togglePad = useCallback((key: string = 'D') => {
    if (audioState.isPlayingPad) {
      soundEngine.stopPad(1.0);
    } else {
      soundEngine.playPad(key, 'warm_pad');
    }
  }, [audioState.isPlayingPad]);

  return {
    ...audioState,
    setPadVolume,
    setVideoVolume,
    setMasterVolume,
    setCrossfader,
    toggleLinkedMode,
    togglePad,
    stopPad: soundEngine.stopPad.bind(soundEngine),
    playPad: soundEngine.playPad.bind(soundEngine),
  };
}
