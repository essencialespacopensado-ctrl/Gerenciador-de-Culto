import React, { useState, useMemo } from 'react';
import { 
  X, Calendar, Search, BookOpen, Clock, User, Mic2, Sparkles, 
  Trash2, RotateCcw, Share2, Printer, CheckCircle2, ChevronRight, 
  ChevronDown, ExternalLink, Music, AlertCircle, FileSpreadsheet, Copy, Check
} from 'lucide-react';
import { 
  ArchivedWorshipProgram, 
  getArchivedWorships, 
  deleteArchivedWorship, 
  restoreArchivedWorshipToProgram, 
  generateArchiveShareText,
  formatWorshipDateLong
} from '../utils/worshipArchiveManager';
import { WorshipProgram } from '../types';
import { getActiveChurchProfile } from '../utils/churchWorkspace';

interface ArchivedWorshipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreProgram: (restoredProgram: WorshipProgram) => void;
  onDuplicateAsTemplate: (templateProgram: WorshipProgram) => void;
  onNotify?: (msg: string) => void;
}

export const ArchivedWorshipsModal: React.FC<ArchivedWorshipsModalProps> = ({
  isOpen,
  onClose,
  onRestoreProgram,
  onDuplicateAsTemplate,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const church = getActiveChurchProfile();

  // Load archived services for current church
  const archives = useMemo(() => {
    return getArchivedWorships(church.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [church.id, reloadTrigger, isOpen]);

  const filteredArchives = useMemo(() => {
    if (!searchQuery.trim()) return archives;
    const q = searchQuery.toLowerCase();
    return archives.filter(item => 
      item.title.toLowerCase().includes(q) ||
      item.date.toLowerCase().includes(q) ||
      (item.dateFormatted && item.dateFormatted.toLowerCase().includes(q)) ||
      (item.preacher && item.preacher.toLowerCase().includes(q)) ||
      (item.theme && item.theme.toLowerCase().includes(q)) ||
      (item.responsiblePerson && item.responsiblePerson.toLowerCase().includes(q))
    );
  }, [archives, searchQuery]);

  const selectedArchive = useMemo(() => {
    if (!selectedArchiveId) return null;
    return archives.find(a => a.id === selectedArchiveId) || null;
  }, [archives, selectedArchiveId]);

  if (!isOpen) return null;

  const handleDelete = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Deseja realmente remover o registro arquivado de "${title}"?`)) {
      deleteArchivedWorship(id, church.id);
      if (selectedArchiveId === id) setSelectedArchiveId(null);
      setReloadTrigger(prev => prev + 1);
      if (onNotify) onNotify('Culto removido do arquivo com sucesso.');
    }
  };

  const handleCopySummary = (archive: ArchivedWorshipProgram, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const text = generateArchiveShareText(archive);
    navigator.clipboard.writeText(text);
    setCopiedId(archive.id);
    setTimeout(() => setCopiedId(null), 2500);
    if (onNotify) onNotify('✓ Resumo do culto copiado para a área de transferência!');
  };

  const handleRestore = (archive: ArchivedWorshipProgram) => {
    if (window.confirm(`Deseja carregar a liturgia de "${archive.dateFormatted}" no console ativo? As alterações atuais serão substituídas.`)) {
      const restored = restoreArchivedWorshipToProgram(archive, false);
      onRestoreProgram(restored);
      onClose();
      if (onNotify) onNotify(`✓ Culto de ${archive.dateFormatted} restaurado no console ativo!`);
    }
  };

  const handleUseAsTemplate = (archive: ArchivedWorshipProgram) => {
    if (window.confirm(`Deseja usar este culto arquivado como modelo para o PRÓXIMO SÁBADO? Todos os horários e ordem serão preservados com atividades desmarcadas.`)) {
      const template = restoreArchivedWorshipToProgram(archive, true);
      onDuplicateAsTemplate(template);
      onClose();
      if (onNotify) onNotify(`✓ Modelo do próximo sábado configurado a partir de ${archive.dateFormatted}!`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl shadow-black/80 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Histórico de Cultos Arquivados
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {church.name}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Acesse programações passadas, consulte louvores realizados e reutilize como modelo.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Stats Bar */}
        <div className="px-6 py-3.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por data, pregador, tema ou responsável..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Total arquivados:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {archives.length} cultos
            </span>
          </div>
        </div>

        {/* Content Body: Split List & Detail View */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800 overflow-hidden">
          {/* Left Column: Archives List */}
          <div className={`${selectedArchive ? 'hidden md:block md:col-span-5' : 'col-span-12'} overflow-y-auto p-4 space-y-2.5 custom-scrollbar`}>
            {filteredArchives.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">
                  {archives.length === 0 
                    ? 'Nenhum culto arquivado ainda nesta igreja.' 
                    : 'Nenhum culto encontrado com este termo de busca.'}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {archives.length === 0
                    ? 'Ao final do culto de sábado, clique no botão "Finalizar Culto & Arquivar" para salvar a programação no histórico da igreja.'
                    : 'Tente buscar por outro termo ou limpe a busca.'}
                </p>
              </div>
            ) : (
              filteredArchives.map(archive => {
                const isSelected = selectedArchiveId === archive.id;
                const completionPercent = Math.round(
                  (archive.completedCount / Math.max(archive.totalCount, 1)) * 100
                );

                return (
                  <div
                    key={archive.id}
                    onClick={() => setSelectedArchiveId(archive.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-2.5 ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500/60 shadow-md shadow-blue-900/20'
                        : 'bg-slate-850/70 hover:bg-slate-800 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-800 text-blue-300 border border-slate-700">
                            {archive.dateFormatted || archive.date}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
                            {completionPercent}% concluído
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white pt-1">
                          {archive.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={e => handleCopySummary(archive, e)}
                          title="Copiar Resumo para WhatsApp"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60"
                        >
                          {copiedId === archive.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={e => handleDelete(archive.id, archive.title, e)}
                          title="Excluir do histórico"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata summary */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                      {archive.preacher && (
                        <span className="flex items-center gap-1 text-slate-300">
                          <Mic2 className="w-3 h-3 text-indigo-400" />
                          {archive.preacher}
                        </span>
                      )}
                      {archive.responsiblePerson && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-blue-400" />
                          {archive.responsiblePerson}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-slate-400">
                        <Music className="w-3 h-3 text-amber-400" />
                        {archive.songsCount} louvores
                      </span>
                    </div>

                    {archive.theme && (
                      <p className="text-xs text-amber-300/90 italic line-clamp-1">
                        Tema: {archive.theme}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Selected Archive Details */}
          {selectedArchive ? (
            <div className="col-span-12 md:col-span-7 flex flex-col h-full bg-slate-900/40 overflow-hidden">
              {/* Detail Top Header */}
              <div className="p-5 border-b border-slate-800 bg-slate-900/70 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {selectedArchive.dateFormatted}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-xs text-slate-400">
                        {selectedArchive.activities.length} atividades cadastradas
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-white mt-1">
                      {selectedArchive.title}
                    </h3>
                  </div>

                  {/* Back button on mobile */}
                  <button
                    onClick={() => setSelectedArchiveId(null)}
                    className="md:hidden px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
                  >
                    Voltar à lista
                  </button>
                </div>

                {/* Tags row */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 font-semibold border border-slate-700">
                    Responsável: <strong className="text-white">{selectedArchive.responsiblePerson}</strong>
                  </span>
                  {selectedArchive.preacher && (
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-950/70 text-indigo-300 font-semibold border border-indigo-700/50">
                      Pregador: <strong className="text-white">{selectedArchive.preacher}</strong>
                    </span>
                  )}
                  {selectedArchive.theme && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-950/70 text-amber-300 font-semibold border border-amber-700/50">
                      Tema: <strong className="text-white">{selectedArchive.theme}</strong>
                    </span>
                  )}
                </div>

                {selectedArchive.closingNotes && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                    <span className="font-bold text-slate-400 block mb-0.5">Observações Finais do Culto:</span>
                    {selectedArchive.closingNotes}
                  </div>
                )}

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => handleRestore(selectedArchive)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-900/30 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restaurar no Console Ativo
                  </button>

                  <button
                    onClick={() => handleUseAsTemplate(selectedArchive)}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-900/30 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Usar como Modelo para o Próximo Sábado
                  </button>

                  <button
                    onClick={() => handleCopySummary(selectedArchive)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedId === selectedArchive.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copiar WhatsApp
                  </button>
                </div>
              </div>

              {/* Detail Activities List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Liturgia Realizada ({selectedArchive.activities.length} itens)
                </h4>

                <div className="space-y-2">
                  {selectedArchive.activities.map((act, idx) => {
                    const medias = [act.congregational1, act.congregational2, act.congregational3].filter(Boolean);

                    return (
                      <div
                        key={act.id || idx}
                        className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                          act.completed
                            ? 'bg-slate-850/50 border-slate-800/80'
                            : 'bg-slate-850 border-slate-750'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {act.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                            )}
                            <span className="font-bold text-white text-sm">
                              {act.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0 font-medium">
                            {act.section === 'escola_sabatina' && (
                              <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-800/30">
                                Escola Sabatina
                              </span>
                            )}
                            {act.section === 'culto_divino' && (
                              <span className="px-2 py-0.5 rounded bg-indigo-900/40 text-indigo-300 border border-indigo-800/30">
                                Culto Divino
                              </span>
                            )}
                            {act.timeSlot && (
                              <span className="font-mono text-amber-400">{act.timeSlot}</span>
                            )}
                          </div>
                        </div>

                        {act.responsible && (
                          <p className="text-slate-400 pl-6">
                            Responsável: <span className="text-slate-200 font-semibold">{act.responsible}</span>
                          </p>
                        )}

                        {medias.length > 0 && (
                          <div className="pl-6 pt-1 space-y-1">
                            {medias.map((m, mIdx) => (
                              <div
                                key={mIdx}
                                className="flex items-center gap-2 text-xs bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300"
                              >
                                <Music className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="font-semibold text-white">{m?.title}</span>
                                {m?.note && (
                                  <span className="text-slate-400 text-[11px]">({m.note})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {act.notes && (
                          <p className="text-[11px] text-slate-500 pl-6 italic">
                            Obs: {act.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex md:col-span-7 flex-col items-center justify-center p-8 text-center text-slate-500 space-y-2">
              <BookOpen className="w-10 h-10 text-slate-600" />
              <p className="text-sm font-semibold text-slate-400">
                Selecione um culto ao lado para ver a liturgia completa
              </p>
              <p className="text-xs text-slate-500 max-w-xs">
                Você poderá restaurar o culto no console ativo, gerar relatório do culto realizado ou usar como modelo para o próximo sábado.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span>
            Igreja ativa: <strong className="text-slate-200">{church.name}</strong> • Histórico 100% isolado
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
