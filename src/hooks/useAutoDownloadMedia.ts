import { useState, useEffect, useCallback } from 'react';
import { 
  autoCacheWeeklyVideo, 
  getVideoFromIndexedDB, 
  OfflineStoredVideo,
  getAllOfflineVideos,
  importLocalVideoFile
} from '../utils/offlineMediaStorage';
import { WeeklyMediaItem } from '../types';

export interface AutoDownloadState {
  isDownloading: boolean;
  isReady: boolean;
  informativoReady: boolean;
  provaiReady: boolean;
  informativoVideo: OfflineStoredVideo | null;
  provaiVideo: OfflineStoredVideo | null;
  totalBytesSaved: number;
  lastChecked: string;
}

export function useAutoDownloadMedia(weeklyMedia?: {
  informativo: WeeklyMediaItem;
  provaiEVede: WeeklyMediaItem;
}) {
  const [downloadState, setDownloadState] = useState<AutoDownloadState>({
    isDownloading: false,
    isReady: false,
    informativoReady: false,
    provaiReady: false,
    informativoVideo: null,
    provaiVideo: null,
    totalBytesSaved: 0,
    lastChecked: new Date().toISOString(),
  });

  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  // Refresh status from IndexedDB
  const checkStatus = useCallback(async () => {
    try {
      const info = await getVideoFromIndexedDB('video_informativo');
      const provai = await getVideoFromIndexedDB('video_provai');
      const totalBytes = (info?.sizeBytes || 0) + (provai?.sizeBytes || 0);

      setDownloadState(prev => ({
        ...prev,
        informativoReady: !!info?.isOfflineReady,
        provaiReady: !!provai?.isOfflineReady,
        isReady: !!(info?.isOfflineReady && provai?.isOfflineReady),
        informativoVideo: info,
        provaiVideo: provai,
        totalBytesSaved: totalBytes,
        lastChecked: new Date().toISOString(),
      }));

      return { info, provai };
    } catch (e) {
      console.warn('Erro ao verificar vídeos no IndexedDB', e);
      return { info: null, provai: null };
    }
  }, []);

  // Automatic download process on startup without command
  const triggerAutoDownload = useCallback(async () => {
    if (!weeklyMedia) return;

    setDownloadState(prev => ({ ...prev, isDownloading: true }));
    setNotificationMessage('⬇️ Baixando vídeos oficiais para uso offline (Informativo & Provai)...');

    try {
      // 1. Informativo Mundial
      const infoPromise = autoCacheWeeklyVideo('informativo', {
        title: weeklyMedia.informativo.title,
        dateText: weeklyMedia.informativo.dateText,
        synopsis: weeklyMedia.informativo.synopsis,
        downloadUrl: weeklyMedia.informativo.downloadUrl,
      });

      // 2. Provai e Vede
      const provaiPromise = autoCacheWeeklyVideo('provai', {
        title: weeklyMedia.provaiEVede.title,
        dateText: weeklyMedia.provaiEVede.dateText,
        synopsis: weeklyMedia.provaiEVede.synopsis,
        downloadUrl: weeklyMedia.provaiEVede.downloadUrl,
      });

      const [infoRes, provaiRes] = await Promise.all([infoPromise, provaiPromise]);
      const totalBytes = (infoRes.sizeBytes || 0) + (provaiRes.sizeBytes || 0);

      setDownloadState({
        isDownloading: false,
        isReady: true,
        informativoReady: true,
        provaiReady: true,
        informativoVideo: infoRes,
        provaiVideo: provaiRes,
        totalBytesSaved: totalBytes,
        lastChecked: new Date().toISOString(),
      });

      const sizeMb = (totalBytes / (1024 * 1024)).toFixed(1);
      setNotificationMessage(`🟢 Vídeos da semana prontos no computador! (${sizeMb} MB salvos offline)`);
      
      // Clear notification after 6 seconds
      setTimeout(() => {
        setNotificationMessage(null);
      }, 6000);
    } catch (err) {
      console.warn('Erro no download automático de vídeos:', err);
      setDownloadState(prev => ({ ...prev, isDownloading: false }));
      setNotificationMessage('⚠️ Falha ao atualizar vídeos offline. Tentaremos novamente.');
      setTimeout(() => setNotificationMessage(null), 5000);
    }
  }, [weeklyMedia]);

  // Run automatically as soon as component mounts / computer opens
  useEffect(() => {
    let isMounted = true;

    async function initialStartupSync() {
      const { info, provai } = await checkStatus();
      if (!isMounted) return;

      // If either video is missing from offline storage, trigger immediate background download
      if (!info || !provai) {
        triggerAutoDownload();
      } else {
        // Both are already saved!
        const totalMb = (((info.sizeBytes || 0) + (provai.sizeBytes || 0)) / (1024 * 1024)).toFixed(1);
        setNotificationMessage(`📦 2 Vídeos da Semana Salvos no Computador (${totalMb} MB Offline)`);
        setTimeout(() => {
          if (isMounted) setNotificationMessage(null);
        }, 5000);
      }
    }

    initialStartupSync();

    // Listen for storage changes
    const handleStorageChange = () => {
      if (isMounted) checkStatus();
    };

    window.addEventListener('iasd-offline-video-changed', handleStorageChange);
    return () => {
      isMounted = false;
      window.removeEventListener('iasd-offline-video-changed', handleStorageChange);
    };
  }, [checkStatus, triggerAutoDownload]);

  // Import custom file handler
  const handleImportFile = async (type: 'informativo' | 'provai', file: File) => {
    const res = await importLocalVideoFile(type, file, {
      title: `${type === 'informativo' ? 'Informativo Mundial' : 'Provai e Vede'} (Arquivo Local)`,
      dateText: new Date().toLocaleDateString('pt-BR'),
    });
    await checkStatus();
    return res;
  };

  return {
    downloadState,
    notificationMessage,
    dismissNotification: () => setNotificationMessage(null),
    triggerAutoDownload,
    handleImportFile,
    checkStatus,
  };
}
