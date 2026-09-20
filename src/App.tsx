import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { ProgramScheduleView } from './components/ProgramScheduleView';
import { HymnalView } from './components/HymnalView';
import { PlaybackSearchView } from './components/PlaybackSearchView';
import { ActivityEditModal } from './components/ActivityEditModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { LiveSonoplastiaMode } from './components/LiveSonoplastiaMode';
import { AIAssistantModal } from './components/AIAssistantModal';
import { ShareExportModal } from './components/ShareExportModal';
import { WeeklyMediaModal } from './components/WeeklyMediaModal';
import { WeeklySearchConfigModal } from './components/WeeklySearchConfigModal';
import { TeamScaleView } from './components/TeamScaleView';
import { ChurchAdminView } from './components/ChurchAdminView';
import { ChurchSongsCatalogView } from './components/ChurchSongsCatalogView';
import { MusicalBackgroundsModal } from './components/MusicalBackgroundsModal';
import { AudioMixerModal } from './components/AudioMixerModal';
import { AuxiliaryDisplayView } from './components/AuxiliaryDisplayView';
import { ProjectionScreensConfigModal } from './components/ProjectionScreensConfigModal';
import { FinishWorshipModal } from './components/FinishWorshipModal';
import { ArchivedWorshipsModal } from './components/ArchivedWorshipsModal';
import { LoginScreen } from './components/LoginScreen';
import { INITIAL_PROGRAM } from './data/churchData';
import { WorshipProgram, ActivityItem, ActivitySection, Hymn, WeeklyMediaItem, WeeklySearchSlot, ChurchSong, SongLiturgyDestination, ActivityCategory, MediaLink, AuthUser } from './types';
import { getSavedOrGeneratedWeeklyMedia, saveWeeklyMedia } from './data/weeklyMediaData';
import { useAutoDownloadMedia } from './hooks/useAutoDownloadMedia';
import { soundEngine } from './utils/audioEngine';
import { projectionManager } from './utils/projectionManager';
import { resolveYoutubePlayable } from './utils/mediaUtils';
import { 
  getActiveChurch, 
  getActiveChurchId, 
  getScopedStorageKey, 
  subscribeActiveChurch, 
  ChurchProfile, 
  DEFAULT_CHURCH_ID 
} from './utils/churchWorkspace';
import { getArchivedWorships, formatWorshipDateShort } from './utils/worshipArchiveManager';
import { getStoredAuthSession, saveAuthSession } from './utils/churchAdminStorage';
import { HardDrive, CheckCircle2, RefreshCw, X, Music, BookOpen, Youtube, Church, Users } from 'lucide-react';

