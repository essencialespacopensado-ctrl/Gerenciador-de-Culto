import React, { useState, useMemo } from 'react';
import { 
  X, Check, Music, Mic, Sparkles, Clock, Calendar, 
  ArrowRight, Layers, BookmarkCheck, ListOrdered, ChevronRight, Heart
} from 'lucide-react';
import { ChurchSong, ActivityItem, ActivitySection, LiturgyMomentPreset, SongLiturgyDestination } from '../types';

interface AssignSongToLiturgyModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: ChurchSong | null;
  activities: ActivityItem[];
  onConfirm: (song: ChurchSong, destination: SongLiturgyDestination) => void;
}

export const AssignSongToLiturgyModal: React.FC<AssignSongToLiturgyModalProps> = ({
  isOpen,
  onClose,
  song,
  activities,
  onConfirm,
}) => {
  if (!isOpen || !song) return null;

  // Determine smart default preset moment based on song type & suggested moment
  const defaultPreset = useMemo<LiturgyMomentPreset>(() => {
    const sug = (song.suggestedMoment || '').toLowerCase();
    if (sug.includes('escola')) return 'escola_abertura';
    if (sug.includes('oferta') || sug.includes('ofertório') || sug.includes('dízimo')) return 'ofertorio';
    if (sug.includes('apelo')) return 'apelo_pos_sermao';
    if (sug.includes('oração') || sug.includes('oracao') || song.type === 'fundo_musical') return 'oracao_intercessoria';
    if (sug.includes('criança') || sug.includes('infantil') || song.type === 'infantil') return 'adoracao_infantil';
    if (song.type === 'mensagem_musical') return 'mensagem_musical';
    return 'abertura_culto';
  }, [song]);

  const [mode, setMode] = useState<'preset' | 'custom_position' | 'existing_activity'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<LiturgyMomentPreset>(defaultPreset);

  // Custom position state
  const [selectedSection, setSelectedSection] = useState<ActivitySection>(
    defaultPreset.startsWith('escola') ? 'escola_sabatina' : 'culto_divino'
  );
  const [placementType, setPlacementType] = useState<'start_of_section' | 'end_of_section' | 'before_activity' | 'after_activity'>('before_activity');
  const [targetActivityId, setTargetActivityId] = useState<string>('');

  // Existing activity linkage state
  const [linkActivityId, setLinkActivityId] = useState<string>('');
  const [targetSlot, setTargetSlot] = useState<'c1' | 'c2' | 'c3'>('c1');

  // Activity customization fields
  const [customName, setCustomName] = useState(() => {
    const prefix = song.type === 'mensagem_musical' ? 'Mensagem Musical' : 'Momento de Louvor';
    return `${prefix}: ${song.title}`;
  });
  const [responsible, setResponsible] = useState(song.artistOrGroup || 'Ministério de Louvor');
  const [durationMinutes, setDurationMinutes] = useState<number>(5);
  const [notes, setNotes] = useState(() => {
    return [song.key ? `Tom: ${song.key}` : null, song.notes].filter(Boolean).join(' • ');
  });

  // Filter activities by section for relative positioning
  const sectionActivities = useMemo(() => {
    return activities.filter(a => a.section === selectedSection);
  }, [activities, selectedSection]);

  // Set default target activity if available
  useMemo(() => {
    if (sectionActivities.length > 0 && !targetActivityId) {
      // Find sermon if culto divino, else middle activity
      const sermon = sectionActivities.find(a => 
        a.category === 'sermao' || a.name.toLowerCase().includes('serm') || a.name.toLowerCase().includes('prega')
      );
      if (sermon) {
        setTargetActivityId(sermon.id);
      } else {
        setTargetActivityId(sectionActivities[0].id);
      }
    }
  }, [sectionActivities, targetActivityId]);

  // Compute live preview of where the song will enter
  const placementPreview = useMemo(() => {
    if (mode === 'preset') {
      switch (selectedPreset) {
        case 'mensagem_musical': {
          const sermon = activities.find(a => 
            a.section === 'culto_divino' && (a.category === 'sermao' || a.name.toLowerCase().includes('serm') || a.name.toLowerCase().includes('prega'))
          );
          return sermon 
            ? `Será inserido imediatamente ANTES de "${sermon.name}" no Culto Divino.`
            : 'Será inserido antes do Sermão no Culto Divino.';
        }
        case 'apelo_pos_sermao': {
          const sermon = activities.find(a => 
            a.section === 'culto_divino' && (a.category === 'sermao' || a.name.toLowerCase().includes('serm') || a.name.toLowerCase().includes('prega'))
          );
          return sermon 
            ? `Será inserido imediatamente APÓS o sermão "${sermon.name}" para o apelo.`
            : 'Será inserido após a pregação do Culto Divino.';
        }
        case 'abertura_culto':
          return 'Será inserido na Abertura do Culto Divino (logo após a Entrada da Plataforma).';
        case 'ofertorio':
          return 'Será inserido no momento dos Dízimos e Ofertas (Ofertório).';
        case 'oracao_intercessoria':
          return 'Será inserido como fundo ou prelúdio para a Oração de Joelhos.';
        case 'adoracao_infantil':
          return 'Será inserido no momento da Adoração Infantil (Crianças).';
        case 'encerramento_culto':
          return 'Será inserido como o Hino Final no encerramento do Culto Divino.';
        case 'escola_abertura':
          return 'Será inserido na Abertura da Escola Sabatina.';
        case 'escola_encerramento':
          return 'Será inserido no Encerramento da Escola Sabatina (antes do Culto Divino).';
        default:
          return 'Será inserido na programação do culto.';
      }
    } else if (mode === 'custom_position') {
      const targetAct = activities.find(a => a.id === targetActivityId);
      const targetName = targetAct ? `"${targetAct.name}"` : 'da atividade selecionada';
      const secName = selectedSection === 'escola_sabatina' ? 'Escola Sabatina' : 'Culto Divino';

      if (placementType === 'start_of_section') return `Será o primeiro item da ${secName}.`;
      if (placementType === 'end_of_section') return `Será o último item da ${secName}.`;
      if (placementType === 'before_activity') return `Será inserido imediatamente ANTES de ${targetName} na ${secName}.`;
      if (placementType === 'after_activity') return `Será inserido imediatamente APÓS ${targetName} na ${secName}.`;
    } else if (mode === 'existing_activity') {
      const act = activities.find(a => a.id === linkActivityId);
      return act 
        ? `Irá preencher o Congregacional ${targetSlot.toUpperCase()} da atividade "${act.name}".`
        : 'Selecione uma atividade para vincular.';
    }
    return '';
  }, [mode, selectedPreset, activities, selectedSection, placementType, targetActivityId, linkActivityId, targetSlot]);

  // Handle Form Submission
  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'existing_activity') {
      if (!linkActivityId) {
        alert('Selecione uma atividade existente para vincular a música.');
        return;
      }
      onConfirm(song, {
        mode: 'existing_activity',
        section: selectedSection,
        targetActivityId: linkActivityId,
        targetSlot,
        activityName: customName,
        durationMinutes,
        responsible,
        notes,
        placement: 'preset',
      });
    } else if (mode === 'preset') {
      const section: ActivitySection = 
        selectedPreset.startsWith('escola') ? 'escola_sabatina' : 'culto_divino';

      onConfirm(song, {
        mode: 'new_activity',
        section,
        presetMoment: selectedPreset,
        placement: 'preset',
        activityName: customName,
        durationMinutes,
        responsible,
        notes,
      });
    } else {
      // custom_position
      onConfirm(song, {
        mode: 'new_activity',
        section: selectedSection,
        placement: placementType,
        targetActivityId: (placementType === 'before_activity' || placementType === 'after_activity') ? targetActivityId : undefined,
        activityName: customName,
        durationMinutes,
        responsible,
        notes,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Destinar Momento na Liturgia
              </h3>
              <p className="text-xs text-slate-400">
                Escolha o momento exato em que esta música entrará na programação do culto.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Song Info Bar */}
        <div className="px-5 py-3 bg-slate-800/60 border-b border-slate-700/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-white">
              {song.title}
            </span>
            <span className="text-xs text-slate-400">
              • {song.artistOrGroup}
            </span>
            {song.key && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900 text-amber-400 border border-slate-700">
                Tom: {song.key}
              </span>
            )}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${
              song.type === 'mensagem_musical'
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                : song.type === 'fundo_musical'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                : song.type === 'infantil'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              {song.type === 'mensagem_musical' ? 'Mensagem Musical' : song.type === 'fundo_musical' ? 'Fundo Musical' : song.type === 'infantil' ? 'Infantil' : 'Louvor'}
            </span>
          </div>

          {song.suggestedMoment && (
            <span className="text-[11px] text-amber-300/90 font-medium">
              Sugerido: {song.suggestedMoment}
            </span>
          )}
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleConfirm} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          
          {/* Mode Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setMode('preset')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'preset'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>Momentos do Culto</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('custom_position')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'custom_position'
                  ? 'bg-blue-600 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Posição Precisa</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('existing_activity')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'existing_activity'
                  ? 'bg-indigo-600 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Vincular a Linha Existente</span>
            </button>
          </div>

          {/* TAB 1: PRESET MOMENTS */}
          {mode === 'preset' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Selecione o Momento do Culto:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                
                {/* Mensagem Musical (Antes do Sermão) */}
                <button
                  type="button"
                  onClick={() => setSelectedPreset('mensagem_musical')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 relative ${
                    selectedPreset === 'mensagem_musical'
                      ? 'bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-500/30'
                      : 'bg-slate-800/50 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-indigo-400" />
                      Mensagem Musical
                    </span>
                    {song.type === 'mensagem_musical' && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        ⭐ Recomendado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Imediatamente antes do Sermão / Pregação bíblica.
                  </p>
                  <span className="text-[10px] font-bold text-indigo-400 mt-1">Culto Divino</span>
                </button>

                {/* Louvor Congregacional / Abertura */}
                <button
                  type="button"
                  onClick={() => setSelectedPreset('abertura_culto')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 relative ${
                    selectedPreset === 'abertura_culto'
                      ? 'bg-amber-950/70 border-amber-500 ring-2 ring-amber-500/30'
                      : 'bg-slate-800/50 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-amber-400" />
                      Louvor Congregacional
                    </span>
                    {song.type === 'louvor' && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        ⭐ Recomendado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Abertura do Culto Divino com a congregação.
                  </p>
                  <span className="text-[10px] font-bold text-amber-400 mt-1">Culto Divino</span>
                </button>

                {/* Ofertório / Dízimos e Ofertas */}
                <button
                  type="button"
                  onClick={() => setSelectedPreset('ofertorio')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 relative ${
                    selectedPreset === 'ofertorio'
                      ? 'bg-emerald-950/70 border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'bg-slate-800/50 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    💰 Dízimos e Ofertas
                  </span>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Música especial durante o recolhimento das ofertas.
                  </p>
                  <span className="text-[10px] font-bold text-emerald-400 mt-1">Culto Divino</span>
                </button>

                {/* Apelo / Pós-Sermão */}
                <button
                  type="button"
                  onClick={() => setSelectedPreset('apelo_pos_sermao')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 relative ${
                    selectedPreset === 'apelo_pos_sermao'
                      ? 'bg-blue-950/70 border-blue-500 ring-2 ring-blue-500/30'
                      : 'bg-slate-800/50 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    ✝️ Momento de Apelo
                  </span>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Imediatamente após o término do Sermão.
                  </p>
                  <span className="text-[10px] font-bold text-blue-400 mt-1">Culto Divino</span>
                </button>

                {/* Oração de Joelhos / Intercessória */}
                <button
                  type="button"
                  onClick={() => setSelectedPreset('oracao_intercessoria')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 relative ${
                    selectedPreset === 'oracao_intercessoria'
                      ? 'bg-purple-950/70 border-purple-500 ring-2 ring-purple-500/30'
                      : 'bg-slate-800/50 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      🙏 Oração de Joelhos
                    </span>
                    {song.type === 'fundo_musical' && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        ⭐ Recomendado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Fundo musical suave ou canto de oração intercessória.
                  </p>
                  <span className="text-[10px] font-bold text-purple-400 mt-1">Culto Divino</span>
                </button>

                {/* Adoração Infantil */}
                <button
                  type="button"
                  onClick={() => setSelectedPreset('adoracao_infantil')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 relative ${
                    selectedPreset === 'adoracao_infantil'
                      ? 'bg-teal-950/70 border-teal-500 ring-2 ring-teal-500/30'
                      : 'bg-slate-800/50 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      👶 Adoração Infantil
                    </span>
                    {song.type === 'infantil' && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        ⭐ Recomendado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Música das crianças para a história infantil.
                  </p>
                  <span className="text-[10px] font-bold text-teal-400 mt-1">Culto Divino</span>
                </button>

                {/* Encerramento / Hino Final */}
                <button
                  type="button"
                  onClick={() => setSelectedPreset('encerramento_culto')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 relative ${
                    selectedPreset === 'encerramento_culto'
                      ? 'bg-orange-950/70 border-orange-500 ring-2 ring-orange-500/30'
                      : 'bg-slate-800/50 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    🏁 Hino Final / Encerramento
                  </span>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Ao final do culto divino para a despedida.
                  </p>
                  <span className="text-[10px] font-bold text-orange-400 mt-1">Culto Divino</span>
                </button>

                {/* Escola Sabatina: Louvor Inicial */}
                <button
                  type="button"
                  onClick={() => setSelectedPreset('escola_abertura')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 relative ${
                    selectedPreset === 'escola_abertura'
                      ? 'bg-sky-950/70 border-sky-500 ring-2 ring-sky-500/30'
                      : 'bg-slate-800/50 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    📖 Escola Sabatina
                  </span>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Louvor de abertura ou momento especial da Escola Sabatina.
                  </p>
                  <span className="text-[10px] font-bold text-sky-400 mt-1">Escola Sabatina</span>
                </button>

              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM POSITION */}
          {mode === 'custom_position' && (
            <div className="space-y-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
              {/* Section selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Em qual Seção da Programação?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSection('culto_divino')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      selectedSection === 'culto_divino'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    Culto Divino ({activities.filter(a => a.section === 'culto_divino').length} itens)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSection('escola_sabatina')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      selectedSection === 'escola_sabatina'
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    Escola Sabatina ({activities.filter(a => a.section === 'escola_sabatina').length} itens)
                  </button>
                </div>
              </div>

              {/* Placement Type */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Onde Inserir na Seção?
                </label>

                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="placementType"
                      checked={placementType === 'start_of_section'}
                      onChange={() => setPlacementType('start_of_section')}
                      className="text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-white">No Início da Seção (Primeiro item)</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="placementType"
                      checked={placementType === 'before_activity'}
                      onChange={() => setPlacementType('before_activity')}
                      className="text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-white">Antes de uma atividade específica...</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="placementType"
                      checked={placementType === 'after_activity'}
                      onChange={() => setPlacementType('after_activity')}
                      className="text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-white">Depois de uma atividade específica...</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="placementType"
                      checked={placementType === 'end_of_section'}
                      onChange={() => setPlacementType('end_of_section')}
                      className="text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-white">No Final da Seção (Último item)</span>
                  </label>
                </div>
              </div>

              {/* Target Activity Dropdown if before or after */}
              {(placementType === 'before_activity' || placementType === 'after_activity') && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {placementType === 'before_activity' ? 'Inserir antes de:' : 'Inserir depois de:'}
                  </label>
                  <select
                    value={targetActivityId}
                    onChange={(e) => setTargetActivityId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {sectionActivities.map((act, idx) => (
                      <option key={act.id} value={act.id}>
                        {idx + 1}. {act.name} {act.responsible ? `(${act.responsible})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXISTING ACTIVITY LINKAGE */}
          {mode === 'existing_activity' && (
            <div className="space-y-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
              <p className="text-xs text-slate-400">
                Vincule este louvor ou mensagem diretamente a uma linha já existente na liturgia (ex: "Momento de louvor", "Mensagem Musical"):
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Selecione a Linha da Liturgia Existente:
                </label>
                <select
                  value={linkActivityId}
                  onChange={(e) => setLinkActivityId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Selecione uma atividade...</option>
                  {activities.map(act => (
                    <option key={act.id} value={act.id}>
                      [{act.section === 'escola_sabatina' ? 'Escola Sabatina' : 'Culto Divino'}] {act.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Slot de Reprodução:
                </label>
                <div className="flex items-center gap-2">
                  {(['c1', 'c2', 'c3'] as const).map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTargetSlot(slot)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        targetSlot === slot
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      Slot {slot.toUpperCase()} {slot === 'c1' ? '(Principal / Vídeo)' : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Placement Live Feedback Banner */}
          {placementPreview && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
              <ChevronRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-amber-300">Posicionamento na Liturgia:</span>
                <p className="text-xs text-amber-200/90 font-medium">
                  {placementPreview}
                </p>
              </div>
            </div>
          )}

          {/* Activity Customization (if creating new item) */}
          {mode !== 'existing_activity' && (
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                Detalhes da Linha na Programação (Opcional)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Nome da Atividade
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Responsável / Solista / Coral
                  </label>
                  <input
                    type="text"
                    value={responsible}
                    onChange={(e) => setResponsible(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Duração Estimada
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value) || 5)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-medium">min</span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Observações / Tom Musical
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Tom: G • Solista com playback no microfone 1"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Check className="w-4 h-4" />
              <span>Inserir no Momento Selecionado</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
