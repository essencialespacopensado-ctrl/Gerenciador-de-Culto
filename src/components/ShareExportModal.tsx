import React, { useState } from 'react';
import { X, Copy, Check, Share2, Printer, Download, Upload, FileText } from 'lucide-react';
import { WorshipProgram } from '../types';
import { formatWhatsAppBulletin } from '../utils/mediaUtils';

interface ShareExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: WorshipProgram;
  onImportProgram: (imported: WorshipProgram) => void;
}

export const ShareExportModal: React.FC<ShareExportModalProps> = ({
  isOpen,
  onClose,
  program,
  onImportProgram,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'print' | 'backup'>('whatsapp');

  if (!isOpen) return null;

  const whatsappText = formatWhatsAppBulletin(program);

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(whatsappText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(program, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `liturgia-iasd-${program.date || 'culto'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.activities)) {
          onImportProgram(parsed);
          alert('Programação importada com sucesso!');
          onClose();
        } else {
          alert('Arquivo JSON inválido para a programação de culto.');
        }
      } catch (err) {
        alert('Erro ao ler arquivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto print:bg-white print:p-0 print:static">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col print:shadow-none print:border-none print:max-w-none">
        {/* Header (hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Compartilhar & Exportar Liturgia
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Envie para o grupo do WhatsApp da sonoplastia ou imprima para a plataforma
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

        {/* Tab Switcher (hidden on print) */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-6 pt-2 gap-2 text-xs font-bold print:hidden">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-2.5 rounded-t-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'whatsapp'
                ? 'bg-white text-emerald-700 border-t-2 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-4 h-4" />
            WhatsApp
          </button>
          <button
            onClick={() => setActiveTab('print')}
            className={`px-4 py-2.5 rounded-t-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'print'
                ? 'bg-white text-emerald-700 border-t-2 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-4 h-4" />
            Boletim para Impressão
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2.5 rounded-t-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'bg-white text-emerald-700 border-t-2 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Backup / Arquivo
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Tab 1: WhatsApp */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Texto Formatado para o Grupo da Igreja
                </span>
                <button
                  id="copy-whatsapp-btn"
                  onClick={handleCopyWhatsApp}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado com Sucesso!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar para o WhatsApp
                    </>
                  )}
                </button>
              </div>

              <textarea
                readOnly
                rows={12}
                value={whatsappText}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 leading-relaxed outline-hidden resize-none"
              />
            </div>
          )}

          {/* Tab 2: Print */}
          {activeTab === 'print' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between print:hidden">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Visualização de Impressão do Boletim
                </span>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir / Salvar PDF
                </button>
              </div>

              {/* Printable Document */}
              <div className="p-6 border border-slate-200 rounded-2xl bg-white text-slate-900 space-y-4 text-xs">
                <div className="text-center border-b pb-3 space-y-1">
                  <h2 className="text-base font-bold uppercase tracking-wider">
                    Igreja Adventista do Sétimo Dia
                  </h2>
                  <h3 className="text-sm font-semibold text-slate-700">
                    {program.title} - {program.date}
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    Responsável: {program.responsiblePerson} | Pregador: {program.preacher || 'Pastor'}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase text-slate-800 border-b pb-1">
                    Ordem das Atividades
                  </h4>
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b text-slate-500">
                        <th className="py-1">Horário</th>
                        <th className="py-1">Atividade</th>
                        <th className="py-1">Responsável</th>
                        <th className="py-1">Música / Playback / Vídeo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {program.activities.map((act, i) => (
                        <tr key={act.id} className="py-1">
                          <td className="py-1 text-slate-500 font-mono">{act.timeSlot || '—'}</td>
                          <td className="py-1 font-semibold">{act.name}</td>
                          <td className="py-1 text-slate-600">{act.responsible || '—'}</td>
                          <td className="py-1 text-slate-700">
                            {[act.congregational1?.title, act.congregational2?.title, act.congregational3?.title]
                              .filter(Boolean)
                              .join(' | ') || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {program.notes && (
                  <div className="pt-2 border-t text-[10px] text-slate-500">
                    <strong>Observações:</strong> {program.notes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Backup & Restore */}
          {activeTab === 'backup' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800">Exportar Arquivo do Culto (JSON)</h4>
                <p className="text-slate-500">
                  Baixe a programação completa como backup para abrir em outros computadores da igreja ou guardar no histórico.
                </p>
                <button
                  onClick={handleExportJSON}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Baixar Arquivo JSON
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800">Importar Programação Salva</h4>
                <p className="text-slate-500">
                  Carregue um arquivo previamente exportado para restaurar a ordem de culto.
                </p>
                <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Selecionar Arquivo JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer (hidden on print) */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
