import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Youtube,
  Tv,
  Play,
  CheckCircle2,
  ExternalLink,
  Plus,
  Trash2,
  RefreshCw,
  Sliders,
  X,
  Volume2,
  Maximize2,
  Radio,
  Check,
  Globe
} from 'lucide-react';
import { WeeklySearchSlot, WeeklyMediaItem } from '../types';
import {
  getWeeklySearchSlots,
  saveWeeklySearchSlots,
  searchWeeklyVideoOnInternet,
  DEFAULT_WEEKLY_SEARCH_SLOTS,
  LiveSearchResultItem
} from '../utils/weeklySearchStorage';
import { projectionManager } from '../utils/projectionManager';

interface WeeklySearchConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySlotToMedia?: (slot: WeeklySearchSlot) => void;
  onPlayDirect?: (videoTitle: string, embedUrl: string, targetScreen: 'main' | 'auxiliary') => void;
}

export const WeeklySearchConfigModal: React.FC<WeeklySearchConfigModalProps> = ({
  isOpen,
  onClose,
  onApplySlotToMedia,
  onPlayDirect,
}) => {
  const [slots, setSlots] = useState<WeeklySearchSlot[]>([]);
  const [activeSlotId, setActiveSlotId] = useState<string>('slot-informativo');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<{ [slotId: string]: LiveSearchResultItem[] }>({});
  const [statusMessage, setStatusMessage] = useState<string>('');

  // New slot form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSlotName, setNewSlotName] = useState('');
  const [newSlotChannel, setNewSlotChannel] = useState('');
  const [newSlotQuery, setNewSlotQuery] = useState('');
  const [newSlotCategory, setNewSlotCategory] = useState<'escola_sabatina' | 'culto_divino' | 'outro'>('culto_divino');
  const [newSlotAutoLink, setNewSlotAutoLink] = useState(true);
  const [newSlotTarget, setNewSlotTarget] = useState<'main' | 'auxiliary'>('auxiliary');
  const [newSlotFullscreen, setNewSlotFullscreen] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const loaded = getWeeklySearchSlots();
      setSlots(loaded);
      if (loaded.length > 0 && !activeSlotId) {
        setActiveSlotId(loaded[0].id);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSlot = slots.find((s) => s.id === activeSlotId) || slots[0];

  const handleUpdateSlot = (id: string, partial: Partial<WeeklySearchSlot>) => {
    const updated = slots.map((s) => (s.id === id ? { ...s, ...partial } : s));
    setSlots(updated);
    saveWeeklySearchSlots(updated);
  };

  const handleSearchInternetForSlot = async (slot: WeeklySearchSlot) => {
    setIsSearching(true);
    setStatusMessage(`Pesquisando vídeo mais recente no YouTube para "${slot.name}"...`);
    try {
      const query = slot.searchQueryTemplate || `${slot.channelName} ${slot.name}`;
      const res = await searchWeeklyVideoOnInternet(query);
      if (res.videos && res.videos.length > 0) {
        setSearchResults((prev) => ({ ...prev, [slot.id]: res.videos }));
        const top = res.topResult || res.videos[0];
        
        // Auto-link top result
        const updated = slots.map((s) => {
          if (s.id === slot.id) {
            return {
              ...s,
              activeVideoId: top.videoId,
              activeVideoTitle: top.title,
              activeDuration: top.duration || s.activeDuration,
              thumbnailUrl: top.thumbnail,
              updatedAt: new Date().toISOString(),
            };
          }
          return s;
        });
        setSlots(updated);
        saveWeeklySearchSlots(updated);

        const updatedSlot = updated.find((s) => s.id === slot.id);
        if (updatedSlot && onApplySlotToMedia) {
          onApplySlotToMedia(updatedSlot);
        }

        setStatusMessage(`✓ Vídeo vinculado com sucesso: "${top.title}" (${top.channel})`);
        setTimeout(() => setStatusMessage(''), 4000);
      } else {
        setStatusMessage('Nenhum vídeo encontrado para essa pesquisa.');
      }
    } catch (err) {
      setStatusMessage('Erro ao conectar com a internet.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (slotId: string, item: LiveSearchResultItem) => {
    const updated = slots.map((s) => {
      if (s.id === slotId) {
        return {
          ...s,
          activeVideoId: item.videoId,
          activeVideoTitle: item.title,
          activeDuration: item.duration || s.activeDuration,
          thumbnailUrl: item.thumbnail,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });
    setSlots(updated);
    saveWeeklySearchSlots(updated);

    const updatedSlot = updated.find((s) => s.id === slotId);
    if (updatedSlot && onApplySlotToMedia) {
      onApplySlotToMedia(updatedSlot);
    }

    setStatusMessage(`✓ Vídeo "${item.title}" selecionado e vinculado.`);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleCreateNewSlot = () => {
    if (!newSlotName.trim()) return;

    const newId = `slot-custom-${Date.now()}`;
    const newSlot: WeeklySearchSlot = {
      id: newId,
      key: newSlotName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      name: newSlotName.trim(),
      category: newSlotCategory,
      channelName: newSlotChannel.trim() || 'YouTube',
      searchQueryTemplate: newSlotQuery.trim() || `${newSlotChannel} ${newSlotName}`,
      autoLink: newSlotAutoLink,
      defaultTargetScreen: newSlotTarget,
      autoFullscreenAux: newSlotFullscreen,
      enabled: true,
      updatedAt: new Date().toISOString(),
    };

    const updated = [...slots, newSlot];
    setSlots(updated);
    saveWeeklySearchSlots(updated);
    setActiveSlotId(newId);

    // Reset form
    setNewSlotName('');
    setNewSlotChannel('');
    setNewSlotQuery('');
    setShowAddForm(false);

    // Auto-search for the newly created slot
    handleSearchInternetForSlot(newSlot);
  };

  const handleDeleteSlot = (id: string) => {
    if (id === 'slot-informativo') {
      alert('O Informativo Mundial das Missões é essencial para a Escola Sabatina e não pode ser excluído, mas pode ser reconfigurado.');
      return;
    }
    const updated = slots.filter((s) => s.id !== id);
    setSlots(updated);
    saveWeeklySearchSlots(updated);
    if (activeSlotId === id && updated.length > 0) {
      setActiveSlotId(updated[0].id);
    }
  };

  const handleResetToOfficialDefaults = () => {
    setSlots(DEFAULT_WEEKLY_SEARCH_SLOTS);
    saveWeeklySearchSlots(DEFAULT_WEEKLY_SEARCH_SLOTS);
    setActiveSlotId('slot-informativo');
    setStatusMessage('Configurações oficiais do canal Daniel Locutor restauradas com sucesso!');
    setTimeout(() => setStatusMessage(''), 3500);
  };

  const handlePlayDirectOnScreen = (slot: WeeklySearchSlot, targetScreen: 'main' | 'auxiliary') => {
    if (!slot.activeVideoId) {
      alert('Nenhum vídeo vinculado. Clique em "Buscar na Internet Agora" primeiro.');
      return;
    }

    const embedUrl = `https://www.youtube.com/embed/${slot.activeVideoId}?autoplay=1&rel=0`;
    const title = slot.activeVideoTitle || slot.name;

    if (onPlayDirect) {
      onPlayDirect(title, embedUrl, targetScreen);
    } else {
      const mediaPayload = {
        id: slot.id,
        title,
        urlOrQuery: embedUrl,
        youtubeId: slot.activeVideoId,
        embedUrl,
        timestamp: Date.now(),
      };
      if (targetScreen === 'auxiliary') {
        projectionManager.transmitToAuxiliaryScreen(
          mediaPayload,
          slot.autoFullscreenAux
        );
      } else {
        projectionManager.transmitToMainScreen(mediaPayload);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Procura Semanal de Vídeos da Internet
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium">
                  Link Automático & Telão
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure canais do YouTube para que os vídeos da semana sejam vinculados automaticamente. Basta apertar o Play!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notification banner */}
        {statusMessage && (
          <div className="px-6 py-2.5 bg-blue-950/60 border-b border-blue-800/40 text-blue-300 text-xs font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Main Content: Sidebar Slots + Config Form */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar: List of Search Slots */}
          <div className="w-80 border-r border-slate-800 bg-slate-950/40 p-4 flex flex-col gap-2 overflow-y-auto">
            <div className="flex items-center justify-between mb-1 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Campos de Procura
              </span>
              <button
                onClick={() => setShowAddForm(true)}
                className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1 transition-colors"
                title="Adicionar novo campo de procura semanal de vídeos"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>

            {slots.map((slot) => {
              const isSelected = slot.id === activeSlotId;
              const isDaniel = slot.channelName.toLowerCase().includes('daniel') || slot.id === 'slot-informativo';

              return (
                <div
                  key={slot.id}
                  onClick={() => {
                    setActiveSlotId(slot.id);
                    setShowAddForm(false);
                  }}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all relative ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500 shadow-md shadow-blue-500/5'
                      : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-sm text-white line-clamp-1">
                      {slot.name}
                    </div>
                    {isDaniel && (
                      <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Daniel Locutor
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 line-clamp-1">
                    <Youtube className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>{slot.channelName}</span>
                  </div>

                  {slot.activeVideoTitle && (
                    <div className="mt-2 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/30 rounded px-2 py-1 flex items-center gap-1.5 line-clamp-1">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>{slot.activeVideoTitle}</span>
                    </div>
                  )}

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-700/40">
                    <span className="flex items-center gap-1">
                      <Tv className="w-3 h-3 text-blue-400" />
                      {slot.defaultTargetScreen === 'auxiliary' ? 'Telão 2' : 'Tela 1'}
                    </span>
                    {slot.autoLink && (
                      <span className="text-amber-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Play Automático
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="mt-auto pt-4 border-t border-slate-800">
              <button
                onClick={handleResetToOfficialDefaults}
                className="w-full py-2 px-3 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Restaurar Oficial (Daniel Locutor)</span>
              </button>
            </div>
          </div>

          {/* Right Area: Form / Configuration or Add New Form */}
          <div className="flex-1 p-6 overflow-y-auto bg-slate-900/60">
            {showAddForm ? (
              /* FORM: ADD NEW WEEKLY SEARCH SLOT */
              <div className="max-w-2xl mx-auto space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Plus className="w-5 h-5 text-blue-400" />
                      Adicionar Novo Campo de Procura Semanal
                    </h3>
                    <p className="text-xs text-slate-400">
                      Adicione um novo momento do culto para ser buscado na internet e reproduzido nas telas.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300">
                      Nome do Campo / Momento
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Mensagem Musical da Semana, Clipe de Abertura, etc."
                      value={newSlotName}
                      onChange={(e) => setNewSlotName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Canal do YouTube
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Daniel Locutor, Gravadora Novo Tempo, Feliz7Play"
                      value={newSlotChannel}
                      onChange={(e) => setNewSlotChannel(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Categoria do Culto
                    </label>
                    <select
                      value={newSlotCategory}
                      onChange={(e: any) => setNewSlotCategory(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-blue-500"
                    >
                      <option value="escola_sabatina">Escola Sabatina</option>
                      <option value="culto_divino">Culto Divino</option>
                      <option value="outro">Outro / Louvor</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300">
                      Termo de Pesquisa no YouTube
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Mensagem Musical Gravadora Novo Tempo Sabado"
                      value={newSlotQuery}
                      onChange={(e) => setNewSlotQuery(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-3 sm:col-span-2 pt-2 border-t border-slate-800">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newSlotAutoLink}
                        onChange={(e) => setNewSlotAutoLink(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
                      />
                      <span className="text-xs text-slate-200 font-medium">
                        Vincular automaticamente para apertar o Play sem precisar procurar
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newSlotFullscreen}
                        onChange={(e) => setNewSlotFullscreen(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
                      />
                      <span className="text-xs text-slate-200 font-medium">
                        Abrir automaticamente em tela cheia nas outras telas (Telão 2)
                      </span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateNewSlot}
                    disabled={!newSlotName.trim()}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Salvar e Pesquisar Vídeo</span>
                  </button>
                </div>
              </div>
            ) : currentSlot ? (
              /* CONFIGURATION OF SELECTED SLOT */
              <div className="max-w-3xl space-y-6">
                {/* Channel & Slot Card Header */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-800/80 to-slate-850 border border-slate-700/80 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {currentSlot.category === 'escola_sabatina' ? 'Escola Sabatina' : 'Culto Divino'}
                        </span>
                        {currentSlot.channelName.toLowerCase().includes('daniel') && (
                          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Canal Daniel Locutor
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-black text-white mt-1.5">
                        {currentSlot.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Canal oficial: <strong>{currentSlot.channelName}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSearchInternetForSlot(currentSlot)}
                        disabled={isSearching}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer transition-all"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
                        <span>{isSearching ? 'Buscando...' : 'Buscar na Internet Agora'}</span>
                      </button>

                      {currentSlot.id !== 'slot-informativo' && (
                        <button
                          onClick={() => handleDeleteSlot(currentSlot.id)}
                          className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 transition-colors"
                          title="Excluir este campo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Live Preview / Linked Video Banner */}
                {currentSlot.activeVideoId ? (
                  <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-700/40 flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-full sm:w-44 aspect-video rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-emerald-500/30 group">
                      <img
                        src={
                          currentSlot.thumbnailUrl ||
                          `https://img.youtube.com/vi/${currentSlot.activeVideoId}/hqdefault.jpg`
                        }
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-white">
                        {currentSlot.activeDuration || '03:15'}
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play className="w-8 h-8 text-white fill-white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Link Automático Ativo no Sistema
                        </span>
                        <span className="text-[10px] text-slate-400">
                          (Basta apertar o Play)
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white line-clamp-2">
                        {currentSlot.activeVideoTitle}
                      </h4>
                      <p className="text-xs text-slate-400">
                        YouTube ID: <span className="font-mono text-slate-300">{currentSlot.activeVideoId}</span>
                      </p>

                      {/* Immediate Play Actions with Fullscreen on Screen 2 */}
                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handlePlayDirectOnScreen(currentSlot, 'auxiliary')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
                          title="Reproduzir diretamente no Telão em Tela Cheia (Tela 2)"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Reproduzir no Telão (Tela Cheia)</span>
                        </button>

                        <button
                          onClick={() => handlePlayDirectOnScreen(currentSlot, 'main')}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-all"
                          title="Abrir no painel do operador (Tela 1)"
                        >
                          <Play className="w-3.5 h-3.5 text-blue-400" />
                          <span>Tela 1 (Operador)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-800/40 border border-dashed border-slate-700 text-center space-y-2">
                    <Youtube className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="text-sm text-slate-300 font-medium">
                      Nenhum vídeo vinculado ainda para este campo.
                    </p>
                    <button
                      onClick={() => handleSearchInternetForSlot(currentSlot)}
                      className="text-xs px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold inline-flex items-center gap-1.5"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Buscar Agora no YouTube
                    </button>
                  </div>
                )}

                {/* Editable Search Fields for this slot */}
                <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    Campos de Procura & Automação do Vídeo
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Nome do Momento
                      </label>
                      <input
                        type="text"
                        value={currentSlot.name}
                        onChange={(e) => handleUpdateSlot(currentSlot.id, { name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Canal Oficial do YouTube
                      </label>
                      <input
                        type="text"
                        value={currentSlot.channelName}
                        onChange={(e) => handleUpdateSlot(currentSlot.id, { channelName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-300">
                        Termo de Pesquisa Semanal na Internet
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={currentSlot.searchQueryTemplate}
                          onChange={(e) =>
                            handleUpdateSlot(currentSlot.id, { searchQueryTemplate: e.target.value })
                          }
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-blue-500"
                        />
                        <button
                          onClick={() => handleSearchInternetForSlot(currentSlot)}
                          disabled={isSearching}
                          className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>Buscar</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        O sistema usa esse termo semanalmente para conectar diretamente com o vídeo mais recente do canal.
                      </p>
                    </div>
                  </div>

                  {/* Dual Screen & Auto-Fullscreen Behavior */}
                  <div className="pt-3 border-t border-slate-700/60 space-y-3">
                    <div className="text-xs font-bold text-slate-300">
                      Comportamento de Reprodução nas Telas
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                          currentSlot.defaultTargetScreen === 'auxiliary'
                            ? 'bg-blue-950/40 border-blue-500'
                            : 'bg-slate-900 border-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`target_${currentSlot.id}`}
                          checked={currentSlot.defaultTargetScreen === 'auxiliary'}
                          onChange={() =>
                            handleUpdateSlot(currentSlot.id, { defaultTargetScreen: 'auxiliary' })
                          }
                          className="mt-0.5 text-blue-600"
                        />
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Tv className="w-3.5 h-3.5 text-blue-400" />
                            Tela 2 (Telão / Projetor)
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Reproduz diretamente no telão da igreja sem interferir na tela do operador.
                          </p>
                        </div>
                      </label>

                      <label
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                          currentSlot.defaultTargetScreen === 'main'
                            ? 'bg-blue-950/40 border-blue-500'
                            : 'bg-slate-900 border-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`target_${currentSlot.id}`}
                          checked={currentSlot.defaultTargetScreen === 'main'}
                          onChange={() =>
                            handleUpdateSlot(currentSlot.id, { defaultTargetScreen: 'main' })
                          }
                          className="mt-0.5 text-blue-600"
                        />
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Play className="w-3.5 h-3.5 text-amber-400" />
                            Tela 1 (Operador)
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Abre em modal na tela do operador antes de projetar.
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentSlot.autoFullscreenAux}
                          onChange={(e) =>
                            handleUpdateSlot(currentSlot.id, { autoFullscreenAux: e.target.checked })
                          }
                          className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                        />
                        <span className="text-xs text-slate-200 font-medium">
                          <strong>Abrir automaticamente em tela cheia nas outras telas:</strong> ao clicar no play, maximiza o telão instantaneamente sem bordas.
                        </span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentSlot.autoLink}
                          onChange={(e) =>
                            handleUpdateSlot(currentSlot.id, { autoLink: e.target.checked })
                          }
                          className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                        />
                        <span className="text-xs text-slate-200 font-medium">
                          <strong>Vincular automaticamente:</strong> no início do culto o link já está pronto, de forma que o operador apenas aperte o Play.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Additional YouTube Search Results for Selection */}
                {searchResults[currentSlot.id] && searchResults[currentSlot.id].length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Outros Vídeos Encontrados no Canal ({currentSlot.channelName})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {searchResults[currentSlot.id].slice(0, 4).map((item) => {
                        const isCurrentActive = currentSlot.activeVideoId === item.videoId;
                        return (
                          <div
                            key={item.videoId}
                            onClick={() => handleSelectSearchResult(currentSlot.id, item)}
                            className={`p-2.5 rounded-xl border flex gap-3 cursor-pointer transition-all ${
                              isCurrentActive
                                ? 'bg-emerald-950/40 border-emerald-500'
                                : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/60'
                            }`}
                          >
                            <img
                              src={item.thumbnail}
                              alt=""
                              className="w-24 aspect-video rounded-lg object-cover shrink-0 bg-black"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-white line-clamp-2">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                                <span>{item.channel}</span>
                                <span className="font-mono">{item.duration}</span>
                              </div>
                              {isCurrentActive && (
                                <span className="text-[10px] font-bold text-emerald-400 mt-1 block">
                                  ✓ Vídeo Selecionado
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Configurações salvas automaticamente. O canal Daniel Locutor está ativo como fonte oficial do Informativo.
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Concluir & Voltar ao Culto
          </button>
        </div>
      </div>
    </div>
  );
};
