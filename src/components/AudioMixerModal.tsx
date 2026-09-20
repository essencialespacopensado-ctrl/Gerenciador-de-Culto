import React, { useState, useEffect } from 'react';
import { 
  Sliders, Volume2, VolumeX, Music, Youtube, Play, Square, 
  Sparkles, RefreshCw, X, ArrowLeftRight, Check, Bell, 
  Activity, Shield, ExternalLink
} from 'lucide-react';
import { soundEngine } from '../utils/audioEngine';
import { useAudioEngine } from '../hooks/useAudioEngine';

interface AudioMixerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMusicalBackgrounds?: () => void;
  onOpenPlaybacks?: () => void;
  currentVideoTitle?: string;
}

export const AudioMixerModal: React.FC<AudioMixerModalProps> = ({
  isOpen,
  onClose,
  onOpenMusicalBackgrounds,
  onOpenPlaybacks,
  currentVideoTitle,
}) => {
  const engineState = useAudioEngine();
  
  // Mixer state synced with soundEngine
  const [masterVolume, setMasterVolume] = useState<number>(engineState.masterVolume);
  const [padVolume, setPadVolume] = useState<number>(engineState.padVolume);
  const [videoVolume, setVideoVolume] = useState<number>(engineState.videoVolume);
  const [crossfader, setCrossfader] = useState<number>(engineState.crossfader);
  const [linkedMode, setLinkedMode] = useState<boolean>(engineState.linkedMode);
  const [isPlayingPad, setIsPlayingPad] = useState<boolean>(engineState.isPlayingPad);
  const [currentKey, setCurrentKey] = useState<string>(engineState.currentKey || 'D');
  const [isPadMuted, setIsPadMuted] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [vuLevel, setVuLevel] = useState<number>(0);

  // Sync state from engine
  useEffect(() => {
    setMasterVolume(engineState.masterVolume);
    setPadVolume(engineState.padVolume);
    setVideoVolume(engineState.videoVolume);
    setCrossfader(engineState.crossfader);
    setLinkedMode(engineState.linkedMode);
    setIsPlayingPad(engineState.isPlayingPad);
    if (engineState.currentKey) setCurrentKey(engineState.currentKey);
  }, [engineState]);

  // Live VU meter update
  useEffect(() => {
    if (!isOpen) return;
    let animId: number;
    const updateVU = () => {
      if (soundEngine.isPlayingPad || currentVideoTitle) {
        setVuLevel(soundEngine.getAudioLevel());
      } else {
        setVuLevel(0);
      }
      animId = requestAnimationFrame(updateVU);
    };
    animId = requestAnimationFrame(updateVU);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, isPlayingPad, currentVideoTitle]);

  if (!isOpen) return null;

  // Handlers for sliders
  const handleMasterChange = (val: number) => {
    setMasterVolume(val);
    soundEngine.setMasterVolume(val);
  };

  const handlePadVolumeChange = (val: number) => {
    setPadVolume(val);
    soundEngine.setPadVolume(val, linkedMode);
    if (linkedMode) {
      setVideoVolume(100 - val);
    }
  };

  const handleVideoVolumeChange = (val: number) => {
    setVideoVolume(val);
    soundEngine.setVideoVolume(val, linkedMode);
    if (linkedMode) {
      setPadVolume(100 - val);
    }
  };

  const handleCrossfaderChange = (val: number) => {
    setCrossfader(val);
    soundEngine.setCrossfader(val);
  };

  const handleToggleLinkedMode = () => {
    const nextState = !linkedMode;
    setLinkedMode(nextState);
    soundEngine.setLinkedMode(nextState);
  };

  const handleTogglePad = () => {
    if (isPlayingPad) {
      soundEngine.stopPad(1.0);
      setIsPlayingPad(false);
    } else {
      soundEngine.playPad(currentKey, soundEngine.currentPadType);
      setIsPlayingPad(true);
    }
  };

  const handleQuickKeyChange = (key: string) => {
    setCurrentKey(key);
    if (isPlayingPad) {
      soundEngine.playPad(key, soundEngine.currentPadType);
    }
  };

  const handleMutePad = () => {
    if (isPadMuted) {
      setIsPadMuted(false);
      soundEngine.setPadVolume(padVolume, false);
    } else {
      setIsPadMuted(true);
      soundEngine.setPadVolume(0, false);
    }
  };

  const handleMuteVideo = () => {
    if (isVideoMuted) {
      setIsVideoMuted(false);
      soundEngine.setVideoVolume(videoVolume, false);
    } else {
      setIsVideoMuted(true);
      soundEngine.setVideoVolume(0, false);
    }
  };

  const handleAutoTransitionToPad = () => {
    if (!isPlayingPad) {
      soundEngine.playPad(currentKey, soundEngine.currentPadType);
      setIsPlayingPad(true);
    }
    soundEngine.performAutoTransition('pad', 3.0);
    setTimeout(() => {
      setCrossfader(-100);
      if (linkedMode) {
        setPadVolume(100);
        setVideoVolume(0);
      }
    }, 3100);
  };

  const handleAutoTransitionToVideo = () => {
    soundEngine.performAutoTransition('video', 3.0);
    setTimeout(() => {
      setCrossfader(100);
      if (linkedMode) {
        setPadVolume(0);
        setVideoVolume(100);
      }
    }, 3100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-800 flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Mesa de Som Auxiliar • Mixer de Áudio
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Saída Real no Dispositivo
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Controles auxiliares independentes e vinculados para Fundos de Oração e Vídeos do YouTube
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Linked Mode Banner */}
        <div className="px-6 py-3 bg-gradient-to-r from-indigo-950/70 via-blue-950/70 to-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleToggleLinkedMode}
              className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                linkedMode 
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm shadow-amber-500/20' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-200">
                  Modo Vinculado Automático
                </span>
                <span className={`px-1.5 py-0.2 text-[10px] font-black rounded ${
                  linkedMode ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'bg-slate-800 text-slate-400'
                }`}>
                  {linkedMode ? 'ATIVADO: Diminuir um Aumenta o Outro' : 'DESATIVADO (Canais Livres)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {linkedMode 
                  ? 'Ao deslizar o fader do Fundo para baixo, o Vídeo sobe na mesma proporção (e vice-versa).'
                  : 'Os canais de Fundo e Vídeo operam de forma 100% independente.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoTransitionToPad}
              className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all cursor-pointer"
              title="Fade out do vídeo e fade in do fundo musical"
            >
              Fade → Fundo
            </button>
            <button
              onClick={handleAutoTransitionToVideo}
              className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 text-xs font-bold transition-all cursor-pointer"
              title="Fade out do fundo e fade in do vídeo"
            >
              Fade → Vídeo
            </button>
          </div>
        </div>

        {/* Mixer Fader Channels Grid */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CANAL 1: FUNDO MUSICAL / PAD DE ORAÇÃO */}
            <div className="bg-slate-950/80 border border-purple-500/30 rounded-3xl p-5 space-y-4 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center">
                      <Music className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-purple-200 uppercase tracking-wider">
                        Canal Aux 1: Fundo Musical
                      </h4>
                      <p className="text-[10px] text-slate-400">Web Audio no Dispositivo</p>
                    </div>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${isPlayingPad ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`} />
                </div>

                {/* Status & Play/Stop */}
                <div className="pt-3 flex items-center justify-between gap-2">
                  <button
                    onClick={handleTogglePad}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isPlayingPad 
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20' 
                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20'
                    }`}
                  >
                    {isPlayingPad ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    {isPlayingPad ? 'Parar Fundo' : 'Tocar Fundo'}
                  </button>

                  <button
                    onClick={handleMutePad}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isPadMuted 
                        ? 'bg-red-500/20 text-red-300 border-red-500/40' 
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                    title={isPadMuted ? 'Desmutar' : 'Mutar Canal'}
                  >
                    {isPadMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => soundEngine.playChime('solemn')}
                    className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 hover:bg-amber-500/30 transition-all cursor-pointer"
                    title="Tocar Sino Solene"
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Key Buttons */}
                <div className="pt-3 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Tom do Fundo:</span>
                  <div className="grid grid-cols-4 gap-1">
                    {['C', 'D', 'E', 'F', 'G', 'A', 'Bb', 'B'].map(k => (
                      <button
                        key={k}
                        onClick={() => handleQuickKeyChange(k)}
                        className={`py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          currentKey === k 
                            ? 'bg-purple-600 text-white shadow-xs' 
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fader Control */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400">Volume Aux 1:</span>
                  <span className="font-mono font-black text-purple-300 text-sm">{padVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={padVolume}
                  onChange={e => handlePadVolumeChange(Number(e.target.value))}
                  className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>-inf dB</span>
                  <span>-6 dB</span>
                  <span>0 dB</span>
                </div>

                {onOpenMusicalBackgrounds && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenMusicalBackgrounds();
                    }}
                    className="w-full mt-2 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800/60 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Music className="w-3.5 h-3.5" />
                    Abrir Painel Completo de Fundos
                  </button>
                )}
              </div>
            </div>

            {/* CANAL 2: VÍDEOS DO YOUTUBE / PLAYBACKS */}
            <div className="bg-slate-950/80 border border-blue-500/30 rounded-3xl p-5 space-y-4 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center">
                      <Youtube className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-blue-200 uppercase tracking-wider">
                        Canal Aux 2: Vídeos YouTube
                      </h4>
                      <p className="text-[10px] text-slate-400">Playbacks & Informativos</p>
                    </div>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${currentVideoTitle ? 'bg-red-400 animate-pulse' : 'bg-slate-700'}`} />
                </div>

                {/* Current Video Info */}
                <div className="pt-3 space-y-2">
                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 text-xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Vídeo Ativo:</span>
                    <p className="font-bold text-slate-200 truncate">
                      {currentVideoTitle || 'Nenhum vídeo em reprodução no momento'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleMuteVideo}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isVideoMuted 
                          ? 'bg-red-500/20 text-red-300 border-red-500/40' 
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {isVideoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      {isVideoMuted ? 'Desmutar Vídeo' : 'Mutar Vídeo'}
                    </button>

                    {onOpenPlaybacks && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenPlaybacks();
                        }}
                        className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-blue-600/20"
                      >
                        <Youtube className="w-3.5 h-3.5" />
                        Buscar Vídeos
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Fader Control */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400">Volume Aux 2:</span>
                  <span className="font-mono font-black text-blue-300 text-sm">{videoVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={videoVolume}
                  onChange={e => handleVideoVolumeChange(Number(e.target.value))}
                  className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>-inf dB</span>
                  <span>-6 dB</span>
                  <span>0 dB</span>
                </div>

                <p className="text-[11px] text-slate-500 italic text-center pt-1">
                  {linkedMode ? '⚡ Vinculado: ao subir, o fundo diminui' : 'Canal independente'}
                </p>
              </div>
            </div>

            {/* CANAL 3: MASTER & VU METER GERAL */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-200 uppercase tracking-wider">
                        Master & Nível Geral
                      </h4>
                      <p className="text-[10px] text-slate-400">Saída Principal</p>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>

                {/* Animated VU Meter */}
                <div className="pt-3 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Nível VU em Tempo Real:</span>
                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-2">
                    <div className="h-4 bg-slate-800 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 rounded-full transition-all duration-75"
                        style={{ width: `${vuLevel}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                      <span>-36dB</span>
                      <span>-18dB</span>
                      <span className="text-amber-400">-6dB</span>
                      <span className="text-red-400">0dB PEAK</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Master Volume Fader */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400">Volume Master Geral:</span>
                  <span className="font-mono font-black text-emerald-300 text-sm">{masterVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume}
                  onChange={e => handleMasterChange(Number(e.target.value))}
                  className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Mute</span>
                  <span>50%</span>
                  <span>100% Máx</span>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => {
                      handleMasterChange(0);
                    }}
                    className="w-full py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-bold transition-all cursor-pointer"
                  >
                    Silêncio Geral (Mute Master)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CROSSFADER HORIZONTAL */}
          <div className="bg-slate-950/60 p-5 rounded-3xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ArrowLeftRight className="w-4 h-4 text-amber-400" />
                Crossfader A/B (Fade Fundo ↔ Vídeo)
              </span>
              <span className="text-xs font-mono font-bold text-amber-300">
                {crossfader < 0 ? `100% Fundo (${crossfader})` : crossfader > 0 ? `100% Vídeo (+${crossfader})` : 'Equilíbrio 50/50'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-purple-300 shrink-0 w-28 text-left">
                🟣 100% Fundo Musical
              </span>
              <div className="flex-1">
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={crossfader}
                  onChange={e => handleCrossfaderChange(Number(e.target.value))}
                  className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>
              <span className="text-xs font-bold text-blue-300 shrink-0 w-28 text-right">
                🔵 100% Vídeo YouTube
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => handleCrossfaderChange(-100)}
                className="px-3 py-1 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 text-purple-300 border border-purple-700/50 text-[11px] font-bold cursor-pointer"
              >
                Só Fundo (-100)
              </button>
              <button
                onClick={() => handleCrossfaderChange(0)}
                className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer"
              >
                Centro (0)
              </button>
              <button
                onClick={() => handleCrossfaderChange(100)}
                className="px-3 py-1 rounded-xl bg-blue-900/40 hover:bg-blue-900/60 text-blue-300 border border-blue-700/50 text-[11px] font-bold cursor-pointer"
              >
                Só Vídeo (+100)
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>🎛️ Mixer integrado à mesa de som virtual da IASD</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black cursor-pointer shadow-md shadow-blue-600/20"
          >
            Fechar Mixer
          </button>
        </div>
      </div>
    </div>
  );
};
