import { WeeklySearchSlot, WeeklyMediaItem } from '../types';

export const WEEKLY_SEARCH_STORAGE_KEY = 'iasd_weekly_search_config_v2';

export const DEFAULT_WEEKLY_SEARCH_SLOTS: WeeklySearchSlot[] = [
  {
    id: 'slot-informativo',
    key: 'informativo',
    name: 'Informativo Mundial das Missões',
    category: 'escola_sabatina',
    channelName: 'Daniel Locutor (@daniellocutor)',
    channelUrl: 'https://www.youtube.com/@daniellocutor',
    searchQueryTemplate: 'Daniel Locutor Informativo Mundial das Missoes',
    autoLink: true,
    defaultTargetScreen: 'auxiliary', // Reproduzir no telão
    autoFullscreenAux: true, // Já abre em tela cheia nas outras telas
    activeVideoId: 'KZKdxa9rewA',
    activeVideoTitle: 'Informativo Mundial das Missões | Daniel Locutor',
    activeDuration: '02:43',
    thumbnailUrl: 'https://img.youtube.com/vi/KZKdxa9rewA/hqdefault.jpg',
    enabled: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'slot-provai',
    key: 'provai',
    name: 'Dízimos e Ofertas (Provai e Vede)',
    category: 'culto_divino',
    channelName: 'Provai e Vede Oficial | Adventistas Brasil',
    channelUrl: 'https://www.youtube.com/@AdventistasBrasil',
    searchQueryTemplate: 'Provai e Vede Oficial Adventistas Brasil',
    autoLink: true,
    defaultTargetScreen: 'auxiliary',
    autoFullscreenAux: true,
    activeVideoId: 'xP4edlDm5Ao',
    activeVideoTitle: 'Provai e Vede Oficial | Adventistas Brasil',
    activeDuration: '05:16',
    thumbnailUrl: 'https://img.youtube.com/vi/xP4edlDm5Ao/hqdefault.jpg',
    enabled: true,
    updatedAt: new Date().toISOString(),
  },
];

export function getWeeklySearchSlots(): WeeklySearchSlot[] {
  if (typeof window === 'undefined') return DEFAULT_WEEKLY_SEARCH_SLOTS;

  try {
    const raw = localStorage.getItem(WEEKLY_SEARCH_STORAGE_KEY);
    if (raw) {
      const parsed: WeeklySearchSlot[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Self-heal: ensure known broken IDs from older test builds get updated
        const healed = parsed.map(slot => {
          if (slot.key === 'informativo' && (!slot.activeVideoId || slot.activeVideoId.includes('b7m') || slot.activeVideoId === 'm9vK5bX-q_k')) {
            return { ...slot, activeVideoId: 'KZKdxa9rewA', thumbnailUrl: 'https://img.youtube.com/vi/KZKdxa9rewA/hqdefault.jpg' };
          }
          if (slot.key === 'provai' && (!slot.activeVideoId || slot.activeVideoId.includes('a4W') || slot.activeVideoId === 'p7rK2bX-v_k')) {
            return { ...slot, activeVideoId: 'xP4edlDm5Ao', thumbnailUrl: 'https://img.youtube.com/vi/xP4edlDm5Ao/hqdefault.jpg' };
          }
          return slot;
        });
        return healed;
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar slots de busca semanal', err);
  }

  // Save default on first load
  saveWeeklySearchSlots(DEFAULT_WEEKLY_SEARCH_SLOTS);
  return DEFAULT_WEEKLY_SEARCH_SLOTS;
}

export function saveWeeklySearchSlots(slots: WeeklySearchSlot[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WEEKLY_SEARCH_STORAGE_KEY, JSON.stringify(slots));
  } catch (err) {
    console.warn('Erro ao salvar slots de busca semanal', err);
  }
}

export interface LiveSearchResultItem {
  videoId: string;
  title: string;
  channel: string;
  duration?: string;
  thumbnail?: string;
  published?: string;
  embedUrl: string;
  watchUrl: string;
}

export interface SearchWeeklyVideoResponse {
  status: string;
  query: string;
  videos: LiveSearchResultItem[];
  topResult: LiveSearchResultItem | null;
}

/**
 * Searches YouTube in real-time through the server endpoint,
 * resolving the newest video from Daniel Locutor or custom channels.
 */
export async function searchWeeklyVideoOnInternet(
  query: string
): Promise<SearchWeeklyVideoResponse> {
  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(`/api/search-weekly-videos?q=${encoded}`);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok' && data.videos) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Falha na busca remota do YouTube, usando fallback local', err);
  }

  // Local fallback if server search fails
  const fallbackId = query.toLowerCase().includes('daniel')
    ? '--daTYwsVLM'
    : query.toLowerCase().includes('provai')
    ? 'xP4edlDm5Ao'
    : 'KZKdxa9rewA';

  const fallbackTitle = query.toLowerCase().includes('daniel')
    ? 'Informativo Mundial das Missões | Daniel Locutor'
    : query.toLowerCase().includes('provai')
    ? 'Provai e Vede Oficial | Adventistas Brasil'
    : 'Vídeo Oficial da Semana';

  const fallbackItem: LiveSearchResultItem = {
    videoId: fallbackId,
    title: fallbackTitle,
    channel: query.toLowerCase().includes('daniel') ? 'Daniel Locutor' : 'Adventistas Brasil',
    duration: '03:15',
    thumbnail: `https://img.youtube.com/vi/${fallbackId}/hqdefault.jpg`,
    embedUrl: `https://www.youtube.com/embed/${fallbackId}?autoplay=1&rel=0`,
    watchUrl: `https://www.youtube.com/watch?v=${fallbackId}`,
  };

  return {
    status: 'fallback',
    query,
    videos: [fallbackItem],
    topResult: fallbackItem,
  };
}

/**
 * Applies a search slot result directly to a WeeklyMediaItem
 */
export function applySlotToMediaItem(
  item: WeeklyMediaItem,
  slot: WeeklySearchSlot
): WeeklyMediaItem {
  if (!slot.activeVideoId) return item;

  return {
    ...item,
    title: slot.activeVideoTitle || item.title,
    youtubeId: slot.activeVideoId,
    directEmbedUrl: `https://www.youtube.com/embed/${slot.activeVideoId}?autoplay=1&rel=0`,
    narrator: slot.channelName.toLowerCase().includes('daniel') ? 'Daniel Locutor' : item.narrator,
    channelTitle: slot.channelName,
    channelUrl: slot.channelUrl,
    backupSearchQuery: slot.searchQueryTemplate,
    autoLinkedFromChannel: slot.autoLink,
    defaultTargetScreen: slot.defaultTargetScreen,
    autoFullscreenAux: slot.autoFullscreenAux,
  };
}
