import React, { useState } from 'react';
import { 
  X, CheckCircle2, Calendar, BookOpen, Clock, User, Mic2, 
  Sparkles, FileSpreadsheet, AlertCircle, Music, ArrowRight, ShieldCheck
} from 'lucide-react';
import { WorshipProgram } from '../types';
import { 
  archiveCurrentWorship, 
  getNextSaturdayDate, 
  formatWorshipDateLong,
  restoreArchivedWorshipToProgram
} from '../utils/worshipArchiveManager';
import { getActiveChurchProfile } from '../utils/churchWorkspace';
import { INITIAL_PROGRAM } from '../data/churchData';
import { applyManualHymnsToProgram } from '../utils/liturgySync';

interface FinishWorshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: WorshipProgram;
  onProgramArchivedAndReset: (newProgram: WorshipProgram) => void;
  onNotify?: (msg: string) => void;
  onOpenArchivesHistory?: () => void;
}

export const FinishWorshipModal: React.FC<FinishWorshipModalProps> = ({
  isOpen,
  onClose,
  program,
  onProgramArchivedAndReset,
  onNotify,
  onOpenArchivesHistory,
}) => {
  const [closingNotes, setClosingNotes] = useState('');
  const [nextStepChoice, setNextStepChoice] = useState<'prepare_next_saturday' | 'blank_next' | 'keep_current'>('prepare_next_saturday');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const church = getActiveChurchProfile();
  const nextSaturday = getNextSaturdayDate(program.date);
  const formattedNextSaturday = formatWorshipDateLong(nextSaturday);

  if (!isOpen) return null;

  const completedActivities = program.activities.filter(a => a.completed).length;
  const totalActivities = program.activities.length;
  const completionPercent = Math.round((completedActivities / Math.max(totalActivities, 1)) * 100);

  // Collect praises and musical messages
  const praisesCount = program.activities.reduce((acc, a) => {
    let c = 0;
    if (a.congregational1?.title) c++;
    if (a.congregational2?.title) c++;
    if (a.congregational3?.title) c++;
    return acc + c;
  }, 0);

  const handleConfirmArchive = () => {
    setIsSubmitting(true);
    try {
      // 1. Archive the current program
      const archived = archiveCurrentWorship(
        program, 
        closingNotes, 
        church.id, 
        church.name
      );

      // 2. Handle next program state according to user's choice
      let nextProgram: WorshipProgram;

      if (nextStepChoice === 'prepare_next_saturday') {
        // Keeps the fixed/recurring activities intact (prayer pads, weekly videos, lesson study, kids, platform),
        // clears only rotating items (praises, musical messages, announcements, preacher/theme), updates date to next Saturday
        nextProgram = restoreArchivedWorshipToProgram(archived, true, true);
      } else if (nextStepChoice === 'blank_next') {
        // Reset to initial clean template with next Saturday's date
        const rawProgram: WorshipProgram = {
          ...INITIAL_PROGRAM,
          id: `prog-${Date.now()}`,
          date: nextSaturday,
          title: `Culto de Sábado - ${formattedNextSaturday}`,
          responsiblePerson: program.responsiblePerson || 'Operador de Sonoplastia',
          preacher: '',
          theme: '',
          activities: INITIAL_PROGRAM.activities.map(a => ({ ...a, completed: false })),
          updatedAt: new Date().toISOString(),
        };
        nextProgram = applyManualHymnsToProgram(rawProgram, nextSaturday, true);
      } else {
        // Keep current program on screen
        nextProgram = { ...program };
      }

      onProgramArchivedAndReset(nextProgram);
      onClose();

      if (onNotify) {
        onNotify(`✓ Culto de ${archived.dateFormatted} arquivado com sucesso no histórico da ${church.name}!`);
      }
    } catch (err) {
      console.error('Erro ao arquivar culto:', err);
      if (onNotify) onNotify('Erro ao arquivar o culto. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl shadow-black/80 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Finalizar Culto e Arquivar Programação
              </h2>
              <p className="text-xs text-slate-400">
                Grave o relatório litúrgico da <strong>{church.name}</strong> no histórico e prepare a próxima semana.
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar text-white">
          {/* Service Summary Banner */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatWorshipDateLong(program.date)}
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-700/40 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {completedActivities} de {totalActivities} itens concluídos ({completionPercent}%)
              </span>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-white">
                {program.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                {program.preacher && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <Mic2 className="w-3.5 h-3.5 text-indigo-400" />
                    Pregador: <strong className="text-white">{program.preacher}</strong>
                  </span>
                )}
                {program.responsiblePerson && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    Operador: <strong className="text-white">{program.responsiblePerson}</strong>
                  </span>
                )}
                <span className="flex items-center gap-1 text-slate-300">
                  <Music className="w-3.5 h-3.5 text-amber-400" />
                  {praisesCount} louvores/mídias
                </span>
              </div>
            </div>

            {program.theme && (
              <p className="text-xs text-amber-300/90 bg-amber-950/40 border border-amber-800/40 px-3 py-1.5 rounded-xl font-medium">
                Tema do Sermão: {program.theme}
              </p>
            )}
          </div>

          {/* Optional Closing Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Observações Finais do Culto (Opcional)</span>
              <span className="text-[10px] text-slate-500 font-normal lowercase">Será salvo no arquivo histórico</span>
            </label>
            <textarea
              value={closingNotes}
              onChange={e => setClosingNotes(e.target.value)}
              placeholder="Ex: Santa Ceia celebrada com reverência. Presença estimada de 180 membros. Playback do louvor tocou com excelente clareza."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none resize-none"
            />
          </div>

          {/* Next Steps Choices */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              O que fazer com o console após arquivar?
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Option 1: Prepare Next Saturday */}
              <label 
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  nextStepChoice === 'prepare_next_saturday'
                    ? 'bg-emerald-950/40 border-emerald-500/70 shadow-sm ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="nextStep"
                  checked={nextStepChoice === 'prepare_next_saturday'}
                  onChange={() => setNextStepChoice('prepare_next_saturday')}
                  className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
                />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Preparar Próximo Sábado ({formattedNextSaturday}) — Apagar itens rotativos
                    <span className="px-2 py-0.2 rounded text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Recomendado
                    </span>
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    <strong className="text-emerald-400">🛡️ O que acontece todo sábado é PRESERVADO:</strong> Informativo Mundial, Provai e Vede, Orações com fundos musicais, Entrada da Plataforma, Adoração Infantil, Estudo da Lição e Sermão.
                  </p>
                  <p className="text-[10px] text-amber-300/90">
                    <strong>🔄 Apagado da liturgia:</strong> Todas as etapas e louvores rotativos são completamente apagados da programação para receber o novo culto da semana.
                  </p>
                </div>
              </label>

              {/* Option 2: Clean slate */}
              <label 
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  nextStepChoice === 'blank_next'
                    ? 'bg-blue-950/40 border-blue-500/70 shadow-sm ring-1 ring-blue-500/30'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="nextStep"
                  checked={nextStepChoice === 'blank_next'}
                  onChange={() => setNextStepChoice('blank_next')}
                  className="mt-0.5 text-blue-500 focus:ring-blue-500"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                    Iniciar liturgia padrão zerada para o Próximo Sábado
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Reseta todos os louvores e informações personalizadas para o modelo inicial da igreja.
                  </p>
                </div>
              </label>

              {/* Option 3: Keep current */}
              <label 
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  nextStepChoice === 'keep_current'
                    ? 'bg-purple-950/40 border-purple-500/70 shadow-sm ring-1 ring-purple-500/30'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="nextStep"
                  checked={nextStepChoice === 'keep_current'}
                  onChange={() => setNextStepChoice('keep_current')}
                  className="mt-0.5 text-purple-500 focus:ring-purple-500"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                    Manter visualização atual (Apenas salvar cópia no histórico)
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Apenas cria o registro permanente no histórico da igreja, sem alterar o que está na tela agora.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          {onOpenArchivesHistory && (
            <button
              onClick={() => {
                onClose();
                onOpenArchivesHistory();
              }}
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              Ver Histórico de Cultos Arquivados
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>

            <button
              onClick={handleConfirmArchive}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/40 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar e Arquivar Culto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
