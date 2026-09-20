import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, ArrowUp, ArrowDown, Play, CheckCircle2, 
  Circle, Calendar, User, Mic2, Music, Youtube, FileSpreadsheet,
  AlertCircle, Share2, Printer, Sparkles, Volume2, Video, Download, RefreshCw, Sliders, Tv,
  ShieldCheck, BookOpen, X, Check, ListPlus, HardDrive, AlertTriangle, Clipboard
} from 'lucide-react';
import { WorshipProgram, ActivityItem, ActivitySection, WeeklyMediaItem, MediaLink } from '../types';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { AuxiliaryMixerButton } from './AuxiliaryMixerButton';
import { projectionManager } from '../utils/projectionManager';
import { isValidTransmissionMedia } from '../utils/mediaUtils';
import { ManualLiturgyBuilderModal } from './ManualLiturgyBuilderModal';
import { PasteLiturgyModal } from './PasteLiturgyModal';
import { 
  formatWorshipDateLong, 
  formatWorshipDateShort, 
  getNextSaturdayDate, 
  getTodayDate,
  isActivityRecurring,
  cleanRotatingLiturgyItems
} from '../utils/worshipArchiveManager';
import {
  getSabbathSchoolManualForDate,
  SabbathSchoolWeeklyManual,
  SABBATH_SCHOOL_MANUAL_WEEKS
} from '../data/sabbathSchoolManualData';

const SECTION_STAGE_PRESETS: Record<ActivitySection, { name: string; responsible?: string; isRecurring: boolean }[]> = {
  escola_sabatina: [
    { name: 'Boas-vindas e Oração Inicial', responsible: 'Direção ES', isRecurring: true },
    { name: 'Momento de Louvor (Equipe Azul)', responsible: 'Equipe Azul', isRecurring: true },
    { name: 'Hino Inicial (Manual da ES)', responsible: 'Congregação', isRecurring: true },
    { name: 'Oração de Joelhos', responsible: 'Direção ES', isRecurring: true },
    { name: 'Informativo Mundial das Missões (Vídeo)', responsible: 'Sonoplastia', isRecurring: true },
    { name: 'Testemunho / Experiência Missionária', responsible: 'Membro Convidado', isRecurring: false },
    { name: 'Introdução e Recitação do Verso Bíblico', responsible: 'Direção ES', isRecurring: true },
    { name: 'Estudo da Lição nas Classes', responsible: 'Professores', isRecurring: true },
    { name: 'Encerramento da Lição', responsible: 'Superintendente ES', isRecurring: true },
    { name: 'Mensagem Musical da Escola Sabatina', responsible: 'Solista / Grupo', isRecurring: false },
    { name: 'Hino Final (Manual da ES)', responsible: 'Congregação', isRecurring: true },
    { name: 'Anúncios e Avisos da Escola Sabatina', responsible: 'Secretaria', isRecurring: true },
  ],
  culto_divino: [
    { name: 'Prelúdio e Momento de Louvor', responsible: 'Equipe de Louvor', isRecurring: true },
    { name: 'Entrada dos Oficiantes / Plataforma', responsible: 'Oficiantes', isRecurring: true },
    { name: 'Oração Silenciosa / Invocação', responsible: 'Ancião', isRecurring: true },
    { name: 'Boas-vindas e Avisos da Igreja', responsible: 'Comunicação', isRecurring: true },
    { name: 'Dízimos e Ofertas (Provai e Vede)', responsible: 'Diáconos', isRecurring: true },
    { name: 'Adoração Infantil', responsible: 'Ministério da Criança', isRecurring: true },
    { name: 'Leitura Bíblica', responsible: 'Membro Convidado', isRecurring: true },
    { name: 'Oração Intercessória / De Joelhos', responsible: 'Ancião', isRecurring: true },
    { name: 'Mensagem Musical Especial', responsible: 'Solista / Coral', isRecurring: false },
    { name: 'Sermão / Mensagem da Palavra', responsible: 'Pastor / Pregador', isRecurring: true },
    { name: 'Hino de Consagração / Apelo', responsible: 'Congregação', isRecurring: true },
    { name: 'Bênção Pastoral / Oração Final', responsible: 'Pastor / Ancião', isRecurring: true },
    { name: 'Poslúdio e Despedida', responsible: 'Sonoplastia', isRecurring: true },
    { name: 'Cerimônia de Batismo', responsible: 'Pastor', isRecurring: false },
    { name: 'Santa Ceia do Senhor', responsible: 'Pastor e Oficiais', isRecurring: false },
    { name: 'Apresentação de Bebê', responsible: 'Pastor', isRecurring: false },
    { name: 'Vídeo Especial', responsible: 'Sonoplastia', isRecurring: false },
  ],
  culto_jovem: [
    { name: 'Abertura Culto Jovem', responsible: 'Líder JA', isRecurring: true },
    { name: 'Momento de Louvor JA', responsible: 'Banda Jovem', isRecurring: true },
    { name: 'Dinâmica e Quebra-Gelo', responsible: 'Equipe JA', isRecurring: true },
    { name: 'Oração Intercessória', responsible: 'Jovens', isRecurring: true },
    { name: 'Testemunho Jovem', responsible: 'Convidado', isRecurring: false },
    { name: 'Mensagem Musical JA', responsible: 'Solista', isRecurring: false },
    { name: 'Palestra / Mensagem Central', responsible: 'Orador', isRecurring: true },
    { name: 'Oração Final', responsible: 'Líder JA', isRecurring: true },
  ],
  outro: [
    { name: 'Momento Especial', responsible: 'Coordenação', isRecurring: false },
    { name: 'Oração', responsible: 'Líder', isRecurring: true },
    { name: 'Mensagem', responsible: 'Orador', isRecurring: false },
  ],
};

interface ProgramScheduleViewProps {
  program: WorshipProgram;
  weeklyMedia: {
    informativo: WeeklyMediaItem;
    provaiEVede: WeeklyMediaItem;
  };
  onUpdateProgram: (newProgram: WorshipProgram) => void;
  onOpenAddModal: (section?: ActivitySection, insertAfterId?: string) => void;
  onOpenEditModal: (activity: ActivityItem) => void;
  onPlayMedia: (title: string, queryOrUrl: string, videoDate?: string, downloadUrl?: string, synopsis?: string, targetScreen?: 'main' | 'auxiliary') => void;
  onOpenSonoplastiaMode: () => void;
  onOpenShareModal: () => void;
  onOpenWeeklyMediaModal: () => void;
  onOpenWeeklySearchModal?: () => void;
  onOpenMusicalBackgrounds?: () => void;
  onOpenMixer?: () => void;
  onOpenPlaybacks?: () => void;
  onOpenSongsCatalog?: () => void;
  onOpenFinishWorshipModal?: () => void;
  onOpenArchivesModal?: () => void;
  archivedCount?: number;
  onNotify?: (msg: string) => void;
}

