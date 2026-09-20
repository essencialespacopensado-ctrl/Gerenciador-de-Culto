import React, { useState, useRef, useEffect } from 'react';
import { Sliders, Volume2, VolumeX, ArrowLeftRight, Music, Youtube, X } from 'lucide-react';
import { useAudioEngine } from '../hooks/useAudioEngine';

interface AuxiliaryMixerButtonProps {
  type: 'fundo' | 'video';
  isPlaying: boolean;
  label?: string;
  onOpenFullMixer?: () => void;
  className?: string;
}

export const AuxiliaryMixerButton: React.FC<AuxiliaryMixerButtonProps> = ({
  type,
  isPlaying,
  label,
  onOpenFullMixer,
  className = '',
}) => {
  const {
    padVolume,
    videoVolume,
    linkedMode,
    setPadVolume,
    setVideoVolume,
    toggleLinkedMode,
  } = useAudioEngine();

  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // STRICT REQUIREMENT: Only appears when actively playing!
  if (!isPlaying) {
    return null;
  }

  const currentVol = type === 'fundo' ? padVolume : videoVolume;

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={popoverRef}>
      {/* Active Auxiliary Mixer Trigger Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md border transition-all cursor-pointer animate-in fade-in zoom-in-95 duration-200 ${
          type === 'fundo'
            ? 'bg-purple-950/90 text-purple-300 border-purple-500/50 hover:bg-purple-900/90 ring-1 ring-purple-500/30'
            : 'bg-red-950/90 text-red-300 border-red-500/50 hover:bg-red-900/90 ring-1 ring-red-500/30'
        }`}
        title={`Mixer Auxiliar de ${type === 'fundo' ? 'Fundo Musical' : 'Vídeo'} (Volume Vinculado)`}
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              type === 'fundo' ? 'bg-purple-400' : 'bg-red-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              type === 'fundo' ? 'bg-purple-400' : 'bg-red-400'
            }`}
          />
        </span>
        <Sliders className="w-3.5 h-3.5" />
        <span className="font-mono text-[11px] font-extrabold">{currentVol}%</span>
        {label && <span className="hidden sm:inline text-[10px] opacity-80">{label}</span>}
      </button>

      {/* Floating Quick Mixer Popover */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 shadow-2xl z-50 text-white space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-white/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  type === 'fundo' ? 'bg-purple-900/60 text-purple-400' : 'bg-red-900/60 text-red-400'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
              </div>
              <div>
                <h5 className="text-xs font-bold leading-tight text-white">Mixer Auxiliar</h5>
                <p className="text-[10px] text-slate-400">Controle rápido em reprodução</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Linked mode badge & toggle */}
          <div className="flex items-center justify-between bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-bold text-slate-200">Mixers Vinculados</span>
            </div>
            <button
              type="button"
              onClick={toggleLinkedMode}
              className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all cursor-pointer ${
                linkedMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {linkedMode ? 'Inverso Ativo' : 'Desvinculado'}
            </button>
          </div>

          {linkedMode && (
            <p className="text-[10px] text-amber-300/80 leading-tight">
              ⚡ Ao aumentar um canal, o outro baixa automaticamente para equilíbrio perfeito.
            </p>
          )}

          {/* Sliders */}
          <div className="space-y-3 pt-1">
            {/* Fundo Musical Channel */}
            <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-purple-900/30">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-purple-400" />
                  Fundo Musical (Pads)
                </span>
                <span className="font-mono font-bold text-purple-300">{padVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={padVolume}
                onChange={(e) => setPadVolume(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Video Channel */}
            <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-red-900/30">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-red-300 flex items-center gap-1.5">
                  <Youtube className="w-3.5 h-3.5 text-red-400" />
                  Áudio do Vídeo
                </span>
                <span className="font-mono font-bold text-red-300">{videoVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={videoVolume}
                onChange={(e) => setVideoVolume(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>
          </div>

          {/* Footer Action */}
          {onOpenFullMixer && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenFullMixer();
              }}
              className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Abrir Mesa de Som Completa</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
