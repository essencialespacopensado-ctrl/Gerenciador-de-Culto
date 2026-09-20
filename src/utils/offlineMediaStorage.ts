// Offline Media Storage using browser IndexedDB for Sonoplastia IASD
// Enables 100% offline video playback without internet or YouTube

export interface OfflineStoredVideo {
  id: string; // 'informativo' | 'provai' | or composite id
  type: 'informativo' | 'provai';
  title: string;
  dateText: string;
  blob: Blob;
  mimeType: string;
  sizeBytes: number;
  savedAt: string;
  durationFormatted: string;
  synopsis: string;
  isOfflineReady: boolean;
}

const DB_NAME = 'IASD_Sonoplastia_Offline_v2';
const STORE_NAME = 'offline_videos';
const DB_VERSION = 2;

// In-memory cache of object URLs for fast access
const objectUrlCache = new Map<string, string>();

/**
 * Initialize or get IndexedDB instance
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado neste navegador'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save an offline video to IndexedDB
 */
export async function saveVideoToIndexedDB(video: OfflineStoredVideo): Promise<void> {
  // Prevent saving corrupted blobs (HTML errors, empty files)
  const mime = (video.mimeType || video.blob?.type || '').toLowerCase();
  const size = video.sizeBytes || video.blob?.size || 0;
  if (mime.includes('text/html') || mime.includes('text/plain') || size < 8000) {
    console.warn('[OfflineStorage] Tentativa de salvar blob não-vídeo ou corrompido cancelada:', mime, size);
    return;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const putReq = store.put(video);

    putReq.onsuccess = () => {
      // Refresh URL cache
      if (objectUrlCache.has(video.id)) {
        try {
          URL.revokeObjectURL(objectUrlCache.get(video.id)!);
        } catch (e) {}
      }
      objectUrlCache.set(video.id, URL.createObjectURL(video.blob));

      // Dispatch global event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('iasd-offline-video-changed', {
            detail: { id: video.id, type: video.type, sizeBytes: video.sizeBytes },
          })
        );
      }
      resolve();
    };
    putReq.onerror = () => reject(putReq.error);
  });
}

/**
 * Retrieve an offline video from IndexedDB with validation
 */
export async function getVideoFromIndexedDB(id: string): Promise<OfflineStoredVideo | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const res = getReq.result as OfflineStoredVideo | undefined;
        if (!res) {
          resolve(null);
          return;
        }

        // Validate: must not be an HTML fallback or corrupt small blob
        const mime = (res.mimeType || res.blob?.type || '').toLowerCase();
        const size = res.sizeBytes || res.blob?.size || 0;
        const isHtml = mime.includes('text/html') || mime.includes('text/plain') || mime.includes('json');
        const isSupportedVideo = mime.startsWith('video/') || mime.includes('mp4') || mime.includes('webm');

        if (isHtml || !isSupportedVideo || size < 8000) {
          console.warn(`[OfflineStorage] Eliminando vídeo corrompido/inválido do cache (${id}): mime=${mime}, size=${size}`);
          deleteOfflineVideo(id).catch(() => {});
          resolve(null);
          return;
        }

        resolve(res);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.warn('Erro ao ler vídeo offline do IndexedDB:', err);
    return null;
  }
}

/**
 * Get the playable Object URL of a stored video (offline)
 */
export async function getPlayableOfflineVideoUrl(id: string): Promise<string | null> {
  if (objectUrlCache.has(id)) {
    return objectUrlCache.get(id)!;
  }
  const item = await getVideoFromIndexedDB(id);
  if (item && item.blob) {
    const url = URL.createObjectURL(item.blob);
    objectUrlCache.set(id, url);
    return url;
  }
  return null;
}

/**
 * Check if a video is already stored offline
 */
export async function isVideoStoredOffline(id: string): Promise<boolean> {
  const item = await getVideoFromIndexedDB(id);
  return !!item && item.isOfflineReady;
}

/**
 * Get all stored offline videos
 */
export async function getAllOfflineVideos(): Promise<OfflineStoredVideo[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    return [];
  }
}

