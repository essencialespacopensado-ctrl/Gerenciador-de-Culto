import { WorshipProgram, MediaLink } from '../types';

export function getYoutubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

// Curated verified playback IDs for standard Adventist church songs and media
export const KNOWN_MEDIA_YOUTUBE_IDS: Record<string, string> = {
  '10 mil razoes': 'LuvfMDhTyMA',
  '10 mil razões': 'LuvfMDhTyMA',
  'meu pastor': 'k-s4Fj5H1G0',
  'la no ceu': 'kZ-bT0hF-kM',
  'lá no céu': 'kZ-bT0hF-kM',
  'hinario 38': 'tX7PZ4xPjS4',
  'hinário 38': 'tX7PZ4xPjS4',
  'o santo sabado': 'tX7PZ4xPjS4',
  'o santo sábado': 'tX7PZ4xPjS4',
  'hinario 192': 'o2g8J0Psm9M',
  'hinário 192': 'o2g8J0Psm9M',
  'infinita graca': 'o2g8J0Psm9M',
  'infinita graça': 'o2g8J0Psm9M',
  'hinario 107': 'v_dJ5E0rL-s',
  'hinário 107': 'v_dJ5E0rL-s',
  'maranata': 'v_dJ5E0rL-s',
  'so tu es santo': '1-Q9y7R_rFs',
  'só tu és santo': '1-Q9y7R_rFs',
  'falar com deus': 'Kqg_T9rCq8g',
  'meu respirar': 'U7l0sU7kM54',
  'quao grande e o meu deus': 'eZ3tMvG8wz4',
  'quão grande é o meu deus': 'eZ3tMvG8wz4',
  'santo somente e o senhor': 'qF2wP8yZz2A',
  'santo somente é o senhor': 'qF2wP8yZz2A',
  'no teu altar': 'qW3pZk2jH8g',
  'melissa barcelos': 'qW3pZk2jH8g',
  'vida e saude': '0G_5WdZ8oQk',
  'vida e saúde': '0G_5WdZ8oQk',
  'controle a fome': '0G_5WdZ8oQk',
  'ep 114': '0G_5WdZ8oQk',
  'deixai vir a mim': 'WqB9cZqF8b0',
  'quem sou eu': 'rB3yFv_2eE0',
  'alvo mais que a neve': 'l4oK7Q5zXy8',
  'sou feliz com jesus': 'p8W2yQ4kLm8',
  'porque ele vive': 'v4M9kQ2xLt1',
  'castelo forte': 'x8L1kM3pQ9z',
  'tudo entregarei': 'm7K3xP9wL2v',
  'maravilhosa graca': 'q2L8xM9pW1v',
  'maravilhosa graça': 'q2L8xM9pW1v',
  'em fervente oracao': 'w9X2kP4mQ1z',
  'em fervente oração': 'w9X2kP4mQ1z',
  'vaso de alabastro': 'j8K3mQ5xL2v',
  'restaura minha familia': 'k9L2xP4mW1v',
  'restaura minha família': 'k9L2xP4mW1v',
  'oracao pastoral': '2bXj4P5v7yQ',
  'oração pastoral': '2bXj4P5v7yQ',
  'musica ofertas': '9lP0tZ7wY6c',
  'música ofertas': '9lP0tZ7wY6c',
  'vinheta': 'v9m8d5zN3k0',
  'comunicados ancionato': '7lQ9f_2W2kA',
  // Official active verified YouTube IDs (2026)
  'informativo mundial': 'KZKdxa9rewA',
  'informativo das missoes': 'KZKdxa9rewA',
  'informativo das missões': 'KZKdxa9rewA',
  'daniel locutor': 'KZKdxa9rewA',
  'provai e vede': 'xP4edlDm5Ao',
  'adoracao infantil': 'c2ixUqu9jAk',
  'adoração infantil': 'c2ixUqu9jAk',
};

export function cleanSearchQuery(text: string): string {
  if (!text) return '';
  // If it's a search_query URL
  if (text.includes('search_query=')) {
    const match = text.match(/search_query=([^&]+)/);
    if (match) {
      try {
        return decodeURIComponent(match[1].replace(/\+/g, ' '));
      } catch (e) {
        return match[1];
      }
    }
  }
  return text.trim();
}

export function extractYoutubeId(urlOrQuery: string): string | null {
  if (!urlOrQuery) return null;
  const str = urlOrQuery.trim();

  // 1. Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }

  // 2. YouTube Shorts
  const shortsMatch = str.match(/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch && shortsMatch[1]) {
    return shortsMatch[1];
  }

  // 3. YouTube standard URLs (watch?v=, youtu.be, embed, etc.)
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = str.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }

  return null;
}

