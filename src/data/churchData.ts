import { WorshipProgram, Hymn, PlaybackItem, ChurchSong } from '../types';

export const INITIAL_PROGRAM: WorshipProgram = {
  id: 'programa-sabado-davi',
  title: 'Culto de Sábado - Liturgia Completa',
  date: new Date().toISOString().split('T')[0],
  responsiblePerson: 'Davi',
  preacher: 'Pastor Convidado',
  theme: 'Fidelidade e Adoração',
  specialEvent: 'Escola Sabatina & Culto Divino',
  notes: 'Sonoplastia: Testar microfones às 08:30. Vídeos do Provai e Vede já baixados.',
  updatedAt: new Date().toISOString(),
  activities: [
    // ESCOLA SABATINA
    {
      id: 'act-1',
      name: 'Momentos de louvor - Equipe Azul',
      section: 'escola_sabatina',
      category: 'louvor',
      responsible: 'Equipe Azul',
      timeSlot: '08:45',
      durationMinutes: 15,
      congregational1: {
        title: '10 mil razoes congregacional',
        url: 'https://www.youtube.com/watch?v=LuvfMDhTyMA',
        note: 'Congregacional 1'
      },
      congregational2: {
        title: 'MEU PASTOR',
        url: 'https://www.youtube.com/watch?v=95z4h2H1Uqg',
        note: 'Congregacional 2'
      },
      congregational3: {
        title: 'LÁ NO CÉU',
        url: 'https://www.youtube.com/watch?v=kZ-bT0hF-kM',
        note: 'Congregacional 3'
      },
      notes: 'Equipe Azul lidera os 3 hinos com a congregação'
    },
    {
      id: 'act-2',
      name: 'Boas vindas',
      section: 'escola_sabatina',
      category: 'abertura',
      responsible: 'Direção da ES',
      timeSlot: '09:00',
      durationMinutes: 3,
      notes: 'Acolhimento aos membros e visitantes'
    },
    {
      id: 'act-3',
      name: 'Hino inicial Escola Sabatina',
      section: 'escola_sabatina',
      category: 'louvor',
      responsible: 'Congregação',
      timeSlot: '09:03',
      durationMinutes: 4,
      congregational1: {
        title: 'Hinário 38 - O Santo Sábado',
        url: 'https://www.youtube.com/watch?v=iZzFq_b2L7I',
        note: 'Hino congregacional de abertura'
      }
    },
    {
      id: 'act-4',
      name: 'Oração de joelhos',
      section: 'escola_sabatina',
      category: 'oracao',
      responsible: 'Diretor ES',
      timeSlot: '09:07',
      durationMinutes: 4,
      congregational1: {
        title: 'FUNDO MUSICAL SÓ TU ÉS SANTO',
        url: 'https://www.youtube.com/watch?v=1-Q9y7R_rFs',
        note: 'Opção 1'
      },
      congregational2: {
        title: 'FUNDO MUSICAL FALAR COM DEUS',
        url: 'https://www.youtube.com/watch?v=Kqg_T9rCq8g',
        note: 'Opção 2'
      },
      congregational3: {
        title: 'FUNDO MUSICAL MEU RESPIRAR',
        url: 'https://www.youtube.com/watch?v=U7l0sU7kM54',
        note: 'Opção 3'
      },
      notes: 'Manter volume suave durante toda a oração'
    },
    {
      id: 'act-5',
      name: 'Informativo Mundial das Missões (Vídeo da Semana)',
      section: 'escola_sabatina',
      category: 'video',
      responsible: 'Sonoplastia',
      timeSlot: '09:11',
      durationMinutes: 6,
      congregational1: {
        title: 'Informativo Mundial das Missões - Vídeo Oficial da Semana',
        url: 'offline:informativo',
        note: 'Vídeo da Semana • Baixado no Computador (100% Offline)',
        videoDate: 'Sábado da Semana',
        isWeeklyMedia: true,
      },
      notes: 'Vídeo missionário oficial salvo no computador para exibição sem internet (sem YouTube).'
    },
    {
      id: 'act-6',
      name: 'Mensagem musical',
      section: 'escola_sabatina',
      category: 'mensagem_musical',
      responsible: 'Cantor convidado',
      timeSlot: '09:17',
      durationMinutes: 5,
      congregational1: {
        title: 'Descansar - Arautos do Rei (Playback)',
        url: 'https://www.youtube.com/watch?v=m3r0l7mP8xQ',
        note: 'Mensagem especial Escola Sabatina'
      },
      notes: 'Mensagem de louvor intermediária'
    },
    {
      id: 'act-7',
      name: 'Introdução - Estudo da Lição',
      section: 'escola_sabatina',
      category: 'geral',
      responsible: 'Professores da ES',
      timeSlot: '09:22',
      durationMinutes: 40,
      notes: 'Divisão das classes e estudo da Lição da Escola Sabatina'
    },
    {
      id: 'act-8',
      name: 'Mensagem Musical',
      section: 'escola_sabatina',
      category: 'mensagem_musical',
      responsible: 'JU',
      timeSlot: '10:02',
      durationMinutes: 5,
      congregational1: {
        title: 'Quem sou EU ? Play back - JU',
        url: 'https://www.youtube.com/watch?v=rB3yFv_2eE0',
        note: 'Playback de apoio para Ju'
      }
    },
    {
      id: 'act-9',
      name: 'Oração',
      section: 'escola_sabatina',
      category: 'oracao',
      responsible: 'Ancião / Diretor',
      timeSlot: '10:07',
      durationMinutes: 3,
      congregational1: {
        title: 'FUNDO MUSICAL SÓ TU ÉS SANTO',
        url: 'https://www.youtube.com/watch?v=1-Q9y7R_rFs',
        note: 'Fundo oração'
      },
      congregational2: {
        title: 'FUNDO MUSICAL FALAR COM DEUS',
        url: 'https://www.youtube.com/watch?v=Kqg_T9rCq8g',
        note: 'Fundo oração alt'
      },
      congregational3: {
        title: 'FUNDO MUSICAL MEU RESPIRAR',
        url: 'https://www.youtube.com/watch?v=U7l0sU7kM54',
        note: 'Fundo oração alt 2'
      }
    },
    {
      id: 'act-10',
      name: 'Entrada das Crianças',
      section: 'escola_sabatina',
      category: 'infantil',
      responsible: 'Ministério da Criança',
      timeSlot: '10:10',
      durationMinutes: 5,
      congregational1: {
        title: 'DEIXAI VIR A MIM OS PEQUENINOS',
        url: 'https://www.youtube.com/watch?v=WqB9cZqF8b0',
        note: 'Entrada das salas infantis para a nave'
      }
    },

    // CULTO DIVINO
    {
      id: 'act-11',
      name: 'Momento de louvor: Equipe Azul',
      section: 'culto_divino',
      category: 'louvor',
      responsible: 'Equipe Azul',
      timeSlot: '10:20',
      durationMinutes: 12,
      congregational1: {
        title: 'QUao Grande é o Meu Deus',
        url: 'https://www.youtube.com/watch?v=eZ3tMvG8wz4',
        note: 'Hino 1 da Equipe Azul'
      },
      congregational2: {
        title: 'Hinário Adventista 192 - INFINITA GRAÇA',
        url: 'https://www.youtube.com/watch?v=o2g8J0Psm9M',
        note: 'Hino 2 da Equipe Azul'
      },
      notes: 'Equipe Azul conduz o louvor preparatório do Culto Divino'
    },
    {
      id: 'act-12',
      name: 'Entrada da Plataforma',
      section: 'culto_divino',
      category: 'abertura',
      responsible: 'Plataforma / Anciãos',
      timeSlot: '10:32',
      durationMinutes: 3,
      congregational1: {
        title: 'SANTO SOMENTE É O SENHOR',
        url: 'https://www.youtube.com/watch?v=qF2wP8yZz2A',
        note: 'Música reverente para entrada da plataforma'
      },
      notes: 'Congregação se coloca de pé na entrada'
    },
    {
      id: 'act-13',
      name: 'Oração pregador',
      section: 'culto_divino',
      category: 'oracao',
      responsible: 'Pregador',
      timeSlot: '10:35',
      durationMinutes: 2,
      congregational1: {
        title: 'FUNDO MUSICAL SÓ TU ÉS SANTO',
        url: 'https://www.youtube.com/watch?v=1-Q9y7R_rFs',
        note: 'Fundo suave de oração'
      }
    },
    {
      id: 'act-14',
      name: 'Video de saúde',
      section: 'culto_divino',
      category: 'video',
      responsible: 'Ministério de Saúde',
      timeSlot: '10:37',
      durationMinutes: 4,
      congregational1: {
        title: 'EP 114 - CONTROLE A FOME | MOMENTO VIDA E SAÚDE',
        url: 'https://www.youtube.com/watch?v=0G_5WdZ8oQk',
        note: 'Vídeo oficial Novo Tempo / Vida e Saúde'
      }
    },
    {
      id: 'act-15',
      name: 'Vídeo de abertura anúncios',
      section: 'culto_divino',
      category: 'anuncios',
      responsible: 'Sonoplastia',
      timeSlot: '10:41',
      durationMinutes: 3,
      congregational1: {
        title: 'VINHETA ANÚNCIOS',
        url: 'https://www.youtube.com/watch?v=v9m8d5zN3k0',
        note: 'Vinheta semanal de comunicados'
      }
    },
    {
      id: 'act-16',
      name: 'Equipe de comunicação - Diego - Ju',
      section: 'culto_divino',
      category: 'anuncios',
      responsible: 'Diego - Ju',
      timeSlot: '10:44',
      durationMinutes: 5,
      congregational2: {
        title: 'Video anciões',
        url: 'https://www.youtube.com/watch?v=7lQ9f_2W2kA',
        note: 'Vídeo com palavras e avisos do ancionato'
      }
    },
    {
      id: 'act-17',
      name: 'Adoração infantil',
      section: 'culto_divino',
      category: 'infantil',
      responsible: 'Líder Infantil',
      timeSlot: '10:49',
      durationMinutes: 6,
      congregational1: {
        title: 'ADORAÇÃO INFANTIL',
        url: 'https://www.youtube.com/watch?v=c2ixUqu9jAk',
        note: 'História para as crianças e recolhimento das ofertas infantis'
      }
    },
    {
      id: 'act-18',
      name: 'Dízimos e Ofertas (Vídeo Provai e Vede da Semana)',
      section: 'culto_divino',
      category: 'ofertas',
      responsible: 'Diáconos / Sonoplastia',
      timeSlot: '10:55',
      durationMinutes: 6,
      congregational1: {
        title: 'Provai e Vede - Vídeo Oficial da Semana',
        url: 'offline:provai',
        note: 'Vídeo da Semana • Baixado no Computador (100% Offline)',
        videoDate: 'Sábado da Semana',
        isWeeklyMedia: true,
      },
      congregational2: {
        title: 'MÚSICA OFERTAS',
        url: 'https://www.youtube.com/watch?v=9lP0tZ7wY6c',
        note: 'Fundo durante o recolhimento pelos diáconos'
      },
      notes: 'Vídeo do Provai e Vede salvo no computador para exibição sem internet (sem YouTube).'
    },
    {
      id: 'act-19',
      name: 'Louvor',
      section: 'culto_divino',
      category: 'louvor',
      responsible: 'Equipe de Louvor',
      timeSlot: '11:01',
      durationMinutes: 4,
      congregational1: {
        title: 'MARANATA',
        url: 'https://www.youtube.com/watch?v=v_dJ5E0rL-s',
        note: 'Louvor congregacional'
      }
    },
    {
      id: 'act-20',
      name: 'Oração de Joelhos',
      section: 'culto_divino',
      category: 'oracao',
      responsible: 'Ancião de plantão',
      timeSlot: '11:05',
      durationMinutes: 5,
      congregational1: {
        title: 'FUNDO MUSICAL SÓ TU ÉS SANTO',
        url: 'https://www.youtube.com/watch?v=1-Q9y7R_rFs',
        note: 'Opção 1 oração'
      },
      congregational2: {
        title: 'FUNDO MUSICAL FALAR COM DEUS',
        url: 'https://www.youtube.com/watch?v=Kqg_T9rCq8g',
        note: 'Opção 2 oração'
      },
      congregational3: {
        title: 'FUNDO MUSICAL MEU RESPIRAR',
        url: 'https://www.youtube.com/watch?v=U7l0sU7kM54',
        note: 'Opção 3 oração'
      },
      notes: 'Toda a congregação se ajoelha para oração intercessória'
    },
    {
      id: 'act-21',
      name: 'Mensagem Musical',
      section: 'culto_divino',
      category: 'mensagem_musical',
      responsible: 'Cantor Solista',
      timeSlot: '11:10',
      durationMinutes: 5,
      congregational1: {
        title: 'No Teu Altar | Melissa Barcelos (Playback)',
        url: 'https://www.youtube.com/watch?v=qW3pZk2jH8g',
        note: 'Mensagem musical preparatória para o sermão'
      },
      notes: 'Atenção aos retornos do palco para o solista'
    },
    {
      id: 'act-22',
      name: 'SERMÃO',
      section: 'culto_divino',
      category: 'sermao',
      responsible: 'Pregador',
      timeSlot: '11:15',
      durationMinutes: 40,
      notes: 'Microfone de lapela / púlpito checado. Fundo musical preparado para o apelo.'
    }
  ]
};

