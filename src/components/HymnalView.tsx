import React, { useState, useMemo } from 'react';
import { Search, Music, Play, Plus, BookOpen, ExternalLink, Sparkles, Copy, Check, Tv } from 'lucide-react';
import { ADVENTIST_HYMNS } from '../data/churchData';
import { Hymn, ActivityItem } from '../types';

interface HymnalViewProps {
  onSelectPlayback: (title: string, query: string, targetScreen?: 'main' | 'auxiliary') => void;
  onAddToActivity?: (hymn: Hymn) => void;
  activities: ActivityItem[];
}

export const HymnalView: React.FC<HymnalViewProps> = ({
  onSelectPlayback,
  onAddToActivity,
  activities,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [activeHymn, setActiveHymn] = useState<Hymn | null>(ADVENTIST_HYMNS[14]); // default 192 Infinita Graça or similar
  const [copiedHymn, setCopiedHymn] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [targetSlot, setTargetSlot] = useState<'c1' | 'c2' | 'c3'>('c1');
  const [assignedNotice, setAssignedNotice] = useState<string | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set(ADVENTIST_HYMNS.map(h => h.category));
    return ['Todos', ...Array.from(set)];
  }, []);

  // Filter hymns
  const filteredHymns = useMemo(() => {
    return ADVENTIST_HYMNS.filter(h => {
      const matchCategory = selectedCategory === 'Todos' || h.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCategory;

      const matchNumber = h.number.toString() === q || h.number.toString().startsWith(q);
      const matchTitle = h.title.toLowerCase().includes(q);
      const matchSnippet = h.lyricsSnippet.toLowerCase().includes(q);
      const matchLyrics = h.fullLyrics?.some(l => l.toLowerCase().includes(q)) || false;

      return matchCategory && (matchNumber || matchTitle || matchSnippet || matchLyrics);
    });
  }, [searchQuery, selectedCategory]);

  const handleCopyLyrics = (hymn: Hymn) => {
    const text = `#${hymn.number} - ${hymn.title}\nTom: ${hymn.key || 'N/A'}\n\n${
      hymn.fullLyrics?.join('\n\n') || hymn.lyricsSnippet
    }`;
    navigator.clipboard.writeText(text);
    setCopiedHymn(true);
    setTimeout(() => setCopiedHymn(false), 2000);
  };

  const handleAssignToActivity = (hymn: Hymn) => {
    if (!selectedActivityId) return;
    if (onAddToActivity) {
      onAddToActivity(hymn);
    }
    setAssignedNotice(`Hino #${hymn.number} adicionado à atividade!`);
    setTimeout(() => setAssignedNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            Banco de Dados do Hinário Adventista
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Hinário Adventista & Playbacks
          </h2>
          <p className="text-sm sm:text-base text-blue-100/80 leading-relaxed">
            Pesquise hinos por número ou título, visualize as estrofes e acesse
            a busca automática de playbacks e vídeos para a sonoplastia do culto.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/95 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4 text-white">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="hymnal-search-input"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Digite o número (ex: 192, 28, 107) ou título do hino..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-white placeholder:text-slate-500 text-sm font-medium outline-hidden transition-all shadow-inner bg-slate-950"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Layout: List on Left, Active Hymn Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hymn List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-semibold uppercase tracking-wider">
            <span>{filteredHymns.length} Hinos Encontrados</span>
            <span>Clique para Detalhes</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredHymns.length === 0 ? (
              <div className="bg-slate-900 p-8 rounded-2xl border border-dashed border-slate-800 text-center text-slate-400 space-y-2">
                <Music className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-sm font-medium">Nenhum hino encontrado com esses termos.</p>
                <p className="text-xs text-slate-500">Tente buscar por outro número ou parte do título.</p>
              </div>
            ) : (
              filteredHymns.map(hymn => {
                const isSelected = activeHymn?.number === hymn.number;
                return (
                  <div
                    key={hymn.number}
                    onClick={() => setActiveHymn(hymn)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-950/80 border-blue-500 shadow-md ring-1 ring-blue-500/30 text-white'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        #{hymn.number}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">
                          {hymn.title}
                        </h4>
                        <p className="text-xs text-slate-400 truncate">
                          {hymn.category} • Tom: {hymn.key || 'D'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        title="Ouvir Playback na Tela 1 (Operador)"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPlayback(
                            `Hinário ${hymn.number} - ${hymn.title}`,
                            hymn.youtubeSearchQuery,
                            'main'
                          );
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current text-slate-300" />
                      </button>

                      <button
                        title="Jogar Playback no Telão da Igreja (Tela 2)"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPlayback(
                            `Hinário ${hymn.number} - ${hymn.title}`,
                            hymn.youtubeSearchQuery,
                            'auxiliary'
                          );
                        }}
                        className="p-2 rounded-xl bg-purple-950/80 hover:bg-purple-800 border border-purple-700/70 text-purple-300 transition-colors cursor-pointer hover:scale-105"
                      >
                        <Tv className="w-3.5 h-3.5 text-purple-300" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Hymn Detail & Playback Action Panel (7 cols) */}
        <div className="lg:col-span-7">
          {activeHymn ? (
            <div className="bg-slate-900/95 rounded-3xl border border-slate-800 shadow-xl p-6 sm:p-7 space-y-6 sticky top-4 text-white">
              {/* Hymn Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold">
                      Hino #{activeHymn.number}
                    </span>
                    <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                      {activeHymn.category}
                    </span>
                    {activeHymn.key && (
                      <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-800/60">
                        Tom: {activeHymn.key}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {activeHymn.title}
                  </h3>
                  {activeHymn.suggestedUsage && (
                    <p className="text-xs text-amber-300 font-medium flex items-center gap-1.5 pt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      {activeHymn.suggestedUsage}
                    </p>
                  )}
                </div>

                {/* Primary Action Buttons: Tela 1 & Telão */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() =>
                      onSelectPlayback(
                        `Hinário ${activeHymn.number} - ${activeHymn.title}`,
                        activeHymn.youtubeSearchQuery,
                        'main'
                      )
                    }
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                    title="Ouvir no computador do operador"
                  >
                    <Play className="w-4 h-4 fill-current text-slate-300" />
                    <span>Ouvir (Tela 1)</span>
                  </button>

                  <button
                    onClick={() =>
                      onSelectPlayback(
                        `Hinário ${activeHymn.number} - ${activeHymn.title}`,
                        activeHymn.youtubeSearchQuery,
                        'auxiliary'
                      )
                    }
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all hover:scale-102 cursor-pointer"
                    title="Transmitir playback diretamente no Telão da Igreja (Tela 2)"
                  >
                    <Tv className="w-4 h-4 text-purple-200" />
                    <span>📺 Jogar no Telão</span>
                  </button>
                </div>
              </div>

              {/* Lyrics Card */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <span>Letra do Hino</span>
                  <button
                    onClick={() => handleCopyLyrics(activeHymn)}
                    className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedHymn ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Letra
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 text-slate-200 text-sm leading-relaxed max-h-72 overflow-y-auto space-y-3 font-serif">
                  {activeHymn.fullLyrics && activeHymn.fullLyrics.length > 0 ? (
                    activeHymn.fullLyrics.map((stanza, idx) => (
                      <p key={idx} className="border-b border-slate-800/80 pb-2 last:border-b-0 last:pb-0">
                        {stanza}
                      </p>
                    ))
                  ) : (
                    <p>{activeHymn.lyricsSnippet}</p>
                  )}
                </div>
              </div>

              {/* Quick Assignment to Current Service Liturgy */}
              {activities && activities.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-blue-400" />
                      Vincular Hino à Programação do Culto
                    </span>
                    <div className="flex items-center gap-1 text-xs">
                      {(['c1', 'c2', 'c3'] as const).map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setTargetSlot(slot)}
                          className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] cursor-pointer transition-colors ${
                            targetSlot === slot
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-900 text-slate-400 border border-slate-750'
                          }`}
                        >
                          Slot {slot.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedActivityId}
                      onChange={e => setSelectedActivityId(e.target.value)}
                      className="grow px-3 py-2 rounded-xl border border-slate-700 text-xs font-medium text-slate-200 bg-slate-900 outline-none focus:border-blue-500"
                    >
                      <option value="">Selecione uma atividade do culto...</option>
                      {activities.map(act => (
                        <option key={act.id} value={act.id}>
                          {act.section === 'escola_sabatina' ? '[ES]' : '[Culto]'} {act.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={!selectedActivityId}
                      onClick={() => handleAssignToActivity(activeHymn)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs shrink-0 cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar
                    </button>
                  </div>

                  {assignedNotice && (
                    <div className="text-xs font-medium text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 p-2 rounded-lg text-center">
                      {assignedNotice}
                    </div>
                  )}
                </div>
              )}

              {/* YouTube Search Direct Link Card */}
              <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="font-mono text-slate-300 truncate mr-2">
                  Busca: "{activeHymn.youtubeSearchQuery}"
                </span>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(activeHymn.youtubeSearchQuery)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 shrink-0"
                >
                  Abrir YouTube <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-12 text-center text-slate-400">
              <Music className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="font-semibold text-slate-200">Selecione um hino na lista ao lado</p>
              <p className="text-xs text-slate-500 mt-1">
                Você verá a letra completa, tom musical e busca automática de playback.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
