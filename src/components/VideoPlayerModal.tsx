import React, { useState, useEffect, useRef } from 'react';
import { 
  X, ExternalLink, Play, Search, Volume2, Calendar, Download, 
  FastForward, CheckCircle, CheckCircle2, HardDrive, Upload, RefreshCw, Sparkles,
  Music, Sliders, Square, ArrowLeftRight, Bell, Youtube, Monitor,
  Tv, Radio, Pause, Check, Eye, Maximize2, Minimize2,
  AlertTriangle, AlertCircle, HelpCircle, Info, VolumeX, ShieldAlert
} from 'lucide-react';
import { 
  getYoutubeSearchUrl, 
  extractYoutubeId, 
  resolveYoutubePlayable, 
  searchAndResolveYoutubeVideo,
  PlayableMediaResolution,
  cleanSearchQuery 
} from '../utils/mediaUtils';
import { 
  getVideoFromIndexedDB, 
  deleteOfflineVideo,
  autoCacheWeeklyVideo, 
  importLocalVideoFile, 
  downloadVideoBlobToUserDisk,
  autoFindAndDownloadAllWeeklyVideos,
  OfflineStoredVideo 
} from '../utils/offlineMediaStorage';
import { soundEngine } from '../utils/audioEngine';
import { 
  projectionManager, 
  ProjectionTarget, 
  ProjectedMedia 
} from '../utils/projectionManager';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  urlOrQuery: string;
  videoDate?: string;
  downloadUrl?: string;
  synopsis?: string;
  initialTargetScreen?: ProjectionTarget;
  onAdvanceToNext?: () => void;
  nextActivityName?: string;
  onOpenMixer?: () => void;
  onOpenMusicalBackgrounds?: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  isOpen,
  onClose,
  title,
  urlOrQuery,
  videoDate,
  downloadUrl,
  synopsis,
  initialTargetScreen = 'main',
  onAdvanceToNext,
  nextActivityName,
  onOpenMixer,
  onOpenMusicalBackgrounds,
}) => {
  const [offlineVideoUrl, setOfflineVideoUrl] = useState<string | null>(null);
  const [offlineMeta, setOfflineMeta] = useState<OfflineStoredVideo | null>(null);
  const [isLoadingOffline, setIsLoadingOffline] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);

  // Playback Source: 'youtube' (official online) vs 'local' (offline saved video file)
  const [playbackSource, setPlaybackSource] = useState<'youtube' | 'local'>('youtube');

  // Dual Screen Transmission State (Main Screen vs Auxiliary Screen)
  const [targetScreen, setTargetScreen] = useState<ProjectionTarget>(initialTargetScreen || 'main');
  const [isAuxWindowOpen, setIsAuxWindowOpen] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [screensOpenedCount, setScreensOpenedCount] = useState(0);

  // Automatic Video Finding and Download State
  const [isAutoDownloading, setIsAutoDownloading] = useState(false);
  const [autoDownloadStatus, setAutoDownloadStatus] = useState<string | null>(null);

  // Optional custom URL/ID override input
  const [customLinkInput, setCustomLinkInput] = useState('');
  const [activeUrlOrQuery, setActiveUrlOrQuery] = useState(urlOrQuery);

  // Auxiliary Mixer state (synced with soundEngine)
  const [padVolume, setPadVolume] = useState<number>(soundEngine.padVolume);
  const [videoVolume, setVideoVolume] = useState<number>(soundEngine.videoVolume);
  const [linkedMode, setLinkedMode] = useState<boolean>(soundEngine.linkedMode);
  const [isPlayingPad, setIsPlayingPad] = useState<boolean>(soundEngine.isPlayingPad);

  useEffect(() => {
    setActiveUrlOrQuery(urlOrQuery);
    setCustomLinkInput('');
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setPlaybackSource('local');
    } else if (urlOrQuery.startsWith('offline:')) {
      setPlaybackSource('local');
    } else {
      setPlaybackSource('youtube');
    }
  }, [urlOrQuery, title]);

  useEffect(() => {
    if (isOpen) {
      setPadVolume(soundEngine.padVolume);
      setVideoVolume(soundEngine.videoVolume);
      setLinkedMode(soundEngine.linkedMode);
      setIsPlayingPad(soundEngine.isPlayingPad);
      setPopupBlocked(false);

      // Listen to projection manager
      const unsub = projectionManager.subscribe((state) => {
        setTargetScreen(state.target);
        setIsAuxWindowOpen(state.isAuxiliaryConnected);
      });
      return () => unsub();
    }
  }, [isOpen]);

  // Real Playback Resolution & Alternatives
  const [resolvedMedia, setResolvedMedia] = useState<PlayableMediaResolution | null>(null);
  const [isSearchingVideo, setIsSearchingVideo] = useState(false);
  const [searchAlternatives, setSearchAlternatives] = useState<Array<{ videoId: string; title: string; channel: string; thumbnail?: string }>>([]);

  // Playback diagnostics, reason of failure and direct 1-click solutions
  const [playbackDiagnostic, setPlaybackDiagnostic] = useState<{
    status: 'ok' | 'blocked' | 'offline_missing' | 'format_error' | 'muted_by_browser' | 'no_internet';
    title: string;
    message: string;
    solution: string;
    actionType?: 'open_yt' | 'switch_alt' | 'unmute' | 'pick_file' | 'retry';
  } | null>(null);
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Compute active playable resolution (uses fast static cache or dynamic resolved search)
  const currentResolution = resolvedMedia || resolveYoutubePlayable(activeUrlOrQuery, title);

  const isPlayingOffline = !!offlineVideoUrl && playbackSource === 'local';

  // Build projected media payload
  const currentMediaPayload: ProjectedMedia = {
    id: activeUrlOrQuery,
    title,
    urlOrQuery: activeUrlOrQuery,
    youtubeId: currentResolution.youtubeId,
    embedUrl: currentResolution.embedUrl,
    videoUrl: isPlayingOffline ? (offlineVideoUrl || undefined) : undefined,
    isOffline: isPlayingOffline,
    videoDate,
    synopsis,
    timestamp: Date.now(),
  };

  // Auto-search and embed availability check
  useEffect(() => {
    setResolvedMedia(null);
    setPlaybackDiagnostic(null);
    const immediate = resolveYoutubePlayable(activeUrlOrQuery, title);

    // 1. Check if user is offline
    if (typeof navigator !== 'undefined' && !navigator.onLine && !offlineVideoUrl) {
      setPlaybackDiagnostic({
        status: 'no_internet',
        title: 'Sem Conexão com a Internet',
        message: 'O computador da igreja está sem conexão ativa com a internet para carregar este vídeo do YouTube.',
        solution: 'Conecte o computador ao Wi-Fi/cabo de rede ou clique em "Carregar Vídeo do Computador" para usar um arquivo salvo.',
        actionType: 'pick_file',
      });
      return;
    }

    // 2. If direct YouTube video exists, check if embedding is allowed or blocked by creator
    if (immediate.isDirectVideo && immediate.youtubeId) {
      fetch(`/api/check-video-embed?id=${immediate.youtubeId}&title=${encodeURIComponent(title)}`)
        .then(res => res.json())
        .then(diag => {
          if (diag && diag.embedAllowed === false) {
            setPlaybackDiagnostic({
              status: 'blocked',
              title: 'Embed Desativado pelo Canal (Restrição de Direitos)',
              message: diag.reason || 'O autor do canal bloqueou a reprodução deste vídeo fora do site do YouTube (Erro 150).',
              solution: diag.solution || 'Abra direto no YouTube ou troque para uma versão alternativa liberada.',
              actionType: 'switch_alt',
            });
            if (diag.alternatives && diag.alternatives.length > 0) {
              setSearchAlternatives(diag.alternatives);
            }
          }
        })
        .catch(() => {});
      return;
    }

    // 3. If query has no direct ID, automatically find the top working YouTube video
    if (!offlineVideoUrl && isOpen) {
      setIsSearchingVideo(true);
      searchAndResolveYoutubeVideo(activeUrlOrQuery || title)
        .then(res => {
          if (res && res.youtubeId) {
            setResolvedMedia(res);
            if (res.alternatives) {
              setSearchAlternatives(res.alternatives);
            }
            // Update projection to Telão with the real resolved video immediately
            if (targetScreen === 'auxiliary' || isAuxWindowOpen) {
              projectionManager.updateProjectedMedia({
                id: activeUrlOrQuery,
                title,
                urlOrQuery: activeUrlOrQuery,
                youtubeId: res.youtubeId,
                embedUrl: res.embedUrl,
                timestamp: Date.now(),
              });
            }
          }
        })
        .finally(() => setIsSearchingVideo(false));
    }
  }, [activeUrlOrQuery, title, isOpen, offlineVideoUrl, targetScreen, isAuxWindowOpen]);

  // Listen to YouTube player error events via postMessage
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (d && (d.event === 'onError' || d.info === 150 || d.info === 101 || d.info === 100 || d.info === 2)) {
          const errCode = d.info || d.errorCode;
          if (errCode === 150 || errCode === 101) {
            setPlaybackDiagnostic({
              status: 'blocked',
              title: 'Incorporação Bloqueada pelo Canal no YouTube (Erro 150)',
              message: 'O canal proprietário deste vídeo marcou a opção "Bloquear reprodução em sites externos" no YouTube Studio.',
              solution: 'Abra no YouTube oficial ou clique abaixo para selecionar uma versão alternativa autorizada.',
              actionType: 'open_yt',
            });
            setShowTroubleshooter(true);
          } else if (errCode === 100) {
            setPlaybackDiagnostic({
              status: 'blocked',
              title: 'Vídeo Indisponível ou Privado',
              message: 'O link ou ID deste vídeo foi removido do YouTube ou configurado como privado.',
              solution: 'Busque uma versão alternativa da música para reproduzir.',
              actionType: 'switch_alt',
            });
            setShowTroubleshooter(true);
          }
        }
      } catch (err) {}
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Monitor network online/offline transitions
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      if (!offlineVideoUrl) {
        setPlaybackDiagnostic({
          status: 'no_internet',
          title: 'Conexão de Internet Perdida',
          message: 'O computador perdeu a conexão com a internet durante a reprodução.',
          solution: 'Verifique a rede da igreja ou use um arquivo offline baixado no computador.',
          actionType: 'pick_file',
        });
      }
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineVideoUrl]);

  // Handle HTML5 video playback errors & browser autoplay restrictions
  const handleHtml5VideoError = async (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const videoEl = e.currentTarget;
    const err = videoEl.error;
    console.warn('HTML5 Video Error encountered:', err);

    let desc = 'Incompatibilidade de formato ou arquivo de vídeo local corrompido.';
    if (err) {
      if (err.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
        desc = 'Formato de vídeo incompatível com o navegador. Recomendamos arquivos MP4 (H.264 / AAC) ou WebM.';
      } else if (err.code === MediaError.MEDIA_ERR_DECODE) {
        desc = 'Arquivo de vídeo corrompido ou incompleto.';
      } else if (err.code === MediaError.MEDIA_ERR_NETWORK) {
        desc = 'Falha ao ler o arquivo de vídeo do armazenamento local.';
      }
    }

    // 1. Purge corrupted cache from IndexedDB so the error does not repeat
    if (targetOfflineId) {
      try {
        await deleteOfflineVideo(targetOfflineId);
      } catch (delErr) {}
    }

    // 2. Clean up object URL
    if (offlineVideoUrl) {
      try {
        URL.revokeObjectURL(offlineVideoUrl);
      } catch (revErr) {}
      setOfflineVideoUrl(null);
    }
    setOfflineMeta(null);

    // 3. Immediately switch playback to YouTube Official so worship continues smoothly
    setPlaybackSource('youtube');

    // 4. Update auxiliary screen projection to YouTube embed
    if (targetScreen === 'auxiliary') {
      projectionManager.updateProjectedMedia({
        ...currentMediaPayload,
        videoUrl: undefined,
        isOffline: false,
      });
    }

    // 5. Notify operator clearly that it seamlessly switched to YouTube
    setPlaybackDiagnostic({
      status: 'format_error',
      title: 'Arquivo Local Incompatível — Alternado para YouTube Oficial',
      message: `${desc} O sistema alternou automaticamente para a reprodução oficial do YouTube para não interromper a programação.`,
      solution: 'A reprodução está ativa via YouTube. Para reprodução offline, utilize um arquivo .mp4 padrão (H.264 / AAC).',
      actionType: 'open_yt',
    });
    setShowTroubleshooter(true);
  };

  // Local Player Fullscreen controls
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false);
  const playerWrapperRef = useRef<HTMLDivElement>(null);

  const togglePlayerFullscreen = async () => {
    const el = playerWrapperRef.current;
    if (!el) return;
    const doc = document as any;
    const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
    
    if (!isFs) {
      const requestMethod = el.requestFullscreen || (el as any).webkitRequestFullscreen || (el as any).mozRequestFullScreen || (el as any).msRequestFullscreen;
      if (requestMethod) {
        try {
          const res = requestMethod.call(el);
          if (res && typeof res.then === 'function') {
            await res;
          }
          setIsPlayerFullscreen(true);
        } catch (e) {}
      }
    } else {
      const exitMethod = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
      if (exitMethod) {
        try {
          const res = exitMethod.call(doc);
          if (res && typeof res.then === 'function') {
            await res;
          }
          setIsPlayerFullscreen(false);
        } catch (e) {}
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      const doc = document as any;
      setIsPlayerFullscreen(!!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Keyboard shortcut F for Fullscreen and Space for Play/Pause in modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        togglePlayerFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Switch transmission to Main Screen (Tela 1)
  const handleTransmitToMainScreen = () => {
    setTargetScreen('main');
    try {
      localStorage.setItem('iasd_preferred_video_target', 'main');
    } catch (e) {}
    projectionManager.transmitToMainScreen(currentMediaPayload);
    if (videoElementRef.current) {
      videoElementRef.current.play().catch(() => {});
    }
  };

  // Switch transmission to Auxiliary Screen (Tela 2 - Telão da Igreja)
  const handleTransmitToAuxiliaryScreen = async () => {
    setTargetScreen('auxiliary');
    try {
      localStorage.setItem('iasd_preferred_video_target', 'auxiliary');
    } catch (e) {}
    const success = await projectionManager.transmitToAuxiliaryScreen(currentMediaPayload, true);
    const connected = projectionManager.getState().connectedScreensCount;
    setScreensOpenedCount(connected || (success ? 1 : 0));
    setPopupBlocked(!success && connected === 0);
  };

  // Auto trigger initial target screen on modal open
  useEffect(() => {
    if (isOpen) {
      if (initialTargetScreen === 'auxiliary') {
        setTargetScreen('auxiliary');
        // Ensure state is synced without reopening popup asynchronously
        projectionManager.updateProjectedMedia(currentMediaPayload);
      } else {
        handleTransmitToMainScreen();
      }
    }
  }, [isOpen, initialTargetScreen]);

  // When offlineVideoUrl loads, keep auxiliary screen payload updated if currently broadcasting to auxiliary
  useEffect(() => {
    if (isOpen && targetScreen === 'auxiliary' && offlineVideoUrl) {
      projectionManager.transmitToAuxiliaryScreen(currentMediaPayload, true);
    }
  }, [offlineVideoUrl, targetScreen, isOpen]);

  // Re-attempt opening auxiliary screen
  const handleOpenAuxWindowManually = async () => {
    const result = await projectionManager.openOnAllAuxiliaryScreens(true);
    setScreensOpenedCount(result.openedCount);
    if (result.openedCount > 0) {
      setPopupBlocked(false);
      await projectionManager.transmitToAuxiliaryScreen(currentMediaPayload, true);
    }
  };

  // Automatic find and download of Provai e Vede & Informativo Mundial das Missões
  const handleAutoFindAndDownload = async () => {
    setIsAutoDownloading(true);
    setAutoDownloadStatus('Buscando automaticamente os vídeos oficiais...');
    try {
      const result = await autoFindAndDownloadAllWeeklyVideos((statusText) => {
        setAutoDownloadStatus(statusText);
      });

      if (result.success) {
        setAutoDownloadStatus('✓ Vídeos encontrados e salvos localmente no computador!');
        // If current modal is for one of these videos, reload it from offline store immediately
        if (targetOfflineId) {
          const item = await getVideoFromIndexedDB(targetOfflineId);
          if (item && item.blob) {
            if (offlineVideoUrl) URL.revokeObjectURL(offlineVideoUrl);
            const url = URL.createObjectURL(item.blob);
            setOfflineVideoUrl(url);
            setOfflineMeta(item);
          }
        }
      }
    } catch (err: any) {
      setAutoDownloadStatus('Erro ao buscar vídeos: ' + (err.message || 'Falha de conexão'));
    } finally {
      setIsAutoDownloading(false);
    }
  };

  // Download video file directly to computer hard drive / pen drive (.mp4 / .webm)
  const handleDownloadVideoToDisk = async () => {
    const type = isWeeklyInformativo ? 'informativo' : 'provai';
    const success = await downloadVideoBlobToUserDisk(type);
    if (success) {
      setAutoDownloadStatus('✓ Download do arquivo iniciado para o computador!');
    }
  };

  // Adjust video element volume if playing local video
  useEffect(() => {
    if (videoElementRef.current) {
      videoElementRef.current.volume = Math.min(1, Math.max(0, videoVolume / 100));
    }
  }, [videoVolume, offlineVideoUrl]);

  const handlePadVolumeChange = (val: number) => {
    setPadVolume(val);
    soundEngine.setPadVolume(val, linkedMode);
    if (linkedMode) {
      setVideoVolume(100 - val);
      if (videoElementRef.current) {
        videoElementRef.current.volume = Math.min(1, Math.max(0, (100 - val) / 100));
      }
    }
  };

  const handleVideoVolumeChange = (val: number) => {
    setVideoVolume(val);
    soundEngine.setVideoVolume(val, linkedMode);
    if (videoElementRef.current) {
      videoElementRef.current.volume = Math.min(1, Math.max(0, val / 100));
    }
    if (linkedMode) {
      setPadVolume(100 - val);
    }
  };

  const handleToggleLinked = () => {
    const next = !linkedMode;
    setLinkedMode(next);
    soundEngine.setLinkedMode(next);
  };

  const handleTogglePad = () => {
    if (isPlayingPad) {
      soundEngine.stopPad(1.0);
      setIsPlayingPad(false);
    } else {
      soundEngine.playPad('D', 'warm_pad');
      setIsPlayingPad(true);
    }
  };

  const isWeeklyInformativo = 
    activeUrlOrQuery === 'offline:informativo' || 
    activeUrlOrQuery.startsWith('offline:informativo') || 
    title.toLowerCase().includes('informativo mundial') ||
    title.toLowerCase().includes('informativo das missões');

  const isWeeklyProvai = 
    activeUrlOrQuery === 'offline:provai' || 
    activeUrlOrQuery.startsWith('offline:provai') || 
    title.toLowerCase().includes('provai e vede');

  const targetOfflineId = isWeeklyInformativo 
    ? 'video_informativo' 
    : isWeeklyProvai 
    ? 'video_provai' 
    : null;

  // Check and load offline video from IndexedDB whenever modal opens
  useEffect(() => {
    let active = true;

    if (!isOpen) {
      if (offlineVideoUrl) {
        URL.revokeObjectURL(offlineVideoUrl);
        setOfflineVideoUrl(null);
      }
      setOfflineMeta(null);
      return;
    }

    async function loadOfflineMedia() {
      if (!targetOfflineId) return;

      setIsLoadingOffline(true);
      try {
        let item = await getVideoFromIndexedDB(targetOfflineId);

        // Only attempt local generation if the church is offline or explicitly requested offline playback
        const requiresOfflineOnly = activeUrlOrQuery.startsWith('offline:') || (typeof navigator !== 'undefined' && !navigator.onLine);
        if ((!item || !item.isOfflineReady) && requiresOfflineOnly) {
          setIsGenerating(true);
          const type = isWeeklyInformativo ? 'informativo' : 'provai';
          try {
            item = await autoCacheWeeklyVideo(type, {
              title,
              dateText: videoDate || new Date().toLocaleDateString('pt-BR'),
              synopsis,
              downloadUrl,
            });
          } catch (e) {
            console.warn('Falha no auto-cache offline:', e);
          } finally {
            setIsGenerating(false);
          }
        }

        if (active && item && item.blob && item.sizeBytes > 8000) {
          const url = URL.createObjectURL(item.blob);
          setOfflineVideoUrl(url);
          setOfflineMeta(item);
          if (requiresOfflineOnly) {
            setPlaybackSource('local');
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar vídeo offline:', err);
      } finally {
        if (active) setIsLoadingOffline(false);
      }
    }

    loadOfflineMedia();

    return () => {
      active = false;
    };
  }, [isOpen, targetOfflineId, title, videoDate, synopsis, downloadUrl, activeUrlOrQuery]);

  // Handle local video file import (e.g. from USB flash drive)
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetOfflineId) return;

    try {
      setIsLoadingOffline(true);
      const type = isWeeklyInformativo ? 'informativo' : 'provai';
      const stored = await importLocalVideoFile(type, file, {
        title,
        dateText: videoDate || new Date().toLocaleDateString('pt-BR'),
        synopsis,
      });

      if (offlineVideoUrl) {
        URL.revokeObjectURL(offlineVideoUrl);
      }
      const newUrl = URL.createObjectURL(stored.blob);
      setOfflineVideoUrl(newUrl);
      setOfflineMeta(stored);
      setPlaybackSource('local');
      setPlaybackDiagnostic(null);
    } catch (err: any) {
      alert(err?.message || 'Erro ao importar arquivo de vídeo local. Recomendamos o formato MP4 (H.264 / AAC).');
    } finally {
      setIsLoadingOffline(false);
    }
  };

  if (!isOpen) return null;

  const searchUrl = currentResolution.searchUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 text-slate-100 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-800 flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl text-white flex items-center justify-center shadow-md shrink-0 ${
              offlineVideoUrl ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-red-600 shadow-red-600/20'
            }`}>
              {offlineVideoUrl ? (
                <HardDrive className="w-5 h-5 ml-0.5" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  {title || 'Reprodução de Vídeo'}
                </h3>
                {videoDate && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-400" />
                    {videoDate}
                  </span>
                )}
                {offlineVideoUrl && (
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl p-0.5 ml-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPlaybackSource('youtube');
                        setPlaybackDiagnostic(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        playbackSource === 'youtube'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Reproduzir canal oficial do YouTube"
                    >
                      ▶ YouTube
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPlaybackSource('local');
                        setPlaybackDiagnostic(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        playbackSource === 'local'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Reproduzir arquivo local salvo sem internet"
                    >
                      💾 Local (Offline)
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {isPlayingOffline 
                  ? 'Vídeo armazenado na memória local do computador • Pronto para execução'
                  : 'Reprodução oficial do YouTube • Pronto para execução no culto'}
              </p>
            </div>
          </div>
          <button
            id="close-video-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TRANSMISSION TARGET SELECTOR: THE 2 USER-REQUESTED BUTTONS */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2 text-white">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-200">
              Destino da Transmissão do Vídeo:
            </span>
          </div>

          {/* THE 2 BUTTONS */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* BOTÃO 1: Reproduzir na Tela 1 (Principal) */}
            <button
              id="transmit-to-main-screen-btn"
              type="button"
              onClick={handleTransmitToMainScreen}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                targetScreen === 'main'
                  ? 'bg-blue-600 hover:bg-blue-500 text-white ring-2 ring-blue-400/50 shadow-blue-600/30'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Reproduzir na Tela 1 (Principal)</span>
              {targetScreen === 'main' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </button>

            {/* BOTÃO 2: Reproduzir na Tela 2 (Auxiliar / Telão) */}
            <button
              id="transmit-to-auxiliary-screen-btn"
              type="button"
              onClick={handleTransmitToAuxiliaryScreen}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                targetScreen === 'auxiliary'
                  ? 'bg-purple-600 hover:bg-purple-500 text-white ring-2 ring-purple-400/50 shadow-purple-600/30'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <Tv className="w-4 h-4 text-purple-300" />
              <span>Reproduzir na Tela 2 (Telão)</span>
              {targetScreen === 'auxiliary' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* POPUP BLOCKED WARNING BANNER */}
        {popupBlocked && (
          <div className="mx-6 mt-4 p-3.5 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-amber-900 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Tv className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                O navegador precisa da sua autorização para exibir o Telão Auxiliar em janela separada:
              </span>
            </div>
            <button
              onClick={handleOpenAuxWindowManually}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-sm transition-all"
            >
              Autorizar e Abrir Telão
            </button>
          </div>
        )}

        {/* AUTOMATIC FIND & DOWNLOAD BANNER (PROVAI E VEDE & INFORMATIVO MUNDIAL DAS MISSÕES) */}
        <div className="mx-4 sm:mx-6 mt-3 p-3.5 bg-slate-950/90 border border-slate-800 rounded-2xl flex flex-col gap-3 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200">
                    Vídeos Oficiais da Semana (DSA)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Provai e Vede + Informativo
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {autoDownloadStatus || 'Encontre e baixe automaticamente os vídeos oficiais para reprodução 100% offline'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                id="auto-find-and-download-btn"
                type="button"
                onClick={handleAutoFindAndDownload}
                disabled={isAutoDownloading}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                title="Localiza os vídeos oficiais da semana e baixa para a memória do computador"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAutoDownloading ? 'animate-spin' : ''}`} />
                <span>{isAutoDownloading ? 'Baixando...' : 'Encontrar e Baixar Automaticamente'}</span>
              </button>

              {offlineVideoUrl && (
                <button
                  type="button"
                  onClick={handleDownloadVideoToDisk}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="Salvar arquivo no disco ou pen drive"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Salvar no PC</span>
                </button>
              )}
            </div>
          </div>

          {/* UPON DOWNLOAD: IMMEDIATE BUTTONS TO PLAY ON SCREEN 1 OR SCREEN 2 */}
          {offlineVideoUrl && (
            <div className="pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Vídeo baixado no computador! Escolha a tela para reproduzir:</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <button
                  id="banner-play-screen-1-btn"
                  type="button"
                  onClick={handleTransmitToMainScreen}
                  className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                    targetScreen === 'main'
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-blue-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Reproduzir na Tela 1</span>
                </button>

                <button
                  id="banner-play-screen-2-btn"
                  type="button"
                  onClick={handleTransmitToAuxiliaryScreen}
                  className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                    targetScreen === 'auxiliary'
                      ? 'bg-purple-600 text-white ring-2 ring-purple-400 shadow-purple-600/30'
                      : 'bg-purple-950/90 hover:bg-purple-900 text-purple-200 border border-purple-500/40'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5 text-purple-300" />
                  <span>Reproduzir na Tela 2 (Telão)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* TARGET: AUXILIARY SCREEN IS ACTIVE (CONFIDENCE MONITOR ON MAIN SCREEN) */}
          {targetScreen === 'auxiliary' ? (
            <div className="bg-slate-950 border border-purple-500/40 rounded-3xl p-5 sm:p-6 text-white space-y-4 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping shrink-0" />
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-purple-400">
                      Transmissão Ativa
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-white">
                      Transmitindo ao Vivo no Telão Auxiliar (Projetor da Igreja)
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenAuxWindowManually}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 border border-purple-600/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Focar / Reabrir Telão</span>
                  </button>
                  <button
                    onClick={handleTransmitToMainScreen}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Trazer para Tela Principal</span>
                  </button>
                </div>
              </div>

              {/* Confidence Monitor (Preview for operator) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2 relative aspect-video rounded-2xl overflow-hidden bg-black ring-1 ring-white/10 shadow-lg">
                  {isPlayingOffline ? (
                    <video
                      ref={videoElementRef}
                      src={offlineVideoUrl!}
                      controls
                      autoPlay
                      playsInline
                      onError={handleHtml5VideoError}
                      onPlay={() => setPlaybackDiagnostic(null)}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <iframe
                      key={currentResolution.embedUrl}
                      src={
                        currentResolution.embedUrl.includes('mute=')
                          ? currentResolution.embedUrl
                          : `${currentResolution.embedUrl}&mute=1`
                      }
                      title={title}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                    />
                  )}
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-black text-purple-300 border border-purple-500/30 pointer-events-none flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>Retorno do Operador (Telão)</span>
                  </div>
                </div>

                <div className="space-y-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-xs">
                  <span className="font-bold text-slate-300 uppercase tracking-wider block">
                    Painel do Operador
                  </span>
                  <p className="text-slate-400">
                    O vídeo está projetando no telão limpo para a igreja. Você pode controlar o volume do áudio do templo abaixo ou avançar de etapa.
                  </p>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-black">Vídeo transmitido:</span>
                    <p className="font-bold text-white text-xs line-clamp-2">{title}</p>
                  </div>
                  <button
                    onClick={() => projectionManager.togglePlayPause()}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pausar / Retomar no Telão</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* TARGET: MAIN SCREEN IS ACTIVE (PLAYING DIRECTLY IN MODAL) */
            <>
              {isPlayingOffline ? (
                <div 
                  ref={playerWrapperRef}
                  onDoubleClick={togglePlayerFullscreen}
                  className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-slate-900/10 group"
                >
                  <video
                    ref={videoElementRef}
                    src={offlineVideoUrl!}
                    controls
                    autoPlay
                    playsInline
                    onError={handleHtml5VideoError}
                    onPlay={() => setPlaybackDiagnostic(null)}
                    onEnded={() => {
                      if (onAdvanceToNext) {
                        onAdvanceToNext();
                      }
                    }}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-white text-[11px] font-black px-3 py-1.5 rounded-xl flex items-center gap-2 border border-emerald-500/40 shadow-lg pointer-events-none">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-300 tracking-wide uppercase">Reprodução Offline na Tela Principal</span>
                  </div>

                  {/* Dedicated Fullscreen Button */}
                  <button
                    type="button"
                    onClick={togglePlayerFullscreen}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-white backdrop-blur-md border border-white/20 shadow-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer hover:scale-105"
                    title="Tela Cheia no Monitor (Tecla F ou Clique Duplo)"
                  >
                    {isPlayerFullscreen ? <Minimize2 className="w-4 h-4 text-emerald-400" /> : <Maximize2 className="w-4 h-4 text-emerald-400" />}
                    <span>{isPlayerFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia (F)'}</span>
                  </button>
                </div>
              ) : (isLoadingOffline || isGenerating) && (activeUrlOrQuery.startsWith('offline:') || (typeof navigator !== 'undefined' && !navigator.onLine)) ? (
                <div className="aspect-video w-full rounded-2xl bg-slate-950 flex flex-col items-center justify-center p-6 text-white space-y-3">
                  <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
                  <div className="text-center">
                    <p className="text-base font-bold">Preparando e Baixando Vídeo Offline...</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Gravando o arquivo oficial diretamente na memória local para funcionamento sem internet.
                    </p>
                  </div>
                </div>
              ) : (
                /* LIVE YOUTUBE / SEARCH PLAYER - ALWAYS PLAYS IMMEDIATELY */
                <div 
                  ref={playerWrapperRef}
                  className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-xl ring-1 ring-slate-900/10 group"
                >
                  <iframe
                    key={currentResolution.embedUrl}
                    src={currentResolution.embedUrl}
                    title={title}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-white text-[11px] font-black px-3 py-1.5 rounded-xl flex items-center gap-2 border border-blue-500/40 shadow-lg pointer-events-none">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-blue-300 tracking-wide uppercase">Tela Principal • Som Ativo</span>
                  </div>

                  {/* Dedicated Fullscreen Button for iframe */}
                  <button
                    type="button"
                    onClick={togglePlayerFullscreen}
                    className="absolute top-3 right-3 z-20 p-2 rounded-xl bg-slate-950/85 hover:bg-slate-900 text-white backdrop-blur-md border border-white/20 shadow-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer hover:scale-105"
                    title="Tela Cheia no Monitor (Tecla F)"
                  >
                    {isPlayerFullscreen ? <Minimize2 className="w-4 h-4 text-blue-400" /> : <Maximize2 className="w-4 h-4 text-blue-400" />}
                    <span>{isPlayerFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia (F)'}</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* DIAGNOSTIC BANNER & EXPLANATION OF WHY VIDEO MIGHT NOT OPEN */}
          {playbackDiagnostic && (
            <div className={`p-4 rounded-2xl border transition-all ${
              playbackDiagnostic.status === 'no_internet' 
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-100'
                : playbackDiagnostic.status === 'muted_by_browser'
                ? 'bg-blue-950/40 border-blue-500/50 text-blue-100'
                : 'bg-red-950/50 border-red-500/60 text-red-100'
            }`}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-black/40 shrink-0 mt-0.5">
                  {playbackDiagnostic.status === 'no_internet' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  ) : playbackDiagnostic.status === 'muted_by_browser' ? (
                    <VolumeX className="w-5 h-5 text-blue-400" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <span>{playbackDiagnostic.title}</span>
                    </h4>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10 text-slate-300">
                      Diagnóstico do Sistema
                    </span>
                  </div>
                  
                  <div className="text-xs space-y-1">
                    <p className="text-slate-200">
                      <strong className="text-white">Motivo identificado:</strong> {playbackDiagnostic.message}
                    </p>
                    <p className="text-slate-300">
                      <strong className="text-emerald-300">Como solucionar:</strong> {playbackDiagnostic.solution}
                    </p>
                  </div>

                  {/* Immediate 1-click Action buttons */}
                  <div className="flex items-center gap-2 pt-2 flex-wrap">
                    <a
                      href={searchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir no YouTube Oficial (1 Clique)</span>
                    </a>

                    {searchAlternatives.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const firstAlt = searchAlternatives[0];
                          if (firstAlt) {
                            setActiveUrlOrQuery(firstAlt.videoId);
                            setPlaybackDiagnostic(null);
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Usar Versão Alternativa Liberada</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-400" />
                      <span>Carregar MP4 do Computador</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ALTERNATIVE VERSIONS CAROUSEL IF FOUND */}
          {searchAlternatives.length > 0 && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Versões alternativas encontradas no YouTube (clique para reproduzir):</span>
                </span>
                <span className="text-[10px] text-slate-500">Prontas para culto</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {searchAlternatives.slice(0, 3).map((alt) => (
                  <button
                    key={alt.videoId}
                    type="button"
                    onClick={() => {
                      setActiveUrlOrQuery(alt.videoId);
                      setPlaybackDiagnostic(null);
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 text-left transition-all group cursor-pointer"
                  >
                    {alt.thumbnail && (
                      <img 
                        src={alt.thumbnail} 
                        alt={alt.title}
                        className="w-14 h-9 object-cover rounded-lg shrink-0" 
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-200 group-hover:text-blue-300 truncate">
                        {alt.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {alt.channel}
                      </p>
                    </div>
                    <Play className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* HELP & TROUBLESHOOTER TOGGLE */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => setShowTroubleshooter(!showTroubleshooter)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>O vídeo não abriu? Guia rápido de motivos e soluções</span>
            </button>

            {isSearchingVideo && (
              <span className="text-xs text-blue-400 flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Localizando melhor vídeo do YouTube...</span>
              </span>
            )}
          </div>

          {showTroubleshooter && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-3 animate-in fade-in">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                <span>Motivos comuns para um vídeo não abrir e como resolver:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-400">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <strong className="text-amber-300 block">1. Embed Desativado (Erro 150)</strong>
                  <p className="text-[11px] leading-relaxed">
                    Alguns canais marcam a opção de não permitir que o vídeo seja exibido fora do YouTube. Solução: Clique em "Abrir no YouTube Oficial" ou use uma versão alternativa liberada.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <strong className="text-blue-300 block">2. Áudio Bloqueado pelo Navegador</strong>
                  <p className="text-[11px] leading-relaxed">
                    O Chrome/Edge bloqueia o áudio automático se você ainda não interagiu com a janela. Solução: Basta dar um clique no player de vídeo para liberar o áudio do templo.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <strong className="text-emerald-300 block">3. Falta de Internet no Templo</strong>
                  <p className="text-[11px] leading-relaxed">
                    Se a internet da igreja falhar, vídeos online não carregam. Solução: Baixe os vídeos oficiais antes pelo botão "Baixar Offline" ou use um arquivo MP4 do pen drive.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick URL/Link Swapper for the Operator */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-1">
              <Youtube className="w-4 h-4 text-red-500 shrink-0" />
              <input
                type="text"
                value={customLinkInput}
                onChange={(e) => setCustomLinkInput(e.target.value)}
                placeholder="Colar link ou ID do YouTube (ex: https://youtu.be/...)"
                className="w-full text-xs bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (customLinkInput.trim()) {
                    setActiveUrlOrQuery(customLinkInput.trim());
                    setCustomLinkInput('');
                  }
                }}
                disabled={!customLinkInput.trim()}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer"
              >
                Trocar Vídeo
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0 justify-end">
              <a
                href={searchUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
                title="Abrir diretamente no site do YouTube"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                <span>Abrir no YouTube</span>
              </a>
            </div>
          </div>

          {/* AUXILIARY MIXER BAR (Fundo Musical vs Vídeo com Controle Vinculado) */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl border border-slate-800 shadow-md space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                      Mixer Auxiliar • Som no Dispositivo
                    </span>
                    <button
                      onClick={handleToggleLinked}
                      className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all cursor-pointer flex items-center gap-1 ${
                        linkedMode 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' 
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                      title="Ao diminuir um, o outro aumenta automaticamente"
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                      {linkedMode ? 'Vinculado (Inverso Ativo)' : 'Canais Livres'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {linkedMode 
                      ? 'Ao baixar o volume do vídeo para oração, o fundo musical sobe suavemente!'
                      : 'Controle de volume separado para o vídeo e o fundo musical.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onOpenMusicalBackgrounds && (
                  <button
                    onClick={onOpenMusicalBackgrounds}
                    className="px-3 py-1.5 rounded-xl bg-purple-900/50 hover:bg-purple-800/60 text-purple-200 border border-purple-600/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Music className="w-3.5 h-3.5 text-purple-400" />
                    Fundos Musicais
                  </button>
                )}
                {onOpenMixer && (
                  <button
                    onClick={onOpenMixer}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    Mesa Completa
                  </button>
                )}
              </div>
            </div>

            {/* Mixer Sliders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Aux 1: Fundo Musical / Pad */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-purple-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-300 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-purple-400" />
                    Aux 1: Fundo Musical (Dispositivo)
                  </span>
                  <span className="font-mono font-bold text-purple-300">{padVolume}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={padVolume}
                    onChange={e => handlePadVolumeChange(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <button
                    onClick={handleTogglePad}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                      isPlayingPad 
                        ? 'bg-red-500/30 text-red-300 border border-red-500/40' 
                        : 'bg-purple-600 text-white shadow-xs'
                    }`}
                  >
                    {isPlayingPad ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                    {isPlayingPad ? 'Parar' : 'Tocar Pad'}
                  </button>
                </div>
              </div>

              {/* Aux 2: Vídeo */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-blue-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-300 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                    Aux 2: Volume do Vídeo
                  </span>
                  <span className="font-mono font-bold text-blue-300">{videoVolume}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={videoVolume}
                    onChange={e => handleVideoVolumeChange(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <button
                    onClick={() => soundEngine.playChime('solemn')}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 bg-amber-500/20 text-amber-300 border border-amber-400/30 hover:bg-amber-500/30 transition-all cursor-pointer flex items-center gap-1"
                    title="Tocar Sino do Início do Culto"
                  >
                    <Bell className="w-3 h-3" />
                    Sino
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Video Status & Storage Bar */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Status do Vídeo na Liturgia:
                </span>
                {offlineVideoUrl ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 rounded-md">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    Salvo no Computador ({offlineMeta ? (offlineMeta.sizeBytes / (1024 * 1024)).toFixed(1) + ' MB' : 'Offline'})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-300 bg-blue-500/20 border border-blue-500/40 px-2 py-0.5 rounded-md">
                    Pronto para Execução • YouTube / Online
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-white">
                {title}
              </p>
              {videoDate && (
                <p className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Exibição: {videoDate}
                </p>
              )}
              {synopsis && (
                <p className="text-xs text-slate-400 italic mt-1">
                  "{synopsis}"
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
              {offlineVideoUrl && (
                <>
                  <button
                    onClick={handleTransmitToMainScreen}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                      targetScreen === 'main'
                        ? 'bg-blue-600 text-white ring-1 ring-blue-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                    title="Reproduzir no monitor do operador (Tela 1)"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Tela 1 (Operador)</span>
                  </button>

                  <button
                    onClick={handleTransmitToAuxiliaryScreen}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                      targetScreen === 'auxiliary'
                        ? 'bg-purple-600 text-white ring-1 ring-purple-400'
                        : 'bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-500/40'
                    }`}
                    title="Reproduzir direto no telão da igreja (Tela 2)"
                  >
                    <Tv className="w-3.5 h-3.5 text-purple-300" />
                    <span>Tela 2 (Telão)</span>
                  </button>
                </>
              )}

              {/* Import Custom File from Pen Drive */}
              {targetOfflineId && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportFile}
                    accept="video/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                    title="Substituir com arquivo .MP4 do Pen Drive para o culto"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-400" />
                    Importar MP4 do Pen Drive
                  </button>
                </>
              )}

              {/* Official Download Link */}
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 shadow-sm transition-all cursor-pointer"
                  title="Baixar arquivo de vídeo oficial da DSA"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  Link DSA Oficial
                </a>
              )}

              {/* Next Stage Command */}
              {onAdvanceToNext && (
                <button
                  onClick={() => {
                    onAdvanceToNext();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-102 cursor-pointer"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  Próxima Etapa do Culto
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {nextActivityName ? (
              <span>Próxima fase da ordem de culto: <strong className="text-slate-200">{nextActivityName}</strong></span>
            ) : (
              <span>Controle total de exibição: Tela Principal (Operador) ou Tela Auxiliar (Telão da Igreja)</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-slate-700"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};