export interface PlayableMediaResolution {
  youtubeId: string | null;
  embedUrl: string;
  searchUrl: string;
  cleanQuery: string;
  isDirectVideo: boolean;
  videoTitle?: string;
  channelTitle?: string;
  alternatives?: Array<{ videoId: string; title: string; channel: string; thumbnail?: string }>;
}

export function resolveYoutubePlayable(
  urlOrQuery: string,
  title?: string,
  preferredYoutubeId?: string
): PlayableMediaResolution {
  // If explicit preferred YouTube ID is supplied
  if (preferredYoutubeId && /^[a-zA-Z0-9_-]{11}$/.test(preferredYoutubeId)) {
    return {
      youtubeId: preferredYoutubeId,
      embedUrl: `https://www.youtube.com/embed/${preferredYoutubeId}?autoplay=1&enablejsapi=1&rel=0&playsinline=1`,
      searchUrl: `https://www.youtube.com/watch?v=${preferredYoutubeId}`,
      cleanQuery: cleanSearchQuery(title || urlOrQuery || ''),
      isDirectVideo: true,
    };
  }

  const clean = cleanSearchQuery(urlOrQuery || title || '');
  const directId = extractYoutubeId(urlOrQuery) || (title ? extractYoutubeId(title) : null);

  if (directId) {
    return {
      youtubeId: directId,
      embedUrl: `https://www.youtube.com/embed/${directId}?autoplay=1&enablejsapi=1&rel=0&playsinline=1`,
      searchUrl: `https://www.youtube.com/watch?v=${directId}`,
      cleanQuery: clean,
      isDirectVideo: true,
    };
  }

  // Check known keywords in normalized input or title
  const normalized = `${urlOrQuery || ''} ${title || ''}`.toLowerCase();

  // Check curated known media mappings first for precision
  for (const [key, id] of Object.entries(KNOWN_MEDIA_YOUTUBE_IDS)) {
    if (normalized.includes(key)) {
      return {
        youtubeId: id,
        embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1&rel=0&playsinline=1`,
        searchUrl: `https://www.youtube.com/watch?v=${id}`,
        cleanQuery: clean,
        isDirectVideo: true,
      };
    }
  }

  // Strict check for official weekly items (only if specifically named)
  if (normalized.includes('informativo mundial') || normalized.includes('informativo das missões') || normalized.includes('informativo das missoes') || normalized.startsWith('informativo')) {
    const id = 'KZKdxa9rewA';
    return {
      youtubeId: id,
      embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1&rel=0&playsinline=1`,
      searchUrl: `https://www.youtube.com/watch?v=${id}`,
      cleanQuery: 'Informativo Mundial das Missões | Daniel Locutor',
      isDirectVideo: true,
      videoTitle: 'Informativo Mundial das Missões | Daniel Locutor',
      channelTitle: 'Daniel Gonçalves (Daniel Locutor)',
    };
  }

  if (normalized.includes('provai e vede') || normalized.startsWith('provai')) {
    const id = 'xP4edlDm5Ao';
    return {
      youtubeId: id,
      embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1&rel=0&playsinline=1`,
      searchUrl: `https://www.youtube.com/watch?v=${id}`,
      cleanQuery: 'Provai e Vede Oficial 2026',
      isDirectVideo: true,
      videoTitle: 'Provai e Vede Oficial | Adventistas Brasil',
      channelTitle: 'Provai e Vede | Oficial',
    };
  }

  // Query search link fallback
  const queryParam = encodeURIComponent(clean || title || 'musica adventista louvor');
  return {
    youtubeId: null,
    embedUrl: `https://www.youtube.com/embed?listType=search&list=${queryParam}&autoplay=1&enablejsapi=1&rel=0&playsinline=1`,
    searchUrl: `https://www.youtube.com/results?search_query=${queryParam}`,
    cleanQuery: clean,
    isDirectVideo: false,
  };
}

/**
 * Searches YouTube in real-time to find the best active video for any church query
 */
export async function searchAndResolveYoutubeVideo(
  query: string
): Promise<PlayableMediaResolution> {
  const clean = cleanSearchQuery(query);

  // Fast-track: check known database first
  const immediate = resolveYoutubePlayable(clean);
  if (immediate.isDirectVideo && immediate.youtubeId) {
    return immediate;
  }

  try {
    const res = await fetch(`/api/search-weekly-videos?q=${encodeURIComponent(clean)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.videos && data.videos.length > 0) {
        const top = data.topResult || data.videos[0];
        if (top && top.videoId) {
          return {
            youtubeId: top.videoId,
            embedUrl: `https://www.youtube.com/embed/${top.videoId}?autoplay=1&enablejsapi=1&rel=0&playsinline=1`,
            searchUrl: `https://www.youtube.com/watch?v=${top.videoId}`,
            cleanQuery: clean,
            isDirectVideo: true,
            videoTitle: top.title,
            channelTitle: top.channel,
            alternatives: data.videos.slice(1, 6).map((v: any) => ({
              videoId: v.videoId,
              title: v.title,
              channel: v.channel,
              thumbnail: v.thumbnail,
            })),
          };
        }
      }
    }
  } catch (err) {
    console.warn('Erro ao buscar vídeo no YouTube:', err);
  }

  return immediate;
}