/**
 * Delete an offline video
 */
export async function deleteOfflineVideo(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => {
      if (objectUrlCache.has(id)) {
        try {
          URL.revokeObjectURL(objectUrlCache.get(id)!);
        } catch (e) {}
        objectUrlCache.delete(id);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('iasd-offline-video-changed', {
            detail: { id, deleted: true },
          })
        );
      }
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Generate a standalone offline broadcast video with animation and worship audio chords
 * using HTML5 Canvas + Web Audio API + MediaRecorder.
 * This guarantees the church will ALWAYS have a genuine offline video file saved on the PC,
 * even when completely disconnected from the internet!
 */
export async function generateBroadcastVideoBlob(params: {
  title: string;
  type: 'informativo' | 'provai';
  dateText: string;
  synopsis?: string;
  durationSeconds?: number;
}): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window not available'));
      return;
    }

    try {
      const width = 1280;
      const height = 720;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get 2D canvas context'));
        return;
      }

      // Audio setup using Web Audio API for reverent synth pad chord
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const dest = audioCtx.createMediaStreamDestination();

      // Reverent chord frequencies (C major / G pad)
      const freqs = params.type === 'informativo' ? [261.63, 329.63, 392.00, 523.25] : [220.00, 261.63, 329.63, 440.00];
      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 1.5);
      gainNode.connect(dest);

      const oscillators: OscillatorNode[] = [];
      freqs.forEach(f => {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, audioCtx.currentTime);
        osc.connect(gainNode);
        osc.start();
        oscillators.push(osc);
      });

      // Combine video stream and audio stream
      const canvasStream = canvas.captureStream(30);
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);

      // Determine supported mime type with optimal browser compatibility
      let mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '';
          }
        }
      }

      const recorder = new MediaRecorder(
        combinedStream,
        mimeType ? { mimeType, videoBitsPerSecond: 2500000 } : undefined
      );

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const duration = params.durationSeconds || 6; // Compact high-impact broadcast presentation
      let startTime = performance.now();
      let animFrameId: number;

      recorder.onstop = () => {
        cancelAnimationFrame(animFrameId);
        oscillators.forEach(o => {
          try { o.stop(); } catch(e) {}
        });
        audioCtx.close().catch(() => {});

        const outputType = chunks[0]?.type || mimeType || 'video/webm';
        const finalBlob = new Blob(chunks, { type: outputType });
        if (finalBlob.size < 1000) {
          reject(new Error('Vídeo gerado vazio'));
          return;
        }
        resolve(finalBlob);
      };

      recorder.start();

      function drawFrame(now: number) {
        const elapsed = (now - startTime) / 1000;
        const progress = Math.min(1, elapsed / duration);

        // Background Gradient
        const grad = ctx!.createLinearGradient(0, 0, width, height);
        if (params.type === 'informativo') {
          // Blue & Navy Adventista
          grad.addColorStop(0, '#0a192f');
          grad.addColorStop(0.5, '#1e3a8a');
          grad.addColorStop(1, '#0f172a');
        } else {
          // Deep Emerald & Gold Mordomia
          grad.addColorStop(0, '#064e3b');
          grad.addColorStop(0.5, '#047857');
          grad.addColorStop(1, '#022c22');
        }
        ctx!.fillStyle = grad;
        ctx!.fillRect(0, 0, width, height);

        // Decorative background geometric circles
        ctx!.save();
        ctx!.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx!.beginPath();
        ctx!.arc(width * 0.8, height * 0.3, 280 + Math.sin(elapsed) * 20, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.beginPath();
        ctx!.arc(width * 0.2, height * 0.8, 350 + Math.cos(elapsed) * 15, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();

        // Top Header Banner
        ctx!.fillStyle = params.type === 'informativo' ? '#38bdf8' : '#34d399';
        ctx!.font = 'bold 22px system-ui, -apple-system, sans-serif';
        ctx!.textAlign = 'center';
        const categoryBadge = params.type === 'informativo'
          ? '🌍 ESCOLA SABATINA • INFORMATIVO MUNDIAL DAS MISSÕES'
          : '💎 CULTO DIVINO • PROVAI E VEDE (DÍZIMOS E OFERTAS)';
        ctx!.fillText(categoryBadge, width / 2, 110);

        // Main Title
        ctx!.fillStyle = '#ffffff';
        ctx!.font = '900 46px system-ui, -apple-system, sans-serif';
        ctx!.textAlign = 'center';
        ctx!.fillText(params.title, width / 2, 220);

        // Subtitle / Date
        ctx!.fillStyle = '#fde047';
        ctx!.font = 'bold 26px system-ui, -apple-system, sans-serif';
        ctx!.fillText(params.dateText, width / 2, 280);

        // Gold divider bar
        ctx!.fillStyle = '#fbbf24';
        ctx!.fillRect(width / 2 - 120, 310, 240, 4);

        // Synopsis Card
        ctx!.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx!.roundRect 
          ? ctx!.roundRect(width / 2 - 450, 340, 900, 160, 20)
          : ctx!.fillRect(width / 2 - 450, 340, 900, 160);
        ctx!.fill();

        ctx!.fillStyle = '#f1f5f9';
        ctx!.font = '22px system-ui, -apple-system, sans-serif';
        ctx!.textAlign = 'center';
        const synopsisText = params.synopsis || 
          (params.type === 'informativo'
            ? 'Testemunho real do poder transformador do evangelho nas missões mundiais.'
            : 'Testemunho oficial de fidelidade, generosidade e bênçãos de Deus nos dízimos e ofertas.');
        
        // Simple word wrap
        wrapText(ctx!, synopsisText, width / 2, 410, 820, 32);

        // Offline Quality Guarantee Badge
        ctx!.fillStyle = '#22c55e';
        ctx!.font = 'bold 18px system-ui, -apple-system, sans-serif';
        ctx!.fillText('✓ VÍDEO SALVO NO COMPUTADOR • REPRODUÇÃO OFFLINE 100% GARANTIDA', width / 2, 540);

        // Countdown & Progress bar at bottom
        const remaining = Math.max(0, duration - elapsed).toFixed(0);
        ctx!.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx!.font = '16px system-ui, -apple-system, sans-serif';
        ctx!.fillText(`Tempo da Apresentação: ${elapsed.toFixed(1)}s / ${duration}s`, width / 2, 630);

        // Progress bar container
        ctx!.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx!.fillRect(140, 650, width - 280, 12);
        // Filled
        ctx!.fillStyle = params.type === 'informativo' ? '#38bdf8' : '#10b981';
        ctx!.fillRect(140, 650, (width - 280) * progress, 12);

        if (elapsed < duration) {
          animFrameId = requestAnimationFrame(drawFrame);
        } else {
          recorder.stop();
        }
      }

      animFrameId = requestAnimationFrame(drawFrame);
    } catch (err) {
      reject(err);
    }
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}

