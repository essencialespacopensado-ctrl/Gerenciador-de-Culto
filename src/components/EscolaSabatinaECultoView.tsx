import React, { useState, useEffect } from 'react';
import { 
  Music, Mic, Plus, Play, Tv, Edit3, Trash2, Check, X, 
  RotateCcw, ArrowUp, ArrowDown, Youtube, Sparkles, Sliders,
  CheckCircle2, ExternalLink, Info, AlertCircle, RefreshCw, Layers,
  ShieldCheck, BookOpen, Calendar, BookMarked
} from 'lucide-react';
import { WorshipProgram, ActivityItem, WorshipPraiseItem, ActivitySection, MediaLink } from '../types';
import { syncPraiseItemsToProgram } from '../utils/liturgySync';
import { 
  getSabbathSchoolManualForDate, 
  SABBATH_SCHOOL_MANUAL_WEEKS, 
  SabbathSchoolWeeklyManual 
} from '../data/sabbathSchoolManualData';

interface EscolaSabatinaECultoViewProps {
  program: WorshipProgram;
  onUpdateProgram: (newProgram: WorshipProgram) => void;
  onPlayMedia: (
    title: string, 
    queryOrUrl: string, 
    videoDate?: string, 
    downloadUrl?: string, 
    synopsis?: string, 
    targetScreen?: 'main' | 'auxiliary'
  ) => void;
}

const STORAGE_KEY = 'iasd_escola_sabatina_culto_items_v2';

export const PRESET_LITURGICAL_MOMENTS = [
  { id: 'es_louvor_1', label: 'Momento de Louvor - 1º Hino', section: 'escola_sabatina' as ActivitySection, kind: 'louvor_congregacional' as const },
  { id: 'es_louvor_2', label: 'Momento de Louvor - 2º Hino', section: 'escola_sabatina' as ActivitySection, kind: 'louvor_congregacional' as const },
  { id: 'es_louvor_3', label: 'Momento de Louvor - 3º Hino', section: 'escola_sabatina' as ActivitySection, kind: 'louvor_congregacional' as const },
  { id: 'es_hino_inicial', label: 'Hino Inicial (Escola Sabatina)', section: 'escola_sabatina' as ActivitySection, kind: 'louvor_congregacional' as const },
  { id: 'es_hino_final', label: 'Hino Final (Escola Sabatina)', section: 'escola_sabatina' as ActivitySection, kind: 'louvor_congregacional' as const },
  { id: 'es_mensagem_musical', label: 'Mensagem Musical (Escola Sabatina)', section: 'escola_sabatina' as ActivitySection, kind: 'mensagem_musical' as const },
  { id: 'cd_congregacional_1', label: 'Congregacional 1 (Abertura do Culto)', section: 'culto_divino' as ActivitySection, kind: 'louvor_congregacional' as const },
  { id: 'cd_congregacional_2', label: 'Congregacional 2 (Louvor do Culto)', section: 'culto_divino' as ActivitySection, kind: 'louvor_congregacional' as const },
  { id: 'cd_congregacional_3', label: 'Congregacional 3 (Ofertório / Dízimos)', section: 'culto_divino' as ActivitySection, kind: 'louvor_congregacional' as const },
  { id: 'cd_mensagem_musical', label: 'Mensagem Musical Especial (Antes do Sermão)', section: 'culto_divino' as ActivitySection, kind: 'mensagem_musical' as const },
  { id: 'cd_apelo', label: 'Hino de Apelo (Pós-Sermão)', section: 'culto_divino' as ActivitySection, kind: 'louvor_congregacional' as const },
  { id: 'cd_hino_final', label: 'Hino Final (Encerramento do Culto)', section: 'culto_divino' as ActivitySection, kind: 'louvor_congregacional' as const },
  { id: 'cd_momento_especial', label: 'Momento Especial de Louvor', section: 'culto_divino' as ActivitySection, kind: 'louvor_congregacional' as const },
  { id: 'video_especial', label: 'Vídeo Especial na Programação', section: 'culto_divino' as ActivitySection, kind: 'mensagem_musical' as const },
];

