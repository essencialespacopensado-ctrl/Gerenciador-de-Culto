import React, { useState } from 'react';
import { 
  X, Sparkles, Send, Loader2, BookOpen, Music, Check, 
  HelpCircle, Lightbulb, RefreshCw, Calendar, ArrowRight 
} from 'lucide-react';
import { WorshipProgram, ActivityItem } from '../types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyLiturgy: (suggestedActivities: ActivityItem[], theme: string) => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyLiturgy,
}) => {
  const [activeTab, setActiveTab] = useState<'generator' | 'chat'>('generator');

  // Generator State
  const [theme, setTheme] = useState('Fidelidade e Salvação');
  const [specialEvent, setSpecialEvent] = useState('Culto de Sábado Regular');
  const [preacher, setPreacher] = useState('Pastor Convidado');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any | null>(null);
  const [generatorError, setGeneratorError] = useState<string | null>(null);

  // Chat State
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Olá! Sou o Assistente de Liturgia e Sonoplastia da Igreja Adventista. Como posso ajudar na organização do seu culto hoje? Posso sugerir hinos, ordens de culto completas ou termos de busca de playbacks!',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  if (!isOpen) return null;

  const handleGenerateLiturgy = async () => {
    setIsGenerating(true);
    setGeneratorError(null);
    try {
      const res = await fetch('/api/gemini/suggest-liturgy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, specialEvent, preacher }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao gerar liturgia com IA');
      }

      const data = await res.json();
      setGeneratedData(data);
    } catch (err: any) {
      setGeneratorError(err.message || 'Erro inesperado ao conectar com o Gemini.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyToProgram = () => {
    if (!generatedData || !Array.isArray(generatedData.activities)) return;

    const formattedActivities: ActivityItem[] = generatedData.activities.map((act: any, idx: number) => ({
      id: `ai-act-${Date.now()}-${idx}`,
      name: act.name || 'Atividade',
      section: act.section === 'culto_divino' ? 'culto_divino' : 'escola_sabatina',
      category: act.category || 'geral',
      responsible: act.responsible || undefined,
      durationMinutes: act.durationMinutes || 5,
      notes: act.notes || undefined,
      congregational1: act.congregational1Title ? {
        title: act.congregational1Title,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(act.congregational1Title + ' playback')}`,
      } : undefined,
    }));

    onApplyLiturgy(formattedActivities, theme);
    onClose();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/gemini/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: messages.map(m => ({ role: m.role, content: m.text })),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Falha temporária no assistente');
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply || 'Sem resposta.' }]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: err.message ? `Aviso: ${err.message}` : 'Desculpe, ocorreu uma oscilação temporária na conexão com os servidores. Por favor, tente enviar novamente em alguns segundos.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                Assistente IA de Culto & Liturgia
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Geração inteligente de ordens de culto e recomendações para sonoplastia
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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 px-6 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-4 py-2.5 rounded-t-xl transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'generator'
                ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Criador Automático de Liturgia
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2.5 rounded-t-xl transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'chat'
                ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            Conversar com o Assistente
          </button>
        </div>

        {/* Tab 1: Liturgy Generator */}
        {activeTab === 'generator' && (
          <div className="p-6 overflow-y-auto space-y-6 grow">
            <div className="bg-indigo-50/60 p-5 rounded-2xl border border-indigo-100 space-y-4">
              <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-indigo-600" />
                Defina o tema para a IA gerar a liturgia com hinos adequados:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Tema do Sermão</label>
                  <input
                    type="text"
                    value={theme}
                    onChange={e => setTheme(e.target.value)}
                    placeholder="Ex: Graça, Família, Sábado, Oração..."
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Ocasião Especial</label>
                  <select
                    value={specialEvent}
                    onChange={e => setSpecialEvent(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium text-slate-800"
                  >
                    <option value="Culto de Sábado Regular">Culto de Sábado Regular</option>
                    <option value="Santa Ceia">Santa Ceia</option>
                    <option value="Cerimônia Batismal">Cerimônia Batismal</option>
                    <option value="Semana de Oração">Semana de Oração</option>
                    <option value="Culto Jovem JA">Culto Jovem JA</option>
                    <option value="Dia das Mães / Pais">Dia das Mães / Pais</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Pregador</label>
                  <input
                    type="text"
                    value={preacher}
                    onChange={e => setPreacher(e.target.value)}
                    placeholder="Pastor Convidado"
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleGenerateLiturgy}
                  disabled={isGenerating || !theme.trim()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Consultando o Hinário e gerando liturgia...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Gerar Liturgia Completa com IA
                    </>
                  )}
                </button>
              </div>
            </div>

            {generatorError && (
              <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-xs font-medium">
                {generatorError}
              </div>
            )}

            {/* Generated Output Preview */}
            {generatedData && (
              <div className="space-y-4 border border-slate-200 rounded-3xl p-6 bg-white shadow-xs animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      Liturgia Sugerida
                    </span>
                    <h3 className="text-xl font-bold text-slate-900">
                      {generatedData.theme || theme}
                    </h3>
                    {generatedData.verseSuggestion && (
                      <p className="text-xs text-slate-600 italic mt-0.5">
                        Texto Bíblico: "{generatedData.verseSuggestion}"
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleApplyToProgram}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Aplicar ao Meu Culto Atual
                  </button>
                </div>

                {/* Hymns suggested */}
                {generatedData.suggestedHymns && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Hinos Recomendados para Este Tema:
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {generatedData.suggestedHymns.map((h: any, i: number) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                          <span className="font-bold text-blue-800">
                            #{h.number} - {h.title}
                          </span>
                          <p className="text-slate-600 text-[11px] mt-0.5">{h.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activities generated */}
                {generatedData.activities && (
                  <div className="space-y-2 pt-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Ordem de Atividades ({generatedData.activities.length}):
                    </h5>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {generatedData.activities.map((act: any, i: number) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{i + 1}. {act.name}</span>
                            {act.responsible && (
                              <span className="ml-2 text-slate-500">({act.responsible})</span>
                            )}
                          </div>
                          {act.congregational1Title && (
                            <span className="text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                              {act.congregational1Title}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {generatedData.soundTeamTips && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                    <span className="font-bold">Dicas para a Sonoplastia:</span> {generatedData.soundTeamTips}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Chat with Assistant */}
        {activeTab === 'chat' && (
          <div className="flex flex-col grow overflow-hidden">
            <div className="p-6 overflow-y-auto space-y-4 grow">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xl p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white font-medium rounded-br-xs'
                        : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-2xl bg-slate-100 text-slate-500 text-xs flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    O assistente está pensando...
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Pergunte ao assistente (ex: Sugira hinos sobre Sábado, como organizar o momento de louvor)..."
                className="grow px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs sm:text-sm outline-hidden font-medium text-slate-900"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Enviar
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
