import React, { useState, useMemo } from 'react';
import { 
  X, Check, Clipboard, Sparkles, FileText, ArrowRight, 
  Calendar, User, Clock, Music, AlertCircle, CheckCircle2,
  Trash2, RefreshCw, Layers
} from 'lucide-react';
import { WorshipProgram, ActivityItem, ActivitySection, ActivityCategory, MediaLink } from '../types';
import { ADVENTIST_HYMNS } from '../data/churchData';
import { getTodayDate } from '../utils/worshipArchiveManager';

interface PasteLiturgyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProgram: WorshipProgram;
  onSaveProgram: (newProgram: WorshipProgram) => void;
  onNotify?: (msg: string) => void;
}

interface ParsedResult {
  title?: string;
  date?: string;
  preacher?: string;
  theme?: string;
  responsiblePerson?: string;
  activities: ActivityItem[];
}

const SAMPLE_LITURGY_TEXT = `Culto de Sábado - 20/09/2026
Dirigente: Davi
Pregador: Pr. Roberto Ferreira
Tema: A Grande Esperança

ESCOLA SABATINA
09:00 - Boas-Vindas e Abertura - Direção ES
09:05 - Louvor Congregacional: Hino 250 - O Amor de Jesus
09:12 - Oração Inicial - Maria Clara
09:15 - Informativo Mundial das Missões (Vídeo Oficial)
09:25 - Estudo da Lição da Escola Sabatina - Classes
10:10 - Louvor Final da Escola Sabatina: Hino 314

CULTO DIVINO
10:25 - Prelúdio Instrumental & Entrada da Plataforma
10:28 - Doxologia: Hino 50
10:32 - Oração Pastoral de Joelhos - Pr. Roberto
10:37 - Adoração Infantil - Ministério da Criança
10:45 - Dízimos e Ofertas: Provai e Vede (Vídeo)
10:55 - Mensagem Musical Especial: Descansar - Arautos do Rei
11:05 - Sermão: A Grande Esperança - Pr. Roberto Ferreira
11:45 - Hino Final de Consagração: Hino 450
11:50 - Oração Final e Bênção Pastoral`;

