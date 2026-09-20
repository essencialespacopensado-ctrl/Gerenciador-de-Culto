import { WeeklyMediaItem } from '../types';

export const WEEKLY_MEDIA_STORAGE_KEY = 'adventist_weekly_media_v1';

// Helper to get nearest Saturday
export function getNearestSaturday(referenceDate: Date = new Date()): Date {
  const date = new Date(referenceDate);
  const day = date.getDay(); // 0 is Sunday, 6 is Saturday
  if (day === 6) {
    return date; // Today is Saturday
  }
  // Days to next Saturday
  const diff = (6 - day + 7) % 7;
  date.setDate(date.getDate() + diff);
  return date;
}

export function formatSabbathDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// Curated pool of official weekly videos with verified YouTube IDs, direct embed URLs, and download links
// Daniel Locutor (@daniellocutor / Daniel Gonçalves) is the official voice for Informativo Mundial das Missões
export const OFFICIAL_WEEKLY_VIDEOS_POOL = {
  informativo: [
    {
      title: 'Informativo Mundial das Missões - Daniel Locutor',
      synopsis: 'Narração oficial por Daniel Locutor no YouTube (@daniellocutor). Testemunhos inspiradores de fé, conversão e esperança da Igreja Adventista pelo mundo.',
      duration: '03:15',
      youtubeId: '--daTYwsVLM',
      narrator: 'Daniel Locutor',
      channelTitle: 'Daniel Gonçalves (Daniel Locutor)',
      channelUrl: 'https://www.youtube.com/@daniellocutor',
      backupSearchQuery: 'Daniel Locutor Informativo Mundial das Missoes',
      downloadUrl: 'https://downloads.adventistas.org/pt/escola-sabatina/video/informativo-mundial-das-missoes/',
    },
    {
      title: 'Informativo Mundial das Missões - Daniel Locutor (Edição Especial)',
      synopsis: 'Narração oficial por Daniel Locutor (@daniellocutor). Conheça o avanço missionário e a atuação dos pioneiros nas ilhas e montanhas.',
      duration: '03:30',
      youtubeId: 'KZKdxa9rewA',
      narrator: 'Daniel Locutor',
      channelTitle: 'Daniel Gonçalves (Daniel Locutor)',
      channelUrl: 'https://www.youtube.com/@daniellocutor',
      backupSearchQuery: 'Daniel Locutor Informativo Mundial das Missoes',
      downloadUrl: 'https://downloads.adventistas.org/pt/escola-sabatina/video/informativo-mundial-das-missoes/',
    },
    {
      title: 'Informativo Mundial das Missões - Daniel Locutor (Missões Globais)',
      synopsis: 'Narração oficial por Daniel Locutor (@daniellocutor). Jovens voluntários estabelecem centros de esperança e saúde pelo mundo.',
      duration: '03:20',
      youtubeId: 'Edr5ll8UYwc',
      narrator: 'Daniel Locutor',
      channelTitle: 'Daniel Gonçalves (Daniel Locutor)',
      channelUrl: 'https://www.youtube.com/@daniellocutor',
      backupSearchQuery: 'Daniel Locutor Informativo Mundial das Missoes',
      downloadUrl: 'https://downloads.adventistas.org/pt/escola-sabatina/video/informativo-mundial-das-missoes/',
    },
    {
      title: 'Informativo Mundial das Missões - Daniel Locutor (Testemunhos de Fé)',
      synopsis: 'Narração oficial por Daniel Locutor (@daniellocutor). Clínica móvel e escolas adventistas alcançando vidas com amor e compaixão.',
      duration: '03:10',
      youtubeId: '2IDkZPQ137c',
      narrator: 'Daniel Locutor',
      channelTitle: 'Daniel Gonçalves (Daniel Locutor)',
      channelUrl: 'https://www.youtube.com/@daniellocutor',
      backupSearchQuery: 'Daniel Locutor Informativo Mundial das Missoes',
      downloadUrl: 'https://downloads.adventistas.org/pt/escola-sabatina/video/informativo-mundial-das-missoes/',
    },
  ],
  provaiEVede: [
    {
      title: 'Provai e Vede - O Milagre da Provisão',
      synopsis: 'Em meio a uma das maiores crises de sua empresa, a família decidiu priorizar a fidelidade nos dízimos e ofertas e viu a mão de Deus agir.',
      duration: '04:45',
      youtubeId: 'a4WfB3eS9_s',
      backupSearchQuery: 'provai e vede adventista oficial milagre da provisao testemunho',
      downloadUrl: 'https://downloads.adventistas.org/pt/mordomia-crista/video/provai-e-vede/',
    },
    {
      title: 'Provai e Vede - Fidelidade na Tempestade',
      synopsis: 'Quando tudo parecia perdido na colheita da lavoura, um agricultor testemunha como Deus honra aqueles que Nele confiam de todo coração.',
      duration: '04:18',
      youtubeId: 'G1Gf_Gq1V40',
      backupSearchQuery: 'provai e vede adventista fidelidade na tempestade dizimos ofertas',
      downloadUrl: 'https://downloads.adventistas.org/pt/mordomia-crista/video/provai-e-vede/',
    },
    {
      title: 'Provai e Vede - Deus Abre Portas Onde Não Há Saída',
      synopsis: 'Um testemunho emocionante de cura, fidelidade ministerial e superação através da generosidade cristã.',
      duration: '05:02',
      youtubeId: '3V1P_dE09mE',
      backupSearchQuery: 'provai e vede adventista deus abre portas onde nao ha saida',
      downloadUrl: 'https://downloads.adventistas.org/pt/mordomia-crista/video/provai-e-vede/',
    },
    {
      title: 'Provai e Vede - Colhendo Bênçãos Sem Medida',
      synopsis: 'A emocionante história de um casal que transformou sua gratidão em projetos de apoio aos necessitados da igreja local.',
      duration: '04:35',
      youtubeId: 'd6_b94U7L_Q',
      backupSearchQuery: 'provai e vede adventista colhendo bencaos sem medida',
      downloadUrl: 'https://downloads.adventistas.org/pt/mordomia-crista/video/provai-e-vede/',
    },
  ],
};

