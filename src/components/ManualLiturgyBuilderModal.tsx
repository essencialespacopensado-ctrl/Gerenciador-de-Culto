import React, { useState, useEffect } from 'react';
import { 
  X, Check, Plus, Trash2, ArrowUp, ArrowDown, Music, 
  Calendar, User, Clock, BookOpen, Search, Sparkles, 
  RefreshCw, ShieldCheck, FileSpreadsheet, Tv, FileText,
  Bookmark, ChevronDown, ChevronUp, Layers
} from 'lucide-react';
import { 
  WorshipProgram, ActivityItem, ActivitySection, 
  ActivityCategory, MediaLink, Hymn, ChurchSong 
} from '../types';
import { ADVENTIST_HYMNS, INITIAL_PROGRAM, INITIAL_CHURCH_SONGS } from '../data/churchData';
import { getTodayDate } from '../utils/worshipArchiveManager';

interface ManualLiturgyBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProgram: WorshipProgram;
  onSaveProgram: (newProgram: WorshipProgram) => void;
  onNotify?: (msg: string) => void;
}

// Recommended base structural template for Seventh-day Adventist services
const IASD_BASE_STAGES: Omit<ActivityItem, 'id'>[] = [
  // ESCOLA SABATINA
  {
    name: 'Abertura & Boas-Vindas',
    section: 'escola_sabatina',
    category: 'abertura',
    responsible: 'Direção da ES',
    timeSlot: '09:00',
    durationMinutes: 5,
    isRecurring: true,
    notes: 'Recepção e boas-vindas à igreja e visitantes',
  },
  {
    name: 'Louvor Congregacional Inicial',
    section: 'escola_sabatina',
    category: 'louvor',
    responsible: 'Equipe de Louvor',
    timeSlot: '09:05',
    durationMinutes: 7,
    isRecurring: false,
    congregational1: {
      title: 'Hino #250 - O Amor de Jesus',
      url: 'https://www.youtube.com/results?search_query=hinario+250+adventista+o+amor+de+jesus+playback',
    },
    notes: 'Louvor participativo com a congregação',
  },
  {
    name: 'Oração Inicial',
    section: 'escola_sabatina',
    category: 'oracao',
    responsible: 'Membro designado',
    timeSlot: '09:12',
    durationMinutes: 3,
    isRecurring: true,
    congregational1: {
      title: 'Fundo Musical Reverente para Oração',
      url: 'https://www.youtube.com/watch?v=1-Q9y7R_rFs',
      note: 'Piano suave durante oração',
    },
    notes: 'Manter volume ambiente bem suave',
  },
  {
    name: 'Informativo Mundial das Missões',
    section: 'escola_sabatina',
    category: 'video',
    responsible: 'Sonoplastia',
    timeSlot: '09:15',
    durationMinutes: 6,
    isRecurring: true,
    congregational1: {
      title: 'Informativo Mundial das Missões (Vídeo Oficial)',
      url: 'offline:informativo',
      isWeeklyMedia: true,
      note: 'Vídeo missionário da semana',
    },
    notes: 'Exibir vídeo no telão principal',
  },
  {
    name: 'Estudo da Lição da Escola Sabatina',
    section: 'escola_sabatina',
    category: 'geral',
    responsible: 'Professores das Classes',
    timeSlot: '09:21',
    durationMinutes: 45,
    isRecurring: true,
    notes: 'Divisão em classes nas salas e nave',
  },
  {
    name: 'Louvor e Encerramento da Escola Sabatina',
    section: 'escola_sabatina',
    category: 'louvor',
    responsible: 'Equipe de Louvor',
    timeSlot: '10:06',
    durationMinutes: 4,
    isRecurring: false,
    congregational1: {
      title: 'Hino #314 - Mais de Cristo',
      url: 'https://www.youtube.com/results?search_query=hinario+314+adventista+mais+de+cristo+playback',
    },
  },

  // CULTO DIVINO
  {
    name: 'Prelúdio & Entrada da Plataforma',
    section: 'culto_divino',
    category: 'abertura',
    responsible: 'Pastores e Anciãos',
    timeSlot: '10:20',
    durationMinutes: 3,
    isRecurring: true,
    congregational1: {
      title: 'Prelúdio Instrumental Reverente',
      url: 'https://www.youtube.com/watch?v=1-Q9y7R_rFs',
    },
    notes: 'Sinal sonoro para início do culto divino',
  },
  {
    name: 'Doxologia',
    section: 'culto_divino',
    category: 'louvor',
    responsible: 'Congregação',
    timeSlot: '10:23',
    durationMinutes: 3,
    isRecurring: true,
    congregational1: {
      title: 'Doxologia - Hino #50',
      url: 'https://www.youtube.com/results?search_query=hinario+50+adventista+doxologia+playback',
    },
    notes: 'Igreja em pé',
  },
  {
    name: 'Oração Pastoral / Intercessória',
    section: 'culto_divino',
    category: 'oracao',
    responsible: 'Ancião de plantão',
    timeSlot: '10:26',
    durationMinutes: 4,
    isRecurring: true,
    congregational1: {
      title: 'Fundo Musical - Falar com Deus',
      url: 'https://www.youtube.com/watch?v=Kqg_T9rCq8g',
    },
    notes: 'Igreja de joelhos',
  },
  {
    name: 'Adoração Infantil',
    section: 'culto_divino',
    category: 'infantil',
    responsible: 'Ministério da Criança',
    timeSlot: '10:30',
    durationMinutes: 7,
    isRecurring: true,
    congregational1: {
      title: 'Música Entrada das Crianças',
      url: 'https://www.youtube.com/watch?v=WqB9cZqF8b0',
    },
    notes: 'Crianças vão à frente para ouvir a historinha',
  },
  {
    name: 'Dízimos e Ofertas (Provai e Vede)',
    section: 'culto_divino',
    category: 'ofertas',
    responsible: 'Diáconos / Sonoplastia',
    timeSlot: '10:37',
    durationMinutes: 7,
    isRecurring: true,
    congregational1: {
      title: 'Provai e Vede (Vídeo Oficial da Semana)',
      url: 'offline:provai',
      isWeeklyMedia: true,
      note: 'Vídeo oficial seguido de música para recolhimento',
    },
    congregational2: {
      title: 'Instrumental para Ofertas',
      url: 'https://www.youtube.com/watch?v=9lP0tZ7wY6c',
    },
  },
  {
    name: 'Mensagem Musical Especial',
    section: 'culto_divino',
    category: 'mensagem_musical',
    responsible: 'Cantor Convidado / Coral',
    timeSlot: '10:44',
    durationMinutes: 5,
    isRecurring: false,
    congregational1: {
      title: 'Descansar - Arautos do Rei (Playback)',
      url: 'https://www.youtube.com/results?search_query=descansar+arautos+do+rei+playback',
    },
    notes: 'Preparar microfone sem fio e volume',
  },
  {
    name: 'Sermão / Pregação da Palavra',
    section: 'culto_divino',
    category: 'sermao',
    responsible: 'Pregador',
    timeSlot: '10:49',
    durationMinutes: 40,
    isRecurring: true,
    notes: 'Microfone do púlpito ativo',
  },
  {
    name: 'Hino Final de Consagração',
    section: 'culto_divino',
    category: 'louvor',
    responsible: 'Equipe de Louvor',
    timeSlot: '11:29',
    durationMinutes: 4,
    isRecurring: false,
    congregational1: {
      title: 'Hino #450 - Breve Jesus Voltará',
      url: 'https://www.youtube.com/results?search_query=hinario+450+adventista+playback',
    },
  },
  {
    name: 'Oração Final & Bênção',
    section: 'culto_divino',
    category: 'oracao',
    responsible: 'Pregador',
    timeSlot: '11:33',
    durationMinutes: 2,
    isRecurring: true,
    notes: 'Despedida da congregação',
  },
];