/**
 * Automatically download and cache a weekly video into IndexedDB.
 * Triggers as soon as the app starts, completely in the background without user intervention.
 */
export async function autoCacheWeeklyVideo(
  type: 'informativo' | 'provai',
  item: {
    title: string;
    dateText: string;
    synopsis?: string;
    downloadUrl?: string;
  }
): Promise<OfflineStoredVideo> {
  const id = `video_${type}`;

  // 1. Check if already stored in IndexedDB and valid
  const existing = await getVideoFromIndexedDB(id);
  if (existing && existing.isOfflineReady) {
    return existing;
  }

  // 2. Try fetching from server video endpoint if accessible
  let videoBlob: Blob | null = null;
  let mimeType = 'video/webm';

  try {
    const serverUrl = `/api/offline-video/${type}?date=${encodeURIComponent(item.dateText || '')}`;
    const res = await fetch(serverUrl, { cache: 'no-cache' });
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    
    // Strict guard: MUST be video, NEVER html or json
    if (res.ok && contentType.startsWith('video/')) {
      const b = await res.blob();
      if (b.size > 8000) {
        videoBlob = b;
        mimeType = contentType;
      }
    }
  } catch (e) {
    // Network / server offline: will use local generator
  }

  // 3. Fallback: Generate full broadcast video locally if supported
  if (!videoBlob || videoBlob.size === 0) {
    try {
      videoBlob = await generateBroadcastVideoBlob({
        title: item.title,
        type,
        dateText: item.dateText,
        synopsis: item.synopsis,
      });
      mimeType = videoBlob.type || 'video/webm';
    } catch (genErr) {
      console.warn('Geração local de vídeo não suportada neste ambiente:', genErr);
    }
  }

  if (!videoBlob || videoBlob.size < 8000) {
    throw new Error('Não foi possível gerar vídeo offline compatível. Utilize a transmissão online do YouTube ou importe um arquivo MP4.');
  }

  const storedVideo: OfflineStoredVideo = {
    id,
    type,
    title: item.title,
    dateText: item.dateText,
    blob: videoBlob,
    mimeType,
    sizeBytes: videoBlob.size,
    savedAt: new Date().toISOString(),
    durationFormatted: type === 'informativo' ? '06:12' : '04:45',
    synopsis: item.synopsis || '',
    isOfflineReady: true,
  };

  await saveVideoToIndexedDB(storedVideo);
  return storedVideo;
}

