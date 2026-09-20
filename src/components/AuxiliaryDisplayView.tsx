import React, { useState, useEffect, useRef } from 'react';
import { 
  Maximize2, Minimize2, Volume2, VolumeX, Tv, CheckCircle2, 
  Sparkles, Church, Radio, Shield, XCircle, Check, Clock, Monitor
} from 'lucide-react';
import { projectionManager, ProjectionState } from '../utils/projectionManager';
import { getScreenById, loadGeneralSettings } from '../utils/screenConfig';

export const AuxiliaryDisplayView: React.FC = () => {
  // Read screen specific metadata and direct media payload from URL params
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const screenId = urlParams.get('screenId') || 'telao_principal';
  const screenNameParam = urlParams.get('screenName');

  const [projState, setProjState] = useState<ProjectionState>(() => {
    const base = projectionManager.getState();
    const urlEmbed = urlParams.get('embedUrl');
    const urlYtId = urlParams.get('youtubeId');
    const urlTitle = urlParams.get('mediaTitle');
    const urlOrQuery = urlParams.get('urlOrQuery');
    const urlVideoUrl = urlParams.get('videoUrl');
    const urlDate = urlParams.get('videoDate');
    const urlSynopsis = urlParams.get('synopsis');

    if (urlEmbed || urlYtId || urlTitle || urlVideoUrl) {
      return {
        ...base,
        target: 'auxiliary',
        isPlaying: true,
        isAuxiliaryConnected: true,
        activeMedia: {
          title: urlTitle ? decodeURIComponent(urlTitle) : 'Vídeo do Culto',
          urlOrQuery: urlOrQuery ? decodeURIComponent(urlOrQuery) : '',
          embedUrl: urlEmbed 
            ? decodeURIComponent(urlEmbed) 
            : (urlYtId ? `https://www.youtube.com/embed/${urlYtId}?autoplay=1&enablejsapi=1&rel=0&playsinline=1` : undefined),
          youtubeId: urlYtId || undefined,
          videoUrl: urlVideoUrl ? decodeURIComponent(urlVideoUrl) : undefined,
          videoDate: urlDate ? decodeURIComponent(urlDate) : undefined,
          synopsis: urlSynopsis ? decodeURIComponent(urlSynopsis) : undefined,
          timestamp: Date.now(),
        }
      };
    }
    return base;
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [currentSeconds, setCurrentSeconds] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Dynamic reactive screen config to immediately reflect changes saved in configuration modal
  const [screenConfig, setScreenConfig] = useState(() => getScreenById(screenId));
  const displayScreenName = screenConfig?.name || screenNameParam || 'Telão da Igreja';
  const standbyMode = screenConfig?.standbyMode || 'logo';

  // Listen to live screen configuration updates from the main window
  useEffect(() => {
    const handleSettingsRefresh = () => {
      const fresh = getScreenById(screenId);
      if (fresh) {
        setScreenConfig(fresh);
        document.title = `${fresh.name} - Sonoplastia IASD`;
        if (!fresh.enabled) {
          try {
            window.close();
          } catch (e) {}
        }
      }
    };

    // Storage listener (for cross-tab/window updates)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'iasd_screen_settings_updated' || e.key === 'iasd_projection_screen_settings_v1') {
        handleSettingsRefresh();
      }
    };
    window.addEventListener('storage', handleStorage);

    // BroadcastChannel listener
    let channel: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel('iasd_projection_sync');
        channel.onmessage = (event) => {
          if (event.data?.type === 'SETTINGS_UPDATED') {
            handleSettingsRefresh();
          }
        };
      }
    } catch (e) {}

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (channel) channel.close();
    };
  }, [screenId]);

  // Subscribe to projection manager
  useEffect(() => {
    projectionManager.notifyAuxiliaryReady();
    const unsubscribe = projectionManager.subscribe((state) => {
      setProjState(state);
    });

    const handleBeforeUnload = () => {
      projectionManager.notifyAuxiliaryClosed();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      projectionManager.notifyAuxiliaryClosed();
    };
  }, []);

  // Handle video ending - closes the auxiliary display automatically
  const handleVideoEnded = () => {
    if (isClosing) return;
    setIsClosing(true);
    console.log('Vídeo concluído no Telão. Fechando o telão automaticamente...');

    // Notify the projection manager and all windows
    projectionManager.notifyVideoEnded();

    // Exit fullscreen first so browser allows window to close cleanly
    exitAppFullscreen().catch(() => {});

    // Attempt to close window immediately
    try {
      window.close();
    } catch (e) {
      console.warn('Browser prevented direct window.close:', e);
    }

    // Fallback if window.close was prevented: clear media and try closing again
    setTimeout(() => {
      try {
        window.close();
      } catch (err) {}
    }, 400);
  };

  // Listen to close commands from other tabs/windows
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'iasd_close_auxiliary_trigger' || e.key === 'iasd_video_ended_trigger') {
        exitAppFullscreen().catch(() => {});
        try {
          window.close();
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Listen to YouTube Player API postMessages to detect video ended event (state 0)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        let data = event.data;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) {
            return;
          }
        }

        // YouTube HTML5 / Iframe API postMessage contract
        // State 0 = YT.PlayerState.ENDED
        if (data) {
          if (data.event === 'onStateChange' && (data.info === 0 || data.data === 0)) {
            handleVideoEnded();
          } else if (data.type === 'onStateChange' && (data.info === 0 || data.data === 0)) {
            handleVideoEnded();
          } else if (data.info === 0 && data.event === 'initialDelivery') {
            // Some players deliver end state via initialDelivery
          }
        }
      } catch (err) {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isClosing]);

  // Hook into iframe and enable postMessage listening for YouTube state changes and trigger autoplay
  useEffect(() => {
    if (projState.activeMedia?.embedUrl && iframeRef.current) {
      const sendPlayCommands = () => {
        try {
          // Tell YouTube iframe to report events to this parent window
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: 'listening' }),
            '*'
          );
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }),
            '*'
          );
          // Explicitly command YouTube player to play immediately
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
            '*'
          );
        } catch (e) {}
      };

      // Send immediate and staged play commands to overcome iframe initialization race conditions
      const t1 = setTimeout(sendPlayCommands, 200);
      const t2 = setTimeout(sendPlayCommands, 600);
      const t3 = setTimeout(sendPlayCommands, 1200);
      const t4 = setTimeout(sendPlayCommands, 2200);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [projState.activeMedia?.embedUrl]);

  // Clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fade out title overlay after 5 seconds
  useEffect(() => {
    if (projState.activeMedia && projState.target === 'auxiliary') {
      setShowOverlay(true);
      const timer = setTimeout(() => {
        setShowOverlay(false);
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, [projState.activeMedia, projState.target]);

  // Adjust volume on HTML5 video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = Math.min(1, Math.max(0, projState.volume / 100));
      if (!projState.isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [projState.volume, projState.isPlaying]);

  // Fullscreen helper functions with cross-browser vendor prefix support
  const requestAppFullscreen = async () => {
    const doc = document as any;
    const docEl = document.documentElement as any;
    const isFs = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
    if (!isFs) {
      const fn =
        docEl.requestFullscreen ||
        docEl.webkitRequestFullscreen ||
        docEl.mozRequestFullScreen ||
        docEl.msRequestFullscreen;
      if (fn) {
        try {
          const res = fn.call(docEl);
          if (res && typeof res.then === 'function') {
            await res;
          }
          setIsFullscreen(true);
        } catch (e) {
          // Browser requires user gesture; will activate on first click or touch
        }
      }
    }
  };

  const exitAppFullscreen = async () => {
    const doc = document as any;
    const fn =
      doc.exitFullscreen ||
      doc.webkitExitFullscreen ||
      doc.mozCancelFullScreen ||
      doc.msExitFullscreen;
    if (fn) {
      try {
        const res = fn.call(doc);
        if (res && typeof res.then === 'function') {
          await res;
        }
        setIsFullscreen(false);
      } catch (e) {}
    }
  };

  const toggleFullscreen = () => {
    const doc = document as any;
    const isFs = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
    if (isFs) {
      exitAppFullscreen();
    } else {
      requestAppFullscreen();
    }
  };

  // Auto-attempt fullscreen on mount or when media triggers
  useEffect(() => {
    // Attempt fullscreen immediately
    requestAppFullscreen();

    // Listen to storage trigger from operator window
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'iasd_fullscreen_trigger') {
        requestAppFullscreen();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (projState.target === 'auxiliary' && projState.activeMedia && !document.fullscreenElement) {
      requestAppFullscreen();
    }
  }, [projState.target, projState.activeMedia]);

  // Enter fullscreen on ANY first user gesture on this window (click, tap, key, or pointer)
  useEffect(() => {
    const handleInteraction = () => {
      const doc = document as any;
      const isFs = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      if (!isFs) {
        requestAppFullscreen();
      }
    };

    window.addEventListener('click', handleInteraction, { passive: true });
    window.addEventListener('pointerdown', handleInteraction, { passive: true });
    window.addEventListener('touchstart', handleInteraction, { passive: true });

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  // Keyboard shortcuts and sync fullscreen changes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        projectionManager.togglePlayPause();
      }
    };

    const handleFullscreenChange = () => {
      const doc = document as any;
      setIsFullscreen(
        !!(
          doc.fullscreenElement ||
          doc.webkitFullscreenElement ||
          doc.mozFullScreenElement ||
          doc.msFullscreenElement
        )
      );
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const isTransmittingToAux = projState.target === 'auxiliary' && projState.activeMedia;

  return (
    <div 
      onClick={!isFullscreen ? requestAppFullscreen : undefined}
      onDoubleClick={toggleFullscreen}
      className="fixed inset-0 w-screen h-screen bg-black text-white overflow-hidden flex flex-col justify-center items-center select-none font-sans"
    >
      {/* Top Banner when NOT in Fullscreen (Helps operator know which screen is in windowed mode) */}
      {!isFullscreen && (
        <div 
          onClick={requestAppFullscreen}
          className="absolute top-0 inset-x-0 z-50 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xl cursor-pointer hover:opacity-95 transition-all"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="tracking-wide uppercase">
              📺 {displayScreenName} • CONECTADO • CLIQUE PARA TELA CHEIA
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-black/30 border border-white/20 px-2 py-0.5 rounded text-[11px]">
              Tecla F
            </span>
            <Maximize2 className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* ACTIVE MEDIA SCREEN - PURELY THE VIDEO (NO OVERLAYS, NO BANNERS) */}
      {isTransmittingToAux ? (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {/* OFFLINE HTML5 VIDEO */}
          {projState.activeMedia?.videoUrl ? (
            <video
              key={projState.activeMedia.videoUrl}
              ref={videoRef}
              src={projState.activeMedia.videoUrl}
              autoPlay
              playsInline
              controls
              className="w-full h-full object-contain bg-black"
              onLoadedMetadata={() => {
                videoRef.current?.play().catch((e) => console.warn('HTML5 play triggered after metadata:', e));
              }}
              onError={(e) => {
                console.warn('Erro ao carregar vídeo local no Telão, alternando automaticamente para YouTube:', e);
                if (projState.activeMedia?.embedUrl) {
                  projectionManager.updateProjectedMedia({
                    ...projState.activeMedia,
                    videoUrl: undefined,
                    isOffline: false,
                  });
                }
              }}
              onEnded={handleVideoEnded}
            />
          ) : projState.activeMedia?.embedUrl ? (
            /* YOUTUBE EMBED PLAYER - 100% CLEAN EDGE-TO-EDGE */
            <iframe
              key={projState.activeMedia.embedUrl}
              ref={iframeRef}
              src={projState.activeMedia.embedUrl}
              title={projState.activeMedia.title}
              className="w-full h-full border-0 pointer-events-auto bg-black"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              onLoad={() => {
                try {
                  iframeRef.current?.contentWindow?.postMessage(
                    JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
                    '*'
                  );
                } catch (e) {}
              }}
            />
          ) : (
            <div className="text-center p-8 space-y-4">
              <Tv className="w-16 h-16 text-amber-400 mx-auto animate-pulse" />
              <h2 className="text-2xl font-bold">{projState.activeMedia?.title}</h2>
              <p className="text-slate-400 text-sm">Carregando vídeo para a tela auxiliar...</p>
            </div>
          )}

          {/* Minimal Floating Controls - visible on mouse hover */}
          <div className="absolute top-3 right-3 z-50 flex items-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-[11px] bg-slate-900/90 text-slate-300 border border-slate-700/50 px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md shadow-md">
              <Monitor className="w-3 h-3 text-purple-400" />
              <span>{displayScreenName}</span>
            </span>

            <span className="text-[11px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md shadow-md">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Fecha ao terminar</span>
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleVideoEnded();
              }}
              className="px-2.5 py-1 rounded-full bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold backdrop-blur-xs border border-red-400/30 shadow-lg cursor-pointer flex items-center gap-1 transition-colors"
              title="Fechar Esta Tela"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Fechar</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white backdrop-blur-xs border border-white/10 shadow-lg cursor-pointer"
              title="Tela Cheia (Clique duplo ou tecla F)"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Discreet prompt if browser blocked auto-fullscreen without user gesture */}
          {!isFullscreen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                requestAppFullscreen();
              }}
              className="absolute bottom-5 z-50 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-2xl backdrop-blur-sm border border-white/30 flex items-center gap-2 cursor-pointer transition-all animate-bounce"
            >
              <Maximize2 className="w-4 h-4 text-white" />
              <span>Expandir em Tela Cheia (Pressione F ou Clique Aqui)</span>
            </button>
          )}
        </div>
      ) : standbyMode === 'black' ? (
        /* BLACKOUT STANDBY MODE */
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-black text-slate-800 select-none">
          <div className="absolute top-4 left-4 flex items-center gap-2 text-[10px] text-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
            <span>{displayScreenName} (Standby Blackout)</span>
          </div>
        </div>
      ) : standbyMode === 'clock_logo' ? (
        /* STAGE DISPLAY / CONFIDENCE MONITOR MODE */
        <div className="relative w-full h-full flex flex-col items-center justify-between p-10 bg-slate-950 text-white select-none">
          {/* Top Bar */}
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
              <span>{displayScreenName}</span>
            </div>
            <div className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
              Monitor de Apoio & Púlpito
            </div>
          </div>

          {/* Massive Center Clock */}
          <div className="text-center space-y-3 my-auto">
            <div className="text-7xl sm:text-9xl font-black font-mono tracking-tighter text-amber-400 drop-shadow-2xl">
              {currentTime}
            </div>
            <p className="text-sm font-semibold tracking-widest text-slate-400 uppercase">
              Horário Oficial do Culto
            </p>
          </div>

          {/* Bottom Bar */}
          <div className="w-full flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-4">
            <div className="flex items-center gap-2">
              <Church className="w-4 h-4 text-amber-500/70" />
              <span>Igreja Adventista do Sétimo Dia</span>
            </div>
            <div>
              Aguardando projeção de vídeo ou louvor...
            </div>
          </div>
        </div>
      ) : (
        /* WORSHIP LOGO STANDBY SCREEN */
        <div className="relative w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-slate-950 via-slate-900 to-black">
          <div className="absolute top-8 left-8 flex items-center gap-3 text-slate-400 text-sm font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-white/90">{displayScreenName}</span>
            <span className="text-xs text-slate-500">• Conectado à Sonoplastia</span>
          </div>

          <div className="absolute top-8 right-8 font-mono text-2xl font-bold text-slate-300">
            {currentTime}
          </div>

          <div className="max-w-2xl space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/10">
              <Church className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1 rounded-full">
                Igreja Adventista do Sétimo Dia
              </span>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-serif">
                Culto de Adoração & Louvor
              </h1>
              <p className="text-base sm:text-lg text-slate-400 font-medium max-w-lg mx-auto pt-2">
                "Tudo tem o seu tempo determinado, e há tempo para todo o propósito debaixo do céu."
              </p>
            </div>

            <div className="pt-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
                <span>
                  {projState.target === 'main' && projState.activeMedia
                    ? `Operador está controlando na Tela Principal: "${projState.activeMedia.title}"`
                    : 'Aguardando próximo comando de transmissão do operador...'}
                </span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 text-center text-xs text-slate-600 font-medium">
            Pressione <strong>F</strong> ou clique duas vezes para Tela Cheia no Projetor
          </div>
        </div>
      )}
    </div>
  );
};
