import React, { useState, useEffect } from 'react';
import { 
  Music, Volume2, Play, Square, Sparkles, Bell, 
  Clock, X, Check, Sliders, Radio, ExternalLink, Link2, Unlink
} from 'lucide-react';
import { soundEngine } from '../utils/audioEngine';
import { useAudioEngine } from '../hooks/useAudioEngine';

interface MusicalBackgroundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMixer?: () => void;
}

export const MusicalBackgroundsModal: React.FC<MusicalBackgroundsModalProps> = ({
  isOpen,
  onClose,
  onOpenMixer,
}) => {
  const { isPlayingPad, padVolume, videoVolume, currentKey, currentPadType, linkedMode } = useAudioEngine();
  const [selectedKey, setSelectedKey] = useState<string>('D');
  const [padStyle, setPadStyle] = useState<'warm_pad' | 'ethereal' | 'piano_strings' | 'solemn_organ'>('warm_pad');
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Sync playing state
  useEffect(() => {
    if (currentKey) {
      setSelectedKey(currentKey);
    }
    if (currentPadType) {
      setPadStyle(currentPadType);
    }
  }, [isOpen, currentKey, currentPadType]);

  // Timer countdown
  useEffect(() => {
    if (!timeRemaining || timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev && prev > 1) return prev - 1;
        // Stop pad when timer ends
        soundEngine.stopPad(2.5);
        return null;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeRemaining]);

  if (!isOpen) return null;

  const handleTogglePlay = (keyToPlay: string = selectedKey, styleToPlay = padStyle) => {
    if (isPlayingPad && currentKey === keyToPlay && currentPadType === styleToPlay) {
      soundEngine.stopPad(1.5);
      setTimeRemaining(null);
    } else {
      setSelectedKey(keyToPlay);
      setPadStyle(styleToPlay);
      soundEngine.playPad(keyToPlay, styleToPlay);
      if (timerMinutes) {
        setTimeRemaining(timerMinutes * 60);
      }
    }
  };

  const handleStop = () => {
    soundEngine.stopPad(1.0);
    setTimeRemaining(null);
  };

  const handleVolumeChange = (newVol: number) => {
    soundEngine.setPadVolume(newVol, linkedMode);
  };

  const keys = [
    { key: 'C', name: 'Dó Maior (C)', note: 'Solene & Firme' },
    { key: 'D', name: 'Ré Maior (D)', note: 'Oração Pastoral (Padrão)' },
    { key: 'E', name: 'Mi Maior (E)', note: 'Adoração Suave' },
    { key: 'F', name: 'Fá Maior (F)', note: 'Gratidão & Ofertas' },
    { key: 'G', name: 'Sol Maior (G)', note: 'Clássico & Aconchegante' },
    { key: 'A', name: 'Lá Maior (A)', note: 'Apelo & Decisão' },
    { key: 'Bb', name: 'Si Bemol (Bb)', note: 'Hinos Tradicionais' },
    { key: 'B', name: 'Si Maior (B)', note: 'Profundo & Elevado' },
  ];

  const padStyles = [
    { id: 'warm_pad', label: 'Pad Quente Analógico', desc: 'Filtro aveludado, ideal para Oração Silenciosa e Intercessória' },
    { id: 'ethereal', label: 'Ethereal / Celestial', desc: 'Harmônicos suaves de ar, ideal para Meditação e Poesias' },
    { id: 'piano_strings', label: 'Cordas & Fundo Harmônico', desc: 'Ressonância clássica, ideal para Ofertório e Doxologia' },
    { id: 'solemn_organ', label: 'Órgão Solene IASD', desc: 'Sustentação rica e inspiradora para entrada de pregadores' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-800 flex flex-col max-h-[92vh] text-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/30 backdrop-blur-md flex items-center justify-center border border-purple-500/40 text-purple-300">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Fundos Musicais & Pads de Oração
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Som Real no Dispositivo
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Sintetizador Web Audio com reprodução contínua nos alto-falantes para momentos solenes
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Play Status Banner */}
          <div className={`p-5 rounded-3xl border transition-all ${
            isPlayingPad 
              ? 'bg-purple-950/40 border-purple-500/50 shadow-lg shadow-purple-950/50' 
              : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${isPlayingPad ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  <p className="text-sm font-black text-white">
                    {isPlayingPad ? `Tocando Fundo em ${selectedKey} no Dispositivo` : 'Nenhum Fundo Musical Tocando'}
                  </p>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  {isPlayingPad 
                    ? `Estilo: ${padStyles.find(p => p.id === padStyle)?.label} • Som ativo nos alto-falantes`
                    : 'Selecione o tom desejado abaixo para iniciar o fundo de oração contínuo'}
                </p>
                {timeRemaining !== null && (
                  <p className="text-xs font-bold text-purple-300 flex items-center gap-1 pt-1">
                    <Clock className="w-3.5 h-3.5" />
                    Tempo Restante: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isPlayingPad ? (
                  <button
                    onClick={handleStop}
                    className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    Parar Som
                  </button>
                ) : (
                  <button
                    onClick={() => handleTogglePlay(selectedKey, padStyle)}
                    className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Tocar Fundo ({selectedKey})
                  </button>
                )}

                {/* Chime Bell */}
                <button
                  onClick={() => soundEngine.playChime('solemn')}
                  className="px-3.5 py-2.5 rounded-2xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-600/40"
                  title="Tocar Sino Solene no Dispositivo"
                >
                  <Bell className="w-4 h-4 text-amber-400" />
                  Sino IASD
                </button>
              </div>
            </div>

            {/* Quick Volume Slider with Linked Mode Indicator */}
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={padVolume}
                    onChange={e => handleVolumeChange(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
                <span className="text-xs font-mono font-bold text-purple-300 w-12 text-right">
                  {padVolume}%
                </span>
                {onOpenMixer && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenMixer();
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0 border border-slate-700"
                  >
                    <Sliders className="w-3.5 h-3.5 text-blue-400" />
                    Mixer
                  </button>
                )}
              </div>

              {/* Linked inverse volume helper notice */}
              {linkedMode && (
                <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="flex items-center gap-1.5 text-blue-300 font-medium">
                    <Link2 className="w-3.5 h-3.5 text-blue-400" />
                    Mixers Vinculados Inversamente: Ao subir o fundo musical, o vídeo reduz automaticamente.
                  </span>
                  <span className="font-mono text-slate-300">
                    Vídeo: {videoVolume}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Key Selection Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
              1. Selecione o Tom do Culto / Oração
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {keys.map(k => {
                const isSelected = selectedKey === k.key;
                const isCurrentPlaying = isPlayingPad && isSelected;
                return (
                  <button
                    key={k.key}
                    onClick={() => handleTogglePlay(k.key, padStyle)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isCurrentPlaying
                        ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/30 scale-[1.02]'
                        : isSelected
                        ? 'bg-purple-950/60 text-purple-200 border-purple-500/60 ring-1 ring-purple-500/40'
                        : 'bg-slate-950 hover:bg-slate-850 text-slate-300 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-lg font-black">{k.key}</span>
                      {isCurrentPlaying && (
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      )}
                    </div>
                    <span className={`text-[10px] font-medium block truncate mt-1 ${
                      isCurrentPlaying ? 'text-purple-100' : 'text-slate-400'
                    }`}>
                      {k.note}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Style of Pad */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
              2. Timbre & Estilo Sonoro do Pad
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {padStyles.map(style => (
                <button
                  key={style.id}
                  onClick={() => {
                    setPadStyle(style.id as any);
                    if (isPlayingPad) {
                      soundEngine.playPad(selectedKey, style.id as any);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    padStyle === style.id
                      ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/40'
                      : 'bg-slate-950 border-slate-800 hover:bg-slate-850 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black">{style.label}</p>
                    {padStyle === style.id && <Check className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {style.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Duration Timer presets */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
              3. Duração Automática da Oração (Opcional)
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { min: null, label: 'Contínuo (Sem Limite)' },
                { min: 2, label: '2 Minutos (Oração Breve)' },
                { min: 3, label: '3 Minutos (Oração Pastoral)' },
                { min: 5, label: '5 Minutos (Ofertório / Apelo)' },
                { min: 8, label: '8 Minutos (Meditação)' },
              ].map(opt => (
                <button
                  key={opt.label}
                  onClick={() => {
                    setTimerMinutes(opt.min);
                    if (opt.min && isPlayingPad) {
                      setTimeRemaining(opt.min * 60);
                    } else if (!opt.min) {
                      setTimeRemaining(null);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    timerMinutes === opt.min
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>🔊 Saída de áudio direta via Web Audio API do navegador</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 cursor-pointer border border-slate-700"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
