import React, { useState } from 'react';
import { Search, Play, Sparkles, Youtube, Volume2, Video, Heart, Shield, Plus, Loader2, Tv } from 'lucide-react';
import { CURATED_MEDIA } from '../data/churchData';
import { PlaybackItem, ActivityItem } from '../types';

interface PlaybackSearchViewProps {
  onPlayMedia: (
    title: string, 
    query: string, 
    videoDate?: string, 
    downloadUrl?: string, 
    synopsis?: string, 
    targetScreen?: 'main' | 'auxiliary'
  ) => void;
  onAddToActivity?: (title: string, query: string) => void;
  activities: ActivityItem[];
}

export const PlaybackSearchView: React.FC<PlaybackSearchViewProps> = ({
  onPlayMedia,
  onAddToActivity,
  activities,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<any[] | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Filter curated media
  const filteredMedia = CURATED_MEDIA.filter(item => {
    const matchCategory =
      activeCategory === 'todos' || item.category === activeCategory;
    const matchSearch =
      !searchTerm.trim() ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.artistOrType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.recommendedFor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleSearchWithGemini = async () => {
    if (!searchTerm.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch('/api/gemini/search-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchTerm,
          occasion: activeCategory !== 'todos' ? activeCategory : 'Culto de Sábado',
        }),
      });

      if (!response.ok) {
        throw new Error('Não foi possível obter sugestões da IA');
      }

      const data = await response.json();
      setAiResults(data.results || []);
    } catch (err: any) {
      setAiError(err.message || 'Falha ao buscar com inteligência artificial');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-red-900 via-rose-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-400/30 text-red-200 text-xs font-semibold">
            <Youtube className="w-3.5 h-3.5 fill-current" />
            Busca Automática de Playbacks & Vídeos
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Sonoplastia & Mensagens Musicais
          </h2>
          <p className="text-sm sm:text-base text-red-100/80 leading-relaxed">
            Busca rápida e automática de playbacks para os momentos de louvor,
            fundos de piano para oração de joelhos, vídeos do Provai e Vede,
            Informativo das Missões e Vida e Saúde.
          </p>
        </div>
      </div>

      {/* Search Bar + AI Assist */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative grow">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="playback-search-input"
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  // Direct trigger
                }
              }}
              placeholder="Digite o nome da música, cantor ou momento (ex: Melissa Barcelos, Só Tu És Santo, Provai e Vede, Maranata)..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 text-slate-900 text-sm font-medium outline-hidden transition-all bg-slate-50/60"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {searchTerm.trim() && (
              <>
                <button
                  onClick={() =>
                    onPlayMedia(searchTerm, `${searchTerm} playback adventista`, undefined, undefined, undefined, 'main')
                  }
                  title="Ouvir no computador do operador (Tela 1)"
                  className="px-3.5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:scale-102 cursor-pointer shrink-0"
                >
                  <Play className="w-4 h-4 fill-current text-slate-300" />
                  <span>Ouvir (Tela 1)</span>
                </button>

                <button
                  onClick={() =>
                    onPlayMedia(searchTerm, `${searchTerm} playback adventista`, undefined, undefined, undefined, 'auxiliary')
                  }
                  title="Buscar e jogar direto no Telão da Igreja (Tela 2 em tela cheia)"
                  className="px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-purple-500/25 transition-all hover:scale-102 cursor-pointer shrink-0"
                >
                  <Tv className="w-4 h-4 text-purple-200" />
                  <span>📺 Jogar no Telão</span>
                </button>
              </>
            )}

            <button
              onClick={handleSearchWithGemini}
              disabled={aiLoading || !searchTerm.trim()}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0"
            >
              {aiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Sugerir com IA
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'todos', label: 'Todos os Recursos', icon: Video },
            { id: 'fundo_musical', label: 'Fundos de Oração', icon: Volume2 },
            { id: 'playback', label: 'Playbacks Mais Tocados', icon: Play },
            { id: 'video_oficial', label: 'Vídeos Oficiais IASD', icon: Youtube },
            { id: 'adoracao_infantil', label: 'Adoração Infantil', icon: Heart },
          ].map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setAiResults(null);
                }}
                className={`px-3.5 py-2 rounded-xl font-medium shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Results Section if triggered */}
      {aiResults && aiResults.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-3xl border border-indigo-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-indigo-950">
                Sugestões da IA para "{searchTerm}"
              </h3>
            </div>
            <button
              onClick={() => setAiResults(null)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Fechar sugestões
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiResults.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-2xl border border-indigo-100/80 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
                      {item.idealMoment || 'Liturgia'}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      {item.number ? `#${item.number} - ` : ''}
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {item.artist || 'Música Sacra'}
                    </p>
                  </div>
                </div>

                {item.reason && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    "{item.reason}"
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    onClick={() => onPlayMedia(item.title, item.youtubeQuery || `${item.title} playback`, undefined, undefined, undefined, 'main')}
                    className="flex-1 min-w-[90px] px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    title="Ouvir no computador do operador"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Tela 1</span>
                  </button>

                  <button
                    onClick={() => onPlayMedia(item.title, item.youtubeQuery || `${item.title} playback`, undefined, undefined, undefined, 'auxiliary')}
                    className="flex-1 min-w-[110px] px-2.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    title="Jogar diretamente no Telão da Igreja (Tela 2)"
                  >
                    <Tv className="w-3.5 h-3.5 text-purple-200" />
                    <span>📺 Telão</span>
                  </button>

                  {onAddToActivity && (
                    <button
                      onClick={() => onAddToActivity(item.title, item.youtubeQuery || `${item.title} playback`)}
                      className="px-2.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Vincular à Programação"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Vincular</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {aiError && (
        <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-xs font-medium">
          {aiError}
        </div>
      )}

      {/* Curated Media Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-semibold uppercase tracking-wider">
          <span>Biblioteca Curada da IASD ({filteredMedia.length} itens)</span>
          <span>Clique em "Testar / Ouvir" para prévia imediata</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMedia.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 hover:border-slate-300"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      item.category === 'fundo_musical'
                        ? 'bg-amber-100 text-amber-800'
                        : item.category === 'video_oficial'
                        ? 'bg-red-100 text-red-800'
                        : item.category === 'adoracao_infantil'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {item.category === 'fundo_musical'
                      ? 'Fundo de Oração'
                      : item.category === 'video_oficial'
                      ? 'Vídeo Oficial'
                      : item.category === 'adoracao_infantil'
                      ? 'Adoração Infantil'
                      : 'Playback'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {item.artistOrType}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {item.title}
                </h4>

                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100/80">
                  <span className="font-semibold text-slate-500">Recomendado para:</span>{' '}
                  {item.recommendedFor}
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => onPlayMedia(item.title, item.youtubeQuery, undefined, undefined, undefined, 'main')}
                  className="flex-1 min-w-[95px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Ouvir na Tela 1 (Operador)"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-slate-600" />
                  <span>Ouvir (Tela 1)</span>
                </button>

                <button
                  onClick={() => onPlayMedia(item.title, item.youtubeQuery, undefined, undefined, undefined, 'auxiliary')}
                  className="flex-1 min-w-[110px] px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-102 cursor-pointer"
                  title="Jogar diretamente no Telão da Igreja (Tela 2 em tela cheia)"
                >
                  <Tv className="w-3.5 h-3.5 text-purple-200" />
                  <span>📺 Telão</span>
                </button>

                {onAddToActivity && (
                  <button
                    onClick={() => onAddToActivity(item.title, item.youtubeQuery)}
                    title="Vincular à Atividade do Culto"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