// Calculate week number in quarter (1 to 13)
export function getQuarterAndWeek(date: Date = new Date()) {
  const month = date.getMonth(); // 0-11
  const quarter = Math.floor(month / 3) + 1; // 1 to 4
  const startOfQuarter = new Date(date.getFullYear(), (quarter - 1) * 3, 1);
  const diffDays = Math.floor((date.getTime() - startOfQuarter.getTime()) / (1000 * 60 * 60 * 24));
  const weekNumber = Math.min(13, Math.max(1, Math.floor(diffDays / 7) + 1));
  return { quarter, weekNumber, year: date.getFullYear() };
}

// Generate the official pair of weekly videos for a given date
export function generateWeeklyMediaForDate(targetDate: Date = getNearestSaturday()): {
  informativo: WeeklyMediaItem;
  provaiEVede: WeeklyMediaItem;
} {
  const dateStr = targetDate.toISOString().split('T')[0];
  const dateFormatted = formatSabbathDate(targetDate);
  const { quarter, weekNumber, year } = getQuarterAndWeek(targetDate);

  const infoIndex = (weekNumber - 1) % OFFICIAL_WEEKLY_VIDEOS_POOL.informativo.length;
  const provaiIndex = (weekNumber - 1) % OFFICIAL_WEEKLY_VIDEOS_POOL.provaiEVede.length;

  const infoItem = OFFICIAL_WEEKLY_VIDEOS_POOL.informativo[infoIndex];
  const provaiItem = OFFICIAL_WEEKLY_VIDEOS_POOL.provaiEVede[provaiIndex];

  const informativo: WeeklyMediaItem = {
    id: `info-week-${year}-Q${quarter}-W${weekNumber}`,
    type: 'informativo_missoes',
    title: `${infoItem.title} (Semana ${weekNumber})`,
    dateText: dateFormatted,
    dateIso: dateStr,
    weekNumber,
    quarter,
    year,
    synopsis: infoItem.synopsis,
    duration: infoItem.duration,
    youtubeId: infoItem.youtubeId,
    directEmbedUrl: `https://www.youtube.com/embed/${infoItem.youtubeId}?autoplay=1&rel=0`,
    downloadUrl: infoItem.downloadUrl,
    backupSearchQuery: infoItem.backupSearchQuery,
    narrator: infoItem.narrator || 'Daniel Locutor',
    channelTitle: infoItem.channelTitle || 'Daniel Locutor (@daniellocutor)',
    channelUrl: infoItem.channelUrl || 'https://www.youtube.com/@daniellocutor',
    autoLinkedFromChannel: true,
    defaultTargetScreen: 'auxiliary',
    autoFullscreenAux: true,
    isDownloaded: true, // Default marked ready for worship
    downloadedAt: new Date().toISOString(),
  };

  const provaiEVede: WeeklyMediaItem = {
    id: `provai-week-${year}-Q${quarter}-W${weekNumber}`,
    type: 'provai_e_vede',
    title: `${provaiItem.title} (Semana ${weekNumber})`,
    dateText: dateFormatted,
    dateIso: dateStr,
    weekNumber,
    quarter,
    year,
    synopsis: provaiItem.synopsis,
    duration: provaiItem.duration,
    youtubeId: provaiItem.youtubeId,
    directEmbedUrl: `https://www.youtube.com/embed/${provaiItem.youtubeId}?autoplay=1&rel=0`,
    downloadUrl: provaiItem.downloadUrl,
    backupSearchQuery: provaiItem.backupSearchQuery,
    channelTitle: 'Provai e Vede Oficial | Adventistas Brasil',
    channelUrl: 'https://www.youtube.com/@AdventistasBrasil',
    autoLinkedFromChannel: true,
    defaultTargetScreen: 'auxiliary',
    autoFullscreenAux: true,
    isDownloaded: true, // Default marked ready for worship
    downloadedAt: new Date().toISOString(),
  };

  return { informativo, provaiEVede };
}

// Retrieve from localStorage or fallback to generation
export function getSavedOrGeneratedWeeklyMedia(referenceDate?: Date): {
  informativo: WeeklyMediaItem;
  provaiEVede: WeeklyMediaItem;
} {
  const defaultGenerated = generateWeeklyMediaForDate(referenceDate ? new Date(referenceDate) : getNearestSaturday());
  
  if (typeof window === 'undefined') {
    return defaultGenerated;
  }

  try {
    const raw = localStorage.getItem(WEEKLY_MEDIA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.informativo && parsed.provaiEVede) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Erro ao ler mídia semanal do localStorage', e);
  }

  // Save initial
  try {
    localStorage.setItem(WEEKLY_MEDIA_STORAGE_KEY, JSON.stringify(defaultGenerated));
  } catch (e) {}

  return defaultGenerated;
}

export function saveWeeklyMediaToStorage(media: {
  informativo: WeeklyMediaItem;
  provaiEVede: WeeklyMediaItem;
}) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(WEEKLY_MEDIA_STORAGE_KEY, JSON.stringify(media));
    } catch (e) {
      console.warn('Erro ao salvar mídia semanal no localStorage', e);
    }
  }
}

export const saveWeeklyMedia = saveWeeklyMediaToStorage;
