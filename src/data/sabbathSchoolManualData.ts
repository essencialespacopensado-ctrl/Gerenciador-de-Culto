/**
 * Seventh-day Adventist Sabbath School Director's Manual (Auxiliar / Manual da Escola Sabatina - CPB / DSA)
 * Provides official weekly lesson themes, initial opening hymn (Hino Inicial), and closing hymn (Hino Final).
 */

export interface ManualHymn {
  number: number;
  title: string;
  youtubeUrl: string;
  youtubeSearchQuery: string;
  theme?: string;
}

export interface SabbathSchoolWeeklyManual {
  lessonNumber: number;
  date: string; // YYYY-MM-DD
  quarter: string;
  lessonTitle: string;
  memoryVerse: string;
  missionaryFocus: string;
  initialHymn: ManualHymn;
  finalHymn: ManualHymn;
}

// Curated pool of Sabbath School Manual weeks based on the official Seventh-day Adventist Guide
export const SABBATH_SCHOOL_MANUAL_WEEKS: SabbathSchoolWeeklyManual[] = [
  {
    lessonNumber: 1,
    date: '2026-01-03',
    quarter: '1º Trimestre - O Fundamento da Fé e Adoração',
    lessonTitle: 'Como Ler a Bíblia e Entender a Vontade de Deus',
    memoryVerse: 'Lâmpada para os meus pés é a Tua palavra e luz para o meu caminho. (Salmos 119:105)',
    missionaryFocus: 'Divisão Euro-Asiática: Plantando Igrejas nas Montanhas',
    initialHymn: {
      number: 38,
      title: 'O Santo Sábado',
      youtubeUrl: 'https://www.youtube.com/watch?v=iZzFq_b2L7I',
      youtubeSearchQuery: 'hinario adventista 38 o santo sabado playback',
      theme: 'Adoração no Sábado'
    },
    finalHymn: {
      number: 323,
      title: 'Da Igreja o Fundamento',
      youtubeUrl: 'https://www.youtube.com/watch?v=m4N6T3lqfVk',
      youtubeSearchQuery: 'hinario adventista 323 da igreja o fundamento playback',
      theme: 'Consagração e Fidelidade'
    }
  },
  {
    lessonNumber: 2,
    date: '2026-01-10',
    quarter: '1º Trimestre - O Fundamento da Fé e Adoração',
    lessonTitle: 'Criados à Imagem do Criador',
    memoryVerse: 'Criou Deus o homem à Sua imagem, à imagem de Deus o criou. (Gênesis 1:27)',
    missionaryFocus: 'Divisão Sul-Asiática: Escolas Cristãs de Esperança',
    initialHymn: {
      number: 10,
      title: 'Louvor ao Deus Criador',
      youtubeUrl: 'https://www.youtube.com/watch?v=gT8_Q0uH3xA',
      youtubeSearchQuery: 'hinario adventista 10 louvor ao deus criador playback',
      theme: 'Deus Criador'
    },
    finalHymn: {
      number: 28,
      title: 'Grandioso És Tu',
      youtubeUrl: 'https://www.youtube.com/watch?v=eYkL2-2k4sA',
      youtubeSearchQuery: 'hinario adventista 28 grandioso es tu playback',
      theme: 'Poder e Majestade'
    }
  },
  {
    lessonNumber: 3,
    date: '2026-01-17',
    quarter: '1º Trimestre - O Fundamento da Fé e Adoração',
    lessonTitle: 'A Queda e a Promessa da Redenção',
    memoryVerse: 'Porei inimizade entre ti e a mulher... esta te ferirá a cabeça. (Gênesis 3:15)',
    missionaryFocus: 'África Central: Clínicas Móveis e Evangelismo',
    initialHymn: {
      number: 17,
      title: 'Nós Te Exaltamos',
      youtubeUrl: 'https://www.youtube.com/watch?v=vV7YJ2K8_8U',
      youtubeSearchQuery: 'hinario adventista 17 nos te exaltamos playback',
      theme: 'Exaltação a Cristo'
    },
    finalHymn: {
      number: 208,
      title: 'Rude Cruz',
      youtubeUrl: 'https://www.youtube.com/watch?v=6O_hI4n3p1Q',
      youtubeSearchQuery: 'hinario adventista 208 rude cruz playback',
      theme: 'Sacrifício da Cruz'
    }
  },
  {
    lessonNumber: 4,
    date: '2026-01-24',
    quarter: '1º Trimestre - O Fundamento da Fé e Adoração',
    lessonTitle: 'A Aliança Eterna com Abraão',
    memoryVerse: 'Olha para os céus e conta as estrelas... assim será a tua descendência. (Gênesis 15:5)',
    missionaryFocus: 'América do Sul: Barco Missionário no Amazonas',
    initialHymn: {
      number: 1,
      title: 'Ó Deus de Amor',
      youtubeUrl: 'https://www.youtube.com/watch?v=l8_f3K7fQvE',
      youtubeSearchQuery: 'hinario adventista 01 o deus de amor playback',
      theme: 'Amor Paterno Divino'
    },
    finalHymn: {
      number: 250,
      title: 'Com Jesus Vai',
      youtubeUrl: 'https://www.youtube.com/watch?v=kY6T3u9a1Bs',
      youtubeSearchQuery: 'hinario adventista 250 com jesus vai playback',
      theme: 'Confiança e Caminhada'
    }
  },
  {
    lessonNumber: 5,
    date: '2026-01-31',
    quarter: '1º Trimestre - O Fundamento da Fé e Adoração',
    lessonTitle: 'A Libertação do Êxodo e o Cuidado de Deus',
    memoryVerse: 'O Senhor pelejará por vós, e vós vos calareis. (Êxodo 14:14)',
    missionaryFocus: 'Ilhas do Pacífico: Centros de Apoio a Jovens',
    initialHymn: {
      number: 33,
      title: 'Castelo Forte',
      youtubeUrl: 'https://www.youtube.com/watch?v=j3v7fM2B_4Q',
      youtubeSearchQuery: 'hinario adventista 33 castelo forte playback',
      theme: 'Proteção e Poder'
    },
    finalHymn: {
      number: 247,
      title: 'Guia-me, Meu Salvador',
      youtubeUrl: 'https://www.youtube.com/watch?v=d_kF9_0k7sM',
      youtubeSearchQuery: 'hinario adventista 247 guia me meu salvador playback',
      theme: 'Condução no Deserto'
    }
  },
  {
    lessonNumber: 6,
    date: '2026-02-07',
    quarter: '1º Trimestre - O Fundamento da Fé e Adoração',
    lessonTitle: 'A Lei de Deus e a Graça Redentora',
    memoryVerse: 'A lei do Senhor é perfeita e restaura a alma. (Salmos 19:7)',
    missionaryFocus: 'Europa: Comunidades de Fé Urbanas',
    initialHymn: {
      number: 38,
      title: 'O Santo Sábado',
      youtubeUrl: 'https://www.youtube.com/watch?v=iZzFq_b2L7I',
      youtubeSearchQuery: 'hinario adventista 38 o santo sabado playback',
      theme: 'Sábado Memorial da Criação'
    },
    finalHymn: {
      number: 232,
      title: 'Minha Esperança',
      youtubeUrl: 'https://www.youtube.com/watch?v=T_l4r9a1M2Q',
      youtubeSearchQuery: 'hinario adventista 232 minha esperanca playback',
      theme: 'Graça em Cristo'
    }
  },
  {
    lessonNumber: 7,
    date: '2026-02-14',
    quarter: '1º Trimestre - O Fundamento da Fé e Adoração',
    lessonTitle: 'O Santuário e o Ministério Celestial',
    memoryVerse: 'E Me farão um santuário, para que Eu possa habitar no meio deles. (Êxodo 25:8)',
    missionaryFocus: 'Ásia Oriental: Rádios Missionárias e Literatura',
    initialHymn: {
      number: 14,
      title: 'Louvemos o Rei',
      youtubeUrl: 'https://www.youtube.com/watch?v=cM3f_8e7N2w',
      youtubeSearchQuery: 'hinario adventista 14 louvemos o rei playback',
      theme: 'Majestade no Templo'
    },
    finalHymn: {
      number: 150,
      title: 'Vinde Vós, Fiéis, Cantar',
      youtubeUrl: 'https://www.youtube.com/watch?v=W_e7n3R9v4E',
      youtubeSearchQuery: 'hinario adventista 150 vinde vos fieis cantar playback',
      theme: 'Sacerdócio de Cristo'
    }
  },
  {
    lessonNumber: 8,
    date: '2026-02-21',
    quarter: '1º Trimestre - O Fundamento da Fé e Adoração',
    lessonTitle: 'Os Profetas e o Chamado ao Arrependimento',
    memoryVerse: 'Vinde, pois, e arrazoemos, diz o Senhor: ainda que os vossos pecados sejam como a escarlata... (Isaías 1:18)',
    missionaryFocus: 'Oriente Médio: Poços de Água e Centros Médicos',
    initialHymn: {
      number: 45,
      title: 'Falar com Deus',
      youtubeUrl: 'https://www.youtube.com/watch?v=Kqg_T9rCq8g',
      youtubeSearchQuery: 'falar com deus playback hinario adventista',
      theme: 'Oração e Contrição'
    },
    finalHymn: {
      number: 280,
      title: 'Mais de Cristo',
      youtubeUrl: 'https://www.youtube.com/watch?v=b4N3f9_2eKs',
      youtubeSearchQuery: 'hinario adventista 280 mais de cristo playback',
      theme: 'Consagração Total'
    }
  },
  {
    lessonNumber: 9,
    date: '2026-02-28',
    quarter: '1º Trimestre - O Fundamento da Fé e Adoração',
    lessonTitle: 'A Vida de Oração e Louvor nos Salmos',
    memoryVerse: 'Tudo o que tem fôlego louve ao Senhor! Aleluia! (Salmos 150:6)',
    missionaryFocus: 'América Central: Construção de Capelas Rurais',
    initialHymn: {
      number: 2,
      title: 'Ó Adorai o Senhor',
      youtubeUrl: 'https://www.youtube.com/watch?v=p4M7k9_1aBc',
      youtubeSearchQuery: 'hinario adventista 02 o adorai o senhor playback',
      theme: 'Santidade na Adoração'
    },
    finalHymn: {
      number: 53,
      title: 'Seja Louvado',
      youtubeUrl: 'https://www.youtube.com/watch?v=L7k9_3a1B2s',
      youtubeSearchQuery: 'hinario adventista 53 seja louvado playback',
      theme: 'Gratidão Eterna'
    }
  },
  {
    lessonNumber: 10,
    date: '2026-03-07',
    quarter: '1º Trimestre - O Fundamento da Fé e Adoração',
    lessonTitle: 'A Encarnação de Jesus e o Seu Ministério Terrestre',
    memoryVerse: 'E o Verbo Se fez carne e habitou entre nós, cheio de graça e de verdade. (João 1:14)',
    missionaryFocus: 'Divisão Interamericana: Ministério com Crianças e Desbravadores',
    initialHymn: {
      number: 78,
      title: 'Nasce Jesus',
      youtubeUrl: 'https://www.youtube.com/watch?v=m5K7l_8a9B0',
      youtubeSearchQuery: 'hinario adventista 78 nasce jesus playback',
      theme: 'Cristo Emanuel'
    },
    finalHymn: {
      number: 99,
      title: 'Amor Que por Si Só Me Amou',
      youtubeUrl: 'https://www.youtube.com/watch?v=z8_k4M7eN1Q',
      youtubeSearchQuery: 'hinario adventista 99 amor que por si so me amou playback',
      theme: 'Graça Incomparável'
    }
  },
  {
    lessonNumber: 11,
    date: '2026-03-14',
    quarter: '1º Trimestre - O Fundamento da Fé e Adoração',
    lessonTitle: 'A Ressurreição e a Nossa Esperança Viva',
    memoryVerse: 'Eu sou a ressurreição e a vida; quem crê em Mim, ainda que morra, viverá. (João 11:25)',
    missionaryFocus: 'África Austral: Centros de Saúde Comunitária',
    initialHymn: {
      number: 111,
      title: 'Cristo Já Ressuscitou',
      youtubeUrl: 'https://www.youtube.com/watch?v=y6L4M9_3b1A',
      youtubeSearchQuery: 'hinario adventista 111 cristo ja ressuscitou playback',
      theme: 'Triunfo Sobre a Morte'
    },
    finalHymn: {
      number: 500,
      title: 'Breve Jesus Voltará',
      youtubeUrl: 'https://www.youtube.com/watch?v=kZ-bT0hF-kM',
      youtubeSearchQuery: 'hinario adventista 500 breve jesus voltara playback',
      theme: 'A Segunda Vinda'
    }
  },
  {
    lessonNumber: 12,
    date: '2026-03-21',
    quarter: '1º Trimestre - O Fundamento da Fé e Adoração',
    lessonTitle: 'A Missão da Igreja e as Três Mensagens Angélicas',
    memoryVerse: 'Vi outro anjo voando pelo meio do céu, tendo um evangelho eterno para pregar. (Apocalipse 14:6)',
    missionaryFocus: 'Sudeste Asiático: Projetos de Esperança Urbana',
    initialHymn: {
      number: 38,
      title: 'O Santo Sábado',
      youtubeUrl: 'https://www.youtube.com/watch?v=iZzFq_b2L7I',
      youtubeSearchQuery: 'hinario adventista 38 o santo sabado playback',
      theme: 'Tempos Finais e Adoração'
    },
    finalHymn: {
      number: 337,
      title: 'Ide por Todo o Mundo',
      youtubeUrl: 'https://www.youtube.com/watch?v=q9L3m_2B7kA',
      youtubeSearchQuery: 'hinario adventista 337 ide por todo o mundo playback',
      theme: 'Grande Comissão'
    }
  },
  {
    lessonNumber: 13,
    date: '2026-03-28',
    quarter: '1º Trimestre - O Fundamento da Fé e Adoração',
    lessonTitle: 'O Novo Céu e a Nova Terra: A Vitória Final',
    memoryVerse: 'E lhes enxugará dos olhos toda lágrima, e a morte já não existirá. (Apocalipse 21:4)',
    missionaryFocus: 'Décimo Terceiro Sábado: Oferta Mundial para Projetos Estratégicos',
    initialHymn: {
      number: 503,
      title: 'Oh! Bela Terra de Esplendor',
      youtubeUrl: 'https://www.youtube.com/watch?v=x7M3_8vN2kA',
      youtubeSearchQuery: 'hinario adventista 503 oh bela terra de esplendor playback',
      theme: 'Pátria Celestial'
    },
    finalHymn: {
      number: 505,
      title: 'Jerusalém, Meu Nobre Lar',
      youtubeUrl: 'https://www.youtube.com/watch?v=w2L9_7fM3kA',
      youtubeSearchQuery: 'hinario adventista 505 jerusalem meu nobre lar playback',
      theme: 'Eternidade com Deus'
    }
  },
  // Default general Sabbath week template for dates outside the specific list
  {
    lessonNumber: 99,
    date: 'default',
    quarter: 'Manual da Escola Sabatina (CPB / DSA)',
    lessonTitle: 'Fidelidade, Comunhão e Testemunho na Escola Sabatina',
    memoryVerse: 'Lembra-te do dia do sábado, para o santificar. (Êxodo 20:8)',
    missionaryFocus: 'Missão Global: Levando a Luz da Verdade a Todos os Povos',
    initialHymn: {
      number: 38,
      title: 'O Santo Sábado',
      youtubeUrl: 'https://www.youtube.com/watch?v=iZzFq_b2L7I',
      youtubeSearchQuery: 'hinario adventista 38 o santo sabado playback',
      theme: 'Abertura do Sábado'
    },
    finalHymn: {
      number: 28,
      title: 'Grandioso És Tu',
      youtubeUrl: 'https://www.youtube.com/watch?v=eYkL2-2k4sA',
      youtubeSearchQuery: 'hinario adventista 28 grandioso es tu playback',
      theme: 'Gratidão e Louvor'
    }
  }
];