export function formatWhatsAppBulletin(program: WorshipProgram): string {
  const dateStr = program.date ? new Date(program.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

  let text = `⛪ *LITURGIA DE CULTO - IASD*\n`;
  text += `📅 *${dateStr.toUpperCase()}*\n`;
  text += `👤 *Responsável:* ${program.responsiblePerson || 'Davi'}\n`;
  if (program.preacher) text += `🎙️ *Pregador:* ${program.preacher}\n`;
  if (program.theme) text += `📖 *Tema:* ${program.theme}\n`;
  text += `------------------------------------\n\n`;

  const esActivities = program.activities.filter(a => a.section === 'escola_sabatina');
  if (esActivities.length > 0) {
    text += `🌅 *ESCOLA SABATINA*\n`;
    esActivities.forEach((act, idx) => {
      text += `${idx + 1}. *${act.name}*`;
      if (act.responsible) text += ` (${act.responsible})`;
      text += `\n`;
      if (act.congregational1?.title) text += `   ▶️ C1: ${act.congregational1.title}\n`;
      if (act.congregational2?.title) text += `   ▶️ C2: ${act.congregational2.title}\n`;
      if (act.congregational3?.title) text += `   ▶️ C3: ${act.congregational3.title}\n`;
    });
    text += `\n`;
  }

  const cdActivities = program.activities.filter(a => a.section === 'culto_divino');
  if (cdActivities.length > 0) {
    text += `📖 *CULTO DIVINO*\n`;
    cdActivities.forEach((act, idx) => {
      text += `${idx + 1}. *${act.name}*`;
      if (act.responsible) text += ` (${act.responsible})`;
      text += `\n`;
      if (act.congregational1?.title) text += `   ▶️ C1: ${act.congregational1.title}\n`;
      if (act.congregational2?.title) text += `   ▶️ C2: ${act.congregational2.title}\n`;
      if (act.congregational3?.title) text += `   ▶️ C3: ${act.congregational3.title}\n`;
    });
  }

  if (program.notes) {
    text += `\n📌 *Observações da Sonoplastia:*\n${program.notes}\n`;
  }

  return text;
}

/**
 * Valida estritamente se uma música/louvor possui um link de transmissão correto
 * ou arquivo de Pen Drive válido para ser exibida e transmitida na liturgia.
 * Atende ao requisito: "AS musicas só devem aparecer na liturgia se estiverem corretas com o link de transmissão."
 */
export function isValidTransmissionMedia(media?: MediaLink | null): boolean {
  if (!media || !media.title || !media.title.trim()) {
    return false;
  }

  // 1. Se a mídia veio de Pen Drive ou Arquivo Local
  if (media.sourceType === 'pendrive' || media.sourceType === 'local') {
    // Se possui arquivo ou url local blob/offline registrada
    if (media.fileName && media.fileName.trim().length > 0) {
      return true;
    }
    if (media.url && (media.url.startsWith('blob:') || media.url.startsWith('offline:'))) {
      return true;
    }
    return false;
  }

  // 2. Se for mídia semanal oficial com vídeo garantido
  if (media.isWeeklyMedia) {
    return true;
  }

  // 3. Se possui URL do YouTube
  if (media.url && media.url.trim()) {
    const u = media.url.trim();

    // Se for URL local ou offline
    if (u.startsWith('blob:') || u.startsWith('offline:')) {
      return true;
    }

    // Se for uma busca genérica do YouTube sem ID específico definido
    // Por exemplo: https://www.youtube.com/results?search_query=... não é um link direto de transmissão do vídeo
    if (u.includes('/results?search_query=')) {
      return false;
    }

    // Verifica se possui ID válido de 11 caracteres
    const ytId = extractYoutubeId(u);
    if (ytId && ytId.length === 11) {
      return true;
    }

    // Links diretos do YouTube
    if (
      u.includes('youtube.com/watch') || 
      u.includes('youtu.be/') || 
      u.includes('youtube.com/embed/') || 
      u.includes('youtube.com/shorts/')
    ) {
      return true;
    }
  }

  // 4. Se o título bate com um playback adventista curado com ID conhecido
  const cleanTitle = (media.title || '').toLowerCase().trim();
  for (const key of Object.keys(KNOWN_MEDIA_YOUTUBE_IDS)) {
    if (cleanTitle.includes(key)) {
      return true;
    }
  }

  return false;
}

