import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Music, Clock, User, Bookmark, Sparkles, Youtube, 
  ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2, HardDrive,
  Move, ArrowUp, ArrowDown, RotateCcw, Edit2
} from 'lucide-react';
import { ActivityItem, ActivitySection, ActivityCategory, MediaSourceType } from '../types';
import { ADVENTIST_HYMNS, CURATED_MEDIA } from '../data/churchData';
import { isActivityRecurring } from '../utils/worshipArchiveManager';
import { isValidTransmissionMedia } from '../utils/mediaUtils';
import { SongMediaSourceSelector } from './SongMediaSourceSelector';

interface ActivityEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: ActivityItem, insertAfterId?: string) => void;
  initialActivity?: ActivityItem | null;
  defaultSection?: ActivitySection;
  insertAfterId?: string;
  allActivities?: ActivityItem[];
}

const COMMON_ACTIVITIES = [
  { name: 'Momentos de louvor - Equipe Azul', section: 'escola_sabatina', category: 'louvor', responsible: 'Equipe Azul' },
  { name: 'Boas vindas', section: 'escola_sabatina', category: 'abertura', responsible: 'Direção' },
  { name: 'Hino inicial Escola Sabatina', section: 'escola_sabatina', category: 'louvor', responsible: 'Congregação' },
  { name: 'Oração de joelhos', section: 'escola_sabatina', category: 'oracao', responsible: 'Diretor ES' },
  { name: 'Informativo - Vídeo', section: 'escola_sabatina', category: 'video', responsible: 'Sonoplastia' },
  { name: 'Introdução - Estudo da Lição', section: 'escola_sabatina', category: 'geral', responsible: 'Professores' },
  { name: 'Mensagem Musical', section: 'escola_sabatina', category: 'mensagem_musical', responsible: 'Solista' },
  { name: 'Entrada das Crianças', section: 'escola_sabatina', category: 'infantil', responsible: 'Ministério da Criança' },
  { name: 'Momento de louvor: Equipe Azul', section: 'culto_divino', category: 'louvor', responsible: 'Equipe Azul' },
  { name: 'Entrada da Plataforma', section: 'culto_divino', category: 'abertura', responsible: 'Plataforma' },
  { name: 'Oração pregador', section: 'culto_divino', category: 'oracao', responsible: 'Pregador' },
  { name: 'Video de saúde', section: 'culto_divino', category: 'video', responsible: 'Ministério de Saúde' },
  { name: 'Vídeo de abertura anúncios', section: 'culto_divino', category: 'anuncios', responsible: 'Sonoplastia' },
  { name: 'Equipe de comunicação', section: 'culto_divino', category: 'anuncios', responsible: 'Comunicação' },
  { name: 'Adoração infantil', section: 'culto_divino', category: 'infantil', responsible: 'Líder Infantil' },
  { name: 'Dízimos e ofertas', section: 'culto_divino', category: 'ofertas', responsible: 'Diáconos' },
  { name: 'Louvor Congregacional', section: 'culto_divino', category: 'louvor', responsible: 'Equipe de Louvor' },
  { name: 'Oração de Joelhos', section: 'culto_divino', category: 'oracao', responsible: 'Ancião' },
  { name: 'Mensagem Musical', section: 'culto_divino', category: 'mensagem_musical', responsible: 'Solista' },
  { name: 'SERMÃO', section: 'culto_divino', category: 'sermao', responsible: 'Pastor / Pregador' },
];