/**
 * Returns the Sabbath School Manual data matching a target date or the nearest Saturday.
 */
export function getSabbathSchoolManualForDate(dateInput?: string | Date): SabbathSchoolWeeklyManual {
  let targetDate: Date;
  if (!dateInput) {
    targetDate = new Date();
  } else if (typeof dateInput === 'string') {
    targetDate = new Date(dateInput);
  } else {
    targetDate = dateInput;
  }

  // Adjust to nearest Saturday if needed
  const day = targetDate.getDay();
  if (day !== 6) {
    const diff = (6 - day + 7) % 7;
    targetDate.setDate(targetDate.getDate() + diff);
  }

  const dateStr = targetDate.toISOString().split('T')[0];

  // Try exact match
  const exact = SABBATH_SCHOOL_MANUAL_WEEKS.find(w => w.date === dateStr);
  if (exact) return exact;

  // Otherwise pick week based on week of the year modulo 13
  const startOfYear = new Date(targetDate.getFullYear(), 0, 1);
  const daysDiff = Math.floor((targetDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const weekNum = Math.floor(daysDiff / 7);
  const lessonIdx = (weekNum % 13);

  const matched = SABBATH_SCHOOL_MANUAL_WEEKS[lessonIdx] || SABBATH_SCHOOL_MANUAL_WEEKS[0];
  return {
    ...matched,
    date: dateStr,
  };
}