export const PasteLiturgyModal: React.FC<PasteLiturgyModalProps> = ({
  isOpen,
  onClose,
  currentProgram,
  onSaveProgram,
  onNotify,
}) => {
  const [rawText, setRawText] = useState('');
  const [replaceMode, setReplaceMode] = useState<'replace' | 'append'>('replace');

  if (!isOpen) return null;

  // Intelligent parser function
  const parseLiturgy = (text: string): ParsedResult => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    let parsedTitle = '';
    let parsedDate = '';
    let parsedPreacher = '';
    let parsedTheme = '';
    let parsedResponsible = '';
    let currentSection: ActivitySection = 'escola_sabatina';

    const parsedActivities: ActivityItem[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lower = line.toLowerCase();

      // Check for section headers
      if (lower.includes('escola sabatina') || lower.startsWith('es:')) {
        currentSection = 'escola_sabatina';
        continue;
      }
      if (lower.includes('culto divino') || lower.startsWith('cd:')) {
        currentSection = 'culto_divino';
        continue;
      }
      if (lower.includes('culto jovem') || lower.includes(' j.a.') || lower.includes(' ja ') || lower.startsWith('ja:')) {
        currentSection = 'culto_jovem';
        continue;
      }

      // Check header metadata
      if (lower.startsWith('pregador:') || lower.startsWith('orador:')) {
        parsedPreacher = line.split(':')[1]?.trim() || '';
        continue;
      }
      if (lower.startsWith('tema:') || lower.startsWith('sermão:') || lower.startsWith('sermao:')) {
        parsedTheme = line.split(':')[1]?.trim() || '';
        continue;
      }
      if (lower.startsWith('dirigente:') || lower.startsWith('responsável:') || lower.startsWith('responsavel:')) {
        parsedResponsible = line.split(':')[1]?.trim() || '';
        continue;
      }
      if (lower.startsWith('data:') || lower.includes('culto de ')) {
        const dateMatch = line.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
        if (dateMatch) {
          const day = dateMatch[1].padStart(2, '0');
          const month = dateMatch[2].padStart(2, '0');
          let year = dateMatch[3];
          if (year.length === 2) year = `20${year}`;
          parsedDate = `${year}-${month}-${day}`;
        }
        if (lower.includes('culto de')) {
          parsedTitle = line;
        }
        if (line.toLowerCase().startsWith('data:')) continue;
      }

      // Attempt to parse line as an activity item
      // Patterns like: "09:00 - Boas-Vindas e Abertura - Davi" or "10:30 Adoração Infantil"
      const timeMatch = line.match(/^(\d{1,2})[:hH](\d{2})/);
      let timeSlot = '';
      let contentWithoutTime = line;

      if (timeMatch) {
        timeSlot = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
        contentWithoutTime = line.replace(/^(\d{1,2})[:hH](\d{2})\s*[-–:]?\s*/, '').trim();
      }

      // If line is too short and not a metadata, continue
      if (contentWithoutTime.length < 3) continue;

      // Split name and responsible if separated by " - "
      const parts = contentWithoutTime.split(/\s+[-–]\s+/);
      let activityName = parts[0]?.trim() || contentWithoutTime;
      let activityResponsible = parts.length > 1 ? parts[parts.length - 1].trim() : '';

      // Check if responsible is actually a song name or vice versa
      let detectedSong: MediaLink | undefined;

      // Check for hymn numbers: "Hino 250", "Hino #250", "HA 250"
      const hymnMatch = contentWithoutTime.match(/(?:hino|hin[aá]rio|ha|h\.)\s*#?\s*(\d{1,3})/i);
      if (hymnMatch) {
        const hymnNum = parseInt(hymnMatch[1], 10);
        const officialHymn = ADVENTIST_HYMNS.find(h => h.number === hymnNum);
        if (officialHymn) {
          detectedSong = {
            title: `Hino #${officialHymn.number} - ${officialHymn.title}`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(officialHymn.youtubeSearchQuery)}`,
            note: `Hinário Adventista • Tom: ${officialHymn.key || 'Padrão'}`,
            sourceType: 'youtube',
            isValidTransmission: true,
          };
        } else {
          detectedSong = {
            title: `Hino #${hymnNum}`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`hinario adventista ${hymnNum} playback`)}`,
            sourceType: 'youtube',
            isValidTransmission: true,
          };
        }
      }

      // Check for explicit music marker: "Louvor: ...", "Playback: ...", "Música: ..."
      const musicMarkerMatch = contentWithoutTime.match(/(?:m[uú]sica|playback|solista|canto):\s*([^\n-]+)/i);
      if (musicMarkerMatch && !detectedSong) {
        const songName = musicMarkerMatch[1].trim();
        detectedSong = {
          title: songName,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(songName + ' playback')}`,
          sourceType: 'youtube',
          isValidTransmission: true,
        };
      }

      // Determine category
      const nameLower = activityName.toLowerCase();
      let category: ActivityCategory = 'geral';
      let isRecurring = true;

      if (nameLower.includes('oração') || nameLower.includes('oracao') || nameLower.includes('pastoral') || nameLower.includes('joelhos') || nameLower.includes('intercess')) {
        category = 'oracao';
        isRecurring = true;
        if (!detectedSong) {
          detectedSong = {
            title: 'Fundo Musical Suave para Oração',
            url: 'https://www.youtube.com/watch?v=1-Q9y7R_rFs',
            note: 'Piano reverente durante oração',
          };
        }
      } else if (nameLower.includes('louvor') || nameLower.includes('hino') || nameLower.includes('doxologia') || nameLower.includes('cântico')) {
        category = 'louvor';
        isRecurring = nameLower.includes('doxologia');
      } else if (nameLower.includes('mensagem musical') || nameLower.includes('especial') || nameLower.includes('solo')) {
        category = 'mensagem_musical';
        isRecurring = false;
      } else if (nameLower.includes('informativo') || nameLower.includes('provai') || nameLower.includes('vídeo') || nameLower.includes('video')) {
        category = 'video';
        isRecurring = true;
        if (nameLower.includes('informativo')) {
          detectedSong = {
            title: 'Informativo Mundial das Missões (Vídeo Oficial)',
            url: 'offline:informativo',
            isWeeklyMedia: true,
          };
        } else if (nameLower.includes('provai')) {
          detectedSong = {
            title: 'Provai e Vede (Vídeo Oficial da Semana)',
            url: 'offline:provai',
            isWeeklyMedia: true,
          };
        }
      } else if (nameLower.includes('infantil') || nameLower.includes('criança') || nameLower.includes('crianca')) {
        category = 'infantil';
        isRecurring = true;
        if (!detectedSong) {
          detectedSong = {
            title: 'Música Adoração Infantil',
            url: 'https://www.youtube.com/watch?v=WqB9cZqF8b0',
          };
        }
      } else if (nameLower.includes('oferta') || nameLower.includes('dízimo') || nameLower.includes('dizimo') || nameLower.includes('recolhimento')) {
        category = 'ofertas';
        isRecurring = true;
      } else if (nameLower.includes('sermão') || nameLower.includes('sermao') || nameLower.includes('pregação') || nameLower.includes('mensagem')) {
        category = 'sermao';
        isRecurring = true;
      } else if (nameLower.includes('abertura') || nameLower.includes('prelúdio') || nameLower.includes('boas-vindas') || nameLower.includes('entrada')) {
        category = 'abertura';
        isRecurring = true;
      } else if (nameLower.includes('aviso') || nameLower.includes('anúncio') || nameLower.includes('anuncio')) {
        category = 'anuncios';
        isRecurring = false;
      }

      // Default durations
      let durationMinutes = 5;
      if (category === 'sermao') durationMinutes = 40;
      else if (category === 'geral' && (nameLower.includes('lição') || nameLower.includes('licao'))) durationMinutes = 45;
      else if (category === 'oracao') durationMinutes = 4;
      else if (category === 'infantil') durationMinutes = 7;
      else if (category === 'ofertas') durationMinutes = 6;
      else if (category === 'video') durationMinutes = 6;

      // If time slot suggests later than 10:15 and section is still escola_sabatina, switch to culto divino
      if (timeSlot) {
        const [hour, min] = timeSlot.split(':').map(Number);
        if (hour > 10 || (hour === 10 && min >= 20)) {
          if (currentSection === 'escola_sabatina') {
            currentSection = 'culto_divino';
          }
        }
      }

      parsedActivities.push({
        id: `act-pasted-${Date.now()}-${parsedActivities.length}`,
        name: activityName,
        section: currentSection,
        category,
        responsible: activityResponsible || (category === 'sermao' ? parsedPreacher : ''),
        timeSlot: timeSlot || undefined,
        durationMinutes,
        isRecurring,
        congregational1: detectedSong,
        completed: false,
      });
    }

    return {
      title: parsedTitle || undefined,
      date: parsedDate || undefined,
      preacher: parsedPreacher || undefined,
      theme: parsedTheme || undefined,
      responsiblePerson: parsedResponsible || undefined,
      activities: parsedActivities,
    };
  };

  const parsedResult = useMemo(() => {
    if (!rawText.trim()) return null;
    return parseLiturgy(rawText);
  }, [rawText]);

  const handleApplyPaste = () => {
    if (!parsedResult || parsedResult.activities.length === 0) {
      alert('Nenhuma etapa válida foi detectada no texto colado. Verifique a formatação.');
      return;
    }

    const mergedActivities = replaceMode === 'replace'
      ? parsedResult.activities
      : [...currentProgram.activities, ...parsedResult.activities];

    const updatedProgram: WorshipProgram = {
      ...currentProgram,
      id: `prog-${Date.now()}`,
      title: parsedResult.title || currentProgram.title,
      date: parsedResult.date || currentProgram.date || getTodayDate(),
      preacher: parsedResult.preacher || currentProgram.preacher,
      theme: parsedResult.theme || currentProgram.theme,
      responsiblePerson: parsedResult.responsiblePerson || currentProgram.responsiblePerson,
      activities: mergedActivities,
      updatedAt: new Date().toISOString(),
    };

    onSaveProgram(updatedProgram);
    if (onNotify) {
      onNotify(`✓ Liturgia distribuída com sucesso! ${parsedResult.activities.length} etapas organizadas.`);
    }
    onClose(); // Crucial requirement: close immediately on save!
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl shadow-black/80 overflow-hidden text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-md">
              <Clipboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Colar Liturgia Pronta & Distribuição Automática</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  Inteligente
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Cole o texto vindo do WhatsApp, e-mail ou boletim. O sistema separa horários, responsáveis e músicas nos lugares certos!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: 2-column layout (Text Input on Left, Live Preview on Right) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* Left Column: Input text area */}
          <div className="p-4 flex flex-col h-full overflow-hidden space-y-3">
            <div className="flex items-center justify-between gap-2 shrink-0">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Cole o texto da liturgia aqui:
              </label>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setRawText(SAMPLE_LITURGY_TEXT)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer border border-slate-700"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Exemplo IASD</span>
                </button>

                {rawText && (
                  <button
                    type="button"
                    onClick={() => setRawText('')}
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800"
                    title="Limpar texto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Cole aqui o texto da liturgia do culto...&#10;&#10;Exemplo:&#10;09:00 - Boas-Vindas&#10;09:05 - Louvor Congregacional: Hino 250&#10;09:12 - Oração Inicial&#10;10:30 - Adoração Infantil&#10;11:00 - Mensagem Musical: Descansar - Arautos do Rei&#10;11:15 - Sermão: Pr. Roberto"
              className="flex-1 w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none resize-none font-mono leading-relaxed custom-scrollbar"
            />

            {/* Replace / Append mode */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs shrink-0">
              <span className="font-bold text-slate-400">Modo de Inserção:</span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="replaceMode"
                    checked={replaceMode === 'replace'}
                    onChange={() => setReplaceMode('replace')}
                    className="text-indigo-500"
                  />
                  <span>Substituir liturgia atual</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="replaceMode"
                    checked={replaceMode === 'append'}
                    onChange={() => setReplaceMode('append')}
                    className="text-indigo-500"
                  />
                  <span>Adicionar ao final</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Live Parsed Preview */}
          <div className="p-4 flex flex-col h-full overflow-hidden space-y-3 bg-slate-950/40">
            <div className="flex items-center justify-between gap-2 shrink-0">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Distribuição Detectada:
              </label>

              {parsedResult && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-900/40 text-emerald-300 border border-emerald-700/50">
                  {parsedResult.activities.length} etapas encontradas
                </span>
              )}
            </div>

            {/* Extracted metadata badges */}
            {parsedResult && (parsedResult.preacher || parsedResult.theme || parsedResult.date || parsedResult.responsiblePerson) && (
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-1.5 shrink-0">
                <p className="font-bold text-slate-300 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Metadados Identificados:
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {parsedResult.date && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-900/40 text-blue-300 border border-blue-700/40 font-semibold">
                      Data: {parsedResult.date}
                    </span>
                  )}
                  {parsedResult.preacher && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-900/40 text-emerald-300 border border-emerald-700/40 font-semibold">
                      Pregador: {parsedResult.preacher}
                    </span>
                  )}
                  {parsedResult.theme && (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-900/40 text-indigo-300 border border-indigo-700/40 font-semibold">
                      Tema: {parsedResult.theme}
                    </span>
                  )}
                  {parsedResult.responsiblePerson && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold">
                      Dirigente: {parsedResult.responsiblePerson}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Extracted activities list */}
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {!parsedResult || parsedResult.activities.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                  <Clipboard className="w-8 h-8 opacity-40" />
                  <p className="text-xs">Cole um texto ao lado ou clique em "Exemplo IASD" para visualizar a distribuição automática.</p>
                </div>
              ) : (
                parsedResult.activities.map((act, idx) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-1 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {act.timeSlot && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px]">
                            {act.timeSlot}
                          </span>
                        )}
                        <span className="font-bold text-white truncate">{act.name}</span>
                      </div>

                      <span className={`px-2 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                        act.section === 'escola_sabatina' 
                          ? 'bg-blue-900/50 text-blue-300 border border-blue-700/40' 
                          : 'bg-indigo-900/50 text-indigo-300 border border-indigo-700/40'
                      }`}>
                        {act.section === 'escola_sabatina' ? 'Escola Sabatina' : 'Culto Divino'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span>Categoria: <strong className="text-slate-300 capitalize">{act.category}</strong></span>
                      {act.responsible && <span>Resp: <strong className="text-slate-300">{act.responsible}</strong></span>}
                    </div>

                    {act.congregational1?.title && (
                      <div className="mt-1 p-1.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5 text-blue-300 text-[11px] font-medium">
                        <Music className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">{act.congregational1.title}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-400">
            {parsedResult ? `${parsedResult.activities.length} etapas prontas para distribuição.` : 'Aguardando texto da liturgia...'}
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              id="distribute-and-save-liturgy-btn"
              onClick={handleApplyPaste}
              disabled={!parsedResult || parsedResult.activities.length === 0}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
            >
              <Check className="w-4 h-4" />
              <span>Distribuir e Salvar Liturgia</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