// Initial Praise & Musical Messages Catalog (Louvores e Mensagens Musicais da IASD)
export const INITIAL_CHURCH_SONGS: ChurchSong[] = [
  // LOUVORES CONGREGACIONAIS
  {
    id: 'song-1',
    title: '10 Mil Razões (Bless the Lord)',
    artistOrGroup: 'Ministério de Louvor IASD',
    type: 'louvor',
    youtubeUrlOrId: 'https://www.youtube.com/watch?v=LuvfMDhTyMA',
    key: 'G',
    suggestedMoment: 'Louvor Congregacional / Escola Sabatina',
    lyricsSnippet: 'Bendize ó minha alma ao Senhor, e tudo o que há em mim...',
    notes: 'Excelente para abertura dos momentos de louvor.',
    createdAt: '2026-01-01T00:00:00.000Z',
    isCustom: false,
  },
  {
    id: 'song-2',
    title: 'Meu Pastor',
    artistOrGroup: 'Sonete / Quarteto Arautos do Rei',
    type: 'louvor',
    youtubeUrlOrId: 'https://www.youtube.com/watch?v=95z4h2H1Uqg',
    key: 'F',
    suggestedMoment: 'Louvor Congregacional',
    lyricsSnippet: 'O Senhor é o meu pastor, nada me faltará...',
    notes: 'Baseado no Salmo 23.',
    createdAt: '2026-01-01T00:00:00.000Z',
    isCustom: false,
  },
  {
    id: 'song-3',
    title: 'Lá no Céu',
    artistOrGroup: 'Arautos do Rei',
    type: 'louvor',
    youtubeUrlOrId: 'https://www.youtube.com/watch?v=kZ-bT0hF-kM',
    key: 'Bb',
    suggestedMoment: 'Louvor Congregacional',
    lyricsSnippet: 'Lá no céu não haverá mais dor, nem pranto, nem tristeza...',
    notes: 'Hino congregacional alegre sobre a esperança da volta de Jesus.',
    createdAt: '2026-01-01T00:00:00.000Z',
    isCustom: false,
  },
  {
    id: 'song-4',
    title: 'Quão Grande É o Meu Deus',
    artistOrGroup: 'Soraya Moraes / IASD',
    type: 'louvor',
    youtubeUrlOrId: 'https://www.youtube.com/watch?v=eZ3tMvG8wz4',
    key: 'C',
    suggestedMoment: 'Culto Divino - Abertura',
    lyricsSnippet: 'Esplendor de um Rei, vestido de majestade...',
    notes: 'Momento de exaltação solene a Deus.',
    createdAt: '2026-01-01T00:00:00.000Z',
    isCustom: false,
  },
  {
    id: 'song-5',
    title: 'Maranata (Ora Vem Senhor Jesus)',
    artistOrGroup: 'Hinário Adventista nº 107',
    type: 'louvor',
    youtubeUrlOrId: 'https://www.youtube.com/watch?v=v_dJ5E0rL-s',
    key: 'D',
    suggestedMoment: 'Louvor Final ou Apelo',
    lyricsSnippet: 'Maranata! Cristo vem! Em breve nós vamos subir...',
    notes: 'Hino oficial adventista da volta de Jesus.',
    createdAt: '2026-01-01T00:00:00.000Z',
    isCustom: false,
  },
  {
    id: 'song-6',
    title: 'Infinita Graça',
    artistOrGroup: 'Hinário Adventista nº 192',
    type: 'louvor',
    youtubeUrlOrId: 'https://www.youtube.com/watch?v=o2g8J0Psm9M',
    key: 'Ab',
    suggestedMoment: 'Louvor Congregacional',
    lyricsSnippet: 'Infinita graça de Jesus, que por mim sofreu na cruz...',
    notes: 'Hino tradicional solene de salvação.',
    createdAt: '2026-01-01T00:00:00.000Z',
    isCustom: false,
  },
  {
    id: 'song-7',
    title: 'O Santo Sábado do Senhor',
    artistOrGroup: 'Hinário Adventista nº 38',
    type: 'louvor',
    youtubeUrlOrId: 'https://www.youtube.com/watch?v=iZzFq_b2L7I',
    key: 'F',
    suggestedMoment: 'Abertura da Escola Sabatina',
    lyricsSnippet: 'O santo sábado chegou, dia feliz de redenção...',
    notes: 'Hino de celebração do dia do Senhor.',
    createdAt: '2026-01-01T00:00:00.000Z',
    isCustom: false,
  },
  {
    id: 'song-8',
    title: 'Santo, Somente É o Senhor',
    artistOrGroup: 'Prisma Brasil / Coral IASD',
    type: 'louvor',
    youtubeUrlOrId: 'https://www.youtube.com/watch?v=qF2wP8yZz2A',
    key: 'Eb',
    suggestedMoment: 'Entrada da Plataforma / Reverência',
    lyricsSnippet: 'Santo, somente é o Senhor, Justo e Fiel Redentor...',
    notes: 'Tocar quando os anciãos e pregadores sobem ao púlpito.',
    createdAt: '2026-01-01T00:00:00.000Z',
    isCustom: false,
  },

  // MENSAGENS MUSICAIS ESPECIAIS (SOLOS, QUARTETOS, GRUPOS)
  {
    id: 'song-9',
    title: 'No Teu Altar',
    artistOrGroup: 'Melissa Barcelos',
    type: 'mensagem_musical',
    youtubeUrlOrId: 'https://www.youtube.com/watch?v=qW3pZk2jH8g',
    key: 'G',
    suggestedMoment: 'Mensagem Musical antes do Sermão',
    lyricsSnippet: 'No Teu altar, Senhor, coloco a minha vida...',
    notes: 'Excelente para solos femininos ou duetos.',
    createdAt: '2026-01-01T00:00:00.000Z',
    isCustom: false,
  },
  {
    id: 'song-10',
    title: 'Quem Sou Eu (Who Am I)',
    artistOrGroup: 'PG / Casting Crowns',
    type: 'mensagem_musical',
    youtubeUrlOrId: 'https://www.youtube.com/watch?v=rB3yFv_2eE0',
    key: 'B',
    suggestedMoment: 'Mensagem Musical da Escola Sabatina',
    lyricsSnippet: 'Quem sou eu para que o Senhor de toda a terra conheça o meu nome?...',
    notes: 'Música de gratidão e humildade.',
    createdAt: '2026-01-01T00:00:00.000Z',
    isCustom: false,
  },
  {
    id: 'song-11',
    title: 'Descansar',
    artistOrGroup: 'Arautos do Rei',
    type: 'mensagem_musical',
    youtubeUrlOrId: 'https://www.youtube.com/watch?v=m3r0l7mP8xQ',
    key: 'C',
    suggestedMoment: 'Mensagem Musical / Especial',
    lyricsSnippet: 'Não quero viver ansioso com o amanhã, prefiro em Deus confiar e descansar...',
    notes: 'Clássico para quartetos masculinos ou grupos.',
    createdAt: '2026-01-01T00:00:00.000Z',
    isCustom: false,
  },
  {
    id: 'song-12',
    title: 'Vaso de Alabastro',
    artistOrGroup: 'Mara Maravilha / IASD',
    type: 'mensagem_musical',
    youtubeUrlOrId: 'https://www.youtube.com/watch?v=j8K3mQ5xL2v',
    key: 'Em',
    suggestedMoment: 'Mensagem Especial de Entrega / Apelo',
    lyricsSnippet: 'Vim para derramar meu perfume sobre os Teus pés...',
    notes: 'Momento profundo de rendição e entrega.',
    createdAt: '2026-01-01T00:00:00.000Z',
    isCustom: false,
  },
  {
    id: 'song-13',
    title: 'Restaura Minha Família',
    artistOrGroup: 'Pr. Edson Nunes / Novo Tempo',
    type: 'mensagem_musical',
    youtubeUrlOrId: 'https://www.youtube.com/watch?v=k9L2xP4mW1v',
    key: 'F',
    suggestedMoment: 'Sábado da Família / Apelo',
    lyricsSnippet: 'Senhor, restaura o meu lar, faz nele a Tua paz habitar...',
    notes: 'Tema familiar e consagração do lar.',
    createdAt: '2026-01-01T00:00:00.000Z',
    isCustom: false,
  },
  {
    id: 'song-14',
    title: 'A Tua Presença',
    artistOrGroup: 'Leonardo Gonçalves',
    type: 'mensagem_musical',
    youtubeUrlOrId: 'https://www.youtube.com/watch?v=9vP3s0kL2yE',
    key: 'E',
    suggestedMoment: 'Mensagem Musical Solene',
    lyricsSnippet: 'A Tua presença me acalma, a Tua presença me traz paz...',
    notes: 'Solo masculino de alto impacto vocal.',
    createdAt: '2026-01-01T00:00:00.000Z',
    isCustom: false,
  },

  // FUNDOS MUSICAIS (ORAÇÃO, OFERTÓRIO, APELO)
  {
    id: 'song-15',
    title: 'Só Tu És Santo (Fundo de Oração)',
    artistOrGroup: 'Instrumental Piano & Cordas',
    type: 'fundo_musical',
    youtubeUrlOrId: 'https://www.youtube.com/watch?v=1-Q9y7R_rFs',
    key: 'C',
    suggestedMoment: 'Oração de Joelhos / Intercessão',
    lyricsSnippet: 'Instrumental reverente para oração congregacional',
    notes: 'Manter volume suave no mixer (cerca de 25% a 35%).',
    createdAt: '2026-01-01T00:00:00.000Z',
    isCustom: false,
  },
  {
    id: 'song-16',
    title: 'Falar com Deus (Fundo de Oração)',
    artistOrGroup: 'Novo Tempo Instrumental',
    type: 'fundo_musical',
    youtubeUrlOrId: 'https://www.youtube.com/watch?v=Kqg_T9rCq8g',
    key: 'D',
    suggestedMoment: 'Oração de Joelhos da Escola Sabatina',
    lyricsSnippet: 'Na oração encontro paz, falar com Deus me satisfaz...',
    notes: 'Ideal para oração silenciosa ou audível.',
    createdAt: '2026-01-01T00:00:00.000Z',
    isCustom: false,
  },
  {
    id: 'song-17',
    title: 'Meu Respirar (Fundo Instrumental)',
    artistOrGroup: 'Piano Reverente',
    type: 'fundo_musical',
    youtubeUrlOrId: 'https://www.youtube.com/watch?v=U7l0sU7kM54',
    key: 'A',
    suggestedMoment: 'Oração Pastoral / Apelo',
    lyricsSnippet: 'Este é o meu respirar, Tua presença em meu viver...',
    notes: 'Harmonia contínua sem quebras bruscas.',
    createdAt: '2026-01-01T00:00:00.000Z',
    isCustom: false,
  },
  {
    id: 'song-18',
    title: 'Música Instrumental para Ofertas',
    artistOrGroup: 'Sonoplastia IASD',
    type: 'fundo_musical',
    youtubeUrlOrId: 'https://www.youtube.com/watch?v=9lP0tZ7wY6c',
    key: 'G',
    suggestedMoment: 'Recolhimento dos Dízimos e Ofertas',
    lyricsSnippet: 'Instrumental suave durante a passagem das salvas',
    notes: 'Tocar logo após o Provai e Vede.',
    createdAt: '2026-01-01T00:00:00.000Z',
    isCustom: false,
  },

  // ADORAÇÃO INFANTIL
  {
    id: 'song-19',
    title: 'Deixai Vir a Mim os Pequeninos',
    artistOrGroup: 'Ministério da Criança IASD',
    type: 'infantil',
    youtubeUrlOrId: 'https://www.youtube.com/watch?v=WqB9cZqF8b0',
    key: 'F',
    suggestedMoment: 'Entrada das Crianças',
    lyricsSnippet: 'Deixai vir a mim os pequeninos, porque deles é o Reino dos Céus...',
    notes: 'Tocar quando as crianças descem das classes da Escola Sabatina.',
    createdAt: '2026-01-01T00:00:00.000Z',
    isCustom: false,
  },
  {
    id: 'song-20',
    title: 'Música Tema da Adoração Infantil',
    artistOrGroup: 'Divisão Sul-Americana',
    type: 'infantil',
    youtubeUrlOrId: 'https://www.youtube.com/watch?v=c2ixUqu9jAk',
    key: 'D',
    suggestedMoment: 'Momento Infantil no Culto Divino',
    lyricsSnippet: 'História da bíblia para as crianças e oferta infantil...',
    notes: 'Exibição durante a ida das crianças à frente.',
    createdAt: '2026-01-01T00:00:00.000Z',
    isCustom: false,
  },
];