export const ManualLiturgyBuilderModal: React.FC<ManualLiturgyBuilderModalProps> = ({
  isOpen,
  onClose,
  currentProgram,
  onSaveProgram,
  onNotify,
}) => {
  const [date, setDate] = useState(currentProgram.date || getTodayDate());
  const [title, setTitle] = useState(currentProgram.title || 'Culto de Sábado');
  const [responsiblePerson, setResponsiblePerson] = useState(currentProgram.responsiblePerson || 'Davi');
  const [preacher, setPreacher] = useState(currentProgram.preacher || '');
  const [theme, setTheme] = useState(currentProgram.theme || '');
  const [notes, setNotes] = useState(currentProgram.notes || '');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [sectionFilter, setSectionFilter] = useState<'all' | ActivitySection>('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Hymn & Song quick picker state
  const [pickerSlotTarget, setPickerSlotTarget] = useState<{ actIdx: number; slot: 'c1' | 'c2' | 'c3' } | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerMode, setPickerMode] = useState<'hymnal' | 'catalog'>('hymnal');

  // Initialize with current program on open
  useEffect(() => {
    if (isOpen) {
      setDate(currentProgram.date || getTodayDate());
      setTitle(currentProgram.title || 'Culto de Sábado');
      setResponsiblePerson(currentProgram.responsiblePerson || 'Davi');
      setPreacher(currentProgram.preacher || '');
      setTheme(currentProgram.theme || '');
      setNotes(currentProgram.notes || '');

      if (currentProgram.activities && currentProgram.activities.length > 0) {
        setActivities(JSON.parse(JSON.stringify(currentProgram.activities)));
      } else {
        // Default to standard Adventist base stages
        loadIasdBaseTemplate();
      }
      setExpandedIndex(0);
    }
  }, [isOpen, currentProgram]);

  if (!isOpen) return null;

  const loadIasdBaseTemplate = () => {
    const newStages: ActivityItem[] = IASD_BASE_STAGES.map((s, idx) => ({
      ...s,
      id: `act-manual-${Date.now()}-${idx}`,
    }));
    setActivities(newStages);
  };

  const handleAddBlankStage = (section: ActivitySection = 'escola_sabatina') => {
    const newStage: ActivityItem = {
      id: `act-manual-${Date.now()}`,
      name: 'Nova Etapa da Liturgia',
      section,
      category: 'louvor',
      responsible: '',
      timeSlot: '09:00',
      durationMinutes: 5,
      isRecurring: false,
    };
    setActivities(prev => [...prev, newStage]);
    setExpandedIndex(activities.length);
  };

  const handleUpdateStage = (idx: number, updates: Partial<ActivityItem>) => {
    setActivities(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...updates };
      return copy;
    });
  };

  const handleMoveStage = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= activities.length) return;
    setActivities(prev => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
    setExpandedIndex(targetIdx);
  };

  const handleDeleteStage = (idx: number) => {
    setActivities(prev => prev.filter((_, i) => i !== idx));
    if (expandedIndex === idx) setExpandedIndex(null);
  };

  // Hymn / Song Picker actions
  const filteredHymns = pickerSearch.trim()
    ? ADVENTIST_HYMNS.filter(h =>
        h.number.toString().includes(pickerSearch.trim()) ||
        h.title.toLowerCase().includes(pickerSearch.toLowerCase())
      ).slice(0, 10)
    : ADVENTIST_HYMNS.slice(0, 10);

  const filteredCatalog = pickerSearch.trim()
    ? INITIAL_CHURCH_SONGS.filter(s =>
        s.title.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        s.artistOrGroup.toLowerCase().includes(pickerSearch.toLowerCase())
      ).slice(0, 10)
    : INITIAL_CHURCH_SONGS.slice(0, 10);

  const handleSelectHymnForSlot = (hymn: Hymn) => {
    if (!pickerSlotTarget) return;
    const { actIdx, slot } = pickerSlotTarget;
    const media: MediaLink = {
      title: `Hino #${hymn.number} - ${hymn.title}`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(hymn.youtubeSearchQuery)}`,
      note: `Hinário Adventista • Tom: ${hymn.key || 'Padrão'}`,
      isValidTransmission: true,
      sourceType: 'youtube',
    };

    if (slot === 'c1') handleUpdateStage(actIdx, { congregational1: media });
    if (slot === 'c2') handleUpdateStage(actIdx, { congregational2: media });
    if (slot === 'c3') handleUpdateStage(actIdx, { congregational3: media });

    setPickerSlotTarget(null);
    setPickerSearch('');
  };

  const handleSelectCatalogSongForSlot = (song: ChurchSong) => {
    if (!pickerSlotTarget) return;
    const { actIdx, slot } = pickerSlotTarget;
    const media: MediaLink = {
      title: song.title,
      url: song.youtubeUrlOrId || `https://www.youtube.com/results?search_query=${encodeURIComponent(song.title + ' ' + song.artistOrGroup + ' playback')}`,
      note: `${song.artistOrGroup} ${song.key ? `• Tom: ${song.key}` : ''}`,
      isValidTransmission: true,
      sourceType: 'youtube',
    };

    if (slot === 'c1') handleUpdateStage(actIdx, { congregational1: media });
    if (slot === 'c2') handleUpdateStage(actIdx, { congregational2: media });
    if (slot === 'c3') handleUpdateStage(actIdx, { congregational3: media });

    setPickerSlotTarget(null);
    setPickerSearch('');
  };

  // Submit and immediately close!
  const handleSaveAll = () => {
    if (activities.length === 0) {
      alert('Por favor, inclua ao menos uma etapa na liturgia.');
      return;
    }

    const newProgram: WorshipProgram = {
      ...currentProgram,
      id: `prog-${Date.now()}`,
      date: date.trim() || getTodayDate(),
      title: title.trim() || 'Culto de Sábado',
      responsiblePerson: responsiblePerson.trim() || 'Davi',
      preacher: preacher.trim() || undefined,
      theme: theme.trim() || undefined,
      notes: notes.trim() || undefined,
      activities: activities.map(a => ({
        ...a,
        completed: false,
      })),
      updatedAt: new Date().toISOString(),
    };

    onSaveProgram(newProgram);
    if (onNotify) {
      onNotify(`✓ Liturgia manual (${activities.length} etapas) salva com sucesso!`);
    }
    onClose(); // Crucial requirement: close immediately on save!
  };

  // Stats
  const esCount = activities.filter(a => a.section === 'escola_sabatina').length;
  const cdCount = activities.filter(a => a.section === 'culto_divino').length;
  const songsCount = activities.reduce((acc, a) => {
    let c = 0;
    if (a.congregational1?.title) c++;
    if (a.congregational2?.title) c++;
    if (a.congregational3?.title) c++;
    return acc + c;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl shadow-black/80 overflow-hidden text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Criar Liturgia Manual Completa</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                  Personalização Total
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Edite todas as etapas, horários, responsáveis, louvores e vídeos em um painel unificado.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar sem salvar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Liturgy Header Fields */}
        <div className="bg-slate-950/60 p-4 border-b border-slate-800/80 shrink-0 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="text-slate-400 font-bold mb-1 block flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Data do Culto:
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold mb-1 block">Título do Culto:</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Culto de Sábado"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold mb-1 block flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                Responsável / Dirigente:
              </label>
              <input
                type="text"
                value={responsiblePerson}
                onChange={e => setResponsiblePerson(e.target.value)}
                placeholder="Ex: Davi, Ancião Marcos"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold mb-1 block">Pregador:</label>
              <input
                type="text"
                value={preacher}
                onChange={e => setPreacher(e.target.value)}
                placeholder="Ex: Pr. Roberto"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold mb-1 block">Tema do Sermão:</label>
              <input
                type="text"
                value={theme}
                onChange={e => setTheme(e.target.value)}
                placeholder="Ex: Fidelidade e Graça"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Quick Action Bar for the Stages */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-850">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Seções:
              </span>
              <button
                type="button"
                onClick={() => setSectionFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  sectionFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Todas ({activities.length})
              </button>
              <button
                type="button"
                onClick={() => setSectionFilter('escola_sabatina')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  sectionFilter === 'escola_sabatina' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Escola Sabatina ({esCount})
              </button>
              <button
                type="button"
                onClick={() => setSectionFilter('culto_divino')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  sectionFilter === 'culto_divino' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Culto Divino ({cdCount})
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={loadIasdBaseTemplate}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer"
                title="Carregar modelo adventista oficial pré-configurado"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                <span>Modelo Padrão IASD</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddBlankStage('escola_sabatina')}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Etapa Escola Sabatina</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddBlankStage('culto_divino')}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Etapa Culto Divino</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stages List (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {activities.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-800 rounded-3xl space-y-3 bg-slate-950/40">
              <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">Nenhuma etapa na liturgia manual ainda</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Comece carregando o roteiro clássico da IASD com um clique ou adicione etapas individuais acima.
              </p>
              <button
                type="button"
                onClick={loadIasdBaseTemplate}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Carregar Roteiro Padrão IASD
              </button>
            </div>
          ) : (
            activities
              .map((act, realIdx) => ({ act, realIdx }))
              .filter(({ act }) => sectionFilter === 'all' || act.section === sectionFilter)
              .map(({ act, realIdx }, displayIdx) => {
                const isExpanded = expandedIndex === realIdx;

                return (
                  <div
                    key={act.id}
                    className={`rounded-2xl border transition-all ${
                      isExpanded
                        ? 'bg-slate-900 border-blue-500/70 shadow-lg ring-1 ring-blue-500/30'
                        : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Collapsed Header Bar of the Stage */}
                    <div 
                      className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
                      onClick={() => setExpandedIndex(isExpanded ? null : realIdx)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                          {realIdx + 1}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white truncate">
                              {act.name || 'Sem título'}
                            </span>

                            <span className={`px-2 py-0.2 rounded-md text-[10px] font-bold uppercase ${
                              act.section === 'escola_sabatina' 
                                ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50' 
                                : 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50'
                            }`}>
                              {act.section === 'escola_sabatina' ? 'Escola Sabatina' : 'Culto Divino'}
                            </span>

                            <span className="px-2 py-0.2 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300">
                              {act.category}
                            </span>

                            {act.isRecurring ? (
                              <span className="px-2 py-0.2 rounded-md text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/40 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Fixo (Todo Sábado)
                              </span>
                            ) : (
                              <span className="px-2 py-0.2 rounded-md text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-700/40 flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" /> Rotativo
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                            {act.timeSlot && <span className="text-amber-400 font-mono font-semibold">{act.timeSlot}</span>}
                            {act.responsible && <span>Resp: <strong className="text-slate-200">{act.responsible}</strong></span>}
                            {act.durationMinutes && <span>({act.durationMinutes} min)</span>}
                            {act.congregational1?.title && (
                              <span className="text-blue-300 font-medium flex items-center gap-1 truncate max-w-xs">
                                <Music className="w-3 h-3 text-blue-400 shrink-0" />
                                {act.congregational1.title}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Controls */}
                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleMoveStage(realIdx, 'up')}
                          disabled={realIdx === 0}
                          title="Subir ordem"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveStage(realIdx, 'down')}
                          disabled={realIdx === activities.length - 1}
                          title="Descer ordem"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStage(realIdx)}
                          title="Excluir etapa"
                          className="p-1.5 rounded-lg text-red-400 hover:text-white hover:bg-red-950/80 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedIndex(isExpanded ? null : realIdx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Edit Form for this Stage */}
                    {isExpanded && (
                      <div className="p-4 border-t border-slate-800/80 bg-slate-950/50 space-y-4 text-xs animate-in fade-in duration-150">
                        {/* Row 1: Name, Section, Category */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-1">
                            <label className="text-slate-400 font-bold mb-1 block">Nome da Etapa *</label>
                            <input
                              type="text"
                              value={act.name}
                              onChange={e => handleUpdateStage(realIdx, { name: e.target.value })}
                              placeholder="Ex: Louvor Congregacional"
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:border-blue-500 outline-none text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-slate-400 font-bold mb-1 block">Seção do Culto</label>
                            <select
                              value={act.section}
                              onChange={e => handleUpdateStage(realIdx, { section: e.target.value as ActivitySection })}
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:border-blue-500 outline-none text-xs"
                            >
                              <option value="escola_sabatina">Escola Sabatina</option>
                              <option value="culto_divino">Culto Divino</option>
                              <option value="culto_jovem">Culto Jovem / JA</option>
                              <option value="outro">Outro Culto</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-slate-400 font-bold mb-1 block">Categoria</label>
                            <select
                              value={act.category}
                              onChange={e => handleUpdateStage(realIdx, { category: e.target.value as ActivityCategory })}
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:border-blue-500 outline-none text-xs"
                            >
                              <option value="louvor">Momento de Louvor</option>
                              <option value="oracao">Oração / Fundo Musical</option>
                              <option value="mensagem_musical">Mensagem Musical</option>
                              <option value="video">Vídeo / Informativo</option>
                              <option value="infantil">Adoração Infantil</option>
                              <option value="ofertas">Dízimos e Ofertas</option>
                              <option value="sermao">Sermão / Pregador</option>
                              <option value="anuncios">Anúncios / Vinheta</option>
                              <option value="abertura">Abertura / Entrada</option>
                              <option value="geral">Geral / Estudo</option>
                            </select>
                          </div>
                        </div>

                        {/* Row 2: Responsible, TimeSlot, Duration, Recurring */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="text-slate-400 font-bold mb-1 block">Responsável:</label>
                            <input
                              type="text"
                              value={act.responsible || ''}
                              onChange={e => handleUpdateStage(realIdx, { responsible: e.target.value })}
                              placeholder="Ex: Davi, Ministério de Louvor..."
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:border-blue-500 outline-none text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-slate-400 font-bold mb-1 block">Horário (Início):</label>
                            <input
                              type="text"
                              value={act.timeSlot || ''}
                              onChange={e => handleUpdateStage(realIdx, { timeSlot: e.target.value })}
                              placeholder="Ex: 09:15"
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-semibold focus:border-blue-500 outline-none text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-slate-400 font-bold mb-1 block">Duração (minutos):</label>
                            <input
                              type="number"
                              min={1}
                              max={120}
                              value={act.durationMinutes || 5}
                              onChange={e => handleUpdateStage(realIdx, { durationMinutes: Number(e.target.value) || 5 })}
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:border-blue-500 outline-none text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-slate-400 font-bold mb-1 block">Regra de Limpeza:</label>
                            <button
                              type="button"
                              onClick={() => handleUpdateStage(realIdx, { isRecurring: !act.isRecurring })}
                              className={`w-full px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                act.isRecurring
                                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                                  : 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                              }`}
                            >
                              {act.isRecurring ? <ShieldCheck className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                              <span>{act.isRecurring ? 'Fixo (Todo Sábado)' : 'Rotativo (Limpo)'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Row 3: Music & Media Slots (C1, C2, C3) */}
                        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                              <Music className="w-3.5 h-3.5 text-blue-400" />
                              Músicas e Playbacks da Etapa:
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Escolha no Hinário 610, Catálogo ou informe o link do YouTube / arquivo.
                            </span>
                          </div>

                          {/* 3 Slots */}
                          {(['c1', 'c2', 'c3'] as const).map(slot => {
                            const media = slot === 'c1' ? act.congregational1 : slot === 'c2' ? act.congregational2 : act.congregational3;
                            const label = slot === 'c1' ? 'Música Principal (C1)' : slot === 'c2' ? 'Opção 2 (C2)' : 'Opção 3 (C3)';

                            return (
                              <div key={slot} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 uppercase">
                                      {slot.toUpperCase()}
                                    </span>
                                    <input
                                      type="text"
                                      value={media?.title || ''}
                                      onChange={e => {
                                        const val = e.target.value;
                                        const updatedMedia: MediaLink | undefined = val.trim() ? {
                                          title: val,
                                          url: media?.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(val + ' playback')}`,
                                          sourceType: 'youtube',
                                          isValidTransmission: true,
                                        } : undefined;

                                        if (slot === 'c1') handleUpdateStage(realIdx, { congregational1: updatedMedia });
                                        if (slot === 'c2') handleUpdateStage(realIdx, { congregational2: updatedMedia });
                                        if (slot === 'c3') handleUpdateStage(realIdx, { congregational3: updatedMedia });
                                      }}
                                      placeholder={`Título da ${label}...`}
                                      className="w-full px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-semibold text-xs focus:border-blue-500 outline-none"
                                    />
                                  </div>

                                  {media?.url && (
                                    <p className="text-[10px] text-slate-400 truncate mt-1 pl-7 font-mono">
                                      Link/Busca: {media.url}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 pl-7 sm:pl-0">
                                  {/* Button: Pick from Hymnal */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPickerSlotTarget({ actIdx: realIdx, slot });
                                      setPickerMode('hymnal');
                                      setPickerSearch('');
                                    }}
                                    className="px-2 py-1 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-300 border border-blue-700/50 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                    title="Escolher no Hinário Adventista 610"
                                  >
                                    <BookOpen className="w-3 h-3" />
                                    <span>Hinário HA</span>
                                  </button>

                                  {/* Button: Pick from Catalog */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPickerSlotTarget({ actIdx: realIdx, slot });
                                      setPickerMode('catalog');
                                      setPickerSearch('');
                                    }}
                                    className="px-2 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-amber-300 border border-amber-700/50 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                    title="Escolher no Catálogo de Músicas da Igreja"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    <span>Catálogo</span>
                                  </button>

                                  {media?.title && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (slot === 'c1') handleUpdateStage(realIdx, { congregational1: undefined });
                                        if (slot === 'c2') handleUpdateStage(realIdx, { congregational2: undefined });
                                        if (slot === 'c3') handleUpdateStage(realIdx, { congregational3: undefined });
                                      }}
                                      className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800"
                                      title="Limpar música"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="text-slate-400 font-bold mb-1 block">Observações para Sonoplastia:</label>
                          <input
                            type="text"
                            value={act.notes || ''}
                            onChange={e => handleUpdateStage(realIdx, { notes: e.target.value })}
                            placeholder="Ex: Microfone sem fio 1 para o solista, volume suave durante a transição..."
                            className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>

        {/* Modal footer with summary & save button */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
            <span>Total: <strong className="text-white">{activities.length}</strong> etapas</span>
            <span>•</span>
            <span>Escola Sabatina: <strong className="text-blue-400">{esCount}</strong></span>
            <span>•</span>
            <span>Culto Divino: <strong className="text-indigo-400">{cdCount}</strong></span>
            <span>•</span>
            <span>Músicas: <strong className="text-amber-400">{songsCount}</strong></span>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              id="save-manual-liturgy-btn"
              onClick={handleSaveAll}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Liturgia Manual</span>
            </button>
          </div>
        </div>

        {/* Hymn & Song Fast Picker Submodal */}
        {pickerSlotTarget && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
              {/* Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                    <Music className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {pickerMode === 'hymnal' ? 'Escolher do Hinário Adventista' : 'Escolher do Catálogo de Músicas'}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Vinculando no slot {pickerSlotTarget.slot.toUpperCase()} da etapa
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPickerSlotTarget(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mode switch */}
              <div className="p-3 border-b border-slate-800 bg-slate-900/90 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPickerMode('hymnal')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pickerMode === 'hymnal' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Hinário Adventista (HA 610)
                </button>
                <button
                  type="button"
                  onClick={() => setPickerMode('catalog')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pickerMode === 'catalog' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Catálogo da Igreja
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-3 border-b border-slate-800 bg-slate-950/60">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={pickerSearch}
                    onChange={e => setPickerSearch(e.target.value)}
                    placeholder={pickerMode === 'hymnal' ? 'Digite o número ou título do hino (ex: 250, Castelo Forte)...' : 'Digite o título da música ou grupo...'}
                    autoFocus
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar text-xs">
                {pickerMode === 'hymnal' ? (
                  filteredHymns.map(h => (
                    <button
                      key={h.number}
                      type="button"
                      onClick={() => handleSelectHymnForSlot(h)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-blue-950/50 border border-slate-800 hover:border-blue-700/60 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-blue-900/40 text-blue-300 font-bold flex items-center justify-center text-xs shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          #{h.number}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                            {h.title}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {h.category} {h.key ? `• Tom: ${h.key}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-blue-400 font-semibold shrink-0">
                        Selecionar
                      </span>
                    </button>
                  ))
                ) : (
                  filteredCatalog.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectCatalogSongForSlot(s)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-amber-950/50 border border-slate-800 hover:border-amber-700/60 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                          {s.title}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {s.artistOrGroup} {s.key ? `• Tom: ${s.key}` : ''} • {s.suggestedMoment || 'Geral'}
                        </p>
                      </div>
                      <span className="text-[10px] text-amber-400 font-semibold shrink-0">
                        Selecionar
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