function loadProgramForChurch(churchId: string): WorshipProgram {
  try {
    const scopedKey = getScopedStorageKey('worship_program', churchId);
    const saved = localStorage.getItem(scopedKey);
    if (saved) {
      return JSON.parse(saved);
    }
    // Migration: if default church and legacy key exists, copy over
    if (churchId === DEFAULT_CHURCH_ID || churchId === 'iasd-vila-nova') {
      const legacy = localStorage.getItem('adventist_worship_program_v1');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        localStorage.setItem(scopedKey, legacy);
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Falha ao carregar programa do localStorage', e);
  }
  return INITIAL_PROGRAM;
}

export default function App() {
  // Check if this window was opened specifically as the Auxiliary Screen (Telão do Templo)
  const [isAuxiliaryWindow, setIsAuxiliaryWindow] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'auxiliar' || window.location.hash === '#auxiliar';
  });

  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      setIsAuxiliaryWindow(params.get('view') === 'auxiliar' || window.location.hash === '#auxiliar');
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // When loaded in auxiliary window mode, render ONLY the video projection view
  if (isAuxiliaryWindow) {
    return <AuxiliaryDisplayView />;
  }

  // Authentication state (Checks active session & rememberMe)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredAuthSession());
  const [activeChurch, setActiveChurch] = useState<ChurchProfile>(() => getActiveChurch());
  const [activeTab, setActiveTab] = useState<ActiveTab>('program');
  const [program, setProgram] = useState<WorshipProgram>(() => loadProgramForChurch(getActiveChurchId()));
  const [archivedCount, setArchivedCount] = useState<number>(() => getArchivedWorships(getActiveChurchId()).length);
  const [isFinishWorshipModalOpen, setIsFinishWorshipModalOpen] = useState(false);
  const [isArchivedWorshipsModalOpen, setIsArchivedWorshipsModalOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // If user is not authenticated, display the dedicated Login Screen
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setToastNotification(`Bem-vindo(a), ${user.name}!`);
        }}
      />
    );
  }

  // Subscribe to active church changes for instantaneous workspace switching
  useEffect(() => {
    const unsubscribe = subscribeActiveChurch((newChurch) => {
      setActiveChurch(newChurch);
      setProgram(loadProgramForChurch(newChurch.id));
      setArchivedCount(getArchivedWorships(newChurch.id).length);
      projectionManager.setChurchId(newChurch.id);
    });
    return unsubscribe;
  }, []);

  // Auto-dismiss toast notification
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => setToastNotification(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  // Official Weekly Media state (Informativo Mundial + Provai e Vede)
  const [weeklyMedia, setWeeklyMedia] = useState(() =>
    getSavedOrGeneratedWeeklyMedia(new Date(program.date || Date.now()))
  );
  const [isWeeklyMediaModalOpen, setIsWeeklyMediaModalOpen] = useState(false);
  const [isWeeklySearchModalOpen, setIsWeeklySearchModalOpen] = useState(false);

  // Automatic Background Video Download on App Startup (No command required)
  const {
    downloadState,
    notificationMessage,
    dismissNotification,
    triggerAutoDownload,
  } = useAutoDownloadMedia(weeklyMedia);

  // Ensure program items for Informativo and Provai are aligned with offline URLs
  useEffect(() => {
    setProgram(prev => {
      let changed = false;
      const updated = prev.activities.map(act => {
        if (
          (act.id === 'act-5' || act.name.toLowerCase().includes('informativo')) && 
          act.congregational1?.url !== 'offline:informativo'
        ) {
          changed = true;
          return {
            ...act,
            name: act.name || 'Informativo Mundial das Missões (Vídeo da Semana)',
            congregational1: {
              title: weeklyMedia.informativo.title,
              url: 'offline:informativo',
              videoDate: weeklyMedia.informativo.dateText,
              note: 'Vídeo da Semana • Baixado no Computador (100% Offline)',
              downloadUrl: weeklyMedia.informativo.downloadUrl,
              isWeeklyMedia: true,
            },
          };
        }
        if (
          (act.id === 'act-18' || act.name.toLowerCase().includes('provai')) && 
          act.congregational1?.url !== 'offline:provai'
        ) {
          changed = true;
          return {
            ...act,
            name: act.name || 'Dízimos e Ofertas (Vídeo Provai e Vede da Semana)',
            congregational1: {
              title: weeklyMedia.provaiEVede.title,
              url: 'offline:provai',
              videoDate: weeklyMedia.provaiEVede.dateText,
              note: 'Vídeo da Semana • Baixado no Computador (100% Offline)',
              downloadUrl: weeklyMedia.provaiEVede.downloadUrl,
              isWeeklyMedia: true,
            },
          };
        }
        return act;
      });
      return changed ? { ...prev, activities: updated } : prev;
    });
  }, [weeklyMedia]);

  // Fetch / Refresh weekly media from server API
  const handleRefreshWeeklyMedia = async () => {
    try {
      const dateParam = program.date || new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/weekly-media?date=${dateParam}`);
      if (res.ok) {
        const data = await res.json();
        if (data.informativo && data.provaiEVede) {
          setWeeklyMedia(data);
          saveWeeklyMedia(data);
          return;
        }
      }
    } catch (err) {
      console.warn('Usando gerador local de mídia semanal', err);
    }
    // Fallback: local calculation for the current/next Saturday
    const fresh = getSavedOrGeneratedWeeklyMedia(new Date(program.date || Date.now()));
    setWeeklyMedia(fresh);
    saveWeeklyMedia(fresh);
  };

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);
  const [defaultSection, setDefaultSection] = useState<ActivitySection>('escola_sabatina');
  const [insertAfterActivityId, setInsertAfterActivityId] = useState<string | null>(null);

  const [activeVideoModal, setActiveVideoModal] = useState<{
    isOpen: boolean;
    title: string;
    queryOrUrl: string;
    videoDate?: string;
    downloadUrl?: string;
    synopsis?: string;
    targetScreen?: 'main' | 'auxiliary';
  }>({
    isOpen: false,
    title: '',
    queryOrUrl: '',
    targetScreen: 'main',
  });

  const [isSonoplastiaOpen, setIsSonoplastiaOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMusicalBackgroundsOpen, setIsMusicalBackgroundsOpen] = useState(false);
  const [isAudioMixerOpen, setIsAudioMixerOpen] = useState(false);
  const [isProjectionScreensConfigOpen, setIsProjectionScreensConfigOpen] = useState(false);

  // Persistence to scoped localStorage (completely isolated per church)
  useEffect(() => {
    try {
      const scopedKey = getScopedStorageKey('worship_program', activeChurch.id);
      localStorage.setItem(scopedKey, JSON.stringify(program));
    } catch (e) {
      console.warn('Falha ao persistir no localStorage', e);
    }
  }, [program, activeChurch.id]);

  // Activity Actions
  const handleOpenAddModal = (section: ActivitySection = 'escola_sabatina', insertAfterId?: string) => {
    setEditingActivity(null);
    setDefaultSection(section);
    setInsertAfterActivityId(insertAfterId || null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (activity: ActivityItem) => {
    setEditingActivity(activity);
    setDefaultSection(activity.section);
    setInsertAfterActivityId(null);
    setIsAddEditModalOpen(true);
  };

  const handleSaveActivity = (savedActivity: ActivityItem, insertAfterId?: string) => {
    const targetAfterId = insertAfterId || insertAfterActivityId;
    setProgram(prev => {
      // Remove existing item to ensure clean repositioning if specified or if section changed
      const remaining = prev.activities.filter(a => a.id !== savedActivity.id);
      let newActivities: ActivityItem[];

      if (targetAfterId === '__START__' || targetAfterId === `__START_${savedActivity.section}__`) {
        // Place at the very beginning of the target section
        const firstSectionIdx = remaining.findIndex(a => a.section === savedActivity.section);
        if (firstSectionIdx >= 0) {
          newActivities = [...remaining];
          newActivities.splice(firstSectionIdx, 0, savedActivity);
        } else {
          newActivities = [savedActivity, ...remaining];
        }
      } else if (targetAfterId === '__END__' || targetAfterId === `__END_${savedActivity.section}__`) {
        // Place at the end of the target section
        const lastSectionIdx = remaining.reduce(
          (acc, a, idx) => a.section === savedActivity.section ? idx : acc,
          -1
        );
        if (lastSectionIdx >= 0) {
          newActivities = [...remaining];
          newActivities.splice(lastSectionIdx + 1, 0, savedActivity);
        } else {
          newActivities = [...remaining, savedActivity];
        }
      } else if (targetAfterId) {
        const targetIdx = remaining.findIndex(a => a.id === targetAfterId);
        if (targetIdx >= 0) {
          newActivities = [...remaining];
          newActivities.splice(targetIdx + 1, 0, savedActivity);
        } else {
          newActivities = [...remaining, savedActivity];
        }
      } else {
        // No explicit repositioning requested
        const origIdx = prev.activities.findIndex(a => a.id === savedActivity.id);
        const origActivity = prev.activities[origIdx];
        if (origIdx >= 0 && origActivity && origActivity.section === savedActivity.section) {
          // Replace in place
          newActivities = prev.activities.map(a => a.id === savedActivity.id ? savedActivity : a);
        } else {
          // Section changed or new activity: place at the end of matching section
          const lastSectionIdx = remaining.reduce(
            (acc, a, idx) => a.section === savedActivity.section ? idx : acc,
            -1
          );
          if (lastSectionIdx >= 0) {
            newActivities = [...remaining];
            newActivities.splice(lastSectionIdx + 1, 0, savedActivity);
          } else {
            newActivities = [...remaining, savedActivity];
          }
        }
      }

      return {
        ...prev,
        activities: newActivities,
        updatedAt: new Date().toISOString(),
      };
    });
    setInsertAfterActivityId(null);
    setIsAddEditModalOpen(false);
    setToastNotification(`✓ Etapa "${savedActivity.name}" salva com sucesso!`);
  };

  const handlePlayMedia = (
    title: string, 
    queryOrUrl: string, 
    videoDate?: string, 
    downloadUrl?: string, 
    synopsis?: string,
    targetScreen?: 'main' | 'auxiliary'
  ) => {
    let targetUrl = queryOrUrl;
    // Only map to offline if not already an explicit web link or youtube URL
    const isDirectWebUrl = queryOrUrl.startsWith('http://') || queryOrUrl.startsWith('https://') || queryOrUrl.includes('youtube.com') || queryOrUrl.includes('youtu.be');
    
    if (!isDirectWebUrl) {
      if (queryOrUrl === 'offline:informativo' || queryOrUrl.startsWith('offline:informativo') || title.toLowerCase().includes('informativo mundial') || title.toLowerCase().includes('informativo das missões')) {
        targetUrl = 'offline:informativo';
      } else if (queryOrUrl === 'offline:provai' || queryOrUrl.startsWith('offline:provai') || title.toLowerCase().includes('provai e vede')) {
        targetUrl = 'offline:provai';
      }
    }

    // Determine target: use provided targetScreen, or check saved preference (default to 'auxiliary' if user wants telão)
    const effectiveTarget: 'main' | 'auxiliary' = 
      targetScreen !== undefined 
        ? targetScreen 
        : ((localStorage.getItem('iasd_preferred_video_target') as 'main' | 'auxiliary') || 'auxiliary');

    soundEngine.setActiveVideo(title, true);

    // If target is auxiliary screen, trigger the window open and broadcast IMMEDIATELY during this user gesture with full media payload
    if (effectiveTarget === 'auxiliary') {
      const mediaRes = resolveYoutubePlayable(targetUrl, title);
      projectionManager.transmitToAuxiliaryScreen({
        id: targetUrl,
        title,
        urlOrQuery: targetUrl,
        youtubeId: mediaRes.youtubeId,
        embedUrl: mediaRes.embedUrl,
        videoDate,
        synopsis,
        timestamp: Date.now(),
      }, true);
    }

    setActiveVideoModal({
      isOpen: true,
      title,
      queryOrUrl: targetUrl,
      videoDate,
      downloadUrl,
      synopsis,
      targetScreen: effectiveTarget,
    });
  };

  // Handler for applying an active video found from custom weekly search slots
  const handleApplyWeeklySearchSlot = (slot: WeeklySearchSlot) => {
    if (!slot.activeVideoId) return;
    const isInfo = slot.key.includes('informativo') || slot.name.toLowerCase().includes('informativo');
    const isProvai = slot.key.includes('provai') || slot.name.toLowerCase().includes('provai');

    const videoTitle = slot.activeVideoTitle || slot.name;
    const embedUrl = `https://www.youtube.com/embed/${slot.activeVideoId}?autoplay=1&rel=0`;

    if (isInfo) {
      const updatedInfo: WeeklyMediaItem = {
        ...weeklyMedia.informativo,
        title: videoTitle,
        directEmbedUrl: embedUrl,
        youtubeId: slot.activeVideoId,
        synopsis: `Vídeo da semana via ${slot.channelName || 'YouTube'}: ${videoTitle}`,
        narrator: slot.channelName?.includes('Daniel') ? 'Daniel Locutor' : weeklyMedia.informativo.narrator,
        channelTitle: slot.channelName,
        autoLinkedFromChannel: true,
      };
      const newWeekly = { ...weeklyMedia, informativo: updatedInfo };
      setWeeklyMedia(newWeekly);
      saveWeeklyMedia(newWeekly);

      setProgram(prev => ({
        ...prev,
        activities: prev.activities.map(act => {
          if (act.name.toLowerCase().includes('informativo') || act.congregational1?.title.toLowerCase().includes('informativo')) {
            return {
              ...act,
              congregational1: {
                title: videoTitle,
                url: embedUrl,
                videoDate: weeklyMedia.informativo.dateText,
                note: `Canal ${slot.channelName || 'YouTube'}`
              }
            };
          }
          return act;
        })
      }));
    } else if (isProvai) {
      const updatedProvai: WeeklyMediaItem = {
        ...weeklyMedia.provaiEVede,
        title: videoTitle,
        directEmbedUrl: embedUrl,
        youtubeId: slot.activeVideoId,
        synopsis: `Vídeo da semana via ${slot.channelName || 'YouTube'}: ${videoTitle}`,
        channelTitle: slot.channelName,
        autoLinkedFromChannel: true,
      };
      const newWeekly = { ...weeklyMedia, provaiEVede: updatedProvai };
      setWeeklyMedia(newWeekly);
      saveWeeklyMedia(newWeekly);

      setProgram(prev => ({
        ...prev,
        activities: prev.activities.map(act => {
          if (act.name.toLowerCase().includes('provai') || act.congregational1?.title.toLowerCase().includes('provai')) {
            return {
              ...act,
              congregational1: {
                title: videoTitle,
                url: embedUrl,
                videoDate: weeklyMedia.provaiEVede.dateText,
                note: `Canal ${slot.channelName || 'YouTube'}`
              }
            };
          }
          return act;
        })
      }));
    }
  };

  // Link official weekly media to program activity
  const handleLinkWeeklyMediaToProgram = (type: 'informativo' | 'provai', mediaItem: WeeklyMediaItem) => {
    setProgram(prev => {
      let activities = [...prev.activities];
      let targetIndex = -1;

      if (type === 'informativo') {
        targetIndex = activities.findIndex(
          a => a.name.toLowerCase().includes('informativo') || (a.category === 'video' && a.section === 'escola_sabatina')
        );
        if (targetIndex >= 0) {
          activities[targetIndex] = {
            ...activities[targetIndex],
            name: `Informativo Mundial - ${mediaItem.dateText}`,
            congregational1: {
              title: mediaItem.title,
              url: mediaItem.directEmbedUrl,
              videoDate: mediaItem.dateText,
              downloadUrl: mediaItem.downloadUrl,
              note: 'Oficial da Semana',
            },
          };
        } else {
          // insert into escola sabatina
          activities.splice(3, 0, {
            id: `act-info-${Date.now()}`,
            name: `Informativo Mundial - ${mediaItem.dateText}`,
            section: 'escola_sabatina',
            category: 'video',
            durationMinutes: 6,
            congregational1: {
              title: mediaItem.title,
              url: mediaItem.directEmbedUrl,
              videoDate: mediaItem.dateText,
              downloadUrl: mediaItem.downloadUrl,
              note: 'Oficial da Semana',
            },
          });
        }
      } else {
        targetIndex = activities.findIndex(
          a => a.name.toLowerCase().includes('provai') || a.name.toLowerCase().includes('dízimo') || a.name.toLowerCase().includes('dizimo')
        );
        if (targetIndex >= 0) {
          activities[targetIndex] = {
            ...activities[targetIndex],
            name: `Dízimos e Ofertas (Provai e Vede - ${mediaItem.dateText})`,
            congregational1: {
              title: mediaItem.title,
              url: mediaItem.directEmbedUrl,
              videoDate: mediaItem.dateText,
              downloadUrl: mediaItem.downloadUrl,
              note: 'Oficial da Semana',
            },
          };
        } else {
          // insert into culto divino
          activities.push({
            id: `act-provai-${Date.now()}`,
            name: `Dízimos e Ofertas (Provai e Vede - ${mediaItem.dateText})`,
            section: 'culto_divino',
            category: 'video',
            durationMinutes: 5,
            congregational1: {
              title: mediaItem.title,
              url: mediaItem.directEmbedUrl,
              videoDate: mediaItem.dateText,
              downloadUrl: mediaItem.downloadUrl,
              note: 'Oficial da Semana',
            },
          });
        }
      }

      return {
        ...prev,
        activities,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Auto-advance trigger from video player modal: automatically starts next phase
  const handleAdvanceToNextFromModal = () => {
    // Find matching activity by title
    const curIdx = program.activities.findIndex(
      a =>
        a.congregational1?.title === activeVideoModal.title ||
        a.name.toLowerCase().includes(activeVideoModal.title.toLowerCase()) ||
        (activeVideoModal.title.includes('Informativo') && a.name.toLowerCase().includes('informativo')) ||
        (activeVideoModal.title.includes('Provai') && a.name.toLowerCase().includes('provai'))
    );

    let nextIdx = curIdx >= 0 ? curIdx + 1 : 0;
    if (nextIdx < program.activities.length) {
      const nextAct = program.activities[nextIdx];
      // Mark current completed
      if (curIdx >= 0) {
        setProgram(prev => {
          const updated = [...prev.activities];
          updated[curIdx] = { ...updated[curIdx], completed: true };
          return { ...prev, activities: updated };
        });
      }

      // Check if next has media to play
      let nextMediaTitle = nextAct.congregational1?.title || nextAct.name;
      let nextMediaUrl = nextAct.congregational1?.url || nextAct.congregational1?.title || nextAct.name;
      let nextDate = nextAct.congregational1?.videoDate;
      let nextDownload = nextAct.congregational1?.downloadUrl;

      // If next is Provai or Informativo, fetch official weekly info and prioritize offline storage
      if (nextAct.name.toLowerCase().includes('provai') || nextAct.category === 'ofertas') {
        nextMediaTitle = weeklyMedia.provaiEVede.title;
        nextMediaUrl = 'offline:provai';
        nextDate = weeklyMedia.provaiEVede.dateText;
        nextDownload = weeklyMedia.provaiEVede.downloadUrl;
      } else if (nextAct.name.toLowerCase().includes('informativo') || (nextAct.category === 'video' && nextAct.section === 'escola_sabatina')) {
        nextMediaTitle = weeklyMedia.informativo.title;
        nextMediaUrl = 'offline:informativo';
        nextDate = weeklyMedia.informativo.dateText;
        nextDownload = weeklyMedia.informativo.downloadUrl;
      }

      setActiveVideoModal({
        isOpen: true,
        title: nextMediaTitle,
        queryOrUrl: nextMediaUrl,
        videoDate: nextDate,
        downloadUrl: nextDownload,
        synopsis: undefined,
      });
    } else {
      setActiveVideoModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  // Hymn / Playback direct linkage to current activity
  const handleAddHymnToCurrentProgram = (hymn: Hymn) => {
    const newActivity: ActivityItem = {
      id: `act-hymn-${Date.now()}`,
      name: `Hino #${hymn.number} - ${hymn.title}`,
      section: 'culto_divino',
      category: 'louvor',
      durationMinutes: 4,
      congregational1: {
        title: `Hinário #${hymn.number} - ${hymn.title}`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(hymn.youtubeSearchQuery)}`,
      },
    };
    handleSaveActivity(newActivity);
  };

  const handleAddPlaybackToProgram = (title: string, query: string) => {
    const newActivity: ActivityItem = {
      id: `act-playback-${Date.now()}`,
      name: title,
      section: 'culto_divino',
      category: 'mensagem_musical',
      durationMinutes: 5,
      congregational1: {
        title: title,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      },
    };
    handleSaveActivity(newActivity);
    alert(`"${title}" adicionado à programação do Culto Divino!`);
  };

  const handleAddSongToLiturgia = (song: ChurchSong, destination?: SongLiturgyDestination) => {
    // Mode 1: Link directly to an existing activity's congregational slot
    if (destination?.mode === 'existing_activity' && destination.targetActivityId) {
      setProgram(prev => {
        const activities = [...prev.activities];
        const idx = activities.findIndex(a => a.id === destination.targetActivityId);
        if (idx >= 0) {
          const mediaLink: MediaLink = {
            title: song.title,
            url: song.youtubeUrlOrId || `https://www.youtube.com/results?search_query=${encodeURIComponent(song.title + ' ' + song.artistOrGroup)}`,
            note: [song.artistOrGroup, song.key ? `Tom: ${song.key}` : null].filter(Boolean).join(' • '),
          };
          const updated = { ...activities[idx] };
          if (destination.targetSlot === 'c2') {
            updated.congregational2 = mediaLink;
          } else if (destination.targetSlot === 'c3') {
            updated.congregational3 = mediaLink;
          } else {
            updated.congregational1 = mediaLink;
          }
          activities[idx] = updated;
        }
        return { ...prev, activities, updatedAt: new Date().toISOString() };
      });
      return;
    }

    // Mode 2: Insert as a new activity at the designated moment or relative position
    const section: ActivitySection = destination?.section || (
      song.suggestedMoment?.toLowerCase().includes('escola') ? 'escola_sabatina' : 'culto_divino'
    );
    const category: ActivityCategory = song.type === 'mensagem_musical' 
      ? 'mensagem_musical' 
      : (song.type === 'infantil' ? 'infantil' : 'louvor');

    const newActivity: ActivityItem = {
      id: `act-song-${Date.now()}`,
      name: destination?.activityName || `${song.type === 'mensagem_musical' ? 'Mensagem Musical' : 'Momento de Louvor'}: ${song.title}`,
      section,
      category,
      durationMinutes: destination?.durationMinutes || 5,
      responsible: destination?.responsible || song.artistOrGroup,
      notes: [song.key ? `Tom: ${song.key}` : null, destination?.notes || song.suggestedMoment, song.notes].filter(Boolean).join(' • '),
      congregational1: {
        title: song.title,
        url: song.youtubeUrlOrId || `https://www.youtube.com/results?search_query=${encodeURIComponent(song.title + ' ' + song.artistOrGroup)}`,
        note: [song.artistOrGroup, song.key ? `Tom: ${song.key}` : null].filter(Boolean).join(' • '),
      },
    };

    setProgram(prev => {
      const list = [...prev.activities];
      let insertIndex = -1;

      if (destination?.placement === 'start_of_section') {
        insertIndex = list.findIndex(a => a.section === section);
        if (insertIndex < 0) insertIndex = 0;
      } else if (destination?.placement === 'end_of_section') {
        for (let i = list.length - 1; i >= 0; i--) {
          if (list[i].section === section) {
            insertIndex = i + 1;
            break;
          }
        }
        if (insertIndex < 0) insertIndex = list.length;
      } else if (destination?.placement === 'before_activity' && destination.targetActivityId) {
        const idx = list.findIndex(a => a.id === destination.targetActivityId);
        insertIndex = idx >= 0 ? idx : list.length;
      } else if (destination?.placement === 'after_activity' && destination.targetActivityId) {
        const idx = list.findIndex(a => a.id === destination.targetActivityId);
        insertIndex = idx >= 0 ? idx + 1 : list.length;
      } else if (destination?.placement === 'preset' && destination.presetMoment) {
        switch (destination.presetMoment) {
          case 'mensagem_musical': {
            // Posicionar exatamente ANTES do Sermão
            const sermonIdx = list.findIndex(a => 
              a.section === 'culto_divino' && (a.category === 'sermao' || a.name.toLowerCase().includes('serm') || a.name.toLowerCase().includes('prega'))
            );
            insertIndex = sermonIdx >= 0 ? sermonIdx : list.length;
            break;
          }
          case 'apelo_pos_sermao': {
            // Posicionar imediatamente APÓS o Sermão
            const sermonIdx = list.findIndex(a => 
              a.section === 'culto_divino' && (a.category === 'sermao' || a.name.toLowerCase().includes('serm') || a.name.toLowerCase().includes('prega'))
            );
            insertIndex = sermonIdx >= 0 ? sermonIdx + 1 : list.length;
            break;
          }
          case 'abertura_culto': {
            // Posicionar após a Entrada da Plataforma ou no início do Culto Divino
            const entradaIdx = list.findIndex(a => 
              a.section === 'culto_divino' && (a.name.toLowerCase().includes('plataforma') || a.name.toLowerCase().includes('abertura'))
            );
            if (entradaIdx >= 0) {
              insertIndex = entradaIdx + 1;
            } else {
              insertIndex = list.findIndex(a => a.section === 'culto_divino');
              if (insertIndex < 0) insertIndex = list.length;
            }
            break;
          }
          case 'ofertorio': {
            // Posicionar após a Oração ou no bloco de Dízimos e Ofertas
            const ofertaIdx = list.findIndex(a => 
              a.section === 'culto_divino' && (
                a.category === 'ofertas' || 
                a.name.toLowerCase().includes('oferta') || 
                a.name.toLowerCase().includes('dízimo') || 
                a.name.toLowerCase().includes('dizimo') || 
                a.name.toLowerCase().includes('provai')
              )
            );
            insertIndex = ofertaIdx >= 0 ? ofertaIdx + 1 : list.length;
            break;
          }
          case 'oracao_intercessoria': {
            // Posicionar junto à oração de joelhos
            const oracaoIdx = list.findIndex(a => 
              a.section === 'culto_divino' && (
                a.category === 'oracao' || 
                a.name.toLowerCase().includes('oração') || 
                a.name.toLowerCase().includes('oracao') || 
                a.name.toLowerCase().includes('joelhos')
              )
            );
            insertIndex = oracaoIdx >= 0 ? oracaoIdx : list.length;
            break;
          }
          case 'adoracao_infantil': {
            const infantilIdx = list.findIndex(a => 
              a.category === 'infantil' || 
              a.name.toLowerCase().includes('infantil') || 
              a.name.toLowerCase().includes('criança')
            );
            insertIndex = infantilIdx >= 0 ? infantilIdx + 1 : list.length;
            break;
          }
          case 'escola_abertura': {
            const esIdx = list.findIndex(a => a.section === 'escola_sabatina');
            insertIndex = esIdx >= 0 ? esIdx : 0;
            break;
          }
          case 'escola_encerramento': {
            for (let i = list.length - 1; i >= 0; i--) {
              if (list[i].section === 'escola_sabatina') {
                insertIndex = i + 1;
                break;
              }
            }
            if (insertIndex < 0) insertIndex = 0;
            break;
          }
          case 'encerramento_culto': {
            for (let i = list.length - 1; i >= 0; i--) {
              if (list[i].section === 'culto_divino') {
                insertIndex = i + 1;
                break;
              }
            }
            if (insertIndex < 0) insertIndex = list.length;
            break;
          }
        }
      }

      if (insertIndex >= 0 && insertIndex <= list.length) {
        list.splice(insertIndex, 0, newActivity);
      } else {
        list.push(newActivity);
      }

      return {
        ...prev,
        activities: list,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // AI Liturgy generator apply
  const handleApplyAILiturgy = (newActivities: ActivityItem[], newTheme: string) => {
    if (window.confirm('Deseja substituir as atividades atuais pela liturgia sugerida pela IA? (Clique Cancelar para apenas adicionar ao final)')) {
      setProgram(prev => ({
        ...prev,
        theme: newTheme || prev.theme,
        activities: newActivities,
        updatedAt: new Date().toISOString(),
      }));
    } else {
      setProgram(prev => ({
        ...prev,
        theme: newTheme || prev.theme,
        activities: [...prev.activities, ...newActivities],
        updatedAt: new Date().toISOString(),
      }));
    }
  };

  // Reset to original template for active church
  const handleResetToDefault = () => {
    if (window.confirm(`Deseja restaurar o modelo padrão do culto para a igreja "${activeChurch.name}"?`)) {
      setProgram(INITIAL_PROGRAM);
      try {
        const scopedKey = getScopedStorageKey('worship_program', activeChurch.id);
        localStorage.setItem(scopedKey, JSON.stringify(INITIAL_PROGRAM));
      } catch (e) {}
    }
  };

  const handleFinishWorshipSuccess = (archivedRecord: any, nextProgram?: WorshipProgram) => {
    setArchivedCount(getArchivedWorships(activeChurch.id).length);
    if (nextProgram) {
      setProgram(nextProgram);
    }
    setToastNotification(`Culto "${archivedRecord.title}" finalizado e arquivado com sucesso no histórico!`);
  };

  const handleRestoreProgram = (restoredProgram: WorshipProgram) => {
    setProgram(restoredProgram);
    setToastNotification(`Culto de ${formatWorshipDateShort(restoredProgram.date)} restaurado para a liturgia principal!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        responsibleName={program.responsiblePerson}
        worshipDate={program.date}
        archivedCount={archivedCount}
        currentUser={currentUser}
        onLogout={() => {
          saveAuthSession(null);
          setCurrentUser(null);
          setToastNotification('Sessão encerrada com sucesso.');
        }}
        onOpenFinishWorshipModal={() => setIsFinishWorshipModalOpen(true)}
        onOpenArchivesModal={() => setIsArchivedWorshipsModalOpen(true)}
        onNotify={(msg) => setToastNotification(msg)}
        onChurchSwitched={(newChurch) => {
          setActiveChurch(newChurch);
          setProgram(loadProgramForChurch(newChurch.id));
          setArchivedCount(getArchivedWorships(newChurch.id).length);
          projectionManager.setChurchId(newChurch.id);
          setToastNotification(`Espaço alternado para "${newChurch.name}"`);
        }}
        onOpenSonoplastiaMode={() => setIsSonoplastiaOpen(true)}
        onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenWeeklyMediaModal={() => setIsWeeklyMediaModalOpen(true)}
        onOpenWeeklySearchModal={() => setIsWeeklySearchModalOpen(true)}
        onOpenMusicalBackgrounds={() => setIsMusicalBackgroundsOpen(true)}
        onOpenMixer={() => setIsAudioMixerOpen(true)}
        onOpenProjectionConfig={() => setIsProjectionScreensConfigOpen(true)}
        onResetToDefault={handleResetToDefault}
      />

      {/* Main Page Container */}
      <main className="grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* SUB-BARRA CONTEXTUAL: MÚSICAS & HINÁRIO */}
        {(activeTab === 'songs_catalog' || activeTab === 'hymnal' || activeTab === 'playbacks' || activeTab === 'escola_culto') && (
          <div className="mb-6 flex items-center justify-between flex-wrap gap-3 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('songs_catalog')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'songs_catalog' || activeTab === 'escola_culto'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Music className="w-4 h-4" />
                <span>Louvores & Mensagens</span>
              </button>

              <button
                onClick={() => setActiveTab('hymnal')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'hymnal'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Hinário Adventista (HA 610)</span>
              </button>

              <button
                onClick={() => setActiveTab('playbacks')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'playbacks'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Youtube className="w-4 h-4" />
                <span>Playbacks & Vídeos</span>
              </button>
            </div>
          </div>
        )}

        {/* SUB-BARRA CONTEXTUAL: IGREJA & EQUIPE */}
        {(activeTab === 'church_admin' || activeTab === 'team_scale') && (
          <div className="mb-6 flex items-center justify-between flex-wrap gap-3 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('church_admin')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'church_admin'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Church className="w-4 h-4" />
                <span>Dados da Igreja, Acessos & Conexões</span>
              </button>

              <button
                onClick={() => setActiveTab('team_scale')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'team_scale'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Equipe & Escala da Sonoplastia</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'program' && (
          <ProgramScheduleView
            program={program}
            weeklyMedia={weeklyMedia}
            onUpdateProgram={setProgram}
            onOpenAddModal={handleOpenAddModal}
            onOpenEditModal={handleOpenEditModal}
            onPlayMedia={handlePlayMedia}
            onOpenSonoplastiaMode={() => setIsSonoplastiaOpen(true)}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onOpenWeeklyMediaModal={() => setIsWeeklyMediaModalOpen(true)}
            onOpenWeeklySearchModal={() => setIsWeeklySearchModalOpen(true)}
            onOpenMusicalBackgrounds={() => setIsMusicalBackgroundsOpen(true)}
            onOpenMixer={() => setIsAudioMixerOpen(true)}
            onOpenPlaybacks={() => setActiveTab('playbacks')}
            onOpenSongsCatalog={() => setActiveTab('songs_catalog')}
            onOpenFinishWorshipModal={() => setIsFinishWorshipModalOpen(true)}
            onOpenArchivesModal={() => setIsArchivedWorshipsModalOpen(true)}
            archivedCount={archivedCount}
            onNotify={toastNotification}
          />
        )}

        {activeTab === 'hymnal' && (
          <HymnalView
            onSelectPlayback={(title, query, targetScreen) =>
              handlePlayMedia(title, query, undefined, undefined, undefined, targetScreen)
            }
            onAddToActivity={handleAddHymnToCurrentProgram}
            activities={program.activities}
          />
        )}

        {(activeTab === 'songs_catalog' || activeTab === 'escola_culto') && (
          <ChurchSongsCatalogView
            onPlayMedia={handlePlayMedia}
            onAddSongToLiturgia={handleAddSongToLiturgia}
            activities={program.activities}
            program={program}
            onUpdateProgram={setProgram}
          />
        )}

        {activeTab === 'playbacks' && (
          <PlaybackSearchView
            onPlayMedia={handlePlayMedia}
            onAddToActivity={handleAddPlaybackToProgram}
            activities={program.activities}
          />
        )}

        {activeTab === 'team_scale' && (
          <TeamScaleView />
        )}

        {activeTab === 'church_admin' && (
          <ChurchAdminView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-850 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-bold text-slate-300">
            Console de Sonoplastia IASD • Liturgia & Modo Telão
          </p>
          <p className="text-slate-500">
            Escola Sabatina • Culto Divino • Vídeos Oficiais (Provai e Vede & Informativo) • Mixers Vinculados
          </p>
        </div>
      </footer>

      {/* Notification Toast for Auto-Download */}
      {notificationMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            {downloadState.isDownloading ? (
              <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{notificationMessage}</span>
          </div>
          <button
            onClick={dismissNotification}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* General Workspace & Archiving Feedback Toast */}
      {toastNotification && (
        <div className="fixed bottom-5 left-5 z-50 max-w-md bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastNotification}</span>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modals */}
      <ActivityEditModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setInsertAfterActivityId(null);
        }}
        onSave={handleSaveActivity}
        initialActivity={editingActivity}
        defaultSection={defaultSection}
        insertAfterId={insertAfterActivityId || undefined}
        allActivities={program.activities}
      />

      <VideoPlayerModal
        isOpen={activeVideoModal.isOpen}
        onClose={() => {
          soundEngine.setActiveVideo(null, false);
          setActiveVideoModal(prev => ({ ...prev, isOpen: false }));
        }}
        title={activeVideoModal.title}
        urlOrQuery={activeVideoModal.queryOrUrl}
        videoDate={activeVideoModal.videoDate}
        downloadUrl={activeVideoModal.downloadUrl}
        synopsis={activeVideoModal.synopsis}
        initialTargetScreen={activeVideoModal.targetScreen || 'main'}
        onAdvanceToNext={handleAdvanceToNextFromModal}
        onOpenMixer={() => setIsAudioMixerOpen(true)}
        onOpenMusicalBackgrounds={() => setIsMusicalBackgroundsOpen(true)}
        nextActivityName={
          (() => {
            const idx = program.activities.findIndex(
              a =>
                a.congregational1?.title === activeVideoModal.title ||
                a.name.toLowerCase().includes(activeVideoModal.title.toLowerCase()) ||
                (activeVideoModal.title.includes('Informativo') && a.name.toLowerCase().includes('informativo')) ||
                (activeVideoModal.title.includes('Provai') && a.name.toLowerCase().includes('provai'))
            );
            return idx >= 0 && idx < program.activities.length - 1 ? program.activities[idx + 1].name : undefined;
          })()
        }
      />

      {isSonoplastiaOpen && (
        <LiveSonoplastiaMode
          program={program}
          weeklyMedia={weeklyMedia}
          onClose={() => setIsSonoplastiaOpen(false)}
          onPlayMedia={handlePlayMedia}
        />
      )}

      <WeeklyMediaModal
        isOpen={isWeeklyMediaModalOpen}
        onClose={() => setIsWeeklyMediaModalOpen(false)}
        weeklyMedia={weeklyMedia}
        onRefreshWeeklyMedia={handleRefreshWeeklyMedia}
        onPlayMedia={handlePlayMedia}
        onLinkToProgram={handleLinkWeeklyMediaToProgram}
        onOpenWeeklySearchConfig={() => {
          setIsWeeklyMediaModalOpen(false);
          setIsWeeklySearchModalOpen(true);
        }}
      />

      <WeeklySearchConfigModal
        isOpen={isWeeklySearchModalOpen}
        onClose={() => setIsWeeklySearchModalOpen(false)}
        onApplySlotToMedia={handleApplyWeeklySearchSlot}
        onPlayDirect={(title, queryOrUrl, targetScreen) => {
          handlePlayMedia(title, queryOrUrl, undefined, undefined, undefined, targetScreen);
        }}
      />

      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        onApplyLiturgy={handleApplyAILiturgy}
      />

      <ShareExportModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        program={program}
        onImportProgram={setProgram}
      />

      {/* Musical Backgrounds & Prayer Pads (Device Audio Output) */}
      <MusicalBackgroundsModal
        isOpen={isMusicalBackgroundsOpen}
        onClose={() => setIsMusicalBackgroundsOpen(false)}
        onOpenMixer={() => {
          setIsMusicalBackgroundsOpen(false);
          setIsAudioMixerOpen(true);
        }}
      />

      {/* Auxiliary Audio Mixer (Inverse Linking: decrease one, increase other) */}
      <AudioMixerModal
        isOpen={isAudioMixerOpen}
        onClose={() => setIsAudioMixerOpen(false)}
        onOpenMusicalBackgrounds={() => {
          setIsAudioMixerOpen(false);
          setIsMusicalBackgroundsOpen(true);
        }}
        onOpenPlaybacks={() => {
          setIsAudioMixerOpen(false);
          setActiveTab('playbacks');
        }}
        currentVideoTitle={activeVideoModal.isOpen ? activeVideoModal.title : undefined}
      />

      {/* Projection Multi-Screens Configuration Modal */}
      <ProjectionScreensConfigModal
        isOpen={isProjectionScreensConfigOpen}
        onClose={() => setIsProjectionScreensConfigOpen(false)}
      />

      {/* Finish Worship and Archive Modal */}
      <FinishWorshipModal
        isOpen={isFinishWorshipModalOpen}
        onClose={() => setIsFinishWorshipModalOpen(false)}
        program={program}
        onFinishSuccess={handleFinishWorshipSuccess}
      />

      {/* Archived Worships History Modal */}
      <ArchivedWorshipsModal
        isOpen={isArchivedWorshipsModalOpen}
        onClose={() => setIsArchivedWorshipsModalOpen(false)}
        onRestoreProgram={handleRestoreProgram}
      />
    </div>
  );
}