// 3 Louvores e 1 Mensagem Musical por padrão
const DEFAULT_PRAISE_ITEMS: WorshipPraiseItem[] = [
  {
    id: 'praise-default-1',
    kind: 'louvor_congregacional',
    title: '10 Mil Razões (Bendize, ó Minha Alma)',
    artistOrGroup: 'Ministério de Louvor / Congregação',
    key: 'G',
    section: 'escola_sabatina',
    momentDescription: 'Momento de Louvor - 1º Hino',
    youtubeUrlOrQuery: 'https://www.youtube.com/watch?v=LuvfMDhTyMA',
    notes: 'Iniciar com violão acústico e piano suave',
    order: 1,
    isRecurring: false,
  },
  {
    id: 'praise-default-2',
    kind: 'louvor_congregacional',
    title: 'Meu Pastor (O Senhor é o Meu Pastor)',
    artistOrGroup: 'Ministério de Louvor / Congregação',
    key: 'C',
    section: 'escola_sabatina',
    momentDescription: 'Momento de Louvor - 2º Hino',
    youtubeUrlOrQuery: 'https://www.youtube.com/watch?v=95z4h2H1Uqg',
    notes: 'Subir tom no refrão final se a igreja estiver cantando forte',
    order: 2,
    isRecurring: false,
  },
  {
    id: 'praise-default-3',
    kind: 'louvor_congregacional',
    title: 'Lá no Céu (Breve Jesus Voltará)',
    artistOrGroup: 'Ministério de Louvor / Congregação',
    key: 'D',
    section: 'escola_sabatina',
    momentDescription: 'Momento de Louvor - 3º Hino',
    youtubeUrlOrQuery: 'https://www.youtube.com/watch?v=kZ-bT0hF-kM',
    notes: 'Hino congregacional de júbilo e esperança',
    order: 3,
    isRecurring: false,
  },
  {
    id: 'praise-default-4',
    kind: 'mensagem_musical',
    title: 'No Teu Altar',
    artistOrGroup: 'Arautos do Rei / Solista',
    key: 'F',
    section: 'culto_divino',
    momentDescription: 'Mensagem Musical Especial (Antes do Sermão)',
    youtubeUrlOrQuery: 'https://www.youtube.com/watch?v=2e0g7T3P04Y',
    notes: 'Ajustar microfone para solista, luz direcionada para o púlpito',
    order: 4,
    isRecurring: false,
  },
];

const MUSICAL_KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B', 'Dm', 'Em', 'Am'];