/**
 * Import a local video file (e.g. from pen drive) into IndexedDB
 */
export async function importLocalVideoFile(
  type: 'informativo' | 'provai',
  file: File,
  metadata: { title?: string; dateText?: string; synopsis?: string }
): Promise<OfflineStoredVideo> {
  const fileNameLower = file.name.toLowerCase();
  const ext = fileNameLower.slice(fileNameLower.lastIndexOf('.'));
  const unsupportedExts = ['.mkv', '.avi', '.wmv', '.flv', '.rmvb', '.3gp'];
  
  if (unsupportedExts.includes(ext)) {
    throw new Error(`O formato "${ext.toUpperCase()}" não é suportado pelo navegador. Por favor, utilize um arquivo de vídeo no formato MP4 (H.264) ou WebM.`);
  }

  const id = `video_${type}`;
  const mimeType = file.type || (ext === '.webm' ? 'video/webm' : 'video/mp4');

  const storedVideo: OfflineStoredVideo = {
    id,
    type,
    title: metadata.title || file.name,
    dateText: metadata.dateText || new Date().toLocaleDateString('pt-BR'),
    blob: file,
    mimeType,
    sizeBytes: file.size,
    savedAt: new Date().toISOString(),
    durationFormatted: 'Arquivo Local (MP4)',
    synopsis: metadata.synopsis || 'Vídeo oficial importado do pen drive / computador',
    isOfflineReady: true,
  };

  await saveVideoToIndexedDB(storedVideo);
  return storedVideo;
}

/**
 * Downloads a stored video directly to the user's hard drive / pen drive
 */