// Comprehensive Adventista Hymnal Database (HASD)
export const ADVENTIST_HYMNS: Hymn[] = [
  {
    number: 1,
    title: 'Ó Deus de Amor',
    category: 'Adoração e Louvor',
    key: 'F',
    lyricsSnippet: 'Ó Deus de amor, Tu és a luz, que ao pecador atrai...',
    youtubeSearchQuery: 'hinario adventista 01 o deus de amor playback',
    suggestedUsage: 'Hino inicial de adoração e abertura'
  },
  {
    number: 2,
    title: 'Ó Adorai o Senhor',
    category: 'Adoração e Louvor',
    key: 'G',
    lyricsSnippet: 'Ó adorai o Senhor na beleza da Sua santidade...',
    youtubeSearchQuery: 'hinario adventista 02 o adorai o senhor playback',
    suggestedUsage: 'Entrada da plataforma e abertura de culto'
  },
  {
    number: 10,
    title: 'Louvor ao Deus Criador',
    category: 'Adoração e Louvor',
    key: 'Eb',
    lyricsSnippet: 'A Deus rendei louvor, com hinos de gratidão...',
    youtubeSearchQuery: 'hinario adventista 10 louvor ao deus criador playback',
    suggestedUsage: 'Abertura de Escola Sabatina'
  },
  {
    number: 17,
    title: 'Nós Te Exaltamos',
    category: 'Adoração e Louvor',
    key: 'D',
    lyricsSnippet: 'Nós Te exaltamos, Senhor, Rei do Universo...',
    youtubeSearchQuery: 'hinario adventista 17 nos te exaltamos playback',
    suggestedUsage: 'Momento de louvor congregacional'
  },
  {
    number: 28,
    title: 'Grandioso És Tu',
    category: 'Adoração e Louvor',
    key: 'Bb',
    lyricsSnippet: 'Senhor meu Deus, quando eu maravilhado, fico a pensar nas obras de Tuas mãos...',
    fullLyrics: [
      'Senhor meu Deus, quando eu maravilhado, fico a pensar nas obras de Tuas mãos, no céu azul de estrelas pontilhado, o Seu poder mostrando a criação.',
      'Então minh’alma canta a Ti, Senhor: Quão grande és Tu! Quão grande és Tu!',
      'Quando a vagar por matas e florestas, o doce canto ouço dos trilos das aves...',
      'E quando enfim, Jesus vier com glória, e para o lar celeste me levar, com que alegria cantarei vitória, e Teu poder pra sempre proclamar!'
    ],
    youtubeSearchQuery: 'hinario adventista 28 grandioso es tu playback',
    suggestedUsage: 'Momento de louvor congregacional ou final solene'
  },
  {
    number: 33,
    title: 'Castelo Forte',
    category: 'Poder e Proteção',
    key: 'C',
    lyricsSnippet: 'Castelo forte é nosso Deus, espada e bom escudo...',
    youtubeSearchQuery: 'hinario adventista 33 castelo forte playback',
    suggestedUsage: 'Culto da Reforma, sermões de fé'
  },
  {
    number: 38,
    title: 'O Santo Sábado',
    category: 'O Santo Sábado',
    key: 'G',
    lyricsSnippet: 'O santo sábado do Senhor, nos traz repouso e paz...',
    youtubeSearchQuery: 'hinario adventista 38 o santo sabado playback',
    suggestedUsage: 'Abertura do Sábado ou Escola Sabatina'
  },
  {
    number: 45,
    title: 'Falar com Deus',
    category: 'Oração e Comunhão',
    key: 'C',
    lyricsSnippet: 'Na oração encontro a paz, em Cristo meu Senhor...',
    youtubeSearchQuery: 'falar com deus playback hinario adventista',
    suggestedUsage: 'Oração de joelhos e momentos de intercessão'
  },
  {
    number: 48,
    title: 'Oração da Manhã',
    category: 'Oração e Comunhão',
    key: 'F',
    lyricsSnippet: 'Bem cedo de manhã, Senhor, a Ti dirijo a voz...',
    youtubeSearchQuery: 'hinario adventista 48 oracao da manha playback',
    suggestedUsage: 'Abertura dos cultos matutinos'
  },
  {
    number: 55,
    title: 'Manso e Suave',
    category: 'Apelo e Convite',
    key: 'Ab',
    lyricsSnippet: 'Manso e suave Jesus está chamando, chama por ti e por mim...',
    youtubeSearchQuery: 'hinario adventista 55 manso e suave playback',
    suggestedUsage: 'Momento de apelo ou encerramento de sermão'
  },
  {
    number: 81,
    title: 'Maravilhoso És Tu, Meu Jesus',
    category: 'Amor de Cristo',
    key: 'D',
    lyricsSnippet: 'Maravilhoso és Tu, meu Salvador e Rei...',
    youtubeSearchQuery: 'hinario adventista 81 maravilhoso es tu playback',
    suggestedUsage: 'Louvor congregacional'
  },
  {
    number: 107,
    title: 'Maranata',
    category: 'Segunda Vinda',
    key: 'F',
    lyricsSnippet: 'Maranata! Cristo vem! Em breve nós O veremos nas nuvens dos céus...',
    youtubeSearchQuery: 'hinario adventista 107 maranata playback',
    suggestedUsage: 'Momento de louvor, semana de oração ou final'
  },
  {
    number: 115,
    title: 'Só Tu És Santo',
    category: 'Santidade de Deus',
    key: 'Eb',
    lyricsSnippet: 'Só Tu és Santo, Senhor Deus onipotente...',
    youtubeSearchQuery: 'hinario adventista 115 so tu es santo playback',
    suggestedUsage: 'Fundo de oração e entrada da plataforma'
  },
  {
    number: 135,
    title: 'Cristo Volta Brevemente',
    category: 'Segunda Vinda',
    key: 'G',
    lyricsSnippet: 'Cristo volta brevemente, alegrai-vos ó fiéis...',
    youtubeSearchQuery: 'hinario adventista 135 cristo volta brevemente playback',
    suggestedUsage: 'Culto profético ou mensagens escatológicas'
  },
  {
    number: 154,
    title: 'Ao Pé da Cruz',
    category: 'Consagração e Cruz',
    key: 'F',
    lyricsSnippet: 'Quero estar ao pé da cruz, de onde rica fonte...',
    youtubeSearchQuery: 'hinario adventista 154 ao pe da cruz playback',
    suggestedUsage: 'Santa Ceia e apelo'
  },
  {
    number: 180,
    title: 'Graça Excelsa (Amazing Grace)',
    category: 'Graça e Salvação',
    key: 'G',
    lyricsSnippet: 'Graça excelsa do Senhor que um dia me encontrou...',
    youtubeSearchQuery: 'hinario adventista 180 graca excelsa playback',
    suggestedUsage: 'Batismos, testemunhos e momentos de fé'
  },
  {
    number: 192,
    title: 'Infinita Graça',
    category: 'Graça e Salvação',
    key: 'Eb',
    lyricsSnippet: 'Infinita graça do bom Salvador, derramada em nós por Seu terno amor...',
    fullLyrics: [
      'Infinita graça do bom Salvador, derramada em nós por Seu terno amor.',
      'Graça que perdoa, graça que conduz, graça que nos salva pelo sangue da cruz.',
      'Mais que as profundezas do mais largo mar, esta graça excelsa pode me livrar.',
      'Canto aleluia ao meu Redentor, rendo a minha vida ao Seu eterno amor.'
    ],
    youtubeSearchQuery: 'hinario adventista 192 infinita graca playback',
    suggestedUsage: 'Momento de Louvor do Culto Divino (como na liturgia da Igreja)'
  },
  {
    number: 201,
    title: 'Meu Respirar',
    category: 'Comunhão e Entrega',
    key: 'G',
    lyricsSnippet: 'Este é o meu respirar, este é o meu respirar, Tua presença habitando em mim...',
    youtubeSearchQuery: 'meu respirar playback hinario adventista',
    suggestedUsage: 'Fundo de oração de joelhos'
  },
  {
    number: 208,
    title: 'Eu Venho Como Estou',
    category: 'Consagração',
    key: 'C',
    lyricsSnippet: 'Tal qual estou, sem nada ter, além do sangue que verteste...',
    youtubeSearchQuery: 'hinario adventista 208 eu venho como estou playback',
    suggestedUsage: 'Apelo pastoral e entrega'
  },
  {
    number: 218,
    title: 'Mais Perto da Tua Cruz',
    category: 'Consagração',
    key: 'Ab',
    lyricsSnippet: 'Mais perto da Tua cruz, meu Salvador, me leva em Teu amor...',
    youtubeSearchQuery: 'hinario adventista 218 mais perto da tua cruz playback',
    suggestedUsage: 'Santa Ceia e oração'
  },
  {
    number: 233,
    title: 'A Âncora da Alma',
    category: 'Esperança',
    key: 'Bb',
    lyricsSnippet: 'Nossa esperança é uma âncora firme e constante na presença de Deus...',
    youtubeSearchQuery: 'hinario adventista 233 a ancora da alma playback',
    suggestedUsage: 'Momentos de consolo e fé'
  },
  {
    number: 240,
    title: 'Santo Somente é o Senhor',
    category: 'Reverência e Abertura',
    key: 'Eb',
    lyricsSnippet: 'Santo, Santo somente é o Senhor Deus dos exércitos...',
    youtubeSearchQuery: 'santo somente e o senhor hinario adventista playback',
    suggestedUsage: 'Entrada solene da plataforma'
  },
  {
    number: 250,
    title: 'No Teu Altar',
    category: 'Consagração e Louvor',
    key: 'D',
    lyricsSnippet: 'No Teu altar, Senhor, coloco o meu viver, coloco os meus anseios...',
    youtubeSearchQuery: 'no teu altar melissa barcelos playback',
    suggestedUsage: 'Mensagem Musical solista antes do sermão'
  },
  {
    number: 270,
    title: 'Brilha no Viver',
    category: 'Testemunho',
    key: 'F',
    lyricsSnippet: 'Brilha no viver, mostra a luz de Jesus em tuas ações...',
    youtubeSearchQuery: 'hinario adventista 270 brilha no viver playback',
    suggestedUsage: 'Culto Jovem e Escola Sabatina'
  },
  {
    number: 280,
    title: 'Vaso Novo',
    category: 'Consagração',
    key: 'C',
    lyricsSnippet: 'Eu quero ser, Senhor amado, como um vaso nas mãos do oleiro...',
    youtubeSearchQuery: 'vaso novo hinario adventista playback',
    suggestedUsage: 'Momento de consagração e apelo'
  },
  {
    number: 300,
    title: 'Deixai Vir a Mim os Pequeninos',
    category: 'Ministério Infantil',
    key: 'D',
    lyricsSnippet: 'Deixai vir a mim os pequeninos, porque dos tais é o reino dos céus...',
    youtubeSearchQuery: 'deixai vir a mim os pequeninos adventista',
    suggestedUsage: 'Entrada das salas infantis e adoração infantil'
  },
  {
    number: 314,
    title: 'Chuvas de Bênçãos',
    category: 'Promessas de Deus',
    key: 'Bb',
    lyricsSnippet: 'Chuvas de bênçãos teremos, é a promessa de Deus...',
    youtubeSearchQuery: 'hinario adventista 314 chuvas de bencaos playback',
    suggestedUsage: 'Momento de louvor congregacional animado'
  },
  {
    number: 330,
    title: 'Sou Feliz com Jesus',
    category: 'Paz e Esperança',
    key: 'C',
    lyricsSnippet: 'Se paz a mais doce me deres gozar, se dor a mais forte sofrer...',
    fullLyrics: [
      'Se paz a mais doce me deres gozar, se dor a mais forte sofrer, seja o que vier, Tu me fazes saber: Sou feliz com Jesus, meu Senhor.',
      'Sou feliz com Jesus! Meu Senhor, meu Senhor!',
      'Embora me assalte o cruel tentador e ataque com fúria e furor, um dom sem igual Cristo me outorgou: Seu amor que na cruz me salvou!'
    ],
    youtubeSearchQuery: 'hinario adventista 330 sou feliz com jesus playback',
    suggestedUsage: 'Culto solene, testemunhos e funeral de esperança'
  },
  {
    number: 340,
    title: 'O Poder do Amor',
    category: 'Amor de Cristo',
    key: 'G',
    lyricsSnippet: 'Vem, ó Cristo, e restaura o meu ser com Teu terno amor...',
    youtubeSearchQuery: 'hinario adventista 340 o poder do amor playback',
    suggestedUsage: 'Louvor e meditação'
  },
  {
    number: 365,
    title: 'Ide por Todo o Mundo',
    category: 'Missão e Evangelismo',
    key: 'F',
    lyricsSnippet: 'Ide por todo o mundo e pregai o evangelho da paz...',
    youtubeSearchQuery: 'hinario adventista 365 ide por todo o mundo playback',
    suggestedUsage: 'Encerramento de Escola Sabatina e envio'
  },
  {
    number: 400,
    title: 'Rude Cruz',
    category: 'A Cruz de Cristo',
    key: 'Bb',
    lyricsSnippet: 'Rude cruz se ergueu, dela o dia fugiu, como emblema de vergonha e dor...',
    youtubeSearchQuery: 'hinario adventista 400 rude cruz playback',
    suggestedUsage: 'Santa Ceia e Páscoa'
  },
  {
    number: 420,
    title: 'A Melhor Dádiva',
    category: 'Dízimos e Ofertas',
    key: 'Eb',
    lyricsSnippet: 'Tudo o que tenho pertence ao Senhor, trago com gozo no meu coração...',
    youtubeSearchQuery: 'hinario adventista dizimos e ofertas playback',
    suggestedUsage: 'Recolhimento dos dízimos e ofertas'
  },
  {
    number: 450,
    title: 'Quão Grande é o Meu Deus',
    category: 'Louvor Contemporâneo',
    key: 'G',
    lyricsSnippet: 'Quão grande é o meu Deus, cantarei quão grande é o meu Deus...',
    youtubeSearchQuery: 'quao grande e o meu deus playback adventista',
    suggestedUsage: 'Momento de louvor da Equipe de Música'
  },
  {
    number: 480,
    title: '10 Mil Razões (Bendize, ó Minh\'Alma)',
    category: 'Louvor Congregacional',
    key: 'G',
    lyricsSnippet: 'Bendize, ó minh\'alma, ao Senhor, Seu santo nome vou louvar...',
    youtubeSearchQuery: '10 mil razoes playback congregacional adventista',
    suggestedUsage: 'Congregacional 1 na abertura da Escola Sabatina'
  },
  {
    number: 500,
    title: 'Meu Pastor (Salmo 23)',
    category: 'Confiança e Paz',
    key: 'D',
    lyricsSnippet: 'O Senhor é o meu pastor e nada me faltará...',
    youtubeSearchQuery: 'meu pastor playback congregacional adventista',
    suggestedUsage: 'Congregacional 2 na Escola Sabatina'
  },
  {
    number: 515,
    title: 'Lá no Céu',
    category: 'Pátria Celestial',
    key: 'F',
    lyricsSnippet: 'Lá no céu, onde a dor não tem lugar, lá no céu com Jesus vou morar...',
    youtubeSearchQuery: 'la no ceu playback congregacional adventista',
    suggestedUsage: 'Congregacional 3 na Escola Sabatina'
  },
  {
    number: 530,
    title: 'Quem Sou Eu?',
    category: 'Graça e Salvação',
    key: 'C',
    lyricsSnippet: 'Quem sou eu para que o Senhor de todo o mundo conheça o meu nome?...',
    youtubeSearchQuery: 'quem sou eu playback adhemar de campos adventista',
    suggestedUsage: 'Mensagem Musical solista'
  },
  {
    number: 550,
    title: 'Provai e Vede',
    category: 'Fidelidade e Mordomia',
    key: 'Eb',
    lyricsSnippet: 'Provai e vede que o Senhor é bom, bem-aventurado aquele que nEle confia...',
    youtubeSearchQuery: 'provai e vede adventista oficial',
    suggestedUsage: 'Momento de Dízimos e Ofertas'
  },
  {
    number: 560,
    title: 'Momento Vida e Saúde',
    category: 'Saúde e Temperança',
    key: 'C',
    lyricsSnippet: 'Vídeos informativos da Igreja Adventista sobre saúde e estilo de vida...',
    youtubeSearchQuery: 'momento vida e saude adventista video',
    suggestedUsage: 'Vídeo de Saúde antes dos comunicados'
  }
];