export const ActivityEditModal: React.FC<ActivityEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialActivity,
  defaultSection = 'escola_sabatina',
  insertAfterId,
}) => {
  const [name, setName] = useState('');
  const [section, setSection] = useState<ActivitySection>(defaultSection);
  const [category, setCategory] = useState<ActivityCategory>('louvor');
  const [responsible, setResponsible] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(5);
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);

  const [c1Title, setC1Title] = useState('');
  const [c1Url, setC1Url] = useState('');
  const [c1SourceType, setC1SourceType] = useState<MediaSourceType>('youtube');
  const [c1FileName, setC1FileName] = useState('');
  const [c1FileSize, setC1FileSize] = useState('');
  const [c1DriveOrigin, setC1DriveOrigin] = useState('Pen Drive (USB)');

  const [c2Title, setC2Title] = useState('');
  const [c2Url, setC2Url] = useState('');
  const [c2SourceType, setC2SourceType] = useState<MediaSourceType>('youtube');
  const [c2FileName, setC2FileName] = useState('');
  const [c2FileSize, setC2FileSize] = useState('');
  const [c2DriveOrigin, setC2DriveOrigin] = useState('Pen Drive (USB)');

  const [c3Title, setC3Title] = useState('');
  const [c3Url, setC3Url] = useState('');
  const [c3SourceType, setC3SourceType] = useState<MediaSourceType>('youtube');
  const [c3FileName, setC3FileName] = useState('');
  const [c3FileSize, setC3FileSize] = useState('');
  const [c3DriveOrigin, setC3DriveOrigin] = useState('Pen Drive (USB)');

  const [quickHymnSearch, setQuickHymnSearch] = useState('');
  const [targetSlot, setTargetSlot] = useState<'c1' | 'c2' | 'c3'>('c1');
  const [positionOption, setPositionOption] = useState<string>('keep');

  useEffect(() => {
    if (initialActivity) {
      setName(initialActivity.name || '');
      setSection(initialActivity.section || defaultSection);
      setCategory(initialActivity.category || 'louvor');
      setResponsible(initialActivity.responsible || '');
      setTimeSlot(initialActivity.timeSlot || '');
      setDurationMinutes(initialActivity.durationMinutes || 5);
      setNotes(initialActivity.notes || '');
      setIsRecurring(
        initialActivity.isRecurring !== undefined 
          ? initialActivity.isRecurring 
          : isActivityRecurring(initialActivity)
      );
      setPositionOption('keep');

      // C1
      setC1Title(initialActivity.congregational1?.title || '');
      setC1Url(initialActivity.congregational1?.url || '');
      setC1SourceType(
        initialActivity.congregational1?.sourceType || 
        (initialActivity.congregational1?.url?.startsWith('blob:') || initialActivity.congregational1?.fileName ? 'pendrive' : 'youtube')
      );
      setC1FileName(initialActivity.congregational1?.fileName || '');
      setC1FileSize(initialActivity.congregational1?.fileSize || '');
      setC1DriveOrigin(initialActivity.congregational1?.driveOrigin || 'Pen Drive (USB)');

      // C2
      setC2Title(initialActivity.congregational2?.title || '');
      setC2Url(initialActivity.congregational2?.url || '');
      setC2SourceType(
        initialActivity.congregational2?.sourceType || 
        (initialActivity.congregational2?.url?.startsWith('blob:') || initialActivity.congregational2?.fileName ? 'pendrive' : 'youtube')
      );
      setC2FileName(initialActivity.congregational2?.fileName || '');
      setC2FileSize(initialActivity.congregational2?.fileSize || '');
      setC2DriveOrigin(initialActivity.congregational2?.driveOrigin || 'Pen Drive (USB)');

      // C3
      setC3Title(initialActivity.congregational3?.title || '');
      setC3Url(initialActivity.congregational3?.url || '');
      setC3SourceType(
        initialActivity.congregational3?.sourceType || 
        (initialActivity.congregational3?.url?.startsWith('blob:') || initialActivity.congregational3?.fileName ? 'pendrive' : 'youtube')
      );
      setC3FileName(initialActivity.congregational3?.fileName || '');
      setC3FileSize(initialActivity.congregational3?.fileSize || '');
      setC3DriveOrigin(initialActivity.congregational3?.driveOrigin || 'Pen Drive (USB)');
    } else {
      setName('');
      setSection(defaultSection);
      setCategory('louvor');
      setResponsible('');
      setTimeSlot('');
      setDurationMinutes(5);
      setNotes('');
      setIsRecurring(false);

      setC1Title('');
      setC1Url('');
      setC1SourceType('youtube');
      setC1FileName('');
      setC1FileSize('');
      setC1DriveOrigin('Pen Drive (USB)');

      setC2Title('');
      setC2Url('');
      setC2SourceType('youtube');
      setC2FileName('');
      setC2FileSize('');
      setC2DriveOrigin('Pen Drive (USB)');

      setC3Title('');
      setC3Url('');
      setC3SourceType('youtube');
      setC3FileName('');
      setC3FileSize('');
      setC3DriveOrigin('Pen Drive (USB)');
    }
  }, [initialActivity, defaultSection, isOpen]);

  if (!isOpen) return null;

  const handleApplyQuickItem = (item: typeof COMMON_ACTIVITIES[0]) => {
    setName(item.name);
    setSection(item.section as ActivitySection);
    setCategory(item.category as ActivityCategory);
    setResponsible(item.responsible);
    setIsRecurring(isActivityRecurring(item as any));
  };

  const handleApplyHymn = (hymnNumber: number, hymnTitle: string, query: string) => {
    const fullTitle = `Hinário ${hymnNumber} - ${hymnTitle}`;
    const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    if (targetSlot === 'c1') {
      setC1Title(fullTitle);
      setC1Url(ytUrl);
      setC1SourceType('youtube');
      setC1FileName('');
    } else if (targetSlot === 'c2') {
      setC2Title(fullTitle);
      setC2Url(ytUrl);
      setC2SourceType('youtube');
      setC2FileName('');
    } else {
      setC3Title(fullTitle);
      setC3Url(ytUrl);
      setC3SourceType('youtube');
      setC3FileName('');
    }
    setQuickHymnSearch('');
  };

  const handleApplyCuratedMedia = (mediaTitle: string, query: string) => {
    const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    if (targetSlot === 'c1') {
      setC1Title(mediaTitle);
      setC1Url(ytUrl);
      setC1SourceType('youtube');
      setC1FileName('');
    } else if (targetSlot === 'c2') {
      setC2Title(mediaTitle);
      setC2Url(ytUrl);
      setC2SourceType('youtube');
      setC2FileName('');
    } else {
      setC3Title(mediaTitle);
      setC3Url(ytUrl);
      setC3SourceType('youtube');
      setC3FileName('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const c1Valid = isValidTransmissionMedia({
      title: c1Title.trim(),
      url: c1Url.trim(),
      sourceType: c1SourceType,
      fileName: c1FileName.trim() || undefined,
    });

    const c2Valid = isValidTransmissionMedia({
      title: c2Title.trim(),
      url: c2Url.trim(),
      sourceType: c2SourceType,
      fileName: c2FileName.trim() || undefined,
    });

    const c3Valid = isValidTransmissionMedia({
      title: c3Title.trim(),
      url: c3Url.trim(),
      sourceType: c3SourceType,
      fileName: c3FileName.trim() || undefined,
    });

    const activity: ActivityItem = {
      id: initialActivity ? initialActivity.id : `act-${Date.now()}`,
      name: name.trim(),
      section,
      category,
      responsible: responsible.trim() || undefined,
      durationMinutes: Number(durationMinutes) || 5,
      timeSlot: timeSlot.trim() || undefined,
      notes: notes.trim() || undefined,
      isRecurring,
      congregational1: c1Title.trim() ? {
        title: c1Title.trim(),
        url: c1Url.trim() || (c1SourceType === 'youtube' ? `https://www.youtube.com/results?search_query=${encodeURIComponent(c1Title.trim() + ' playback')}` : undefined),
        sourceType: c1SourceType,
        fileName: c1FileName.trim() || undefined,
        fileSize: c1FileSize.trim() || undefined,
        driveOrigin: c1DriveOrigin.trim() || undefined,
        isValidTransmission: c1Valid,
      } : undefined,
      congregational2: c2Title.trim() ? {
        title: c2Title.trim(),
        url: c2Url.trim() || (c2SourceType === 'youtube' ? `https://www.youtube.com/results?search_query=${encodeURIComponent(c2Title.trim() + ' playback')}` : undefined),
        sourceType: c2SourceType,
        fileName: c2FileName.trim() || undefined,
        fileSize: c2FileSize.trim() || undefined,
        driveOrigin: c2DriveOrigin.trim() || undefined,
        isValidTransmission: c2Valid,
      } : undefined,
      congregational3: c3Title.trim() ? {
        title: c3Title.trim(),
        url: c3Url.trim() || (c3SourceType === 'youtube' ? `https://www.youtube.com/results?search_query=${encodeURIComponent(c3Title.trim() + ' playback')}` : undefined),
        sourceType: c3SourceType,
        fileName: c3FileName.trim() || undefined,
        fileSize: c3FileSize.trim() || undefined,
        driveOrigin: c3DriveOrigin.trim() || undefined,
        isValidTransmission: c3Valid,
      } : undefined,
    };

    onSave(activity, insertAfterId);
    onClose();
  };

  const filteredHymns = quickHymnSearch
    ? ADVENTIST_HYMNS.filter(
        h =>
          h.number.toString().includes(quickHymnSearch) ||
          h.title.toLowerCase().includes(quickHymnSearch.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {initialActivity ? 'Editar Etapa da Liturgia' : 'Cadastrar Nova Etapa na Liturgia'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Configure título, responsável, horários e links de playbacks / vídeos da etapa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="bg-slate-50/80 px-6 py-2.5 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs text-slate-600">
          <span className="font-semibold text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Atalhos rápidos:
          </span>
          {COMMON_ACTIVITIES.slice(0, 7).map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyQuickItem(item)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700 font-medium shrink-0 transition-colors cursor-pointer"
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Name */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Nome da Atividade *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Momentos de louvor - Equipe Azul, Oração de joelhos..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden text-sm font-medium text-slate-900"
              />
            </div>

            {/* Section */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Seção do Culto *
              </label>
              <select
                value={section}
                onChange={e => setSection(e.target.value as ActivitySection)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden text-sm font-medium text-slate-900 bg-white"
              >
                <option value="escola_sabatina">Escola Sabatina</option>
                <option value="culto_divino">Culto Divino</option>
                <option value="culto_jovem">Culto Jovem / JA</option>
                <option value="outro">Outro Culto / Reunião</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Categoria
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ActivityCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden text-sm font-medium text-slate-900 bg-white"
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

            {/* Responsible */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Responsável
              </label>
              <input
                type="text"
                value={responsible}
                onChange={e => setResponsible(e.target.value)}
                placeholder="Ex: Davi, Equipe Azul, Ju..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden text-sm font-medium text-slate-900"
              />
            </div>

            {/* Time Slot */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Horário
              </label>
              <input
                type="text"
                value={timeSlot}
                onChange={e => setTimeSlot(e.target.value)}
                placeholder="Ex: 09:15"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden text-sm font-medium text-slate-900"
              />
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Duração (minutos)
              </label>
              <input
                type="number"
                min={1}
                max={180}
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden text-sm font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Regra de Limpeza de Liturgia (Fixo / Rotativo) */}
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                {isRecurring ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-amber-600" />
                )}
                Comportamento na Limpeza de Liturgia:
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isRecurring 
                  ? 'Acontece todo sábado: será PRESERVADO intacto com fundos musicais e links ao limpar a liturgia.' 
                  : 'Item rotativo: os louvores/vídeos serão limpos a cada culto para a nova escala da igreja.'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsRecurring(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isRecurring
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Acontece todo Sábado (Fixo)
              </button>
              <button
                type="button"
                onClick={() => setIsRecurring(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  !isRecurring
                    ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-500'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Rotativo (Limpo por Culto)
              </button>
            </div>
          </div>

          {/* Congregational / Media Slots (Matching spreadsheet Congregacional 1, 2, 3) */}
          <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  Músicas, Playbacks e Vídeos Vinculados
                </h4>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                Inserir no:
                {(['c1', 'c2', 'c3'] as const).map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTargetSlot(slot)}
                    className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition-colors ${
                      targetSlot === slot
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    {slot.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Picker from Hymnal / Curated Media */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={quickHymnSearch}
                  onChange={e => setQuickHymnSearch(e.target.value)}
                  placeholder="Pesquisar hino pelo número ou nome (ex: 192, 107, Infinita Graça)..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-100 outline-hidden"
                />
              </div>

              {filteredHymns.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {filteredHymns.map(h => (
                    <button
                      key={h.number}
                      type="button"
                      onClick={() => handleApplyHymn(h.number, h.title, h.youtubeSearchQuery)}
                      className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-medium border border-blue-200 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      #{h.number} {h.title}
                    </button>
                  ))}
                </div>
              )}

              {/* Fast presets for prayers / specials */}
              <div className="pt-1 flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-400 shrink-0">Fundos Rápidos:</span>
                <button
                  type="button"
                  onClick={() => handleApplyCuratedMedia('FUNDO MUSICAL SÓ TU ÉS SANTO', 'fundo musical so tu es santo oracao piano')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition-colors"
                >
                  Só Tu És Santo
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyCuratedMedia('FUNDO MUSICAL FALAR COM DEUS', 'fundo musical falar com deus oracao')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition-colors"
                >
                  Falar com Deus
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyCuratedMedia('FUNDO MUSICAL MEU RESPIRAR', 'fundo musical meu respirar piano oracao')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition-colors"
                >
                  Meu Respirar
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyCuratedMedia('PROVAI E VEDE - USE O PRIMEIRO VIDEO', 'provai e vede adventista primeiro video')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 transition-colors"
                >
                  Provai e Vede
                </button>
              </div>
            </div>

            {/* Seletor Avançado de Origem de Mídia: YouTube vs Pen Drive */}
            <div className="space-y-3">
              <SongMediaSourceSelector
                slotLabel="Congregacional 1 / Playback 1"
                slotNumber={1}
                title={c1Title}
                onChangeTitle={setC1Title}
                url={c1Url}
                onChangeUrl={setC1Url}
                sourceType={c1SourceType}
                onChangeSourceType={setC1SourceType}
                fileName={c1FileName}
                onChangeFileName={setC1FileName}
                fileSize={c1FileSize}
                onChangeFileSize={setC1FileSize}
                driveOrigin={c1DriveOrigin}
                onChangeDriveOrigin={setC1DriveOrigin}
                onClear={() => {
                  setC1Title('');
                  setC1Url('');
                  setC1FileName('');
                  setC1FileSize('');
                }}
              />

              <SongMediaSourceSelector
                slotLabel="Congregacional 2 / Playback 2"
                slotNumber={2}
                title={c2Title}
                onChangeTitle={setC2Title}
                url={c2Url}
                onChangeUrl={setC2Url}
                sourceType={c2SourceType}
                onChangeSourceType={setC2SourceType}
                fileName={c2FileName}
                onChangeFileName={setC2FileName}
                fileSize={c2FileSize}
                onChangeFileSize={setC2FileSize}
                driveOrigin={c2DriveOrigin}
                onChangeDriveOrigin={setC2DriveOrigin}
                onClear={() => {
                  setC2Title('');
                  setC2Url('');
                  setC2FileName('');
                  setC2FileSize('');
                }}
              />

              <SongMediaSourceSelector
                slotLabel="Congregacional 3 / Playback 3"
                slotNumber={3}
                title={c3Title}
                onChangeTitle={setC3Title}
                url={c3Url}
                onChangeUrl={setC3Url}
                sourceType={c3SourceType}
                onChangeSourceType={setC3SourceType}
                fileName={c3FileName}
                onChangeFileName={setC3FileName}
                fileSize={c3FileSize}
                onChangeFileSize={setC3FileSize}
                driveOrigin={c3DriveOrigin}
                onChangeDriveOrigin={setC3DriveOrigin}
                onClear={() => {
                  setC3Title('');
                  setC3Url('');
                  setC3FileName('');
                  setC3FileSize('');
                }}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Observações & Dicas para Sonoplastia
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Instruções para áudio, microfones, transição de slides ou vídeo..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden text-sm text-slate-800"
            />
          </div>

          {/* Submit / Cancel Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              id="save-activity-btn"
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-102"
            >
              {initialActivity ? 'Salvar Alterações' : 'Adicionar ao Culto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