export const EscolaSabatinaECultoView: React.FC<EscolaSabatinaECultoViewProps> = ({
  program,
  onUpdateProgram,
  onPlayMedia,
}) => {
  // State for items
  const [items, setItems] = useState<WorshipPraiseItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_PRAISE_ITEMS;
  });

  // Filters
  const [filterType, setFilterType] = useState<'all' | 'escola_sabatina' | 'culto_divino' | 'louvor_congregacional' | 'mensagem_musical'>('all');

  // Currently editing item ID
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Edit form buffer
  const [formTitle, setFormTitle] = useState('');
  const [formArtist, setFormArtist] = useState('');
  const [formKind, setFormKind] = useState<'louvor_congregacional' | 'mensagem_musical'>('louvor_congregacional');
  const [formSection, setFormSection] = useState<ActivitySection>('escola_sabatina');
  const [formKey, setFormKey] = useState('');
  const [formMoment, setFormMoment] = useState('');
  const [formTargetActivityId, setFormTargetActivityId] = useState<string>('');
  const [formIsRecurring, setFormIsRecurring] = useState<boolean>(false);
  const [formYoutube, setFormYoutube] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Add new item mode
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [addModeKind, setAddModeKind] = useState<'louvor_congregacional' | 'mensagem_musical'>('louvor_congregacional');

  // Sabbath School Manual Modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualWeek, setManualWeek] = useState<SabbathSchoolWeeklyManual>(() => 
    getSabbathSchoolManualForDate(program.date)
  );

  // Notification feedback
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  // Persist to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore
    }
  }, [items]);

  // Counts
  const louvoresCount = items.filter(i => i.kind === 'louvor_congregacional').length;
  const mensagensCount = items.filter(i => i.kind === 'mensagem_musical').length;
  const escolaCount = items.filter(i => i.section === 'escola_sabatina').length;
  const cultoCount = items.filter(i => i.section === 'culto_divino').length;
  const fixedCount = items.filter(i => i.isRecurring).length;
  const rotatingCount = items.filter(i => !i.isRecurring).length;

  // Filtered items
  const filteredItems = items.filter(item => {
    if (filterType === 'all') return true;
    if (filterType === 'escola_sabatina') return item.section === 'escola_sabatina';
    if (filterType === 'culto_divino') return item.section === 'culto_divino';
    if (filterType === 'louvor_congregacional') return item.kind === 'louvor_congregacional';
    if (filterType === 'mensagem_musical') return item.kind === 'mensagem_musical';
    return true;
  });

  // Toggle item recurrence directly from the quadro (card)
  const handleToggleRecurring = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updatedItem: WorshipPraiseItem | undefined;
    const nextItems = items.map(item => {
      if (item.id === id) {
        const nextVal = !item.isRecurring;
        updatedItem = { ...item, isRecurring: nextVal };
        return updatedItem;
      }
      return item;
    });

    setItems(nextItems);

    if (updatedItem) {
      showNotification(
        updatedItem.isRecurring
          ? `🛡️ "${updatedItem.title}" configurado como: Todo Sábado (Fixo — protegido na limpeza)`
          : `🔄 "${updatedItem.title}" configurado como: Rotativo (Limpo no fim do culto)`
      );
      // Synchronize directly with liturgy
      const synced = syncPraiseItemsToProgram(nextItems, program);
      onUpdateProgram(synced);
    }
  };

  // Start editing an item in its quadro
  const handleStartEdit = (item: WorshipPraiseItem) => {
    setEditingItemId(item.id);
    setFormTitle(item.title);
    setFormArtist(item.artistOrGroup);
    setFormKind(item.kind);
    setFormSection(item.section);
    setFormKey(item.key || '');
    setFormMoment(item.momentDescription || '');
    setFormTargetActivityId(item.targetActivityId || '');
    setFormIsRecurring(item.isRecurring || false);
    setFormYoutube(item.youtubeUrlOrQuery);
    setFormNotes(item.notes || '');
    setIsAddingNew(false);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  // Save edited item
  const handleSaveEdit = (id: string) => {
    if (!formTitle.trim()) {
      alert('Por favor, informe o título da música.');
      return;
    }

    const nextItems = items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          title: formTitle.trim(),
          artistOrGroup: formArtist.trim() || 'Ministério de Louvor',
          kind: formKind,
          section: formSection,
          key: formKey.trim() || undefined,
          momentDescription: formMoment.trim() || (
            formKind === 'mensagem_musical' ? 'Mensagem Musical Especial' : 'Momento de Louvor'
          ),
          targetActivityId: formTargetActivityId || undefined,
          isRecurring: formIsRecurring,
          youtubeUrlOrQuery: formYoutube.trim() || `https://www.youtube.com/results?search_query=${encodeURIComponent(formTitle + ' playback')}`,
          notes: formNotes.trim() || undefined,
        };
      }
      return item;
    });

    setItems(nextItems);
    setEditingItemId(null);

    // Synchronize to Liturgia Principal immediately
    const updatedProgram = syncPraiseItemsToProgram(nextItems, program);
    onUpdateProgram(updatedProgram);

    showNotification(`✓ Quadro "${formTitle}" salvo e sincronizado com a liturgia principal!`);
  };

  // Start adding a new item
  const handleStartAdd = (kind: 'louvor_congregacional' | 'mensagem_musical') => {
    setAddModeKind(kind);
    setFormKind(kind);
    setFormTitle('');
    setFormArtist(kind === 'mensagem_musical' ? 'Solista / Quarteto' : 'Ministério de Louvor');
    setFormSection(kind === 'mensagem_musical' ? 'culto_divino' : 'escola_sabatina');
    setFormKey('G');
    setFormMoment(kind === 'mensagem_musical' ? 'Antes do Sermão (Culto Divino)' : `Momento de Louvor - Louvor ${louvoresCount + 1}`);
    setFormTargetActivityId('');
    setFormIsRecurring(false);
    setFormYoutube('');
    setFormNotes('');
    setIsAddingNew(true);
    setEditingItemId(null);
  };

  // Submit new item
  const handleConfirmAdd = () => {
    if (!formTitle.trim()) {
      alert('Por favor, informe o título da música.');
      return;
    }

    const newItem: WorshipPraiseItem = {
      id: `praise-${Date.now()}`,
      title: formTitle.trim(),
      artistOrGroup: formArtist.trim() || (formKind === 'mensagem_musical' ? 'Solista' : 'Ministério de Louvor'),
      kind: formKind,
      section: formSection,
      key: formKey.trim() || undefined,
      momentDescription: formMoment.trim() || (
        formKind === 'mensagem_musical' ? 'Mensagem Musical Especial' : 'Momento de Louvor'
      ),
      targetActivityId: formTargetActivityId || undefined,
      isRecurring: formIsRecurring,
      youtubeUrlOrQuery: formYoutube.trim() || `https://www.youtube.com/results?search_query=${encodeURIComponent(formTitle + ' playback')}`,
      notes: formNotes.trim() || undefined,
      order: items.length + 1,
    };

    const nextItems = [...items, newItem];
    setItems(nextItems);
    setIsAddingNew(false);

    // Sync immediately to program
    const updatedProgram = syncPraiseItemsToProgram(nextItems, program);
    onUpdateProgram(updatedProgram);

    showNotification(`✓ Novo item cadastrado no momento "${newItem.momentDescription}" e sincronizado com a liturgia!`);
  };

  // Delete item
  const handleDeleteItem = (id: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja remover "${title}" desta lista?`)) {
      const nextItems = items.filter(i => i.id !== id);
      setItems(nextItems);
      if (editingItemId === id) setEditingItemId(null);

      const updatedProgram = syncPraiseItemsToProgram(nextItems, program);
      onUpdateProgram(updatedProgram);

      showNotification(`"${title}" removido.`);
    }
  };

  // Move item up / down
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setItems(updated);

    const updatedProgram = syncPraiseItemsToProgram(updated, program);
    onUpdateProgram(updatedProgram);
  };

  // Reset to default (3 Louvores + 1 Mensagem Musical)
  const handleResetToDefault = () => {
    if (window.confirm('Deseja restaurar a lista padrão com 3 Louvores Congregacionais e 1 Mensagem Musical?')) {
      setItems(DEFAULT_PRAISE_ITEMS);
      setEditingItemId(null);
      setIsAddingNew(false);
      const updatedProgram = syncPraiseItemsToProgram(DEFAULT_PRAISE_ITEMS, program);
      onUpdateProgram(updatedProgram);
      showNotification('✓ Lista padrão restaurada (3 Louvores + 1 Mensagem Musical).');
    }
  };

  // Synchronize all praises and musical message into the Liturgy program manually
  const handleSyncWithLiturgy = () => {
    const updatedProgram = syncPraiseItemsToProgram(items, program);
    onUpdateProgram(updatedProgram);
    showNotification(`✓ Liturgia atualizada com sucesso com os ${items.length} louvores e mensagens!`);
  };

  // Apply hymns from the Sabbath School Manual (CPB / DSA)
  const handleApplyManualHymns = (manual: SabbathSchoolWeeklyManual) => {
    // Check if initial & final hymns exist
    const initialHymnItem: WorshipPraiseItem = {
      id: `praise-manual-initial-${Date.now()}`,
      kind: 'louvor_congregacional',
      title: `Hinário ${manual.initialHymn.number} - ${manual.initialHymn.title}`,
      artistOrGroup: 'Congregação (Manual da Escola Sabatina)',
      key: 'G',
      section: 'escola_sabatina',
      momentDescription: 'Hino Inicial (Escola Sabatina)',
      youtubeUrlOrQuery: manual.initialHymn.youtubeUrl,
      notes: `Sugerido no Manual da Escola Sabatina: ${manual.lessonTitle}`,
      order: 0,
      isRecurring: true, // Manual opening hymn happens every sabbath
      sourceFromManual: true,
    };

    const finalHymnItem: WorshipPraiseItem = {
      id: `praise-manual-final-${Date.now()}`,
      kind: 'louvor_congregacional',
      title: `Hinário ${manual.finalHymn.number} - ${manual.finalHymn.title}`,
      artistOrGroup: 'Congregação (Manual da Escola Sabatina)',
      key: 'Bb',
      section: 'escola_sabatina',
      momentDescription: 'Hino Final (Escola Sabatina)',
      youtubeUrlOrQuery: manual.finalHymn.youtubeUrl,
      notes: `Hino de encerramento sugerido no Manual: ${manual.lessonTitle}`,
      order: 99,
      isRecurring: true,
      sourceFromManual: true,
    };

    // Replace existing or append
    let nextItems = items.filter(
      i => !i.momentDescription?.toLowerCase().includes('hino inicial') &&
           !i.momentDescription?.toLowerCase().includes('hino final') &&
           !i.title.toLowerCase().includes('hino inicial escola sabatina') &&
           !i.title.toLowerCase().includes('hino final escola sabatina')
    );

    nextItems = [initialHymnItem, ...nextItems, finalHymnItem];
    setItems(nextItems);

    // Sync directly to program activities
    const updatedProgram = syncPraiseItemsToProgram(nextItems, program);
    onUpdateProgram(updatedProgram);

    setShowManualModal(false);
    showNotification(
      `✓ Hinos do Manual aplicados: Inicial (Hino ${manual.initialHymn.number}) e Final (Hino ${manual.finalHymn.number})!`
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-600 text-white rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                Escola Sabatina & Culto
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Padrão: 3 Louvores + 1 Mensagem Musical + Hinos do Manual
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Music className="w-6 h-6 text-amber-400" />
              Louvores, Mensagens Musicais & Hinos
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Edite cada quadro diretamente, escolha o momento exato em que cada música será usada na liturgia e controle o que acontece todo sábado (fixo) ou o que é rotativo.
            </p>
          </div>

          {/* Global Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Manual da Escola Sabatina Button */}
            <button
              onClick={() => {
                setManualWeek(getSabbathSchoolManualForDate(program.date));
                setShowManualModal(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-900/30 transition-all hover:scale-102 cursor-pointer border border-purple-400/40"
              title="Pegar hinos inicial e final sugeridos no Manual da Escola Sabatina"
            >
              <BookOpen className="w-4 h-4 text-purple-200" />
              <span>📖 Pegar Hinos do Manual (ES)</span>
            </button>

            <button
              onClick={handleSyncWithLiturgy}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all hover:scale-102 cursor-pointer"
              title="Aplica estes louvores e mensagens musicais diretamente na programação oficial do sábado"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sincronizar com a Liturgia</span>
            </button>

            <button
              onClick={handleResetToDefault}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Restaurar os 3 Louvores e 1 Mensagem Musical padrão"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restaurar Padrão</span>
            </button>
          </div>
        </div>

        {/* Quick Add Bar & Stat Badges */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Add Louvor Congregacional button */}
            <button
              onClick={() => handleStartAdd('louvor_congregacional')}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-900/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Adicionar Louvor Congregacional</span>
            </button>

            {/* Add Mensagem Musical button */}
            <button
              onClick={() => handleStartAdd('mensagem_musical')}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-900/30 cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>+ Adicionar Mensagem Musical</span>
            </button>
          </div>

          {/* Stat Badges */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              {fixedCount} Todo Sábado
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-300 font-semibold flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-amber-400" />
              {rotatingCount} Rotativos
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300 font-medium">
              Total: {items.length} quadros
            </span>
          </div>
        </div>
      </div>

      {/* Adding / Editing Panel Inline */}
      {isAddingNew && (
        <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                addModeKind === 'mensagem_musical'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
              }`}>
                {addModeKind === 'mensagem_musical' ? 'Nova Mensagem Musical / Vídeo Especial' : 'Novo Louvor Congregacional'}
              </span>
              <h3 className="text-sm font-bold text-white">Escolha os detalhes e o momento exato na programação</h3>
            </div>
            <button
              onClick={() => setIsAddingNew(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-bold mb-1">Título da Música ou Vídeo *</label>
              <input
                type="text"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="Ex: Descansar, Grandioso És Tu, O Santo Sábado..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Artist / Group */}
            <div>
              <label className="block text-slate-400 font-bold mb-1">Cantor / Grupo / Responsável</label>
              <input
                type="text"
                value={formArtist}
                onChange={e => setFormArtist(e.target.value)}
                placeholder="Ex: Equipe Azul, Solista, Congregação..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-slate-400 font-bold mb-1">Tipo de Item</label>
              <select
                value={formKind}
                onChange={e => setFormKind(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="louvor_congregacional">Louvor Congregacional</option>
                <option value="mensagem_musical">Mensagem Musical / Vídeo Especial</option>
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="block text-slate-400 font-bold mb-1">Destino no Sábado</label>
              <select
                value={formSection}
                onChange={e => setFormSection(e.target.value as ActivitySection)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="escola_sabatina">Escola Sabatina (09:00)</option>
                <option value="culto_divino">Culto Divino (10:15)</option>
              </select>
            </div>

            {/* Musical Key (Tom) */}
            <div>
              <label className="block text-slate-400 font-bold mb-1">Tom Musical</label>
              <select
                value={formKey}
                onChange={e => setFormKey(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">Não informado</option>
                {MUSICAL_KEYS.map(k => (
                  <option key={k} value={k}>Tom {k}</option>
                ))}
              </select>
            </div>

            {/* Momento Específico na Programação (Preset pills + Link to activity) */}
            <div className="sm:col-span-3 space-y-2 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <label className="block text-slate-300 font-bold">
                🎯 Momento Exato em que Será Usado na Programação
              </label>

              {/* Preset buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {PRESET_LITURGICAL_MOMENTS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setFormMoment(preset.label);
                      setFormSection(preset.section);
                      setFormKind(preset.kind);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      formMoment === preset.label
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom input or linkage to existing activity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1">
                    Descrição do Momento (ou digite um momento personalizado)
                  </label>
                  <input
                    type="text"
                    value={formMoment}
                    onChange={e => setFormMoment(e.target.value)}
                    placeholder="Ex: Antes do Sermão, Louvor 1, Momento Especial de Oração..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1">
                    Vincular a uma Atividade existente da Liturgia
                  </label>
                  <select
                    value={formTargetActivityId}
                    onChange={e => {
                      const actId = e.target.value;
                      setFormTargetActivityId(actId);
                      if (actId) {
                        const act = program.activities.find(a => a.id === actId);
                        if (act) {
                          setFormMoment(act.name);
                          setFormSection(act.section);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
                  >
                    <option value="">Nenhuma atividade vinculada (novo quadro)</option>
                    {program.activities.map(act => (
                      <option key={act.id} value={act.id}>
                        {act.section === 'escola_sabatina' ? '[ES]' : '[Culto]'} {act.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Frequency switch (Todo Sábado vs Rotativo) */}
            <div className="sm:col-span-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  {formIsRecurring ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-amber-400" />
                  )}
                  Comportamento na Limpeza de Liturgia:
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {formIsRecurring 
                    ? 'Todo Sábado (Fixo): Ficará salvo permanentemente para os próximos cultos.' 
                    : 'Rotativo: Será limpo automaticamente ao limpar itens rotativos do culto.'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-700 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setFormIsRecurring(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    formIsRecurring
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Todo Sábado
                </button>
                <button
                  type="button"
                  onClick={() => setFormIsRecurring(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    !formIsRecurring
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Rotativo
                </button>
              </div>
            </div>

            {/* YouTube Link */}
            <div className="sm:col-span-3">
              <label className="block text-slate-400 font-bold mb-1">Link ou Busca do YouTube (Playback / Letra)</label>
              <input
                type="text"
                value={formYoutube}
                onChange={e => setFormYoutube(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... ou deixe vazio para busca automática"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono text-xs"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-3">
              <label className="block text-slate-400 font-bold mb-1">Observações para a Sonoplastia</label>
              <input
                type="text"
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                placeholder="Ex: Microfone sem fio 2, subir som no refrão..."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => setIsAddingNew(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmAdd}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Música no Momento Escolhido</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterType === 'all'
              ? 'bg-slate-700 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          Todos ({items.length})
        </button>

        <button
          onClick={() => setFilterType('louvor_congregacional')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
            filterType === 'louvor_congregacional'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-blue-400/80 hover:text-blue-300 hover:bg-blue-950/40'
          }`}
        >
          <Music className="w-3 h-3" />
          Louvores Congregacionais ({louvoresCount})
        </button>

        <button
          onClick={() => setFilterType('mensagem_musical')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
            filterType === 'mensagem_musical'
              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
              : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-950/40'
          }`}
        >
          <Mic className="w-3 h-3" />
          Mensagens Musicais ({mensagensCount})
        </button>

        <button
          onClick={() => setFilterType('escola_sabatina')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterType === 'escola_sabatina'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          Escola Sabatina ({escolaCount})
        </button>

        <button
          onClick={() => setFilterType('culto_divino')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterType === 'culto_divino'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          Culto Divino ({cultoCount})
        </button>
      </div>

      {/* Items List (Quadros) */}
      <div className="space-y-3.5">
        {filteredItems.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
            <Music className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-bold text-white">Nenhum item encontrado neste filtro</p>
            <p className="text-xs text-slate-500 mt-1">
              Adicione um novo louvor congregacional ou mensagem musical acima.
            </p>
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const isEditing = editingItemId === item.id;
            const isLouvor = item.kind === 'louvor_congregacional';

            if (isEditing) {
              return (
                <div 
                  key={item.id}
                  className="bg-slate-900 border-2 border-blue-500/70 rounded-3xl p-5 shadow-2xl space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                      Editando Quadro: {item.title}
                    </span>
                    <button
                      onClick={handleCancelEdit}
                      className="text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 font-bold mb-1">Título *</label>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={e => setFormTitle(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Cantor / Grupo</label>
                      <input
                        type="text"
                        value={formArtist}
                        onChange={e => setFormArtist(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Tipo</label>
                      <select
                        value={formKind}
                        onChange={e => setFormKind(e.target.value as any)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                      >
                        <option value="louvor_congregacional">Louvor Congregacional</option>
                        <option value="mensagem_musical">Mensagem Musical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Seção</label>
                      <select
                        value={formSection}
                        onChange={e => setFormSection(e.target.value as any)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                      >
                        <option value="escola_sabatina">Escola Sabatina</option>
                        <option value="culto_divino">Culto Divino</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Tom Musical</label>
                      <select
                        value={formKey}
                        onChange={e => setFormKey(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                      >
                        <option value="">Não informado</option>
                        {MUSICAL_KEYS.map(k => (
                          <option key={k} value={k}>Tom {k}</option>
                        ))}
                      </select>
                    </div>

                    {/* Momento Específico na Programação */}
                    <div className="sm:col-span-3 space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <label className="block text-slate-300 font-bold">Momento Específico na Liturgia</label>
                      <div className="flex flex-wrap items-center gap-1">
                        {PRESET_LITURGICAL_MOMENTS.slice(0, 8).map(preset => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              setFormMoment(preset.label);
                              setFormSection(preset.section);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer ${
                              formMoment === preset.label
                                ? 'bg-blue-600 text-white border-blue-400'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <input
                          type="text"
                          value={formMoment}
                          onChange={e => setFormMoment(e.target.value)}
                          placeholder="Momento na liturgia..."
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                        />
                        <select
                          value={formTargetActivityId}
                          onChange={e => {
                            const actId = e.target.value;
                            setFormTargetActivityId(actId);
                            if (actId) {
                              const act = program.activities.find(a => a.id === actId);
                              if (act) {
                                setFormMoment(act.name);
                                setFormSection(act.section);
                              }
                            }
                          }}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                        >
                          <option value="">Vincular a uma atividade existente...</option>
                          {program.activities.map(act => (
                            <option key={act.id} value={act.id}>
                              {act.section === 'escola_sabatina' ? '[ES]' : '[Culto]'} {act.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Recurrence in edit form */}
                    <div className="sm:col-span-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-300">
                        {formIsRecurring ? '🛡️ Acontece Todo Sábado (Fixo)' : '🔄 Rotativo (Limpo no fim do culto)'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setFormIsRecurring(true)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            formIsRecurring ? 'bg-emerald-600 text-white' : 'text-slate-400 bg-slate-900 hover:text-white'
                          }`}
                        >
                          Todo Sábado
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormIsRecurring(false)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            !formIsRecurring ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 bg-slate-900 hover:text-white'
                          }`}
                        >
                          Rotativo
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-slate-400 font-bold mb-1">Link ou Busca do YouTube</label>
                      <input
                        type="text"
                        value={formYoutube}
                        onChange={e => setFormYoutube(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-slate-400 font-bold mb-1">Observações da Sonoplastia</label>
                      <input
                        type="text"
                        value={formNotes}
                        onChange={e => setFormNotes(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleSaveEdit(item.id)}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-md cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              );
            }

            const isRecurring = item.isRecurring || false;

            return (
              <div
                key={item.id}
                className={`border rounded-2xl p-4 sm:p-5 transition-all shadow-md hover:border-slate-700/80 ${
                  isLouvor 
                    ? 'bg-slate-900/90 border-slate-800' 
                    : 'bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border-amber-900/40'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Icon badge */}
                    <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center font-black text-sm shadow-md ${
                      isLouvor 
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {isLouvor ? <Music className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {/* Type badge */}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          isLouvor
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {isLouvor ? 'Louvor Congregacional' : 'Mensagem Musical'}
                        </span>

                        {/* Section badge */}
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold">
                          {item.section === 'escola_sabatina' ? 'Escola Sabatina' : 'Culto Divino'}
                        </span>

                        {/* Source From Manual Badge */}
                        {item.sourceFromManual && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-500/50 text-[10px] font-bold flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-purple-400" />
                            Manual da Escola Sabatina
                          </span>
                        )}

                        {/* Musical Key */}
                        {item.key && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-900/40 text-purple-300 border border-purple-700/50 text-[10px] font-bold">
                            Tom: {item.key}
                          </span>
                        )}

                        {/* Moment badge */}
                        {item.momentDescription && (
                          <span className="text-[11px] text-amber-300/90 font-medium bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-md">
                            🎯 {item.momentDescription}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug truncate">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-300">
                          {item.artistOrGroup}
                        </span>
                        {item.notes && (
                          <span className="text-slate-500 italic">
                            — {item.notes}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions: Frequency Button (Todo Sábado vs Rotativo), Play Tela 1 / Telão, Edit & Order */}
                  <div className="flex flex-wrap items-center gap-2 lg:self-center shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                    {/* Botão Todo Sábado vs Rotativo em todos os quadros */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleRecurring(item.id, e)}
                      title={
                        isRecurring 
                          ? 'Acontece Todo Sábado (Fixo — protegido na limpeza). Clique para tornar Rotativo.' 
                          : 'Rotativo (Limpo ao finalizar culto). Clique para tornar Fixo (Todo Sábado).'
                      }
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isRecurring
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/70 hover:bg-emerald-900/80 ring-1 ring-emerald-500/30'
                          : 'bg-slate-800/90 text-slate-400 border-slate-700 hover:text-amber-300 hover:border-amber-600/60'
                      }`}
                    >
                      {isRecurring ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Todo Sábado</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Rotativo</span>
                        </>
                      )}
                    </button>

                    {/* Play Tela 1 */}
                    <button
                      onClick={() => onPlayMedia(item.title, item.youtubeUrlOrQuery, undefined, undefined, undefined, 'main')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                      title="Reproduzir na Tela 1 (Operador)"
                    >
                      <Play className="w-3.5 h-3.5 text-blue-400" />
                      <span>Tela 1</span>
                    </button>

                    {/* Play Telão */}
                    <button
                      onClick={() => onPlayMedia(item.title, item.youtubeUrlOrQuery, undefined, undefined, undefined, 'auxiliary')}
                      className="px-3 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Projetar no Telão (Auxiliar)"
                    >
                      <Tv className="w-3.5 h-3.5 text-purple-400" />
                      <span>Telão</span>
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => handleStartEdit(item)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-700/60"
                      title="Editar quadro no mesmo lugar"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Editar</span>
                    </button>

                    {/* Reordering */}
                    <div className="flex items-center gap-1 bg-slate-800/80 rounded-xl p-0.5 border border-slate-700/60">
                      <button
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Mover para cima"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === items.length - 1}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Mover para baixo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteItem(item.id, item.title)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Remover quadro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info Box */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-300">
            Sincronização Direta e Automática com a Liturgia Principal
          </p>
          <p className="mt-0.5">
            Ao salvar ou alternar os botões de <strong>Todo Sábado / Rotativo</strong> em qualquer quadro, as alterações refletem automaticamente na Liturgia Principal. Quando a liturgia for limpa, todos os itens marcados como <strong>Todo Sábado</strong> permanecerão protegidos.
          </p>
        </div>
      </div>

      {/* Modal: Manual da Escola Sabatina (CPB / DSA) */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-purple-500/60 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Manual da Escola Sabatina (Auxiliar CPB / DSA)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Hinos oficiais sugeridos para a abertura e encerramento
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowManualModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select Lesson Week */}
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Lição da Semana:
                </span>
                <span className="text-amber-400 font-semibold">{manualWeek.quarter}</span>
              </div>

              <select
                value={manualWeek.lessonNumber}
                onChange={e => {
                  const num = Number(e.target.value);
                  const found = SABBATH_SCHOOL_MANUAL_WEEKS.find(w => w.lessonNumber === num);
                  if (found) setManualWeek(found);
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:ring-2 focus:ring-purple-500"
              >
                {SABBATH_SCHOOL_MANUAL_WEEKS.filter(w => w.lessonNumber !== 99).map(w => (
                  <option key={w.lessonNumber} value={w.lessonNumber}>
                    Lição {w.lessonNumber}: {w.lessonTitle} ({w.date})
                  </option>
                ))}
              </select>

              <div className="text-[11px] text-slate-400 pt-1">
                <p className="italic font-serif">"{manualWeek.memoryVerse}"</p>
                <p className="text-[10px] text-purple-300 font-semibold mt-1">
                  🌍 Foco Missionário: {manualWeek.missionaryFocus}
                </p>
              </div>
            </div>

            {/* Hymns from Manual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Hino Inicial */}
              <div className="bg-slate-950/90 border border-purple-800/50 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-purple-900/50 text-purple-200 text-[10px] font-black uppercase">
                    Hino Inicial (Abertura)
                  </span>
                  <span className="text-xs text-amber-400 font-bold">
                    HASD {manualWeek.initialHymn.number}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  {manualWeek.initialHymn.title}
                </h4>
                {manualWeek.initialHymn.theme && (
                  <p className="text-[11px] text-slate-400">
                    Tema: {manualWeek.initialHymn.theme}
                  </p>
                )}
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => onPlayMedia(manualWeek.initialHymn.title, manualWeek.initialHymn.youtubeUrl, undefined, undefined, undefined, 'main')}
                    className="grow px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3 text-blue-400" />
                    Ouvir Playback
                  </button>
                  <button
                    onClick={() => onPlayMedia(manualWeek.initialHymn.title, manualWeek.initialHymn.youtubeUrl, undefined, undefined, undefined, 'auxiliary')}
                    className="px-2 py-1.5 bg-purple-900/50 hover:bg-purple-800 text-purple-200 border border-purple-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    title="Telão"
                  >
                    <Tv className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Hino Final */}
              <div className="bg-slate-950/90 border border-indigo-800/50 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-indigo-900/50 text-indigo-200 text-[10px] font-black uppercase">
                    Hino Final (Encerramento)
                  </span>
                  <span className="text-xs text-amber-400 font-bold">
                    HASD {manualWeek.finalHymn.number}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  {manualWeek.finalHymn.title}
                </h4>
                {manualWeek.finalHymn.theme && (
                  <p className="text-[11px] text-slate-400">
                    Tema: {manualWeek.finalHymn.theme}
                  </p>
                )}
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => onPlayMedia(manualWeek.finalHymn.title, manualWeek.finalHymn.youtubeUrl, undefined, undefined, undefined, 'main')}
                    className="grow px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3 text-blue-400" />
                    Ouvir Playback
                  </button>
                  <button
                    onClick={() => onPlayMedia(manualWeek.finalHymn.title, manualWeek.finalHymn.youtubeUrl, undefined, undefined, undefined, 'auxiliary')}
                    className="px-2 py-1.5 bg-purple-900/50 hover:bg-purple-800 text-purple-200 border border-purple-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    title="Telão"
                  >
                    <Tv className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowManualModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Fechar
              </button>

              <button
                onClick={() => handleApplyManualHymns(manualWeek)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-900/30 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Aplicar Hinos do Manual à Programação</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