// Curated Seventh-Day Adventist Media Library (Fundos Musicais, Playbacks, Vinhetas)
export const CURATED_MEDIA: PlaybackItem[] = [
  // Fundos Musicais para Oração
  {
    id: 'fundo-so-tu-es-santo',
    title: 'Fundo Musical - Só Tu És Santo (Piano Suave)',
    artistOrType: 'Instrumental Reverente',
    category: 'fundo_musical',
    youtubeQuery: 'fundo musical so tu es santo oracao piano',
    recommendedFor: 'Oração de joelhos, oração intercessória e oração do pregador'
  },
  {
    id: 'fundo-falar-com-deus',
    title: 'Fundo Musical - Falar com Deus (Piano & Cordas)',
    artistOrType: 'Instrumental Reverente',
    category: 'fundo_musical',
    youtubeQuery: 'fundo musical falar com deus piano oracao',
    recommendedFor: 'Oração congregacional de joelhos'
  },
  {
    id: 'fundo-meu-respirar',
    title: 'Fundo Musical - Meu Respirar (Piano Contemplativo)',
    artistOrType: 'Instrumental Reverente',
    category: 'fundo_musical',
    youtubeQuery: 'fundo musical meu respirar piano oracao',
    recommendedFor: 'Oração intercessória da Escola Sabatina e Culto'
  },
  {
    id: 'fundo-quero-me-entregar',
    title: 'Fundo Musical - Quero Me Entregar (Apelo Pastoral)',
    artistOrType: 'Instrumental Apelo',
    category: 'fundo_musical',
    youtubeQuery: 'fundo musical oracao apelo piano adventista',
    recommendedFor: 'Momento final do Sermão e apelo batismal'
  },

  // Playbacks Mais Tocados
  {
    id: 'pb-10-mil-razoes',
    title: '10 Mil Razões - Playback Oficial',
    artistOrType: 'Congregacional / Matt Redman',
    category: 'playback',
    youtubeQuery: '10 mil razoes congregacional playback',
    recommendedFor: 'Momentos de louvor da Escola Sabatina'
  },
  {
    id: 'pb-meu-pastor',
    title: 'Meu Pastor - Playback',
    artistOrType: 'Congregacional',
    category: 'playback',
    youtubeQuery: 'meu pastor playback congregacional adventista',
    recommendedFor: 'Momentos de louvor da congregação'
  },
  {
    id: 'pb-la-no-ceu',
    title: 'Lá No Céu - Playback',
    artistOrType: 'Congregacional',
    category: 'playback',
    youtubeQuery: 'la no ceu playback adventista',
    recommendedFor: 'Momentos de louvor da congregação'
  },
  {
    id: 'pb-no-teu-altar',
    title: 'No Teu Altar - Melissa Barcelos (Playback)',
    artistOrType: 'Melissa Barcelos',
    category: 'playback',
    youtubeQuery: 'no teu altar melissa barcelos playback youtube',
    recommendedFor: 'Mensagem Musical solista antes da pregação'
  },
  {
    id: 'pb-infinita-graca',
    title: 'Infinita Graça (Hinário 192) - Playback',
    artistOrType: 'Hinário Adventista',
    category: 'hino',
    youtubeQuery: 'hinario adventista 192 infinita graca playback youtube',
    recommendedFor: 'Momento de louvor da Equipe Azul no Culto Divino'
  },
  {
    id: 'pb-quao-grande-e-o-meu-deus',
    title: 'Quão Grande é o Meu Deus - Playback',
    artistOrType: 'Soraya Moraes / Congregacional',
    category: 'playback',
    youtubeQuery: 'quao grande e o meu deus playback adventista',
    recommendedFor: 'Abertura do louvor no Culto Divino'
  },
  {
    id: 'pb-santo-somente-e-o-senhor',
    title: 'Santo Somente é o Senhor - Playback Instrumental',
    artistOrType: 'Plataforma Reverente',
    category: 'playback',
    youtubeQuery: 'santo somente e o senhor playback adventista',
    recommendedFor: 'Entrada solene dos anciãos e pregador na plataforma'
  },
  {
    id: 'pb-maranata',
    title: 'Maranata (Hinário 107) - Playback',
    artistOrType: 'Hinário Adventista',
    category: 'hino',
    youtubeQuery: 'hinario adventista 107 maranata playback',
    recommendedFor: 'Louvor congregacional antes da oração de joelhos'
  },
  {
    id: 'pb-quem-sou-eu',
    title: 'Quem Sou Eu? - Playback',
    artistOrType: 'Adhemar de Campos / Voz Solo',
    category: 'playback',
    youtubeQuery: 'quem sou eu playback adhemar de campos',
    recommendedFor: 'Mensagem musical solista (Ju)'
  },
  {
    id: 'pb-deixai-vir-a-mim',
    title: 'Deixai Vir a Mim os Pequeninos',
    category: 'adoracao_infantil',
    artistOrType: 'Ministério Infantil',
    youtubeQuery: 'deixai vir a mim os pequeninos adventista',
    recommendedFor: 'Entrada das crianças das classes da Escola Sabatina'
  },

  // Vídeos Oficiais da Igreja Adventista
  {
    id: 'vid-provai-e-vede',
    title: 'Provai e Vede - Canal Oficial (Primeiro Vídeo)',
    artistOrType: 'Divisão Sul-Americana',
    category: 'video_oficial',
    youtubeQuery: 'provai e vede adventista primeiro video oficial',
    recommendedFor: 'Momento de Dízimos e Ofertas'
  },
  {
    id: 'vid-vida-e-saude',
    title: 'Momento Vida e Saúde (EP 114 - Controle a Fome)',
    artistOrType: 'TV Novo Tempo',
    category: 'video_oficial',
    youtubeQuery: 'ep 114 controle a fome momento vida e saude youtube',
    recommendedFor: 'Momento de Saúde antes dos comunicados'
  },
  {
    id: 'vid-informativo-missoes',
    title: 'Informativo Mundial das Missões (Semanal)',
    artistOrType: 'Divisão Sul-Americana / Novo Tempo',
    category: 'video_oficial',
    youtubeQuery: 'informativo mundial das missoes adventista semana youtube',
    recommendedFor: 'Informativo das Missões da Escola Sabatina'
  },
  {
    id: 'vid-vinheta-anuncios',
    title: 'Vinheta de Anúncios e Comunicados',
    artistOrType: 'Comunicação IASD',
    category: 'video_oficial',
    youtubeQuery: 'vinheta comunicados igreja adventista youtube',
    recommendedFor: 'Abertura do bloco de anúncios da igreja'
  }
];
