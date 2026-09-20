import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Play, Pause, Volume2, FastForward, Rewind, CheckCircle2, 
  Clock, AlertTriangle, Music, Youtube, Maximize2, Minimize2,
  Calendar, Download, SkipForward, Sparkles, Check, Flame, Tv,
  Sliders, ExternalLink, HardDrive
} from 'lucide-react';
import { WorshipProgram, ActivityItem, WeeklyMediaItem } from '../types';
import { extractYoutubeId, getYoutubeSearchUrl, resolveYoutubePlayable, isValidTransmissionMedia } from '../utils/mediaUtils';
import { getSavedOrGeneratedWeeklyMedia } from '../data/weeklyMediaData';
import { getVideoFromIndexedDB } from '../utils/offlineMediaStorage';
import { projectionManager } from '../utils/projectionManager';

interface LiveSonoplastiaModeProps {
  program: WorshipProgram;
  onClose: () => void;
  onPlayMedia: (title: string, queryOrUrl: string, videoDate?: string, downloadUrl?: string, synopsis?: string) => void;
  weeklyMedia?: {
    informativo: WeeklyMediaItem;
    provaiEVede: WeeklyMediaItem;
  };
}

export const LiveSonoplastiaMode: React.FC<LiveSonoplastiaModeProps> = ({
  program,
  onClose,
  onPlayMedia,
  weeklyMedia: propWeeklyMedia,
}) => {
  const [weeklyMedia] = useState(() => propWeeklyMedia || getSavedOrGeneratedWeeklyMedia(new Date(program.date || Date.now())));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [completedMap, setCompletedMap] = useState<{ [key: string]: boolean }>({});
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);
  
  // Live embedded media player state
  const [activeMedia, setActiveMedia] = useState<{
    title: string;
    urlOrQuery: string;
    dateText?: string;
    downloadUrl?: string;
    subTrackType?: 'c1' | 'c2' | 'c3' | 'weekly_info' | 'weekly_provai' | 'outro';
  } | null>(null);
  const [offlineBlobUrl, setOfflineBlobUrl] = useState<string | null>(null);

  // Check and load offline video from IndexedDB for active media
  useEffect(() => {
    let active = true;
    if (!activeMedia) {
      if (offlineBlobUrl) {
        URL.revokeObjectURL(offlineBlobUrl);
        setOfflineBlobUrl(null);
      }
      return;
    }

    const isInfo = 
      activeMedia.urlOrQuery.includes('informativo') || 
      activeMedia.title.toLowerCase().includes('informativo') || 
      activeMedia.subTrackType === 'weekly_info' || 
      activeMedia.urlOrQuery === 'offline:informativo';

    const isProvai = 
      activeMedia.urlOrQuery.includes('provai') || 
      activeMedia.title.toLowerCase().includes('provai') || 
      activeMedia.subTrackType === 'weekly_provai' || 
      activeMedia.urlOrQuery === 'offline:provai';

    const targetId = isInfo ? 'video_informativo' : isProvai ? 'video_provai' : null;

    if (targetId) {
      getVideoFromIndexedDB(targetId).then(item => {
        if (active && item && item.blob) {
          const url = URL.createObjectURL(item.blob);
          setOfflineBlobUrl(url);
        }
      });
    } else {
      setOfflineBlobUrl(null);
    }

    return () => {
      active = false;
    };
  }, [activeMedia]);

  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(prev => (prev === msg ? null : prev));
    }, 4000);
  };

  // Live wall clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Activity stopwatch
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const activities = program.activities;
  const currentActivity: ActivityItem | undefined = activities[currentIndex];
  const nextActivity: ActivityItem | undefined = activities[currentIndex + 1];

  // Helper to find media for a given activity
  const getMediaForActivity = (act: ActivityItem) => {
    const lowerName = act.name.toLowerCase();
    
    // Check if it's the weekly mission video
    if (lowerName.includes('informativo') || (act.category === 'video' && act.section === 'escola_sabatina')) {
      return {
        title: weeklyMedia.informativo.title,
        url: 'offline:informativo',
        dateText: weeklyMedia.informativo.dateText,
        downloadUrl: weeklyMedia.informativo.downloadUrl,
        subTrackType: 'weekly_info' as const,
      };
    }
    
    // Check if it's Provai e Vede / Dízimos
    if (lowerName.includes('provai') || lowerName.includes('dízimo') || lowerName.includes('dizimo') || lowerName.includes('oferta')) {
      return {
        title: weeklyMedia.provaiEVede.title,
        url: 'offline:provai',
        dateText: weeklyMedia.provaiEVede.dateText,
        downloadUrl: weeklyMedia.provaiEVede.downloadUrl,
        subTrackType: 'weekly_provai' as const,
      };
    }

    if (act.congregational1?.title) {
      return {
        title: act.congregational1.title,
        url: act.congregational1.url || act.congregational1.title,
        dateText: act.congregational1.videoDate,
        subTrackType: 'c1' as const,
      };
    }

    return null;
  };

  // Automatically start playing media when stage begins / changes
  useEffect(() => {
    const act = activities[currentIndex];
    if (!act) return;

    const media = getMediaForActivity(act);
    if (media) {
      playMediaInline(
        media.title,
        media.url,
        media.dateText,
        media.downloadUrl,
        media.subTrackType
      );
    } else {
      setActiveMedia(null);
      setIsTimerRunning(true);
    }
  }, [currentIndex]);

  // Trigger media playback inside the live operator view and project to auxiliary screen
  const playMediaInline = (
    title: string, 
    urlOrQuery: string, 
    dateText?: string, 
    downloadUrl?: string, 
    subTrackType?: any
  ) => {
    setActiveMedia({
      title,
      urlOrQuery,
      dateText,
      downloadUrl,
      subTrackType,
    });
    setIsTimerRunning(true);
    showToast(`▶️ Reproduzindo: ${title}`);

    // Automatically sync to church projector in fullscreen
    const mediaRes = resolveYoutubePlayable(urlOrQuery, title);
    projectionManager.openOnAllAuxiliaryScreens(true);
    projectionManager.transmitToAuxiliaryScreen({
      id: urlOrQuery,
      title,
      urlOrQuery,
      youtubeId: mediaRes.youtubeId,
      embedUrl: mediaRes.embedUrl,
      videoDate: dateText,
      timestamp: Date.now(),
    }, true);
  };

  // Central Command: Advance to next stage and AUTOMATICALLY start playing the next media
  const handleAdvanceAndPlayNext = () => {
    if (!currentActivity) return;

    // 1. Mark current stage as completed
    setCompletedMap(prev => ({ ...prev, [currentActivity.id]: true }));

    // 2. Check if there's a next stage
    if (currentIndex < activities.length - 1) {
      const nextIdx = currentIndex + 1;
      const nextAct = activities[nextIdx];
      
      setCurrentIndex(nextIdx);
      setTimerSeconds(0);
      setIsTimerRunning(true);

      // 3. Find if next stage has media to auto-play
      const nextMedia = getMediaForActivity(nextAct);

      if (nextMedia) {
        playMediaInline(
          nextMedia.title,
          nextMedia.url,
          nextMedia.dateText,
          nextMedia.downloadUrl,
          nextMedia.subTrackType
        );
        showToast(`✅ Avançado para "${nextAct.name}" • Rodando mídia automaticamente!`);
      } else {
        // No media, clear current player and start phase timer
        setActiveMedia(null);
        showToast(`✅ Avançado para "${nextAct.name}" • Cronômetro iniciado!`);
      }
    } else {
      showToast('🎉 Ordem do culto concluída com sucesso!');
    }
  };

  // Advance sub-track (C1 -> C2 -> C3) within current activity
  const handleNextSubTrack = () => {
    if (!currentActivity) return;

    if (!activeMedia || activeMedia.subTrackType === 'c1') {
      if (currentActivity.congregational2?.title) {
        playMediaInline(
          currentActivity.congregational2.title,
          currentActivity.congregational2.url || currentActivity.congregational2.title,
          currentActivity.congregational2.videoDate,
          undefined,
          'c2'
        );
        return;
      }
    }

    if (activeMedia?.subTrackType === 'c2') {
      if (currentActivity.congregational3?.title) {
        playMediaInline(
          currentActivity.congregational3.title,
          currentActivity.congregational3.url || currentActivity.congregational3.title,
          currentActivity.congregational3.videoDate,
          undefined,
          'c3'
        );
        return;
      }
    }

    // If no further subtracks, advance to next phase automatically
    handleAdvanceAndPlayNext();
  };

  const handleManualPrev = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      setTimerSeconds(0);
      setActiveMedia(null);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleAdvanceAndPlayNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleManualPrev();
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsTimerRunning(prev => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        const doc = document as any;
        const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
        if (!isFs) {
          const docEl = document.documentElement as any;
          const fn = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
          if (fn) fn.call(docEl).catch(() => {});
        } else {
          const fn = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
          if (fn) fn.call(doc).catch(() => {});
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentActivity, activeMedia]);

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeMediaResolution = activeMedia ? resolveYoutubePlayable(activeMedia.urlOrQuery, activeMedia.title) : null;
  const activeYoutubeId = activeMediaResolution?.youtubeId || null;
  const activeEmbedUrl = activeMediaResolution?.embedUrl || null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-y-auto select-none">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-60 bg-blue-600 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-2xl border border-blue-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full bg-red-500 animate-pulse ring-4 ring-red-500/20" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-white">
                Controle de Sonoplastia • IASD
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Auto-Play Habilitado
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Culto: <span className="text-slate-200">{program.title}</span> • Responsável: <span className="text-amber-400 font-bold">{program.responsiblePerson}</span>
            </p>
          </div>
        </div>

        {/* Live Clock, Telão Fullscreen & Close Button */}
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={async () => {
              if (activeMedia) {
                const mediaRes = resolveYoutubePlayable(activeMedia.urlOrQuery, activeMedia.title);
                await projectionManager.transmitToAuxiliaryScreen({
                  id: activeMedia.urlOrQuery,
                  title: activeMedia.title,
                  urlOrQuery: activeMedia.urlOrQuery,
                  youtubeId: mediaRes.youtubeId,
                  embedUrl: mediaRes.embedUrl,
                  videoDate: activeMedia.dateText,
                  timestamp: Date.now(),
                }, true);
              } else {
                await projectionManager.openOnAllAuxiliaryScreens(true);
              }
              showToast('📺 Telão aberto em Tela Cheia no 2º monitor!');
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer hover:scale-105"
            title="Abrir Telão da Igreja em Tela Cheia no Segundo Monitor (Tecla F)"
          >
            <Tv className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Telão em Tela Cheia</span>
          </button>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Horário Oficial
            </span>
            <div className="font-mono text-2xl sm:text-3xl font-black text-amber-400 tracking-wider leading-none">
              {currentTime}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Sair do Modo Telão / Sonoplastia"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="grow p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        
        {/* Left / Center (8 cols): Current Stage, Auto-Advance Master Control & Active Media Player */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* MASTER AUTO-ADVANCE & NEXT PHASE BUTTON (Highest Priority) */}
          <div className="bg-gradient-to-r from-blue-900/90 via-indigo-950 to-slate-900 border-2 border-blue-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Comando de Transição
                  </span>
                  {nextActivity && (
                    <span className="text-xs text-slate-400">
                      Próximo: <strong className="text-white">{nextActivity.name}</strong>
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Avanço Automático de Fase e Músicas
                </h3>
                <p className="text-xs text-slate-300 max-w-xl">
                  Clique no botão principal para concluir a etapa atual e iniciar a próxima fase executando sua respectiva música ou vídeo automaticamente.
                </p>
              </div>

              {/* HUGE GLOWING ADVANCE BUTTON */}
              <button
                id="auto-advance-next-stage-btn"
                onClick={handleAdvanceAndPlayNext}
                disabled={currentIndex >= activities.length - 1}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-30 text-slate-950 font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-all hover:scale-103 cursor-pointer shadow-xl shadow-emerald-500/30 shrink-0"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>PRÓXIMA ETAPA (RODAR AGORA)</span>
                <FastForward className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-track switch if current activity has multiple songs (C1, C2, C3) */}
            {currentActivity && (currentActivity.congregational2 || currentActivity.congregational3) && (
              <div className="mt-4 pt-3 border-t border-blue-800/60 flex items-center justify-between gap-3 text-xs">
                <span className="text-blue-200 font-semibold flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-blue-400" />
                  Músicas desta etapa: 
                  <strong className="text-white ml-1">
                    {activeMedia?.subTrackType === 'c3' ? 'C3 (Final)' : activeMedia?.subTrackType === 'c2' ? 'C2 (Segunda)' : 'C1 (Primeira)'}
                  </strong>
                </span>

                <button
                  onClick={handleNextSubTrack}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Próxima Música desta Etapa</span>
                </button>
              </div>
            )}
          </div>

          {/* ACTIVE INLINE MEDIA SCREEN (If playing) */}
          {activeMedia && (
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-4 shadow-2xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs font-black uppercase tracking-wider text-red-400">
                    Ao Vivo no Telão / Transmissão
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {activeMedia.downloadUrl && (
                    <a
                      href={activeMedia.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1"
                    >
                      <Download className="w-3 h-3 text-emerald-400" />
                      Baixar MP4 (Offline)
                    </a>
                  )}

                  <button
                    onClick={() => setActiveMedia(null)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs"
                    title="Ocultar tela do vídeo"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Player Frame or Search Fallback */}
              {offlineBlobUrl ? (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-emerald-500/30">
                  <video
                    src={offlineBlobUrl}
                    controls
                    autoPlay
                    playsInline
                    onEnded={handleAdvanceAndPlayNext}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md text-emerald-300 text-[11px] font-black px-3 py-1.5 rounded-xl flex items-center gap-2 border border-emerald-500/40 shadow-lg pointer-events-none">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>REPRODUÇÃO 100% OFFLINE NO TELÃO (Sem YouTube / Sem Internet)</span>
                  </div>
                </div>
              ) : activeEmbedUrl ? (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-inner ring-1 ring-white/10">
                  <iframe
                    key={activeEmbedUrl}
                    src={activeEmbedUrl}
                    title={activeMedia.title}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
                    <Volume2 className="w-6 h-6 animate-pulse" />
                  </div>
                  <h4 className="text-base font-bold text-white">{activeMedia.title}</h4>
                  <p className="text-xs text-slate-400">
                    Etapa iniciada: <span className="font-mono text-amber-300">{activeMedia.urlOrQuery}</span>
                  </p>
                  <div className="flex items-center justify-center gap-1.5 pt-1">
                    <span className="w-1.5 h-6 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-8 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-10 bg-emerald-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-7 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
                    <span className="w-1.5 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.4s]" />
                  </div>
                  <span className="inline-block text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
                    ⚡ Áudio e Momento Ativo Automaticamente
                  </span>
                </div>
              )}

              {/* Playing Info Bar */}
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>{activeMedia.title}</span>
                    {activeMedia.dateText && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        📅 {activeMedia.dateText}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (activeMedia) {
                        const mediaRes = resolveYoutubePlayable(activeMedia.urlOrQuery, activeMedia.title);
                        await projectionManager.transmitToAuxiliaryScreen({
                          id: activeMedia.urlOrQuery,
                          title: activeMedia.title,
                          urlOrQuery: activeMedia.urlOrQuery,
                          youtubeId: mediaRes.youtubeId,
                          embedUrl: mediaRes.embedUrl,
                          videoDate: activeMedia.dateText,
                          timestamp: Date.now(),
                        }, true);
                        showToast(`📺 Jogando no Telão: ${activeMedia.title}`);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-600/30 hover:scale-102"
                    title="Transmitir este vídeo imediatamente para o Telão da Igreja (Tela 2) em tela cheia"
                  >
                    <Tv className="w-3.5 h-3.5 text-purple-200" />
                    <span>Jogar no Telão (Tela 2)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (activeMedia && onPlayMedia) {
                        onPlayMedia(activeMedia.title, activeMedia.urlOrQuery, activeMedia.dateText, activeMedia.downloadUrl);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                    title="Abrir reprodutor com mixer, diagnósticos e alternativas"
                  >
                    <Sliders className="w-3.5 h-3.5 text-blue-400" />
                    <span>Mixer & Opções</span>
                  </button>

                  <a
                    href={activeMediaResolution?.searchUrl || getYoutubeSearchUrl(activeMedia.title)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-700"
                    title="Se não abrir, assista no YouTube oficial"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    <span>YouTube</span>
                  </a>

                  <button
                    onClick={handleAdvanceAndPlayNext}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-transform hover:scale-102 cursor-pointer shadow-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Concluir Etapa</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE ACTIVITY DETAILS CARD */}
          {currentActivity && (
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-7 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="px-3.5 py-1 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-black uppercase tracking-wider">
                  {currentActivity.section === 'escola_sabatina' ? 'Escola Sabatina' : 'Culto Divino'}
                </span>
                <span className="text-xs font-mono text-slate-400 font-bold">
                  Etapa {currentIndex + 1} de {activities.length}
                </span>
              </div>

              {/* Title & Responsible */}
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                  {currentActivity.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                  {currentActivity.responsible && (
                    <span className="bg-slate-800 px-3 py-1 rounded-xl font-bold text-slate-200 border border-slate-700">
                      👤 {currentActivity.responsible}
                    </span>
                  )}
                  {currentActivity.timeSlot && (
                    <span className="bg-slate-800 px-3 py-1 rounded-xl font-mono text-amber-300 border border-slate-700 font-bold">
                      ⏰ {currentActivity.timeSlot}
                    </span>
                  )}
                  {currentActivity.durationMinutes && (
                    <span className="text-slate-400 font-medium text-xs">
                      Previsto: {currentActivity.durationMinutes} min
                    </span>
                  )}
                </div>
              </div>

              {/* Stopwatch Timer */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Cronômetro da Etapa Atual
                  </span>
                  <div className="font-mono text-3xl sm:text-4xl font-black text-emerald-400">
                    {formatTimer(timerSeconds)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      isTimerRunning
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isTimerRunning ? 'Pausar' : 'Iniciar'}
                  </button>
                  <button
                    onClick={() => setTimerSeconds(0)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Zerar
                  </button>
                </div>
              </div>

              {/* Media Buttons (C1, C2, C3) with Direct Inline Play */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Músicas e Mídias Disponíveis para Esta Fase:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Clique para executar imediatamente
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* C1 */}
                  {currentActivity.congregational1 ? (
                    (() => {
                      const isValid = isValidTransmissionMedia(currentActivity.congregational1);
                      const isPendrive = currentActivity.congregational1.sourceType === 'pendrive' || currentActivity.congregational1.sourceType === 'local' || !!currentActivity.congregational1.fileName || currentActivity.congregational1.url?.startsWith('blob:');
                      if (!isValid) {
                        return (
                          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-600/40 text-left flex flex-col justify-between space-y-2">
                            <div className="flex items-center justify-between text-amber-400">
                              <span className="text-[10px] font-bold uppercase tracking-wider">C1 / Playback 1</span>
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-semibold text-slate-300 line-through truncate">
                              {currentActivity.congregational1.title}
                            </span>
                            <span className="text-[10px] text-amber-400 font-bold bg-amber-900/50 px-2 py-0.5 rounded text-center">
                              Falta Link de Transmissão
                            </span>
                          </div>
                        );
                      }
                      return (
                        <button
                          onClick={() =>
                            playMediaInline(
                              currentActivity.congregational1!.title,
                              currentActivity.congregational1!.url || currentActivity.congregational1!.title,
                              currentActivity.congregational1!.videoDate,
                              undefined,
                              'c1'
                            )
                          }
                          className="p-4 rounded-2xl bg-blue-900/50 hover:bg-blue-800 text-left border border-blue-600 transition-all hover:scale-102 flex flex-col justify-between space-y-2 cursor-pointer shadow-lg group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1">
                              {isPendrive ? <HardDrive className="w-3 h-3 text-cyan-400" /> : <Youtube className="w-3 h-3 text-red-400" />}
                              C1 ({isPendrive ? 'Pen Drive' : 'YouTube'})
                            </span>
                            <Play className="w-4 h-4 fill-current text-blue-300 group-hover:scale-110 transition-transform" />
                          </div>
                          <span className="text-sm font-bold text-white line-clamp-2">
                            {currentActivity.congregational1.title}
                          </span>
                        </button>
                      );
                    })()
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-600 text-xs font-semibold flex items-center justify-center">
                      C1: Nenhum
                    </div>
                  )}

                  {/* C2 */}
                  {currentActivity.congregational2 ? (
                    (() => {
                      const isValid = isValidTransmissionMedia(currentActivity.congregational2);
                      const isPendrive = currentActivity.congregational2.sourceType === 'pendrive' || currentActivity.congregational2.sourceType === 'local' || !!currentActivity.congregational2.fileName || currentActivity.congregational2.url?.startsWith('blob:');
                      if (!isValid) {
                        return (
                          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-600/40 text-left flex flex-col justify-between space-y-2">
                            <div className="flex items-center justify-between text-amber-400">
                              <span className="text-[10px] font-bold uppercase tracking-wider">C2 / Playback 2</span>
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-semibold text-slate-300 line-through truncate">
                              {currentActivity.congregational2.title}
                            </span>
                            <span className="text-[10px] text-amber-400 font-bold bg-amber-900/50 px-2 py-0.5 rounded text-center">
                              Falta Link de Transmissão
                            </span>
                          </div>
                        );
                      }
                      return (
                        <button
                          onClick={() =>
                            playMediaInline(
                              currentActivity.congregational2!.title,
                              currentActivity.congregational2!.url || currentActivity.congregational2!.title,
                              currentActivity.congregational2!.videoDate,
                              undefined,
                              'c2'
                            )
                          }
                          className="p-4 rounded-2xl bg-indigo-900/50 hover:bg-indigo-800 text-left border border-indigo-600 transition-all hover:scale-102 flex flex-col justify-between space-y-2 cursor-pointer shadow-lg group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                              {isPendrive ? <HardDrive className="w-3 h-3 text-cyan-400" /> : <Youtube className="w-3 h-3 text-red-400" />}
                              C2 ({isPendrive ? 'Pen Drive' : 'YouTube'})
                            </span>
                            <Play className="w-4 h-4 fill-current text-indigo-300 group-hover:scale-110 transition-transform" />
                          </div>
                          <span className="text-sm font-bold text-white line-clamp-2">
                            {currentActivity.congregational2.title}
                          </span>
                        </button>
                      );
                    })()
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-600 text-xs font-semibold flex items-center justify-center">
                      C2: Nenhum
                    </div>
                  )}

                  {/* C3 */}
                  {currentActivity.congregational3 ? (
                    (() => {
                      const isValid = isValidTransmissionMedia(currentActivity.congregational3);
                      const isPendrive = currentActivity.congregational3.sourceType === 'pendrive' || currentActivity.congregational3.sourceType === 'local' || !!currentActivity.congregational3.fileName || currentActivity.congregational3.url?.startsWith('blob:');
                      if (!isValid) {
                        return (
                          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-600/40 text-left flex flex-col justify-between space-y-2">
                            <div className="flex items-center justify-between text-amber-400">
                              <span className="text-[10px] font-bold uppercase tracking-wider">C3 / Playback 3</span>
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-semibold text-slate-300 line-through truncate">
                              {currentActivity.congregational3.title}
                            </span>
                            <span className="text-[10px] text-amber-400 font-bold bg-amber-900/50 px-2 py-0.5 rounded text-center">
                              Falta Link de Transmissão
                            </span>
                          </div>
                        );
                      }
                      return (
                        <button
                          onClick={() =>
                            playMediaInline(
                              currentActivity.congregational3!.title,
                              currentActivity.congregational3!.url || currentActivity.congregational3!.title,
                              currentActivity.congregational3!.videoDate,
                              undefined,
                              'c3'
                            )
                          }
                          className="p-4 rounded-2xl bg-purple-900/50 hover:bg-purple-800 text-left border border-purple-600 transition-all hover:scale-102 flex flex-col justify-between space-y-2 cursor-pointer shadow-lg group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1">
                              {isPendrive ? <HardDrive className="w-3 h-3 text-cyan-400" /> : <Youtube className="w-3 h-3 text-red-400" />}
                              C3 ({isPendrive ? 'Pen Drive' : 'YouTube'})
                            </span>
                            <Play className="w-4 h-4 fill-current text-purple-300 group-hover:scale-110 transition-transform" />
                          </div>
                          <span className="text-sm font-bold text-white line-clamp-2">
                            {currentActivity.congregational3.title}
                          </span>
                        </button>
                      );
                    })()
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-600 text-xs font-semibold flex items-center justify-center">
                      C3: Nenhum
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {currentActivity.notes && (
                <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-2xl text-amber-200 text-xs">
                  <span className="font-bold">Observação da Sonoplastia:</span> {currentActivity.notes}
                </div>
              )}
            </div>
          )}

          {/* Bottom Step Navigation Bar */}
          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <button
              onClick={handleManualPrev}
              disabled={currentIndex === 0}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Rewind className="w-4 h-4" />
              Etapa Anterior
            </button>

            {nextActivity && (
              <div className="hidden sm:block text-center text-xs text-slate-400">
                <span className="text-slate-500">Próxima etapa:</span>{' '}
                <span className="font-bold text-white">{nextActivity.name}</span>
              </div>
            )}

            <button
              onClick={handleAdvanceAndPlayNext}
              disabled={currentIndex === activities.length - 1}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-bold text-sm flex items-center gap-2 transition-all hover:scale-102 cursor-pointer shadow-lg shadow-blue-500/25"
            >
              Avançar & Rodar Próxima
              <FastForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Sidebar (4 cols): Official Weekly Videos & Complete Order List */}
        <div className="lg:col-span-4 space-y-6">

          {/* OFFICIAL WEEKLY MEDIA FAST 1-CLICK ACCESS */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-500" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Vídeos Oficiais da Semana
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Atualizado
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Vídeos da semana atualizados para o culto. Clique em <strong>Play</strong> para rodar imediatamente com data e título.
            </p>

            {/* INFORMATIVO MUNDIAL DAS MISSÕES BUTTON */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/60 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-600/30 text-blue-300 uppercase">
                  Escola Sabatina
                </span>
                <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {weeklyMedia.informativo.dateText}
                </span>
              </div>

              <h4 className="text-xs font-bold text-white line-clamp-2">
                {weeklyMedia.informativo.title}
              </h4>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() =>
                    playMediaInline(
                      weeklyMedia.informativo.title,
                      weeklyMedia.informativo.directEmbedUrl,
                      weeklyMedia.informativo.dateText,
                      weeklyMedia.informativo.downloadUrl,
                      'weekly_info'
                    )
                  }
                  className="grow py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  RODAR INFORMATIVO (PLAY)
                </button>

                <a
                  href={weeklyMedia.informativo.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Baixar vídeo oficial para uso offline"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                </a>
              </div>
            </div>

            {/* PROVAI E VEDE BUTTON */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-red-500/60 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-600/30 text-red-300 uppercase">
                  Culto Divino / Ofertas
                </span>
                <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {weeklyMedia.provaiEVede.dateText}
                </span>
              </div>

              <h4 className="text-xs font-bold text-white line-clamp-2">
                {weeklyMedia.provaiEVede.title}
              </h4>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() =>
                    playMediaInline(
                      weeklyMedia.provaiEVede.title,
                      weeklyMedia.provaiEVede.directEmbedUrl,
                      weeklyMedia.provaiEVede.dateText,
                      weeklyMedia.provaiEVede.downloadUrl,
                      'weekly_provai'
                    )
                  }
                  className="grow py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  RODAR PROVAI E VEDE (PLAY)
                </button>

                <a
                  href={weeklyMedia.provaiEVede.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Baixar vídeo oficial para uso offline"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Sound Background Shortcuts */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 space-y-3 shadow-xl">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Fundos Musicais Instantâneos
              </h3>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => playMediaInline('Fundo Musical Só Tu És Santo', 'fundo musical so tu es santo oracao piano')}
                className="w-full p-2.5 rounded-xl bg-slate-800 hover:bg-amber-950/60 hover:border-amber-500 text-left border border-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center justify-between cursor-pointer"
              >
                <span>Só Tu És Santo (Oração)</span>
                <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
              </button>

              <button
                onClick={() => playMediaInline('Fundo Musical Falar com Deus', 'fundo musical falar com deus oracao')}
                className="w-full p-2.5 rounded-xl bg-slate-800 hover:bg-amber-950/60 hover:border-amber-500 text-left border border-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center justify-between cursor-pointer"
              >
                <span>Falar com Deus (Oração)</span>
                <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
              </button>

              <button
                onClick={() => playMediaInline('Fundo Musical Meu Respirar', 'fundo musical meu respirar piano oracao')}
                className="w-full p-2.5 rounded-xl bg-slate-800 hover:bg-amber-950/60 hover:border-amber-500 text-left border border-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center justify-between cursor-pointer"
              >
                <span>Meu Respirar (Oração)</span>
                <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
              </button>

              <button
                onClick={() => playMediaInline('Vinheta de Anúncios IASD', 'vinheta comunicados igreja adventista youtube')}
                className="w-full p-2.5 rounded-xl bg-slate-800 hover:bg-indigo-950/60 hover:border-indigo-500 text-left border border-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center justify-between cursor-pointer"
              >
                <span>Vinheta de Comunicados</span>
                <Play className="w-3.5 h-3.5 fill-current text-indigo-400" />
              </button>
            </div>
          </div>

          {/* Full Sequence Checklist with Click to Jump */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 space-y-3 shadow-xl max-h-[340px] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Sequência do Culto
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">
                {Object.keys(completedMap).length}/{activities.length} feitas
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              {activities.map((act, idx) => {
                const isCur = idx === currentIndex;
                const isDone = completedMap[act.id] || idx < currentIndex;
                return (
                  <div
                    key={act.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setTimerSeconds(0);
                      const m = getMediaForActivity(act);
                      if (m) {
                        playMediaInline(m.title, m.url, m.dateText, m.downloadUrl, m.subTrackType);
                      } else {
                        setActiveMedia(null);
                      }
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isCur
                        ? 'bg-blue-600 text-white font-black border-blue-400 shadow-md scale-101'
                        : isDone
                        ? 'bg-slate-950/70 text-slate-500 border-slate-800'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    <span className="truncate">
                      {idx + 1}. {act.name}
                    </span>
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
