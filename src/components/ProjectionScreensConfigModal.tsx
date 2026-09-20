import React, { useState, useEffect } from 'react';
import { 
  Tv, Monitor, Check, X, Plus, Trash2, Edit3, Play, 
  ExternalLink, Maximize2, Shield, Settings2, Clock, 
  Info, AlertCircle, Sparkles, Volume2, CheckCircle2, RotateCcw
} from 'lucide-react';
import { 
  ProjectionScreenConfig, 
  GeneralProjectionSettings, 
  loadGeneralSettings, 
  saveGeneralSettings, 
  DEFAULT_PROJECTION_SCREENS,
  ScreenType 
} from '../utils/screenConfig';
import { projectionManager } from '../utils/projectionManager';

interface ProjectionScreensConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectionScreensConfigModal: React.FC<ProjectionScreensConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [settings, setSettings] = useState<GeneralProjectionSettings>(loadGeneralSettings);
  const [editingScreen, setEditingScreen] = useState<ProjectionScreenConfig | null>(null);
  const [isAddingScreen, setIsAddingScreen] = useState(false);

  // New/Edit Screen form fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<ScreenType>('projector');
  const [formStandby, setFormStandby] = useState<'logo' | 'clock_logo' | 'black'>('logo');
  const [formAutoFullscreen, setFormAutoFullscreen] = useState(true);
  const [formAutoClose, setFormAutoClose] = useState(true);

  // Feedback notification
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSettings(loadGeneralSettings());
      setEditingScreen(null);
      setIsAddingScreen(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleToggleScreen = (screenId: string) => {
    const updatedScreens = settings.screens.map(s => {
      if (s.id === screenId) {
        return { ...s, enabled: !s.enabled };
      }
      return s;
    });
    const updatedSettings = { ...settings, screens: updatedScreens };
    setSettings(updatedSettings);
    saveGeneralSettings(updatedSettings);
    projectionManager.broadcastSettingsUpdate(updatedSettings);
    showNotification(`✓ Status da tela atualizado e sincronizado imediatamente.`);
  };

  const handleSaveGlobalSetting = (key: keyof GeneralProjectionSettings, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveGeneralSettings(updated);
    projectionManager.broadcastSettingsUpdate(updated);
    showNotification('✓ Preferência geral atualizada e aplicada.');
  };

  const handleStartAddScreen = () => {
    setEditingScreen(null);
    setFormName('');
    setFormDescription('');
    setFormType('projector');
    setFormStandby('logo');
    setFormAutoFullscreen(true);
    setFormAutoClose(true);
    setIsAddingScreen(true);
  };

  const handleStartEditScreen = (screen: ProjectionScreenConfig) => {
    setIsAddingScreen(false);
    setEditingScreen(screen);
    setFormName(screen.name);
    setFormDescription(screen.description || '');
    setFormType(screen.type);
    setFormStandby(screen.standbyMode);
    setFormAutoFullscreen(screen.autoFullscreen);
    setFormAutoClose(screen.autoCloseOnEnd);
  };

  const handleSaveScreenForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    let updatedScreens: ProjectionScreenConfig[];

    if (editingScreen) {
      updatedScreens = settings.screens.map(s => {
        if (s.id === editingScreen.id) {
          return {
            ...s,
            name: formName.trim(),
            description: formDescription.trim(),
            type: formType,
            standbyMode: formStandby,
            autoFullscreen: formAutoFullscreen,
            autoCloseOnEnd: formAutoClose,
          };
        }
        return s;
      });
      showNotification(`✓ Tela "${formName.trim()}" salva e atualizada em tempo real!`);
    } else {
      const newScreen: ProjectionScreenConfig = {
        id: `custom_${Date.now()}`,
        name: formName.trim(),
        description: formDescription.trim(),
        type: formType,
        enabled: true,
        autoFullscreen: formAutoFullscreen,
        autoCloseOnEnd: formAutoClose,
        standbyMode: formStandby,
        isCustom: true,
      };
      updatedScreens = [...settings.screens, newScreen];
      showNotification(`✓ Nova tela "${formName.trim()}" cadastrada e ativada!`);
    }

    const updatedSettings = { ...settings, screens: updatedScreens };
    setSettings(updatedSettings);
    saveGeneralSettings(updatedSettings);
    projectionManager.broadcastSettingsUpdate(updatedSettings);
    setEditingScreen(null);
    setIsAddingScreen(false);
  };

  const handleDeleteCustomScreen = (screenId: string) => {
    const updatedScreens = settings.screens.filter(s => s.id !== screenId);
    const updatedSettings = { ...settings, screens: updatedScreens };
    setSettings(updatedSettings);
    saveGeneralSettings(updatedSettings);
    projectionManager.broadcastSettingsUpdate(updatedSettings);
    showNotification('✓ Tela removida e atualizada.');
  };

  const handleResetDefaults = () => {
    if (window.confirm('Deseja restaurar as telas de projeção para a configuração padrão da igreja?')) {
      const reset = {
        ...settings,
        screens: DEFAULT_PROJECTION_SCREENS,
      };
      setSettings(reset);
      saveGeneralSettings(reset);
      projectionManager.broadcastSettingsUpdate(reset);
      showNotification('✓ Telas restauradas para o padrão oficial.');
    }
  };

  const handleTestSingleScreen = (screen: ProjectionScreenConfig) => {
    projectionManager.openSingleScreen(screen, screen.autoFullscreen);
    showNotification(`Janela de teste aberta para: ${screen.name}`);
  };

  const handleOpenAllActive = () => {
    projectionManager.openOnAllAuxiliaryScreens(settings.autoFullscreenAll);
    showNotification('Abrindo todas as telas de projeção configuradas...');
  };

  const handleCloseAllScreens = () => {
    projectionManager.closeAuxiliaryScreens();
    showNotification('Todas as telas de projeção foram fechadas.');
  };

  const enabledCount = settings.screens.filter(s => s.enabled).length;

  const getScreenIcon = (type: ScreenType) => {
    switch (type) {
      case 'stage_display':
        return <Clock className="w-5 h-5 text-purple-400" />;
      case 'foyer':
        return <Tv className="w-5 h-5 text-blue-400" />;
      case 'nursery':
        return <Sparkles className="w-5 h-5 text-pink-400" />;
      case 'side_screen':
        return <Monitor className="w-5 h-5 text-indigo-400" />;
      default:
        return <Tv className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl shadow-black/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/40">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Configuração Geral de Telas de Projeção</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                  {enabledCount} {enabledCount === 1 ? 'tela ativa' : 'telas ativas'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Defina em quais telas, projetores e televisores o culto deve ser transmitido simultaneamente além da tela principal do operador.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Notification Toast */}
          {feedback && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{feedback}</span>
              </div>
              <button onClick={() => setFeedback(null)} className="text-emerald-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Action Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-800/60 to-blue-950/40 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Como funciona a projeção multi-telas</span>
              </div>
              <p className="text-xs text-slate-400">
                Ao clicar em <strong>"Telão"</strong> em qualquer louvor, hino, playback ou liturgia, o vídeo será enviado automaticamente para todas as telas marcadas como <strong>Ativas</strong> abaixo.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenAllActive}
                className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-900/30 cursor-pointer transition-all"
                title="Abrir todas as telas ativas agora em novas janelas"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Abrir Telas Ativas</span>
              </button>

              <button
                type="button"
                onClick={handleCloseAllScreens}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Fechar todas as janelas auxiliares"
              >
                <X className="w-3.5 h-3.5" />
                <span>Fechar Telões</span>
              </button>
            </div>
          </div>

          {/* List of Screens */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Monitor className="w-4 h-4 text-purple-400" />
                <span>Telas e Destinos Cadastrados</span>
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                  title="Restaurar Telas Padrão da Igreja"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Padrão</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartAddScreen}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Adicionar Tela / TV</span>
                </button>
              </div>
            </div>

            {/* Screen Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {settings.screens.map((screen) => {
                const isConfiguringThis = (isAddingScreen || editingScreen) && editingScreen?.id === screen.id;

                return (
                  <div
                    key={screen.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      screen.enabled
                        ? 'bg-slate-800/80 border-purple-500/40 shadow-sm shadow-purple-950/20'
                        : 'bg-slate-800/30 border-slate-800 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          screen.enabled ? 'bg-purple-950/80 border border-purple-500/40 text-purple-300' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {getScreenIcon(screen.type)}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white">
                              {screen.name}
                            </h4>
                            {screen.isCustom && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-semibold">
                                Personalizada
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            {screen.description}
                          </p>

                          {/* Attributes badges */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                            <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/80 text-slate-300">
                              {screen.standbyMode === 'clock_logo' 
                                ? '🕒 Relógio + Púlpito' 
                                : screen.standbyMode === 'black' 
                                  ? '⬛ Standby Blackout' 
                                  : '⛪ Logo da Igreja'}
                            </span>
                            {screen.autoFullscreen && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-950/60 border border-blue-500/30 text-blue-300">
                                Tela Cheia Auto
                              </span>
                            )}
                            {screen.autoCloseOnEnd && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                                Fecha ao Fim
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Enable / Disable Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleScreen(screen.id)}
                        className={`w-12 h-6.5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                          screen.enabled ? 'bg-purple-600' : 'bg-slate-700'
                        }`}
                        title={screen.enabled ? 'Tela Ativa para Projeção' : 'Tela Inativa (Desativada)'}
                      >
                        <div className={`w-5.5 h-5.5 rounded-full bg-white transition-transform ${
                          screen.enabled ? 'translate-x-5.5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Bottom Screen Actions */}
                    <div className="mt-3.5 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => handleTestSingleScreen(screen)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                        title="Abrir uma janela de teste para verificar em qual monitor ela aparece"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                        <span>Testar Esta Tela</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartEditScreen(screen)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
                          title="Editar preferências desta tela"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {screen.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomScreen(screen.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="Excluir tela personalizada"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form to Add or Edit Screen */}
          {(isAddingScreen || editingScreen) && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/90 border border-amber-500/40 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>{editingScreen ? `Editar "${editingScreen.name}"` : 'Cadastrar Nova Tela ou TV'}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => { setIsAddingScreen(false); setEditingScreen(null); }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveScreenForm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Nome da Tela / TV *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ex: TV Galeria Superior, Telão Púlpito 2..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Tipo de Destino
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as ScreenType)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="projector">Projetor Principal da Nave</option>
                      <option value="stage_display">Monitor de Retorno do Púlpito / Palco</option>
                      <option value="foyer">TV de Entrada / Foyer / Galeria</option>
                      <option value="nursery">TV do Berçário / Sala dos Pais</option>
                      <option value="side_screen">Telão Lateral / Retorno do Coral</option>
                      <option value="custom">Outro Destino Personalizado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Descrição do Local
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Ex: Televisor posicionado na parede lateral esquerda da igreja"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Modo de Standby (Sem vídeo)
                    </label>
                    <select
                      value={formStandby}
                      onChange={(e) => setFormStandby(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="logo">⛪ Logo da Igreja Oficial</option>
                      <option value="clock_logo">🕒 Relógio Grande + Púlpito</option>
                      <option value="black">⬛ Tela Preta (Blackout)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="form-fullscreen"
                      checked={formAutoFullscreen}
                      onChange={(e) => setFormAutoFullscreen(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700"
                    />
                    <label htmlFor="form-fullscreen" className="text-xs text-slate-300 cursor-pointer">
                      Entrar em Tela Cheia auto
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="form-autoclose"
                      checked={formAutoClose}
                      onChange={(e) => setFormAutoClose(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700"
                    />
                    <label htmlFor="form-autoclose" className="text-xs text-slate-300 cursor-pointer">
                      Fechar ao término do vídeo
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700/80">
                  <button
                    type="button"
                    onClick={() => { setIsAddingScreen(false); setEditingScreen(null); }}
                    className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                  >
                    Salvar Tela
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* General Automation Preferences */}
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-amber-400" />
              <span>Automações Globais de Projeção</span>
            </h3>

            <div className="space-y-2.5">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.autoCloseAllOnEnd}
                  onChange={(e) => handleSaveGlobalSetting('autoCloseAllOnEnd', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200">
                    Fechar todas as telas de projeção automaticamente quando o vídeo terminar
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Ideal para que o telão não fique aberto com telas pretas após o término de um hino, playback ou informativo.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.autoFullscreenAll}
                  onChange={(e) => handleSaveGlobalSetting('autoFullscreenAll', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200">
                    Entrar automaticamente em tela cheia nas telas de projeção
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Oculta as barras do navegador no projetor e televisores automaticamente.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Configurações salvas automaticamente no sistema local da igreja.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-purple-900/30"
          >
            Concluir & Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
