// Web Audio API Sound Engine for Real Device Audio Output
// Generates ambient worship pads, devotional prayer backgrounds, and church chimes

export interface AudioEngineState {
  masterVolume: number;
  padVolume: number;
  videoVolume: number;
  crossfader: number;
  linkedMode: boolean;
  isPlayingPad: boolean;
  currentKey: string | null;
  currentPadType: 'warm_pad' | 'ethereal' | 'piano_strings' | 'solemn_organ';
  isPlayingVideo: boolean;
  activeVideoTitle: string | null;
}

class DeviceAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private padGain: GainNode | null = null;
  private aux2Gain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private listeners: Set<(state: AudioEngineState) => void> = new Set();
  private registeredVideoElements: Set<HTMLVideoElement> = new Set();

  // Active oscillators for the ambient pad
  private activeOscillators: OscillatorNode[] = [];
  private activeLfos: OscillatorNode[] = [];
  private filterNode: BiquadFilterNode | null = null;

  // Current playing key
  public currentKey: string | null = null;
  public currentPadType: 'warm_pad' | 'ethereal' | 'piano_strings' | 'solemn_organ' = 'warm_pad';
  public isPlayingPad: boolean = false;

  // Video state tracking for auxiliary mixer visibility
  public isPlayingVideo: boolean = false;
  public activeVideoTitle: string | null = null;

  // Volumes (0 to 100)
  public masterVolume: number = 85;
  public padVolume: number = 70;
  public videoVolume: number = 80;
  public crossfader: number = 0; // -100 (Full Pad) to +100 (Full Video)
  public linkedMode: boolean = true; // When true, decreasing one increases the other!

  // Musical note frequencies for Adventist worship pads (Fundamental + 5th + Octave + 9th for rich harmonic spread)
  private readonly KEY_FREQUENCIES: Record<string, number[]> = {
    'C': [130.81, 196.00, 261.63, 329.63, 392.00, 523.25],   // C3, G3, C4, E4, G4, C5
    'D': [146.83, 220.00, 293.66, 369.99, 440.00, 587.33],   // D3, A3, D4, F#4, A4, D5
    'E': [164.81, 246.94, 329.63, 415.30, 493.88, 659.25],   // E3, B3, E4, G#4, B4, E5
    'F': [174.61, 261.63, 349.23, 440.00, 523.25, 698.46],   // F3, C4, F4, A4, C5, F5
    'G': [98.00, 196.00, 293.66, 392.00, 493.88, 587.33],    // G2, G3, D4, G4, B4, D5
    'A': [110.00, 220.00, 329.63, 440.00, 554.37, 659.25],   // A2, A3, E4, A4, C#5, E5
    'Bb': [116.54, 233.08, 349.23, 466.16, 587.33, 698.46],  // Bb2, Bb3, F4, Bb4, D5, F5
    'B': [123.47, 246.94, 369.99, 493.88, 622.25, 739.99],   // B2, B3, F#4, B4, D#5, F#5
  };

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume / 100, this.ctx.currentTime);

      // Pad Aux Gain
      this.padGain = this.ctx.createGain();
      this.padGain.gain.setValueAtTime((this.padVolume / 100) * this.getPadCrossfadeFactor(), this.ctx.currentTime);

      // Video Aux Gain (virtual level reference)
      this.aux2Gain = this.ctx.createGain();
      this.aux2Gain.gain.setValueAtTime((this.videoVolume / 100) * this.getVideoCrossfadeFactor(), this.ctx.currentTime);

      // Analyser for real-time VU meter
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      // Routing
      this.padGain.connect(this.masterGain);
      this.aux2Gain.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Crossfade calculation: -100 = 100% Pad / 0% Video; +100 = 0% Pad / 100% Video
  private getPadCrossfadeFactor(): number {
    if (this.crossfader <= 0) return 1.0;
    return Math.max(0, 1 - (this.crossfader / 100));
  }

  private getVideoCrossfadeFactor(): number {
    if (this.crossfader >= 0) return 1.0;
    return Math.max(0, 1 - (Math.abs(this.crossfader) / 100));
  }

  public subscribe(listener: (state: AudioEngineState) => void): () => void {
    this.listeners.add(listener);
    // Notify immediately with current state
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): AudioEngineState {
    return {
      masterVolume: this.masterVolume,
      padVolume: this.padVolume,
      videoVolume: this.videoVolume,
      crossfader: this.crossfader,
      linkedMode: this.linkedMode,
      isPlayingPad: this.isPlayingPad,
      currentKey: this.currentKey,
      currentPadType: this.currentPadType,
      isPlayingVideo: this.isPlayingVideo,
      activeVideoTitle: this.activeVideoTitle,
    };
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (err) {
        console.warn('Error in audioEngine listener', err);
      }
    });
  }

  // Register an HTMLVideoElement so its volume is automatically linked to soundEngine.videoVolume
  public registerVideoElement(el: HTMLVideoElement | null) {
    if (!el) return;
    this.registeredVideoElements.add(el);
    el.volume = Math.min(1, Math.max(0, this.videoVolume / 100));
    return () => {
      this.registeredVideoElements.delete(el);
    };
  }

  public unregisterVideoElement(el: HTMLVideoElement) {
    this.registeredVideoElements.delete(el);
  }

  private syncVideoElementsVolume() {
    const vol = Math.min(1, Math.max(0, this.videoVolume / 100));
    this.registeredVideoElements.forEach(el => {
      try {
        el.volume = vol;
      } catch (e) {}
    });
  }

  // Track video active / playing state across the application
  public setActiveVideo(title: string | null, isPlaying: boolean = false) {
    this.activeVideoTitle = title;
    this.isPlayingVideo = isPlaying;
    this.notifyListeners();
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.min(100, Math.max(0, vol));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume / 100, this.ctx.currentTime, 0.05);
    }
    this.notifyListeners();
  }

  // Linked volume control: when user lowers one, the other increases!
  // "Tambem quero que os mixers sejam vinculados uns aos outros, de forma que quando eu aumente um, baixe os outros automaticamente"
  public setPadVolume(vol: number, allowLinking: boolean = true) {
    this.padVolume = Math.min(100, Math.max(0, vol));
    
    if (this.linkedMode && allowLinking) {
      // In linked mixer mode: decreasing one increases the other, or increasing one decreases the other!
      this.videoVolume = Math.max(0, Math.min(100, 100 - this.padVolume));
      this.updateGains();
      this.syncVideoElementsVolume();
    } else {
      this.updateGains();
    }
    this.notifyListeners();
  }

  public setVideoVolume(vol: number, allowLinking: boolean = true) {
    this.videoVolume = Math.min(100, Math.max(0, vol));

    if (this.linkedMode && allowLinking) {
      // In linked mixer mode: increasing video decreases pad automatically!
      this.padVolume = Math.max(0, Math.min(100, 100 - this.videoVolume));
      this.updateGains();
    } else {
      this.updateGains();
    }
    this.syncVideoElementsVolume();
    this.notifyListeners();
  }

  public setCrossfader(val: number) {
    this.crossfader = Math.min(100, Math.max(-100, val));
    this.updateGains();
    this.notifyListeners();
  }

  public setLinkedMode(linked: boolean) {
    this.linkedMode = linked;
    this.notifyListeners();
  }

  private updateGains() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.padGain) {
      const finalPad = (this.padVolume / 100) * this.getPadCrossfadeFactor();
      this.padGain.gain.setTargetAtTime(finalPad, now, 0.05);
    }
    if (this.aux2Gain) {
      const finalVid = (this.videoVolume / 100) * this.getVideoCrossfadeFactor();
      this.aux2Gain.gain.setTargetAtTime(finalVid, now, 0.05);
    }
  }

  // Play ambient continuous pad in key
  public playPad(key: string = 'D', type: 'warm_pad' | 'ethereal' | 'piano_strings' | 'solemn_organ' = 'warm_pad') {
    this.initContext();
    if (!this.ctx || !this.padGain) return;

    // If already playing the same key and type, do not recreate
    if (this.isPlayingPad && this.currentKey === key && this.currentPadType === type) {
      return;
    }

    // Stop current oscillators smoothly
    this.stopPadOscillators(0.3);

    this.currentKey = key;
    this.currentPadType = type;
    this.isPlayingPad = true;

    const frequencies = this.KEY_FREQUENCIES[key] || this.KEY_FREQUENCIES['D'];
    const now = this.ctx.currentTime;

    // Master filter for the warm sound
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    
    // Choose filter cutoff based on pad type
    if (type === 'warm_pad') {
      filter.frequency.setValueAtTime(480, now);
      filter.Q.setValueAtTime(2.5, now);
    } else if (type === 'ethereal') {
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(3.0, now);
    } else if (type === 'piano_strings') {
      filter.frequency.setValueAtTime(600, now);
      filter.Q.setValueAtTime(1.8, now);
    } else { // solemn_organ
      filter.frequency.setValueAtTime(950, now);
      filter.Q.setValueAtTime(1.5, now);
    }

    filter.connect(this.padGain);
    this.filterNode = filter;

    // LFO for subtle analog chorus / detuning motion
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.3, now); // 0.3 Hz slow gentle sweep
    lfoGain.gain.setValueAtTime(4.0, now); // +/- 4Hz detuning
    lfo.connect(lfoGain);
    lfo.start(now);
    this.activeLfos.push(lfo);

    // Create detuned layered oscillators
    frequencies.forEach((freq, index) => {
      if (!this.ctx) return;
      
      // Detuned oscillator pair for stereo-like analog width
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      // Types of waves based on pad style
      if (type === 'warm_pad') {
        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
      } else if (type === 'ethereal') {
        osc1.type = 'sine';
        osc2.type = 'triangle';
      } else if (type === 'piano_strings') {
        osc1.type = 'triangle';
        osc2.type = 'sawtooth';
      } else {
        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
      }

      // Detuning
      const detuneAmount = (index % 2 === 0 ? 1 : -1) * (3 + index * 1.5);
      osc1.frequency.setValueAtTime(freq, now);
      osc1.detune.setValueAtTime(detuneAmount, now);

      osc2.frequency.setValueAtTime(freq * 1.0015, now);
      osc2.detune.setValueAtTime(-detuneAmount, now);

      // Connect LFO modulation
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      // Gain per note (higher notes are softer to keep warmth)
      const noteGain = (1 / frequencies.length) * (index > 3 ? 0.45 : 0.85);
      oscGain.gain.setValueAtTime(0.0001, now);
      // Gentle attack envelope (fade in over 1.8 seconds)
      oscGain.gain.exponentialRampToValueAtTime(noteGain, now + 1.8);

      osc1.connect(oscGain);
      osc2.connect(oscGain);
      oscGain.connect(filter);

      osc1.start(now);
      osc2.start(now);

      this.activeOscillators.push(osc1, osc2);
    });

    this.notifyListeners();
  }

  // Stop ambient pad
  public stopPad(fadeDuration: number = 1.0) {
    this.stopPadOscillators(fadeDuration);
    this.isPlayingPad = false;
    this.currentKey = null;
    this.notifyListeners();
  }

  private stopPadOscillators(fadeDuration: number = 0.5) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Fade out current oscillators
    this.activeOscillators.forEach(osc => {
      try {
        osc.stop(now + fadeDuration);
      } catch (e) {
        // Ignore if already stopped
      }
    });

    this.activeLfos.forEach(lfo => {
      try {
        lfo.stop(now + fadeDuration);
      } catch (e) {}
    });

    this.activeOscillators = [];
    this.activeLfos = [];
  }

  // Play church bell chime (sino do início de culto / oração)
  public playChime(type: 'solemn' | 'reverent' = 'solemn') {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const chimeGain = this.ctx.createGain();
    chimeGain.connect(this.masterGain);

    const chimeFreqs = type === 'solemn' 
      ? [523.25, 659.25, 783.99, 1046.50] // C major celestial chime
      : [440.00, 554.37, 659.25, 880.00];  // A major warm bell

    chimeFreqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.18);

      // Bell envelope (quick hit, long harmonic decay)
      noteGain.gain.setValueAtTime(0.001, now + idx * 0.18);
      noteGain.gain.exponentialRampToValueAtTime(0.4 / (idx + 1), now + idx * 0.18 + 0.05);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.18 + 3.2);

      osc.connect(noteGain);
      noteGain.connect(chimeGain);

      osc.start(now + idx * 0.18);
      osc.stop(now + idx * 0.18 + 3.5);
    });
  }

  // Smooth Crossfade Auto Transition (e.g. from Video to Prayer Pad over 4 seconds)
  public performAutoTransition(target: 'pad' | 'video' | 'center', durationSeconds: number = 3.5) {
    let startVal = this.crossfader;
    let endVal = target === 'pad' ? -100 : target === 'video' ? 100 : 0;
    let startTime = performance.now();
    let durationMs = durationSeconds * 1000;

    const animate = (currentTime: number) => {
      let elapsed = currentTime - startTime;
      let progress = Math.min(1, elapsed / durationMs);
      // Smooth ease in-out
      let ease = progress < 0.5 
        ? 2 * progress * progress 
        : -1 + (4 - 2 * progress) * progress;
      
      let currentVal = startVal + (endVal - startVal) * ease;
      this.setCrossfader(currentVal);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  // Get current audio VU meter level (0 to 100)
  public getAudioLevel(): number {
    if (!this.analyser) return 0;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    // Map average (0 - 255) to percentage (0 - 100)
    return Math.min(100, Math.round((average / 180) * 100));
  }
}

// Singleton global instance
export const soundEngine = new DeviceAudioEngine();
