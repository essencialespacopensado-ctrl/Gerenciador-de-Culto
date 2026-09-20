import React, { useState, useEffect, useMemo } from 'react';
import { 
  Music, Search, Plus, Play, Tv, Trash2, Edit3, Check, 
  Mic, Sparkles, Filter, X, Eye, ExternalLink, Calendar,
  BookOpen, Heart, Music2, Share2, Tag, ArrowRight
} from 'lucide-react';
import { ChurchSong, MusicType, ActivityItem, SongLiturgyDestination, WorshipProgram } from '../types';
import { INITIAL_CHURCH_SONGS } from '../data/churchData';
import { AssignSongToLiturgyModal } from './AssignSongToLiturgyModal';
import { EscolaSabatinaECultoView } from './EscolaSabatinaECultoView';

interface ChurchSongsCatalogViewProps {
  onPlayMedia: (
    title: string, 
    queryOrUrl: string, 
    videoDate?: string, 
    downloadUrl?: string, 
    synopsis?: string, 
    targetScreen?: 'main' | 'auxiliary'
  ) => void;
  onAddSongToLiturgia?: (song: ChurchSong, destination: SongLiturgyDestination) => void;
  activities?: ActivityItem[];
  program?: WorshipProgram;
  onUpdateProgram?: (newProgram: WorshipProgram) => void;
}

const STORAGE_KEY = 'iasd_church_songs_catalog_v1';