export const ProgramScheduleView: React.FC<ProgramScheduleViewProps> = ({
  program,
  weeklyMedia,
  onUpdateProgram,
  onOpenAddModal,
  onOpenEditModal,
  onPlayMedia,
  onOpenSonoplastiaMode,
  onOpenShareModal,
  onOpenWeeklyMediaModal,
  onOpenWeeklySearchModal,
  onOpenMusicalBackgrounds,
  onOpenMixer,
  onOpenPlaybacks,
  onOpenSongsCatalog,
  onOpenFinishWorshipModal,
  onOpenArchivesModal,
  archivedCount = 0,
  onNotify,
}) => {
  // Chave seletora principal de modo: 'liturgia' (padrão limpo) | 'som_telao' | 'gestao'
  const [activeMode, setActiveMode] = useState<'liturgia' | 'som_telao' | 'gestao'>('liturgia');
  const [showWeeklyVideosCard, setShowWeeklyVideosCard] = useState(false);
  const [activeSectionFilter, setActiveSectionFilter] = useState<'all' | 'escola_sabatina' | 'culto_divino'>('all');
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [showCleanRotatingModal, setShowCleanRotatingModal] = useState(false);
  const [editDate, setEditDate] = useState(program.date || getTodayDate());
  const [editResponsible, setEditResponsible] = useState(program.responsiblePerson);
  const [editTitle, setEditTitle] = useState(program.title);
  const [editTheme, setEditTheme] = useState(program.theme || '');
  const [editPreacher, setEditPreacher] = useState(program.preacher || '');

  // Stage Deletion Confirmation State
  const [activityToDelete, setActivityToDelete] = useState<ActivityItem | null>(null);

  // Manual Liturgy Builder & Paste Liturgy Modals
  const [showManualBuilderModal, setShowManualBuilderModal] = useState(false);
  const [showPasteLiturgyModal, setShowPasteLiturgyModal] = useState(false);

  // Inline Quick Add Stage States
  const [inlineAddSection, setInlineAddSection] = useState<ActivitySection | null>(null);
  const [quickStageName, setQuickStageName] = useState('');
  const [quickStageResponsible, setQuickStageResponsible] = useState('');
  const [quickStageTime, setQuickStageTime] = useState('');
  const [quickStageIsRecurring, setQuickStageIsRecurring] = useState(false);

  const handleConfirmCleanRotating = () => {
    const cleaned = cleanRotatingLiturgyItems(program);
    onUpdateProgram(cleaned);
    setShowCleanRotatingModal(false);
    if (onNotify) {
      onNotify(`✓ Liturgia limpa com sucesso! Os itens que acontecem todo sábado foram 100% preservados para ${formatWorshipDateShort(cleaned.date)}.`);
    }
  };

  // Keep edit fields synced if program changes externally
  React.useEffect(() => {
    setEditDate(program.date || getTodayDate());
    setEditResponsible(program.responsiblePerson);
    setEditTitle(program.title);
    setEditTheme(program.theme || '');
    setEditPreacher(program.preacher || '');
  }, [program.date, program.responsiblePerson, program.title, program.theme, program.preacher]);

  const { isPlayingPad, isPlayingVideo, activeVideoTitle } = useAudioEngine();

  // Sabbath School Manual Modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualWeek, setManualWeek] = useState<SabbathSchoolWeeklyManual>(() => 
    getSabbathSchoolManualForDate(program.date)
  );

  const handleApplyManualHymnsToLiturgy = (manual: SabbathSchoolWeeklyManual) => {
    let updatedActivities = [...program.activities];

    // Hino Inicial Escola Sabatina
    const initialIndex = updatedActivities.findIndex(a => 
      a.section === 'escola_sabatina' && (a.name.toLowerCase().includes('hino inicial') || a.category === 'louvor')
    );
    const initialHymnActivity: ActivityItem = {
      id: initialIndex >= 0 ? updatedActivities[initialIndex].id : `act-manual-initial-${Date.now()}`,
      name: `Hino Inicial Escola Sabatina: Hinário ${manual.initialHymn.number} - ${manual.initialHymn.title}`,
      responsible: 'Congregação (Manual da Escola Sabatina)',
      timeSlot: '09:05',
      durationMinutes: 5,
      section: 'escola_sabatina',
      category: 'louvor',
      completed: false,
      isRecurring: true,
      notes: `Sugerido no Manual da ES: ${manual.lessonTitle}`,
      congregational1: {
        title: `Hinário ${manual.initialHymn.number} - ${manual.initialHymn.title}`,
        url: manual.initialHymn.youtubeUrl,
      }
    };

    if (initialIndex >= 0) {
      updatedActivities[initialIndex] = initialHymnActivity;
    } else {
      updatedActivities.unshift(initialHymnActivity);
    }

    // Hino Final Escola Sabatina
    const finalIndex = updatedActivities.findIndex(a => 
      a.section === 'escola_sabatina' && a.name.toLowerCase().includes('hino final')
    );
    const finalHymnActivity: ActivityItem = {
      id: finalIndex >= 0 ? updatedActivities[finalIndex].id : `act-manual-final-${Date.now()}`,
      name: `Hino Final Escola Sabatina: Hinário ${manual.finalHymn.number} - ${manual.finalHymn.title}`,
      responsible: 'Congregação (Manual da Escola Sabatina)',
      timeSlot: '10:05',
      durationMinutes: 5,
      section: 'escola_sabatina',
      category: 'louvor',
      completed: false,
      isRecurring: true,
      notes: `Encerramento sugerido no Manual da ES: ${manual.lessonTitle}`,
      congregational1: {
        title: `Hinário ${manual.finalHymn.number} - ${manual.finalHymn.title}`,
        url: manual.finalHymn.youtubeUrl,
      }
    };

    if (finalIndex >= 0) {
      updatedActivities[finalIndex] = finalHymnActivity;
    } else {
      const lastEsIdx = updatedActivities.reduce((acc, a, idx) => a.section === 'escola_sabatina' ? idx : acc, -1);
      if (lastEsIdx >= 0) {
        updatedActivities.splice(lastEsIdx + 1, 0, finalHymnActivity);
      } else {
        updatedActivities.push(finalHymnActivity);
      }
    }

    onUpdateProgram({
      ...program,
      activities: updatedActivities,
      updatedAt: new Date().toISOString(),
    });

    setShowManualModal(false);
    if (onNotify) {
      onNotify(`✓ Hinos do Manual aplicados na Escola Sabatina: Inicial (Hino ${manual.initialHymn.number}) e Final (Hino ${manual.finalHymn.number})!`);
    }
  };

  const handleSaveHeader = () => {
    onUpdateProgram({
      ...program,
      date: editDate || program.date || getTodayDate(),
      responsiblePerson: editResponsible.trim() || 'Davi',
      title: editTitle.trim() || 'Culto de Sábado',
      theme: editTheme.trim() || undefined,
      preacher: editPreacher.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
    setIsEditingHeader(false);
  };

  const handleToggleComplete = (activityId: string) => {
    const updated = program.activities.map(act => {
      if (act.id === activityId) {
        return { ...act, completed: !act.completed };
      }
      return act;
    });
    onUpdateProgram({ ...program, activities: updated });
  };

  const handleToggleRecurring = (activityId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    let targetName = '';
    let nextVal = false;
    const updated = program.activities.map(act => {
      if (act.id === activityId) {
        targetName = act.name;
        const currentVal = act.isRecurring !== undefined ? act.isRecurring : isActivityRecurring(act);
        nextVal = !currentVal;
        return { ...act, isRecurring: nextVal };
      }
      return act;
    });

    onUpdateProgram({
      ...program,
      activities: updated,
      updatedAt: new Date().toISOString(),
    });

    if (onNotify) {
      onNotify(
        nextVal
          ? `🛡️ "${targetName}" configurado para: Todo Sábado (Fixo — protegido na limpeza)`
          : `🔄 "${targetName}" configurado para: Rotativo (Limpo no fim do culto)`
      );
    }
  };

  const handleConfirmDeleteActivity = () => {
    if (!activityToDelete) return;
    const deletedName = activityToDelete.name;
    const updated = program.activities.filter(act => act.id !== activityToDelete.id);
    onUpdateProgram({
      ...program,
      activities: updated,
      updatedAt: new Date().toISOString(),
    });
    if (onNotify) {
      onNotify(`🗑️ Etapa "${deletedName}" removida da liturgia com sucesso.`);
    }
    setActivityToDelete(null);
  };

  const handleMoveActivityInSection = (activityId: string, direction: 'up' | 'down') => {
    const act = program.activities.find(a => a.id === activityId);
    if (!act) return;
    const sectionItems = program.activities.filter(a => a.section === act.section);
    const itemSecIdx = sectionItems.findIndex(a => a.id === activityId);
    const targetSecIdx = direction === 'up' ? itemSecIdx - 1 : itemSecIdx + 1;
    if (targetSecIdx < 0 || targetSecIdx >= sectionItems.length) return;

    const targetItem = sectionItems[targetSecIdx];
    const globalIdx1 = program.activities.findIndex(a => a.id === activityId);
    const globalIdx2 = program.activities.findIndex(a => a.id === targetItem.id);

    if (globalIdx1 < 0 || globalIdx2 < 0) return;

    const list = [...program.activities];
    const temp = list[globalIdx1];
    list[globalIdx1] = list[globalIdx2];
    list[globalIdx2] = temp;

    onUpdateProgram({
      ...program,
      activities: list,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleQuickAddStage = (section: ActivitySection) => {
    if (!quickStageName.trim()) return;

    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      name: quickStageName.trim(),
      section,
      category: 'geral',
      responsible: quickStageResponsible.trim() || undefined,
      timeSlot: quickStageTime.trim() || undefined,
      durationMinutes: 5,
      completed: false,
      isRecurring: quickStageIsRecurring,
    };

    const lastSecIdx = program.activities.reduce(
      (acc, a, idx) => a.section === section ? idx : acc,
      -1
    );

    let updatedActivities: ActivityItem[];
    if (lastSecIdx >= 0) {
      updatedActivities = [...program.activities];
      updatedActivities.splice(lastSecIdx + 1, 0, newActivity);
    } else {
      updatedActivities = [...program.activities, newActivity];
    }

    onUpdateProgram({
      ...program,
      activities: updatedActivities,
      updatedAt: new Date().toISOString(),
    });

    if (onNotify) {
      onNotify(`✓ Etapa "${newActivity.name}" inserida na liturgia!`);
    }

    setQuickStageName('');
    setQuickStageResponsible('');
    setQuickStageTime('');
    setQuickStageIsRecurring(false);
    setInlineAddSection(null);
  };

  const esActivities = program.activities.filter(a => a.section === 'escola_sabatina');
  const cdActivities = program.activities.filter(a => a.section === 'culto_divino');
  const otherActivities = program.activities.filter(a => a.section !== 'escola_sabatina' && a.section !== 'culto_divino');

  // Render a media button for C1, C2, C3 with auxiliary mixer button when playing
  const renderMediaCell = (
    item?: MediaLink, 
    defaultLabel = '—',
    badgeLabel?: string,
    activityParent?: ActivityItem
  ) => {
    if (!item || !item.title) {
      return <span className="text-slate-600 font-mono text-xs">{defaultLabel}</span>;
    }

    // Regra estrita do usuário: AS musicas só devem aparecer na liturgia se estiverem corretas com o link de transmissão
    const isValid = isValidTransmissionMedia(item);
    if (!isValid) {
      return (
        <div 
          key={badgeLabel || item.title}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs shadow-xs"
          title="Mídia bloqueada: Esta música só aparecerá na transmissão se tiver o link do YouTube ou arquivo do Pen Drive vinculado."
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="truncate max-w-[130px] text-slate-300 font-medium text-xs">
              {badgeLabel ? `[${badgeLabel}] ` : ''}{item.title}
            </span>
            <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wide">
              Transmissão Pendente
            </span>
          </div>
          {activityParent && (
            <button
              type="button"
              onClick={() => onOpenEditModal(activityParent)}
              className="px-1.5 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10px] font-black uppercase transition-all cursor-pointer shrink-0"
              title="Vincular vídeo oficial do YouTube ou arquivo do Pen Drive"
            >
              Vincular
            </button>
          )}
        </div>
      );
    }

    const isFundo = item.title.toUpperCase().includes('FUNDO');
    const isVideo = item.title.toUpperCase().includes('VÍDEO') || item.title.toUpperCase().includes('VIDEO') || item.title.toUpperCase().includes('VINHETA') || item.title.toUpperCase().includes('PROVAI') || item.title.toUpperCase().includes('INFORMATIVO');

    // If it's the weekly mission video or Provai, attach the official weekly date
    let videoDate = item.videoDate;
    let downloadUrl: string | undefined;
    let synopsis: string | undefined;

    if (item.title.toUpperCase().includes('INFORMATIVO')) {
      videoDate = weeklyMedia.informativo.dateText;
      downloadUrl = weeklyMedia.informativo.downloadUrl;
      synopsis = weeklyMedia.informativo.synopsis;
    } else if (item.title.toUpperCase().includes('PROVAI')) {
      videoDate = weeklyMedia.provaiEVede.dateText;
      downloadUrl = weeklyMedia.provaiEVede.downloadUrl;
      synopsis = weeklyMedia.provaiEVede.synopsis;
    }

    const isFundoPlaying = isFundo && isPlayingPad;
    const isVideoPlaying = isVideo && isPlayingVideo && (
      !activeVideoTitle || 
      activeVideoTitle.toLowerCase().includes(item.title.toLowerCase()) || 
      item.title.toLowerCase().includes(activeVideoTitle.toLowerCase())
    );

    const isPendriveSource = item.sourceType === 'pendrive' || item.sourceType === 'local' || !!item.fileName || item.url?.startsWith('blob:');

    return (
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => onPlayMedia(item.title, item.url || item.title, videoDate, downloadUrl, synopsis)}
          title={`Clique para reproduzir ${badgeLabel ? `(${badgeLabel})` : ''}: ${item.title}`}
          className={`group text-left px-2 py-1 rounded-lg text-xs font-semibold max-w-full flex items-center gap-1.5 transition-all border cursor-pointer hover:shadow-md ${
            isFundo
              ? 'bg-purple-950/70 text-purple-200 border-purple-700/60 hover:bg-purple-900/90'
              : isVideo
              ? 'bg-red-950/70 text-red-200 border-red-700/60 hover:bg-red-900/90'
              : 'bg-blue-950/70 text-blue-200 border-blue-700/60 hover:bg-blue-900/90'
          }`}
        >
          {badgeLabel && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-black tracking-wider bg-white/15 text-white border border-white/20 shrink-0">
              {badgeLabel}
            </span>
          )}
          <div className="truncate flex flex-col min-w-0">
            <span className="truncate max-w-[140px] sm:max-w-[180px] text-xs">
              {item.title}
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {/* Badge de Origem da Mídia */}
              {isPendriveSource ? (
                <span className="text-[8px] font-bold text-blue-300 bg-blue-950/90 border border-blue-500/40 px-1 rounded inline-flex items-center gap-0.5">
                  <HardDrive className="w-2.5 h-2.5 text-blue-400" />
                  <span>{item.driveOrigin || 'Pen Drive'}</span>
                </span>
              ) : (
                <span className="text-[8px] font-bold text-red-300 bg-red-950/90 border border-red-500/40 px-1 rounded inline-flex items-center gap-0.5">
                  <Youtube className="w-2.5 h-2.5 text-red-400" />
                  <span>YouTube</span>
                </span>
              )}

              {videoDate && (
                <span className="text-[9px] font-bold text-amber-400">
                  📅 {videoDate}
                </span>
              )}
              {(item.url?.startsWith('offline:') || item.title.toUpperCase().includes('INFORMATIVO') || item.title.toUpperCase().includes('PROVAI')) && (
                <span className="text-[8px] font-bold text-emerald-300 bg-emerald-950/90 border border-emerald-500/40 px-1 rounded inline-flex items-center gap-0.5">
                  ⚡ Salvo
                </span>
              )}
            </div>
          </div>
          <span className="shrink-0 w-4 h-4 rounded bg-white/10 flex items-center justify-center text-slate-300 group-hover:scale-110 transition-transform">
            {isFundo ? (
              <Volume2 className="w-2.5 h-2.5 text-purple-300" />
            ) : (
              <Play className="w-2.5 h-2.5 fill-current text-red-400" />
            )}
          </span>
        </button>

        {/* Botão de Transmissão Direta para o Telão da Igreja */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPlayMedia(item.title, item.url || item.title, videoDate, downloadUrl, synopsis, 'auxiliary');
          }}
          title="Jogar direto no Telão da Igreja (Tela 2 em tela cheia)"
          className="px-2 py-1.5 rounded-xl bg-purple-900/80 hover:bg-purple-700 text-purple-200 border border-purple-600/70 flex items-center gap-1 text-[11px] font-bold shadow-xs hover:scale-105 transition-all cursor-pointer"
        >
          <Tv className="w-3.5 h-3.5 text-purple-300 shrink-0" />
          <span className="hidden sm:inline">Telão</span>
        </button>

        {/* Botão Auxiliar de Mixer para Fundos Musicais (aparece apenas quando estiver sendo reproduzido) */}
        {isFundoPlaying && (
          <AuxiliaryMixerButton
            type="fundo"
            isPlaying={true}
            onOpenFullMixer={onOpenMixer}
          />
        )}

        {/* Botão Auxiliar de Mixer para Vídeos (aparece apenas quando estiver sendo reproduzido) */}
        {isVideoPlaying && (
          <AuxiliaryMixerButton
            type="video"
            isPlaying={true}
            label={item.title.slice(0, 10)}
            onOpenFullMixer={onOpenMixer}
          />
        )}
      </div>
    );
  };

  const renderSectionTable = (title: string, subtitle: string, items: ActivityItem[], sectionKey: ActivitySection) => {
    return (
      <div className="glass-panel card-lift rounded-3xl border border-slate-800 shadow-xl overflow-hidden mb-8 animate-fade-slide-up">
        {/* Section Header */}
        <div className="px-6 py-4.5 bg-slate-950/80 text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
          <div className="space-y-0.5">
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-400" />
              {title}
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              {subtitle} • {items.length} atividades cadastradas
            </p>
          </div>

          <div className="flex items-center gap-2">
            {sectionKey === 'escola_sabatina' && (
              <button
                type="button"
                onClick={() => {
                  setManualWeek(getSabbathSchoolManualForDate(program.date));
                  setShowManualModal(true);
                }}
                className="px-3 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-purple-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Pegar hinos inicial e final sugeridos no Manual da Escola Sabatina"
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Hinos do Manual</span>
              </button>
            )}

            {onOpenSongsCatalog && (
              <button
                onClick={onOpenSongsCatalog}
                className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-amber-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Abrir catálogo para escolher e destinar louvor ou mensagem musical"
              >
                <Music className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Destinar Louvor</span>
              </button>
            )}

            <button
              onClick={() => onOpenAddModal(sectionKey)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              Adicionar Atividade
            </button>
          </div>
        </div>

        {/* Liturgy Table (Compact & 100% width - No horizontal scroll) */}
        <div className="w-full">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-slate-950/90 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-3 w-10 text-center">Status</th>
                <th className="py-2.5 px-3 w-5/12 sm:w-4/12">
                  <span>Atividade / Responsável</span>
                </th>
                <th className="py-2.5 px-3 w-auto sm:w-6/12">
                  <span>Mídias & Congregacionais (C1, C2, C3)</span>
                </th>
                <th className="py-2.5 px-3 w-24 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm bg-slate-900/50">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 text-xs font-medium">
                    Nenhuma atividade cadastrada nesta seção. Clique em "Adicionar Atividade" acima.
                  </td>
                </tr>
              ) : (
                items.map((act, secIdx) => {
                  const globalIdx = program.activities.findIndex(a => a.id === act.id);
                  const isRecurring = isActivityRecurring(act);
                  const isC1Valid = act.congregational1 && isValidTransmissionMedia(act.congregational1);
                  const isC2Valid = act.congregational2 && isValidTransmissionMedia(act.congregational2);
                  const isC3Valid = act.congregational3 && isValidTransmissionMedia(act.congregational3);
                  const hasAnyMedia = Boolean(act.congregational1 || act.congregational2 || act.congregational3);
                  const hasValidMedia = Boolean(isC1Valid || isC2Valid || isC3Valid);
                  const firstValidMedia = isC1Valid ? act.congregational1 : isC2Valid ? act.congregational2 : isC3Valid ? act.congregational3 : null;

                  return (
                    <tr
                      key={act.id}
                      className={`hover:bg-slate-800/60 transition-colors ${
                        act.completed ? 'bg-slate-950/60 opacity-40' : ''
                      }`}
                    >
                      {/* Status Checkbox */}
                      <td className="py-2.5 px-3 text-center align-top pt-3.5">
                        <button
                          onClick={() => handleToggleComplete(act.id)}
                          title={act.completed ? 'Marcar como pendente' : 'Marcar como concluído'}
                          className="text-slate-500 hover:text-blue-400 transition-colors cursor-pointer"
                        >
                          {act.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                      </td>

                      {/* Name, Responsible & Unified [Rotativo/Fixo + Edição Completa] Control */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-start justify-between gap-2 flex-wrap sm:flex-nowrap">
                            <span className="font-bold text-white leading-tight text-sm">
                              {act.name}
                            </span>

                            {/* Bloco Unificado: Frequência (Rotativo/Todo Sábado) + Aba de Edição Completa da Etapa */}
                            <div className="inline-flex items-center rounded-xl bg-slate-950/90 border border-slate-700/80 p-0.5 shadow-xs shrink-0">
                              {/* Botão Rotativo / Todo Sábado */}
                              <button 
                                type="button"
                                onClick={(e) => handleToggleRecurring(act.id, e)}
                                className={`group inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  isRecurring 
                                    ? 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-500/40' 
                                    : 'bg-amber-950 text-amber-300 hover:bg-amber-900 border border-amber-500/40'
                                }`}
                                title={isRecurring 
                                  ? "Frequência: Todo Sábado (Fixo). Clique para mudar para Rotativo." 
                                  : "Frequência: Rotativo (Limpo no fim do culto). Clique para mudar para Todo Sábado."}
                              >
                                {isRecurring ? (
                                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                                ) : (
                                  <RefreshCw className="w-3 h-3 text-amber-400 shrink-0" />
                                )}
                                <span>{isRecurring ? 'Todo Sábado' : 'Rotativo'}</span>
                              </button>

                              {/* Divisor vertical */}
                              <div className="w-px h-3 bg-slate-800 mx-0.5" />

                              {/* Aba de Edição Completa da Etapa */}
                              <button
                                type="button"
                                onClick={() => onOpenEditModal(act)}
                                title="Abrir a aba de edição completa desta etapa (hinos, vídeos, playbacks, horários e notas)"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold text-blue-300 hover:text-white hover:bg-blue-600/30 transition-all cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3 text-blue-400" />
                                <span>Editar</span>
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                            {act.responsible && (
                              <span className="text-slate-200 font-semibold bg-slate-800/90 border border-slate-700/80 px-2 py-0.2 rounded-md text-[11px]">
                                {act.responsible}
                              </span>
                            )}
                            {act.timeSlot && (
                              <span className="text-amber-400 font-mono text-xs">
                                {act.timeSlot}
                              </span>
                            )}
                            {act.durationMinutes && (
                              <span className="text-slate-400 text-xs">
                                ({act.durationMinutes} min)
                              </span>
                            )}
                          </div>
                          {act.notes && (
                            <p className="text-[11px] text-slate-400 italic line-clamp-2">
                              Obs: {act.notes}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Mídias & Congregacionais (C1, C2, C3 agrupados fluidamente) */}
                      <td className="py-2.5 px-3 align-top">
                        {hasAnyMedia ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {act.congregational1 && renderMediaCell(act.congregational1, undefined, 'C1', act)}
                            {act.congregational2 && renderMediaCell(act.congregational2, undefined, 'C2', act)}
                            {act.congregational3 && renderMediaCell(act.congregational3, undefined, 'C3', act)}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenEditModal(act)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800/70 border border-dashed border-slate-700/50 transition-colors cursor-pointer"
                            title="Nenhuma mídia anexada a esta etapa. Clique para adicionar hino, vídeo ou playback."
                          >
                            <Music className="w-3 h-3 text-slate-500" />
                            <span>+ Mídia / Hino</span>
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right align-top pt-3">
                        <div className="inline-flex items-center gap-1">
                          {/* Botão rápido para jogar atividade no Telão (apenas se tiver link de transmissão válido) */}
                          {hasValidMedia && firstValidMedia && (
                            <button
                              onClick={() => {
                                onPlayMedia(firstValidMedia.title, firstValidMedia.url || firstValidMedia.title, firstValidMedia.videoDate, undefined, undefined, 'auxiliary');
                              }}
                              title={`Jogar no Telão (Tela 2): ${firstValidMedia.title}`}
                              className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/70 transition-colors cursor-pointer border border-purple-700/40"
                            >
                              <Tv className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Botão Editar todos os campos da etapa */}
                          <button
                            onClick={() => onOpenEditModal(act)}
                            title={`Editar todos os campos da etapa "${act.name}" (nome, responsável, horários, músicas e notas)`}
                            className="p-1.5 rounded-lg text-blue-300 hover:text-white hover:bg-blue-600 transition-colors cursor-pointer border border-blue-500/40"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleMoveActivityInSection(act.id, 'up')}
                            disabled={secIdx === 0}
                            title="Subir ordem na seção"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 cursor-pointer transition-colors"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveActivityInSection(act.id, 'down')}
                            disabled={secIdx === items.length - 1}
                            title="Descer ordem na seção"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 cursor-pointer transition-colors"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Inserir nova etapa abaixo desta */}
                          <button
                            onClick={() => onOpenAddModal(act.section, act.id)}
                            title={`+ Inserir nova etapa abaixo de "${act.name}"`}
                            className="p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-950/80 cursor-pointer transition-colors border border-emerald-900/40"
                          >
                            <ListPlus className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setActivityToDelete(act)}
                            title={`Apagar etapa "${act.name}" da liturgia`}
                            className="p-1.5 rounded-lg text-red-400 hover:text-white hover:bg-red-950/80 cursor-pointer transition-colors border border-red-900/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Quick Add Stage Footer */}
        <div className="bg-slate-950/90 p-3.5 border-t border-slate-800">
          {inlineAddSection === sectionKey ? (
            <div className="w-full bg-slate-900/95 border border-blue-500/40 rounded-2xl p-3.5 space-y-3 shadow-xl animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                  <Plus className="w-4 h-4 text-blue-400" />
                  <span>Inserir Nova Etapa em: {title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setInlineAddSection(null);
                    setQuickStageName('');
                    setQuickStageResponsible('');
                    setQuickStageTime('');
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                {/* Sugestões adventistas */}
                <div className="sm:col-span-4">
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    Sugestões Adventistas:
                  </label>
                  <select
                    onChange={(e) => {
                      const selectedPreset = (SECTION_STAGE_PRESETS[sectionKey] || []).find(p => p.name === e.target.value);
                      if (selectedPreset) {
                        setQuickStageName(selectedPreset.name);
                        if (selectedPreset.responsible) setQuickStageResponsible(selectedPreset.responsible);
                        setQuickStageIsRecurring(selectedPreset.isRecurring);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">-- Escolha uma etapa pronta --</option>
                    {(SECTION_STAGE_PRESETS[sectionKey] || []).map((preset, pIdx) => (
                      <option key={pIdx} value={preset.name}>
                        {preset.name} {preset.responsible ? `(${preset.responsible})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nome da Etapa */}
                <div className="sm:col-span-5">
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    Nome da Etapa *
                  </label>
                  <input
                    type="text"
                    value={quickStageName}
                    onChange={(e) => setQuickStageName(e.target.value)}
                    placeholder="Ex: Oração Especial, Testemunho, Batismo, Boas-vindas..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Responsável */}
                <div className="sm:col-span-3">
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    Responsável (opcional)
                  </label>
                  <input
                    type="text"
                    value={quickStageResponsible}
                    onChange={(e) => setQuickStageResponsible(e.target.value)}
                    placeholder="Ex: Pastor, Solista, Ancião..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Horário:</span>
                    <input
                      type="text"
                      value={quickStageTime}
                      onChange={(e) => setQuickStageTime(e.target.value)}
                      placeholder="09:30"
                      className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setQuickStageIsRecurring(!quickStageIsRecurring)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      quickStageIsRecurring
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                        : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                    }`}
                  >
                    {quickStageIsRecurring ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <RefreshCw className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{quickStageIsRecurring ? 'Todo Sábado (Fixo)' : 'Rotativo (Limpo na troca)'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInlineAddSection(null);
                      onOpenAddModal(sectionKey);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Adicionar com Músicas/Links...
                  </button>
                  <button
                    type="button"
                    disabled={!quickStageName.trim()}
                    onClick={() => handleQuickAddStage(sectionKey)}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-blue-900/30 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Inserir na Liturgia
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setInlineAddSection(sectionKey);
                    setQuickStageName('');
                    setQuickStageResponsible('');
                    setQuickStageTime('');
                    setQuickStageIsRecurring(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-blue-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Colocar Etapa em {title}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAddModal(sectionKey)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ListPlus className="w-3.5 h-3.5 text-slate-400" />
                  <span>Opções Avançadas (Hinos / Vídeos)</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-500">
                Use <ListPlus className="w-3 h-3 inline text-emerald-400 mx-0.5" /> na linha para colocar abaixo, ou <Trash2 className="w-3 h-3 inline text-red-400 mx-0.5" /> para apagar.
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-white">
      {/* Top Program Banner & Responsible Bar */}
      <div className="bg-slate-900/95 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-wider">
                Ordem de Culto IASD
              </span>
              <button
                type="button"
                onClick={() => setIsEditingHeader(true)}
                className="group flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="Clique para alterar a data do culto"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Data do Culto: <strong className="text-amber-200">{formatWorshipDateLong(program.date)}</strong></span>
                <Edit2 className="w-3 h-3 text-amber-400/60 ml-0.5" />
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {program.title}
            </h1>

            {/* Header Metadata Chips */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-sm">
              <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 px-3 py-1 rounded-xl text-slate-200 font-bold">
                <User className="w-4 h-4 text-blue-400" />
                <span className="text-slate-400 font-normal">Responsável:</span>
                <span className="text-blue-300">{program.responsiblePerson}</span>
              </div>

              {program.preacher && (
                <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 px-3 py-1 rounded-xl text-slate-300 font-medium">
                  <Mic2 className="w-4 h-4 text-indigo-400" />
                  <span>Pregador: {program.preacher}</span>
                </div>
              )}

              {program.theme && (
                <div className="flex items-center gap-1.5 bg-amber-950/60 text-amber-200 border border-amber-500/40 px-3 py-1 rounded-xl text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Tema: {program.theme}
                </div>
              )}
            </div>
          </div>

          {/* Chaves Seletoras de Atuação (Reduz drasticamente os botões na tela) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
            <div className="inline-flex p-1 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveMode('liturgia')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'liturgia'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Liturgia</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('som_telao')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'som_telao'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Som & Telão</span>
                {(isPlayingPad || isPlayingVideo) && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('gestao')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'gestao'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Gestão & Ações</span>
              </button>
            </div>

            {/* Ação rápida direta: Ao Vivo / Telão */}
            <button
              onClick={onOpenSonoplastiaMode}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
              title="Abrir Modo Ao Vivo / Telão em Tela Cheia"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Ao Vivo</span>
            </button>
          </div>
        </div>

        {/* Barra Expansível da Chave Seletora: Som & Telão */}
        {activeMode === 'som_telao' && (
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-purple-500/30 flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5 mr-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              Som & Projeção:
            </span>

            {onOpenMusicalBackgrounds && (
              <div className="flex items-center gap-1.5">
                <button
                  id="schedule-open-pads-btn"
                  onClick={onOpenMusicalBackgrounds}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isPlayingPad
                      ? 'bg-purple-900/60 text-purple-200 border-purple-500/70 ring-1 ring-purple-500/30'
                      : 'bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-700/80'
                  }`}
                  title="Pads de Oração e Fundos Musicais (Som no Dispositivo)"
                >
                  <Music className="w-4 h-4 text-purple-400" />
                  <span>Fundos Musicais</span>
                  {isPlayingPad && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </button>
                <AuxiliaryMixerButton
                  type="fundo"
                  isPlaying={isPlayingPad}
                  onOpenFullMixer={onOpenMixer}
                />
              </div>
            )}

            {onOpenPlaybacks && (
              <div className="flex items-center gap-1.5">
                <button
                  id="schedule-open-youtube-btn"
                  onClick={onOpenPlaybacks}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                    isPlayingVideo
                      ? 'bg-red-900/60 text-red-200 border-red-500/70 ring-1 ring-red-500/30'
                      : 'bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-700/80'
                  }`}
                  title="Vídeos do YouTube, Playbacks e Louvores"
                >
                  <Youtube className="w-4 h-4 text-red-400" />
                  <span>Playbacks & Vídeos</span>
                </button>
                <AuxiliaryMixerButton
                  type="video"
                  isPlaying={isPlayingVideo}
                  label={activeVideoTitle ? activeVideoTitle.slice(0, 12) : undefined}
                  onOpenFullMixer={onOpenMixer}
                />
              </div>
            )}

            {onOpenMixer && (
              <button
                id="schedule-open-mixer-btn"
                onClick={onOpenMixer}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700/80 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Mesa de Som Auxiliar • Mixers Vinculados"
              >
                <Sliders className="w-4 h-4 text-blue-400" />
                <span>Mixer Vinculado</span>
              </button>
            )}

            {onOpenSongsCatalog && (
              <button
                id="schedule-open-songs-btn"
                onClick={onOpenSongsCatalog}
                className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Catálogo de Louvores & Mensagens Musicais"
              >
                <Music className="w-4 h-4 text-amber-400" />
                <span>Louvores & Mensagens</span>
              </button>
            )}

            <button
              id="schedule-open-auxiliary-btn"
              onClick={() => projectionManager.openOnAllAuxiliaryScreens()}
              className="px-3.5 py-2 rounded-xl bg-purple-950/70 hover:bg-purple-900/90 text-purple-200 border border-purple-500/50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Abrir Telão em todas as telas que não sejam a principal"
            >
              <Tv className="w-4 h-4 text-purple-400" />
              <span>Tela Auxiliar (Telão)</span>
            </button>
          </div>
        )}

        {/* Barra Expansível da Chave Seletora: Gestão & Ações */}
        {activeMode === 'gestao' && (
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 flex flex-wrap items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 mr-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Gestão da Liturgia:
            </span>

            {onOpenFinishWorshipModal && (
              <button
                id="schedule-finish-worship-btn"
                onClick={onOpenFinishWorshipModal}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all hover:scale-102 cursor-pointer border border-emerald-400/30"
                title="Finalizar este culto e arquivar a liturgia no histórico"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Finalizar Culto</span>
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <button
                id="schedule-clean-rotating-btn"
                onClick={() => setShowCleanRotatingModal(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border border-amber-600/50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Limpeza de liturgia: limpa apenas os itens rotativos mantendo o que acontece todo sábado"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Limpar Rotativos</span>
              </button>
              <div 
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-medium"
                title="Status da liturgia"
              >
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{program.activities.filter(a => isActivityRecurring(a)).length} Fixos</span>
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <RefreshCw className="w-3 h-3" />
                  <span>{program.activities.filter(a => !isActivityRecurring(a)).length} Rotativos</span>
                </span>
              </div>
            </div>

            {onOpenArchivesModal && (
              <button
                id="schedule-archives-btn"
                onClick={onOpenArchivesModal}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700/80 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Acessar histórico de cultos anteriores"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                <span>Histórico</span>
                {archivedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/30">
                    {archivedCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setIsEditingHeader(!isEditingHeader)}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-semibold border border-slate-700/80 transition-colors cursor-pointer"
            >
              {isEditingHeader ? 'Fechar Edição' : 'Editar Cabeçalho'}
            </button>

            <button
              onClick={onOpenShareModal}
              className="px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-700/60 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp / Imprimir</span>
            </button>
          </div>
        )}

        {/* Quick Header Editor Form */}
        {isEditingHeader && (
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 animate-in fade-in duration-150 text-white">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Editar Dados Gerais do Culto
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-400">Data do Culto</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditDate(getTodayDate())}
                      className="text-[10px] text-blue-400 hover:text-blue-300 underline cursor-pointer"
                      title="Usar data de hoje"
                    >
                      Hoje
                    </button>
                    <span className="text-slate-600 text-[10px]">•</span>
                    <button
                      type="button"
                      onClick={() => setEditDate(getNextSaturdayDate())}
                      className="text-[10px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                      title="Usar próximo sábado"
                    >
                      Sábado
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold bg-slate-900 text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400">Nome do Responsável</label>
                <input
                  type="text"
                  value={editResponsible}
                  onChange={e => setEditResponsible(e.target.value)}
                  placeholder="Ex: Davi"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold bg-slate-900 text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400">Título do Culto</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Culto de Sábado"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold bg-slate-900 text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400">Pregador</label>
                <input
                  type="text"
                  value={editPreacher}
                  onChange={e => setEditPreacher(e.target.value)}
                  placeholder="Pastor Convidado"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold bg-slate-900 text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400">Tema do Sermão</label>
                <input
                  type="text"
                  value={editTheme}
                  onChange={e => setEditTheme(e.target.value)}
                  placeholder="Ex: Fidelidade, Graça..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold bg-slate-900 text-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setIsEditingHeader(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveHeader}
                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-500"
              >
                Salvar Cabeçalho
              </button>
            </div>
          </div>
        )}

        {/* Section Filter Pills & Liturgy Action Switches */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs font-semibold">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400">Seção:</span>
            <button
              onClick={() => setActiveSectionFilter('all')}
              className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
                activeSectionFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
              }`}
            >
              Todas ({program.activities.length})
            </button>
            <button
              onClick={() => setActiveSectionFilter('escola_sabatina')}
              className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
                activeSectionFilter === 'escola_sabatina'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
              }`}
            >
              Escola Sabatina ({esActivities.length})
            </button>
            <button
              onClick={() => setActiveSectionFilter('culto_divino')}
              className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
                activeSectionFilter === 'culto_divino'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
              }`}
            >
              Culto Divino ({cdActivities.length})
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Chave seletora para abrir vídeos oficiais da semana */}
            <button
              type="button"
              onClick={() => setShowWeeklyVideosCard(!showWeeklyVideosCard)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                showWeeklyVideosCard
                  ? 'bg-red-950/70 text-red-300 border-red-500/50 shadow-xs'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
              }`}
              title="Alternar exibição do painel dos vídeos oficiais (Informativo e Provai e Vede)"
            >
              <Video className="w-3.5 h-3.5 text-red-400" />
              <span>Vídeos da Semana</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${showWeeklyVideosCard ? 'bg-red-500/30 text-red-200' : 'bg-slate-700 text-slate-400'}`}>
                {showWeeklyVideosCard ? 'Ocultar' : 'Exibir'}
              </span>
            </button>

            {/* Sabbath School Manual Modal Trigger */}
            <button
              id="schedule-open-manual-btn"
              type="button"
              onClick={() => {
                setManualWeek(getSabbathSchoolManualForDate(program.date));
                setShowManualModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Consultar Lição e Hinos Oficiais do Manual da Escola Sabatina"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Hinos do Manual</span>
            </button>

            {/* Botão Criar Liturgia Manual */}
            <button
              id="schedule-create-manual-btn"
              type="button"
              onClick={() => setShowManualBuilderModal(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Criar liturgia manual onde você escolhe todos os campos, horários e músicas"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Criar Liturgia Manual</span>
            </button>

            {/* Botão Colar Liturgia Pronta */}
            <button
              id="schedule-paste-liturgy-btn"
              type="button"
              onClick={() => setShowPasteLiturgyModal(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Colar liturgia pronta para distribuição automática dos horários, responsáveis e músicas"
            >
              <Clipboard className="w-3.5 h-3.5 text-indigo-400" />
              <span>Colar Liturgia Pronta</span>
            </button>

            {/* Add Stage button */}
            <button
              type="button"
              onClick={() => onOpenAddModal(activeSectionFilter === 'culto_divino' ? 'culto_divino' : 'escola_sabatina')}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Adicionar nova etapa na liturgia"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nova Etapa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Weekly Media Card (Provai e Vede & Informativo das Missões) */}
      {showWeeklyVideosCard && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 text-white shadow-lg border border-slate-700/80 space-y-4 animate-in fade-in duration-150">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0 shadow-inner">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Vídeos Oficiais da Semana
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Atualizado para o Culto
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Acesse apenas com o Play para exibição na igreja ou faça o download para uso offline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {onOpenWeeklySearchModal && (
              <button
                onClick={onOpenWeeklySearchModal}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-md shadow-red-600/20 cursor-pointer"
                title="Configurar campos de busca semanal na internet e canais do YouTube"
              >
                <Sliders className="w-3.5 h-3.5" />
                Procura Semanal (Internet)
              </button>
            )}
            <button
              onClick={onOpenWeeklyMediaModal}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              Central de Vídeos Semanais
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* INFORMATIVO MUNDIAL DAS MISSÕES */}
          {(() => {
            const infoAct = program.activities.find(a => 
              a.name.toLowerCase().includes('informativo') || a.id === 'act-5'
            );
            const isInfoRecurring = infoAct ? (infoAct.isRecurring !== undefined ? infoAct.isRecurring : isActivityRecurring(infoAct)) : true;

            return (
              <div className="bg-slate-950/70 border border-slate-700/70 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-blue-500/50 transition-colors">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-600 text-white">
                        Escola Sabatina
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Daniel Locutor
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {infoAct && (
                        <button
                          type="button"
                          onClick={(e) => handleToggleRecurring(infoAct.id, e)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-colors cursor-pointer ${
                            isInfoRecurring
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60 hover:bg-emerald-900/80'
                              : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-amber-300'
                          }`}
                          title={isInfoRecurring ? 'Fixo: Acontece todo sábado (protegido na limpeza de liturgia)' : 'Rotativo: Limpo no encerramento da liturgia'}
                        >
                          {isInfoRecurring ? (
                            <>
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              <span>Todo Sábado</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3 text-slate-400" />
                              <span>Rotativo</span>
                            </>
                          )}
                        </button>
                      )}

                      {infoAct && (
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(infoAct)}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Editar este quadro na liturgia"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {weeklyMedia.informativo.dateText}
                      </span>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">
                    {weeklyMedia.informativo.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {weeklyMedia.informativo.synopsis}
                  </p>
                  <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Link automático pronto • Basta apertar o Play</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800 flex-wrap">
                  {/* Dual Screen Play: Tela 1 (Operador) & Tela 2 (Telão Tela Cheia) */}
                  <button
                    onClick={() =>
                      onPlayMedia(
                        weeklyMedia.informativo.title,
                        weeklyMedia.informativo.directEmbedUrl,
                        weeklyMedia.informativo.dateText,
                        weeklyMedia.informativo.downloadUrl,
                        weeklyMedia.informativo.synopsis,
                        'main'
                      )
                    }
                    className="grow py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-101 cursor-pointer shadow-md"
                    title="Reproduzir no monitor do operador (Tela 1)"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Tela 1 (Operador)
                  </button>

                  <button
                    onClick={() =>
                      onPlayMedia(
                        weeklyMedia.informativo.title,
                        weeklyMedia.informativo.directEmbedUrl,
                        weeklyMedia.informativo.dateText,
                        weeklyMedia.informativo.downloadUrl,
                        weeklyMedia.informativo.synopsis,
                        'auxiliary'
                      )
                    }
                    className="grow py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-101 cursor-pointer shadow-md shadow-purple-600/30"
                    title="Reproduzir diretamente na Tela 2 (Telão em Tela Cheia)"
                  >
                    <Tv className="w-3.5 h-3.5 text-purple-200" />
                    Tela 2 (Telão Cheio)
                  </button>

                  {isPlayingVideo && (activeVideoTitle?.toLowerCase().includes('informativo') || activeVideoTitle?.toLowerCase().includes('miss')) && (
                    <AuxiliaryMixerButton
                      type="video"
                      isPlaying={true}
                      label="Informativo"
                      onOpenFullMixer={onOpenMixer}
                    />
                  )}

                  <a
                    href={weeklyMedia.informativo.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Baixar vídeo oficial MP4 para rodar sem internet"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    Baixar
                  </a>
                </div>
              </div>
            );
          })()}

          {/* PROVAI E VEDE */}
          {(() => {
            const provaiAct = program.activities.find(a => 
              a.name.toLowerCase().includes('dízimos') || a.name.toLowerCase().includes('ofertas') || a.name.toLowerCase().includes('provai') || a.id === 'act-16'
            );
            const isProvaiRecurring = provaiAct ? (provaiAct.isRecurring !== undefined ? provaiAct.isRecurring : isActivityRecurring(provaiAct)) : true;

            return (
              <div className="bg-slate-950/70 border border-slate-700/70 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-red-500/50 transition-colors">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-600 text-white">
                      Culto Divino / Ofertas
                    </span>

                    <div className="flex items-center gap-1.5">
                      {provaiAct && (
                        <button
                          type="button"
                          onClick={(e) => handleToggleRecurring(provaiAct.id, e)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-colors cursor-pointer ${
                            isProvaiRecurring
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60 hover:bg-emerald-900/80'
                              : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-amber-300'
                          }`}
                          title={isProvaiRecurring ? 'Fixo: Acontece todo sábado (protegido na limpeza de liturgia)' : 'Rotativo: Limpo no encerramento da liturgia'}
                        >
                          {isProvaiRecurring ? (
                            <>
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              <span>Todo Sábado</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3 text-slate-400" />
                              <span>Rotativo</span>
                            </>
                          )}
                        </button>
                      )}

                      {provaiAct && (
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(provaiAct)}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Editar este quadro na liturgia"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {weeklyMedia.provaiEVede.dateText}
                      </span>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">
                    {weeklyMedia.provaiEVede.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {weeklyMedia.provaiEVede.synopsis}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800 flex-wrap">
                  <button
                    onClick={() =>
                      onPlayMedia(
                        weeklyMedia.provaiEVede.title,
                        weeklyMedia.provaiEVede.directEmbedUrl,
                        weeklyMedia.provaiEVede.dateText,
                        weeklyMedia.provaiEVede.downloadUrl,
                        weeklyMedia.provaiEVede.synopsis,
                        'main'
                      )
                    }
                    className="grow py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-101 cursor-pointer shadow-md"
                    title="Reproduzir no monitor do operador (Tela 1)"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Tela 1 (Operador)
                  </button>

                  <button
                    onClick={() =>
                      onPlayMedia(
                        weeklyMedia.provaiEVede.title,
                        weeklyMedia.provaiEVede.directEmbedUrl,
                        weeklyMedia.provaiEVede.dateText,
                        weeklyMedia.provaiEVede.downloadUrl,
                        weeklyMedia.provaiEVede.synopsis,
                        'auxiliary'
                      )
                    }
                    className="grow py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-101 cursor-pointer shadow-md shadow-purple-600/30"
                    title="Reproduzir diretamente na Tela 2 (Telão em Tela Cheia)"
                  >
                    <Tv className="w-3.5 h-3.5 text-purple-200" />
                    Tela 2 (Telão Cheio)
                  </button>

                  {isPlayingVideo && activeVideoTitle?.toLowerCase().includes('provai') && (
                    <AuxiliaryMixerButton
                      type="video"
                      isPlaying={true}
                      label="Provai e Vede"
                      onOpenFullMixer={onOpenMixer}
                    />
                  )}

                  <a
                    href={weeklyMedia.provaiEVede.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Baixar vídeo oficial MP4 para rodar sem internet"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    Baixar
                  </a>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    )}

      {/* Main Tables */}
      {(activeSectionFilter === 'all' || activeSectionFilter === 'escola_sabatina') && (
        renderSectionTable(
          'ESCOLA SABATINA',
          'Abertura, louvor da Equipe Azul, informativo missionário e estudo da lição',
          esActivities,
          'escola_sabatina'
        )
      )}

      {(activeSectionFilter === 'all' || activeSectionFilter === 'culto_divino') && (
        renderSectionTable(
          'CULTO DIVINO',
          'Momento de louvor, entrada da plataforma, oração de joelhos, mensagem musical e sermão',
          cdActivities,
          'culto_divino'
        )
      )}

      {otherActivities.length > 0 && activeSectionFilter === 'all' && (
        renderSectionTable(
          'OUTRAS ATIVIDADES / CULTO JOVEM',
          'Atividades adicionais da programação',
          otherActivities,
          'outro'
        )
      )}

      {/* Modal de Confirmação: Limpar Itens Rotativos */}
      {showCleanRotatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    Limpar Apenas Itens Rotativos
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Preparação rápida da liturgia para o próximo sábado ({formatWorshipDateShort(getNextSaturdayDate(program.date || getTodayDate()))})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCleanRotatingModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300/90 leading-relaxed space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  O que acontece TODO SÁBADO é PRESERVADO 100% intacto:
                </span>
                <p className="text-[11px] text-slate-300">
                  • <strong>Orações com Fundos Musicais</strong> (Só Tu és Santo, Falar com Deus, etc.)<br />
                  • <strong>Informativo Mundial das Missões</strong> (vídeo semanal oficial da igreja)<br />
                  • <strong>Provai e Vede</strong> (vídeo semanal de dízimos e ofertas)<br />
                  • <strong>Estudo da Lição</strong> (divisão das classes na Escola Sabatina)<br />
                  • <strong>Adoração Infantil</strong> e <strong>Entrada da Plataforma</strong><br />
                  • <strong>Estrutura do Sermão</strong>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-300/90 leading-relaxed space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-amber-400">
                  <RefreshCw className="w-4 h-4 text-amber-400" />
                  O que será limpo para a nova escala:
                </span>
                <p className="text-[11px] text-slate-300">
                  • Músicas congregacionais e playbacks dos momentos de louvor (C1, C2, C3)<br />
                  • Músicas especiais de cantores/mensagens musicais rotativas<br />
                  • Vídeos e anúncios temporários<br />
                  • Pregador e tema do culto anterior<br />
                  • Desmarcação de todas as caixas de concluído
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCleanRotatingModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCleanRotating}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-bold shadow-lg shadow-amber-900/30 flex items-center gap-2 transition-all hover:scale-102 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Confirmar Limpeza (Apenas Rotativos)
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Hinos Sugeridos no Manual da Escola Sabatina */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight flex items-center gap-2">
                    Manual da Escola Sabatina (CPB)
                  </h3>
                  <p className="text-xs text-purple-300/80 mt-0.5">
                    Hinos oficiais sugeridos no auxiliar da lição semanal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Weekly Lesson Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Escolha a Lição / Sábado:</label>
              <select
                value={manualWeek.date}
                onChange={(e) => {
                  const found = SABBATH_SCHOOL_MANUAL_WEEKS.find(w => w.date === e.target.value);
                  if (found) setManualWeek(found);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-purple-500 cursor-pointer"
              >
                {SABBATH_SCHOOL_MANUAL_WEEKS.map((w) => (
                  <option key={w.date} value={w.date}>
                    {formatWorshipDateShort(w.date)} — {w.lessonTitle}
                  </option>
                ))}
              </select>
            </div>

            {/* Hymns Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Initial Hymn */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/50">
                    Hino Inicial (Abertura)
                  </span>
                  <span className="text-xs font-black text-amber-400">
                    HASD {manualWeek.initialHymn.number}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  {manualWeek.initialHymn.title}
                </h4>
                <p className="text-[11px] text-slate-400">
                  Tocará no início da Escola Sabatina
                </p>
              </div>

              {/* Final Hymn */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
                    Hino Final (Encerramento)
                  </span>
                  <span className="text-xs font-black text-amber-400">
                    HASD {manualWeek.finalHymn.number}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  {manualWeek.finalHymn.title}
                </h4>
                <p className="text-[11px] text-slate-400">
                  Tocará ao encerrar a lição da Escola Sabatina
                </p>
              </div>
            </div>

            {/* Note & Action */}
            <div className="p-3 bg-purple-950/30 border border-purple-500/20 rounded-2xl text-[11px] text-purple-300/90 leading-relaxed">
              💡 Ao clicar em <strong>"Aplicar Hinos à Liturgia"</strong>, o sistema preencherá automaticamente as atividades de abertura e encerramento da Escola Sabatina com os números do Hinário Adventista e links de reprodução prontos.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => handleApplyManualHymnsToLiturgy(manualWeek)}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/30 flex items-center gap-2 transition-all hover:scale-102 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Aplicar Hinos à Liturgia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Stage Confirmation Modal */}
      {activityToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">
                  Apagar Etapa da Liturgia
                </h3>
                <p className="text-xs text-red-300/80 mt-0.5">
                  Esta etapa será removida da ordem deste culto
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{activityToDelete.name}</span>
              </div>
              <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                  {activityToDelete.section === 'escola_sabatina' 
                    ? 'Escola Sabatina' 
                    : activityToDelete.section === 'culto_divino' 
                    ? 'Culto Divino' 
                    : 'Outra Seção'}
                </span>
                {activityToDelete.timeSlot && (
                  <span className="text-amber-400 font-mono">⏰ {activityToDelete.timeSlot}</span>
                )}
                {activityToDelete.responsible && (
                  <span>👤 {activityToDelete.responsible}</span>
                )}
              </div>
              {(activityToDelete.congregational1?.title || activityToDelete.congregational2?.title) && (
                <div className="text-[11px] text-amber-300/90 pt-1 border-t border-slate-800/80">
                  🎵 Contém músicas/mídias vinculadas
                </div>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Deseja realmente apagar esta etapa da liturgia? Você poderá adicionar novamente a qualquer momento através dos botões de "+ Colocar Etapa".
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActivityToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteActivity}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-900/30 flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Liturgy Builder Modal */}
      {showManualBuilderModal && (
        <ManualLiturgyBuilderModal
          isOpen={showManualBuilderModal}
          onClose={() => setShowManualBuilderModal(false)}
          currentProgram={program}
          onSaveProgram={(newProgram) => {
            onUpdateProgram(newProgram);
            setShowManualBuilderModal(false);
          }}
          onNotify={onNotify}
        />
      )}

      {/* Paste Ready Liturgy & Smart Distribution Modal */}
      {showPasteLiturgyModal && (
        <PasteLiturgyModal
          isOpen={showPasteLiturgyModal}
          onClose={() => setShowPasteLiturgyModal(false)}
          currentProgram={program}
          onSaveProgram={(newProgram) => {
            onUpdateProgram(newProgram);
            setShowPasteLiturgyModal(false);
          }}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};