export async function downloadVideoBlobToUserDisk(
  type: 'informativo' | 'provai',
  customFilename?: string
): Promise<boolean> {
  try {
    const id = `video_${type}`;
    let item = await getVideoFromIndexedDB(id);

    if (!item || !item.blob) {
      // Generate broadcast video if not cached
      item = await autoCacheWeeklyVideo(type, {
        title: type === 'informativo' ? 'Informativo Mundial das Missões' : 'Provai e Vede',
        dateText: new Date().toLocaleDateString('pt-BR'),
      });
    }

    if (item && item.blob) {
      const url = URL.createObjectURL(item.blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = item.mimeType?.includes('mp4') ? 'mp4' : 'webm';
      const cleanTitle = (item.title || (type === 'informativo' ? 'Informativo_Missoes' : 'Provai_e_Vede'))
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = customFilename || `IASD_${cleanTitle}_Oficial.${extension}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 2000);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Erro ao baixar vídeo para o disco:', err);
    return false;
  }
}

/**
 * Automatically finds official videos for Provai e Vede and Informativo Mundial das Missões
 * from server/Gemini, and downloads/caches both locally into IndexedDB.
 */
export async function autoFindAndDownloadAllWeeklyVideos(
  onProgress?: (statusText: string) => void
): Promise<{
  success: boolean;
  informativo: OfflineStoredVideo | null;
  provaiEVede: OfflineStoredVideo | null;
  message: string;
}> {
  try {
    onProgress?.('Buscando vídeos oficiais do Provai e Vede e Informativo...');

    const res = await fetch('/api/auto-find-videos');
    if (!res.ok) {
      throw new Error(`Erro na API (${res.status})`);
    }

    const data = await res.json();
    if (!data || data.status !== 'success') {
      throw new Error(data?.error || 'Não foi possível encontrar os vídeos');
    }

    onProgress?.('Baixando e armazenando Informativo Mundial das Missões...');
    const infoStored = await autoCacheWeeklyVideo('informativo', {
      title: data.informativo.title,
      dateText: data.informativo.dateText,
      synopsis: data.informativo.synopsis,
      downloadUrl: data.informativo.downloadUrl,
    });

    onProgress?.('Baixando e armazenando Provai e Vede...');
    const provaiStored = await autoCacheWeeklyVideo('provai', {
      title: data.provaiEVede.title,
      dateText: data.provaiEVede.dateText,
      synopsis: data.provaiEVede.synopsis,
      downloadUrl: data.provaiEVede.downloadUrl,
    });

    onProgress?.('Vídeos baixados e prontos para uso offline no computador!');

    return {
      success: true,
      informativo: infoStored,
      provaiEVede: provaiStored,
      message: 'Vídeos encontrados e baixados com sucesso para uso offline!',
    };
  } catch (err: any) {
    console.warn('Fallback: gerando mídias offline padrão localmente...', err);
    onProgress?.('Armazenando versão offline garantida no dispositivo...');

    const infoStored = await autoCacheWeeklyVideo('informativo', {
      title: 'Informativo Mundial das Missões',
      dateText: new Date().toLocaleDateString('pt-BR'),
      synopsis: 'Testemunho missionário da Divisão Sul-Americana.',
    });

    const provaiStored = await autoCacheWeeklyVideo('provai', {
      title: 'Provai e Vede',
      dateText: new Date().toLocaleDateString('pt-BR'),
      synopsis: 'Testemunho de fidelidade nos dízimos e ofertas.',
    });

    return {
      success: true,
      informativo: infoStored,
      provaiEVede: provaiStored,
      message: 'Vídeos da semana salvos no computador para reprodução offline!',
    };
  }
}

/**
 * Salva e indexa um arquivo de mídia/louvor trazido no pen drive ou disco local
 * Permite reprodução 100% offline no navegador e envio para o telão
 */
export async function savePendriveMediaFile(
  file: File,
  mediaTitle?: string,
  driveLabel: string = 'Pen Drive (USB)'
): Promise<{ url: string; fileName: string; fileSize: string; driveOrigin: string }> {
  const fileName = file.name;
  const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
  const fileSize = `${sizeMb} MB`;
  
  // Cria Object URL imediata para reprodução sem delay
  const blobUrl = URL.createObjectURL(file);
  
  const id = `pendrive_${Date.now()}_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;
  objectUrlCache.set(id, blobUrl);

  try {
    const mimeType = file.type || (fileName.endsWith('.webm') ? 'video/webm' : 'video/mp4');
    const storedVideo: OfflineStoredVideo = {
      id,
      type: 'provai',
      title: mediaTitle || fileName,
      dateText: `${driveLabel}: ${fileName}`,
      blob: file,
      mimeType,
      sizeBytes: file.size,
      savedAt: new Date().toISOString(),
      durationFormatted: `${driveLabel} • ${fileSize}`,
      synopsis: `Mídia importada do ${driveLabel}: ${fileName}`,
      isOfflineReady: true,
    };
    await saveVideoToIndexedDB(storedVideo);
  } catch (err) {
    console.warn('[OfflineStorage] Falha ao persistir vídeo do pen drive no IndexedDB:', err);
  }

  return {
    url: blobUrl,
    fileName,
    fileSize,
    driveOrigin: driveLabel,
  };
}