export const ChurchSongsCatalogView: React.FC<ChurchSongsCatalogViewProps> = ({
  onPlayMedia,
  onAddSongToLiturgia,
  activities = [],
  program,
  onUpdateProgram,
}) => {
  // Subtab state: 'escola_culto' (3 Louvores + 1 Mensagem) or 'catalog' (Acervo Geral)
  const [activeSubTab, setActiveSubTab] = useState<'escola_culto' | 'catalog'>('escola_culto');

  // Modal to designate moment in liturgy
  const [songForLiturgyModal, setSongForLiturgyModal] = useState<ChurchSong | null>(null);
  // Load saved songs or initialize with preset songs
  const [songs, setSongs] = useState<ChurchSong[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ChurchSong[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge any new initial songs that don't exist in saved
          const savedIds = new Set(parsed.map(s => s.id));
          const missingDefaults = INITIAL_CHURCH_SONGS.filter(s => !savedIds.has(s.id));
          return [...parsed, ...missingDefaults];
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar catálogo de louvores do localStorage:', e);
    }
    return INITIAL_CHURCH_SONGS;
  });

  // Save to localStorage when songs change
  const saveSongs = (newSongs: ChurchSong[]) => {
    setSongs(newSongs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSongs));
    } catch (e) {
      console.warn('Erro ao salvar catálogo no localStorage:', e);
    }
  };

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<MusicType | 'all' | 'custom'>('all');
  const [selectedKey, setSelectedKey] = useState<string>('all');

  // Modal / Form state for registering or editing songs
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formArtist, setFormArtist] = useState('');
  const [formType, setFormType] = useState<MusicType>('louvor');
  const [formYoutubeUrl, setFormYoutubeUrl] = useState('');
  const [formKey, setFormKey] = useState('');
  const [formMoment, setFormMoment] = useState('');
  const [formLyrics, setFormLyrics] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Notification feedback
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Open Form for New Registration
  const handleOpenNewForm = (presetType: MusicType = 'louvor') => {
    setEditingSongId(null);
    setFormTitle('');
    setFormArtist('');
    setFormType(presetType);
    setFormYoutubeUrl('');
    setFormKey('');
    setFormMoment('');
    setFormLyrics('');
    setFormNotes('');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Form for Editing
  const handleOpenEditForm = (song: ChurchSong) => {
    setEditingSongId(song.id);
    setFormTitle(song.title);
    setFormArtist(song.artistOrGroup);
    setFormType(song.type);
    setFormYoutubeUrl(song.youtubeUrlOrId);
    setFormKey(song.key || '');
    setFormMoment(song.suggestedMoment || '');
    setFormLyrics(song.lyricsSnippet || '');
    setFormNotes(song.notes || '');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Save Registration (Create or Update)
  const handleSaveSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Informe o título do louvor ou da mensagem musical.');
      return;
    }

    if (editingSongId) {
      // Update existing
      const updated = songs.map(s => {
        if (s.id === editingSongId) {
          return {
            ...s,
            title: formTitle.trim(),
            artistOrGroup: formArtist.trim() || 'Ministério de Louvor',
            type: formType,
            youtubeUrlOrId: formYoutubeUrl.trim(),
            key: formKey.trim() || undefined,
            suggestedMoment: formMoment.trim() || undefined,
            lyricsSnippet: formLyrics.trim() || undefined,
            notes: formNotes.trim() || undefined,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });
      saveSongs(updated);
      showNotification(`✓ Louvor "${formTitle}" atualizado com sucesso!`);
    } else {
      // Create new
      const newSong: ChurchSong = {
        id: `custom-song-${Date.now()}`,
        title: formTitle.trim(),
        artistOrGroup: formArtist.trim() || 'Ministério de Louvor',
        type: formType,
        youtubeUrlOrId: formYoutubeUrl.trim(),
        key: formKey.trim() || undefined,
        suggestedMoment: formMoment.trim() || undefined,
        lyricsSnippet: formLyrics.trim() || undefined,
        notes: formNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
        isCustom: true,
      };
      saveSongs([newSong, ...songs]);
      showNotification(`✓ "${formTitle}" cadastrado com sucesso!`);
    }

    setIsFormModalOpen(false);
  };

  // Delete Song
  const handleDeleteSong = (id: string, title: string) => {
    if (window.confirm(`Deseja remover "${title}" do catálogo?`)) {
      const filtered = songs.filter(s => s.id !== id);
      saveSongs(filtered);
      showNotification(`"${title}" removido do catálogo.`);
    }
  };

  // Reset to default presets
  const handleResetPresets = () => {
    if (window.confirm('Deseja restaurar as músicas pré-configuradas originais? Suas músicas cadastradas serão preservadas.')) {
      const customOnes = songs.filter(s => s.isCustom);
      const combined = [...customOnes, ...INITIAL_CHURCH_SONGS];
      saveSongs(combined);
      showNotification('Músicas padrão restauradas.');
    }
  };

  // Filtered list with instant search
  const filteredSongs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return songs.filter(song => {
      // Type filter
      if (selectedType === 'custom') {
        if (!song.isCustom) return false;
      } else if (selectedType !== 'all') {
        if (song.type !== selectedType) return false;
      }

      // Key filter
      if (selectedKey !== 'all') {
        if (song.key !== selectedKey) return false;
      }

      // Search query filter (matches title, artist, lyrics snippet, moment, notes)
      if (!q) return true;

      const inTitle = song.title.toLowerCase().includes(q);
      const inArtist = song.artistOrGroup.toLowerCase().includes(q);
      const inLyrics = song.lyricsSnippet?.toLowerCase().includes(q) || false;
      const inMoment = song.suggestedMoment?.toLowerCase().includes(q) || false;
      const inNotes = song.notes?.toLowerCase().includes(q) || false;
      const inKey = song.key?.toLowerCase() === q;

      return inTitle || inArtist || inLyrics || inMoment || inNotes || inKey;
    });
  }, [songs, searchQuery, selectedType, selectedKey]);

  // Counts for quick pills
  const counts = useMemo(() => {
    return {
      all: songs.length,
      louvor: songs.filter(s => s.type === 'louvor').length,
      mensagem_musical: songs.filter(s => s.type === 'mensagem_musical').length,
      fundo_musical: songs.filter(s => s.type === 'fundo_musical').length,
      infantil: songs.filter(s => s.type === 'infantil').length,
      custom: songs.filter(s => s.isCustom).length,
    };
  }, [songs]);

  // Unique keys for filter
  const availableKeys = useMemo(() => {
    const keys = new Set<string>();
    songs.forEach(s => {
      if (s.key) keys.add(s.key);
    });
    return Array.from(keys).sort();
  }, [songs]);

  const handleAddSongToEscolaECultoList = (song: ChurchSong) => {
    try {
      const PRAISE_KEY = 'iasd_escola_sabatina_culto_items_v2';
      const existingStr = localStorage.getItem(PRAISE_KEY);
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const isMensagem = song.type === 'mensagem_musical';
      const newItem = {
        id: `praise_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        kind: isMensagem ? 'mensagem_musical' : 'louvor_congregacional',
        title: song.title,
        artistOrGroup: song.artistOrGroup || 'Ministério de Louvor',
        key: song.key || 'C',
        section: isMensagem ? 'culto_divino' : 'escola_sabatina',
        momentDescription: song.suggestedMoment || (isMensagem ? 'Mensagem Musical Especial' : 'Momento de Louvor Congregacional'),
        youtubeUrlOrQuery: song.youtubeUrlOrId || song.title,
        notes: song.notes || '',
        order: existing.length + 1,
      };
      localStorage.setItem(PRAISE_KEY, JSON.stringify([...existing, newItem]));
      window.dispatchEvent(new Event('storage'));
      setFeedbackMessage(`✓ "${song.title}" adicionado à lista de Escola Sabatina & Culto!`);
      setActiveSubTab('escola_culto');
    } catch (e) {
      console.error('Error adding to escola sabatina list:', e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Sub-Tab Navigation Header */}
      <div className="flex flex-col sm:flex-row items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <button
          id="subtab-btn-escola-culto"
          type="button"
          onClick={() => setActiveSubTab('escola_culto')}
          className={`w-full sm:flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'escola_culto'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>Escola Sabatina & Culto (3 Louvores + 1 Mensagem Musical)</span>
        </button>

        <button
          id="subtab-btn-catalog"
          type="button"
          onClick={() => setActiveSubTab('catalog')}
          className={`w-full sm:flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'catalog'
              ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Catálogo Geral de Músicas ({songs.length})</span>
        </button>
      </div>

      {activeSubTab === 'escola_culto' ? (
        <EscolaSabatinaECultoView
          program={program || { id: 'default', date: '', theme: '', activities: [] }}
          onUpdateProgram={onUpdateProgram || (() => {})}
          onPlayMedia={onPlayMedia}
        />
      ) : (
        <>
          {/* Header & Quick Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>Louvores & Mensagens Musicais</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    {songs.length} cadastrados
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Cadastre seus louvores e mensagens musicais com busca rápida e reprodução com 1 clique na Tela 1 ou Telão.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleOpenNewForm('louvor')}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>+ Cadastrar Louvor</span>
            </button>

            <button
              onClick={() => handleOpenNewForm('mensagem_musical')}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <Mic className="w-4 h-4" />
              <span>+ Mensagem Musical</span>
            </button>
          </div>
        </div>

        {/* Quick Notification Toast */}
        {feedbackMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-md">
            <span>{feedbackMessage}</span>
            <button onClick={() => setFeedbackMessage(null)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Instant Search Bar & Filter Controls */}
        <div className="mt-6 space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Busca rápida por nome da música, cantor/grupo, trecho da letra ou momento do culto..."
              className="w-full pl-11 pr-10 py-3 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedType === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>Todos ({counts.all})</span>
            </button>

            <button
              onClick={() => setSelectedType('louvor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedType === 'louvor'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Music className="w-3.5 h-3.5 text-amber-400" />
              <span>Louvores Congregacionais ({counts.louvor})</span>
            </button>

            <button
              onClick={() => setSelectedType('mensagem_musical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedType === 'mensagem_musical'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-indigo-400" />
              <span>Mensagens Musicais ({counts.mensagem_musical})</span>
            </button>

            <button
              onClick={() => setSelectedType('fundo_musical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedType === 'fundo_musical'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Fundos Musicais ({counts.fundo_musical})</span>
            </button>

            <button
              onClick={() => setSelectedType('infantil')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedType === 'infantil'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>👶 Infantis ({counts.infantil})</span>
            </button>

            {counts.custom > 0 && (
              <button
                onClick={() => setSelectedType('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedType === 'custom'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>⭐ Meus Cadastrados ({counts.custom})</span>
              </button>
            )}

            {/* Key Filter Dropdown */}
            {availableKeys.length > 0 && (
              <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
                <span>Tom:</span>
                <select
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="all">Todos os Tons</option>
                  {availableKeys.map(k => (
                    <option key={k} value={k}>Tom: {k}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>
            Mostrando <strong>{filteredSongs.length}</strong> de {songs.length} louvores e mensagens
            {searchQuery && ` para a busca "${searchQuery}"`}
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-amber-400 hover:underline cursor-pointer"
            >
              Limpar busca
            </button>
          )}
        </div>

        {filteredSongs.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
            <Music2 className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Nenhum louvor ou mensagem encontrado</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Não encontramos músicas com o termo "{searchQuery}". Você pode cadastrar esta música agora mesmo!
              </p>
            </div>
            <button
              onClick={() => {
                handleOpenNewForm('louvor');
                setFormTitle(searchQuery);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar "{searchQuery}" Agora</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredSongs.map(song => {
              const isLouvor = song.type === 'louvor';
              const isMensagem = song.type === 'mensagem_musical';
              const isFundo = song.type === 'fundo_musical';
              const isInfantil = song.type === 'infantil';

              const typeBadgeColor = isLouvor 
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                : isMensagem 
                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' 
                : isFundo
                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';

              const typeLabel = isLouvor 
                ? 'Louvor Congregacional' 
                : isMensagem 
                ? 'Mensagem Musical' 
                : isFundo 
                ? 'Fundo Musical' 
                : 'Infantil';

              const effectiveUrlOrQuery = song.youtubeUrlOrId || `${song.title} ${song.artistOrGroup}`;

              return (
                <div
                  key={song.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-md hover:shadow-xl transition-all group relative"
                >
                  <div className="space-y-2">
                    {/* Top Row: Type Badge + Key + Action Menu */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${typeBadgeColor}`}>
                          {typeLabel}
                        </span>

                        {song.key && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-amber-400 border border-slate-700">
                            Tom: {song.key}
                          </span>
                        )}

                        {song.isCustom && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-950/80 text-blue-300 border border-blue-500/30">
                            Cadastrado
                          </span>
                        )}
                      </div>

                      {/* Quick Edit / Delete Buttons */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEditForm(song)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                          title="Editar informações"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {song.isCustom && (
                          <button
                            onClick={() => handleDeleteSong(song.id, song.title)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                            title="Excluir louvor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Title & Artist */}
                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                        {song.title}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium line-clamp-1">
                        {song.artistOrGroup}
                      </p>
                    </div>

                    {/* Suggested Moment / Category Info */}
                    {song.suggestedMoment && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="line-clamp-1">{song.suggestedMoment}</span>
                      </p>
                    )}

                    {/* Lyrics Snippet */}
                    {song.lyricsSnippet && (
                      <p className="text-xs text-slate-400/90 italic bg-slate-950/50 p-2 rounded-xl border border-slate-800/60 line-clamp-2">
                        "{song.lyricsSnippet}"
                      </p>
                    )}

                    {/* Notes if present */}
                    {song.notes && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        💡 {song.notes}
                      </p>
                    )}
                  </div>

                  {/* Action Playback Buttons: Tela 1 vs Telão */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    {/* Add to Liturgia with moment selection */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {onAddSongToLiturgia && (
                        <button
                          onClick={() => setSongForLiturgyModal(song)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-xs"
                          title="Destinar o momento exato em que este louvor/mensagem entra no culto"
                        >
                          <Plus className="w-3.5 h-3.5 text-amber-400" />
                          <span>Destinar no Culto</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleAddSongToEscolaECultoList(song)}
                        className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-950/60 border border-slate-700/80 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Adicionar à lista de louvores da Escola Sabatina e Culto"
                      >
                        <Music className="w-3 h-3 text-amber-400" />
                        <span>+ Lista Culto</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                      {/* Play on Main Screen (Tela 1 - Operador) */}
                      <button
                        onClick={() => onPlayMedia(
                          song.title,
                          effectiveUrlOrQuery,
                          undefined,
                          undefined,
                          song.suggestedMoment || song.notes,
                          'main'
                        )}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                        title="Reproduzir na Tela 1 (Operador)"
                      >
                        <Play className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
                        <span>Tela 1</span>
                      </button>

                      {/* Play on Auxiliary Screen (Telão da Igreja) */}
                      <button
                        onClick={() => onPlayMedia(
                          song.title,
                          effectiveUrlOrQuery,
                          undefined,
                          undefined,
                          song.suggestedMoment || song.notes,
                          'auxiliary'
                        )}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                        title="Projetar diretamente no Telão da Igreja (fecha automaticamente ao terminar)"
                      >
                        <Tv className="w-3.5 h-3.5" />
                        <span>Telão</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </>
      )}

      {/* Modal for Adding / Editing Song */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Music className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-white">
                  {editingSongId ? 'Editar Louvor ou Mensagem' : 'Cadastrar Novo Louvor / Mensagem'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveSong} className="space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Tipo de Música
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('louvor')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                      formType === 'louvor'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    🎵 Louvor Congregacional
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('mensagem_musical')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                      formType === 'mensagem_musical'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    🎤 Mensagem Musical (Solo/Grupo)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('fundo_musical')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                      formType === 'fundo_musical'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    🎹 Fundo Musical / Oração
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('infantil')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                      formType === 'infantil'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    👶 Adoração Infantil
                  </button>
                </div>
              </div>

              {/* Title & Artist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Título da Música *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ex: 10 Mil Razões, No Teu Altar..."
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Cantor, Grupo ou Quarteto
                  </label>
                  <input
                    type="text"
                    value={formArtist}
                    onChange={(e) => setFormArtist(e.target.value)}
                    placeholder="Ex: Arautos do Rei, Leonardo Gonçalves, Coral..."
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* YouTube Link / ID & Key */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Link do YouTube ou ID (Vídeo Oficial / Playback)
                  </label>
                  <input
                    type="text"
                    value={formYoutubeUrl}
                    onChange={(e) => setFormYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... ou ID de 11 caracteres"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Tom Musical
                  </label>
                  <input
                    type="text"
                    value={formKey}
                    onChange={(e) => setFormKey(e.target.value.toUpperCase())}
                    placeholder="Ex: C, G, D, Bb, F#m"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono text-xs"
                  />
                </div>
              </div>

              {/* Suggested Moment of Culto */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Momento Recomendado no Culto
                </label>
                <input
                  type="text"
                  value={formMoment}
                  onChange={(e) => setFormMoment(e.target.value)}
                  placeholder="Ex: Abertura do Louvor, Antes do Sermão, Apelo, Ofertório, Escola Sabatina"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Lyrics Snippet */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Trecho da Letra ou Refrão (Facilita a busca rápida)
                </label>
                <textarea
                  rows={2}
                  value={formLyrics}
                  onChange={(e) => setFormLyrics(e.target.value)}
                  placeholder="Ex: Bendize ó minha alma ao Senhor, e tudo o que há em mim..."
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Observações para a Sonoplastia
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Começar baixo e subir na entrada da voz, afinar microfones 1 e 2"
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingSongId ? 'Salvar Alterações' : 'Salvar no Catálogo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal to designate the exact liturgy moment */}
      <AssignSongToLiturgyModal
        isOpen={!!songForLiturgyModal}
        onClose={() => setSongForLiturgyModal(null)}
        song={songForLiturgyModal}
        activities={activities}
        onConfirm={(song, dest) => {
          if (onAddSongToLiturgia) {
            onAddSongToLiturgia(song, dest);
            showNotification(`✓ "${song.title}" destinada com sucesso na liturgia!`);
          }
        }}
      />
    </div>
  );
};
