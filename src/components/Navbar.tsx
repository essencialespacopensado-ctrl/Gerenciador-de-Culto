import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, BookOpen, Youtube, Sparkles, Play, 
  RotateCcw, Share2, Church, Video, Users, Music, Sliders, Clock, Tv,
  CheckCircle2, Calendar, ChevronDown, User as UserIcon, LogOut
} from 'lucide-react';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { AuxiliaryMixerButton } from './AuxiliaryMixerButton';
import { projectionManager } from '../utils/projectionManager';
import { ChurchWorkspaceSelector } from './ChurchWorkspaceSelector';
import { formatWorshipDateShort } from '../utils/worshipArchiveManager';
import { ChurchProfile } from '../utils/churchWorkspace';
import { AuthUser } from '../types';

export type ActiveTab = 'program' | 'hymnal' | 'songs_catalog' | 'playbacks' | 'team_scale' | 'church_admin' | 'escola_culto';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  responsibleName: string;
  worshipDate?: string;
  archivedCount?: number;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onOpenFinishWorshipModal?: () => void;
  onOpenArchivesModal?: () => void;
  onNotify?: (msg: string) => void;
  onChurchSwitched?: (newChurch: ChurchProfile) => void;
  onOpenSonoplastiaMode: () => void;
  onOpenAIAssistant: () => void;
  onOpenShareModal: () => void;
  onOpenWeeklyMediaModal: () => void;
  onOpenWeeklySearchModal?: () => void;
  onOpenMusicalBackgrounds?: () => void;
  onOpenMixer?: () => void;
  onOpenProjectionConfig?: () => void;
  onResetToDefault: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  responsibleName,
  worshipDate,
  archivedCount = 0,
  currentUser,
  onLogout,
  onOpenFinishWorshipModal,
  onOpenArchivesModal,
  onNotify,
  onChurchSwitched,
  onOpenSonoplastiaMode,
  onOpenAIAssistant,
  onOpenShareModal,
  onOpenWeeklyMediaModal,
  onOpenWeeklySearchModal,
  onOpenMusicalBackgrounds,
  onOpenMixer,
  onOpenProjectionConfig,
  onResetToDefault,
}) => {
  const { isPlayingPad, isPlayingVideo, activeVideoTitle } = useAudioEngine();
  const [currentTime, setCurrentTime] = useState('');
  const [isAuxConnected, setIsAuxConnected] = useState(projectionManager.getState().isAuxiliaryConnected);
  const [openDropdown, setOpenDropdown] = useState<'none' | 'sound_display' | 'management' | 'user'>('none');
  
  // Active state helpers for consolidated 3-tab navigation
  const isMediaActive = activeTab === 'songs_catalog' || activeTab === 'hymnal' || activeTab === 'playbacks' || activeTab === 'escola_culto';
  const isChurchTeamActive = activeTab === 'church_admin' || activeTab === 'team_scale';

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#header-group-sound-display') && 
          !target.closest('#header-group-management') && 
          !target.closest('#header-group-user')) {
        setOpenDropdown('none');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Subscribe to projection manager auxiliary connection state
  useEffect(() => {
    return projectionManager.subscribe((st) => {
      setIsAuxConnected(st.isAuxiliaryConnected);
    });
  }, []);

  // Live wall clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="glass-panel border-b border-slate-800 sticky top-0 z-40 shadow-xl text-white animate-fade-slide-up">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          {/* Logo & Church Identity */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="logo-breathe w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-blue-900/30 border border-blue-400/20 shrink-0">
              <Church className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-gradient-brand tracking-tight leading-none">
                  Sonoplastia IASD
                </h1>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Telão
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
                <span>{responsibleName ? `Operador: ${responsibleName}` : 'Console de Culto'}</span>
                {currentTime && (
                  <span className="text-amber-400 font-mono font-bold flex items-center gap-1">
                    • <Clock className="w-3 h-3 inline" /> {currentTime}
                  </span>
                )}
              </p>
            </div>

            {/* Church Workspace Selector (Isolated Multi-church) */}
            <div className="ml-1 sm:ml-2">
              <ChurchWorkspaceSelector onNotify={onNotify} onChurchSwitched={onChurchSwitched} />
            </div>

            {/* Worship Date Pill */}
            {worshipDate && (
              <div 
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-bold text-amber-300"
                title={`Data do Culto: ${worshipDate}`}
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>{formatWorshipDateShort(worshipDate)}</span>
              </div>
            )}
          </div>

          {/* Consolidated 3 Navigation Tabs: Liturgia | Músicas & Hinário | Igreja & Equipe */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {/* TAB 1: LITURGIA */}
            <button
              id="tab-program"
              onClick={() => setActiveTab('program')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'program'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
              <span>Liturgia do Culto</span>
            </button>

            {/* TAB 2: MÚSICAS & HINÁRIO */}
            <button
              id="tab-media-hub"
              onClick={() => setActiveTab(isMediaActive ? activeTab : 'songs_catalog')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isMediaActive
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
              title="Aba consolidada de Hinário, Louvores e Playbacks"
            >
              <Music className={`w-3.5 h-3.5 ${isMediaActive ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>Músicas & Hinário</span>
            </button>

            {/* TAB 3: IGREJA & EQUIPE */}
            <button
              id="tab-church-team-hub"
              onClick={() => setActiveTab(isChurchTeamActive ? activeTab : 'church_admin')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isChurchTeamActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
              title="Aba consolidada de Dados da Igreja, Conexões e Escala da Equipe"
            >
              <Church className="w-3.5 h-3.5 text-indigo-400" />
              <span>Igreja & Equipe</span>
            </button>
          </nav>

          {/* Right Action Buttons - Organized in Compact Groups/Sessions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* GRUPO 1: Som & Projeção */}
            <div id="header-group-sound-display" className="relative">
              <div className="inline-flex items-center rounded-xl bg-slate-800/90 border border-slate-700/80 p-0.5 shadow-xs">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(prev => prev === 'sound_display' ? 'none' : 'sound_display')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isPlayingPad || isPlayingVideo || isAuxConnected
                      ? 'bg-purple-950 text-purple-200 border border-purple-500/40 shadow-xs'
                      : 'text-slate-200 hover:bg-slate-700/60'
                  }`}
                  title="Sessão Som & Projeção: Fundos Musicais, Telão, Mixer e Vídeos"
                >
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Som & Telão</span>
                  {(isPlayingPad || isPlayingVideo) && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${openDropdown === 'sound_display' ? 'rotate-180' : ''}`} />
                </button>

                {/* Inline Auxiliary Mixer when something is actively playing */}
                {isPlayingPad && (
                  <div className="ml-0.5">
                    <AuxiliaryMixerButton
                      type="fundo"
                      isPlaying={true}
                      onOpenFullMixer={onOpenMixer}
                    />
                  </div>
                )}
                {isPlayingVideo && (
                  <div className="ml-0.5">
                    <AuxiliaryMixerButton
                      type="video"
                      isPlaying={true}
                      label={activeVideoTitle ? activeVideoTitle.slice(0, 10) : 'Vídeo'}
                      onOpenFullMixer={onOpenMixer}
                    />
                  </div>
                )}
              </div>

              {/* Dropdown Menu Som & Telão */}
              {openDropdown === 'sound_display' && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900/98 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between border-b border-slate-800">
                    <span>Ferramentas de Áudio & Telão</span>
                    {(isPlayingPad || isPlayingVideo) && (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold normal-case">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Em Reprodução
                      </span>
                    )}
                  </div>

                  {/* Fundos Musicais */}
                  {onOpenMusicalBackgrounds && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenMusicalBackgrounds();
                        setOpenDropdown('none');
                      }}
                      className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-purple-400" />
                        <div>
                          <div>Fundos Musicais & Pads</div>
                          <div className="text-[10px] text-slate-400 font-normal">Pads contínuos para momentos de oração</div>
                        </div>
                      </div>
                      {isPlayingPad && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-500/30 text-purple-200 border border-purple-500/40 font-bold">
                          Ativo
                        </span>
                      )}
                    </button>
                  )}

                  {/* Mesa de Som / Mixer */}
                  {onOpenMixer && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenMixer();
                        setOpenDropdown('none');
                      }}
                      className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold flex items-center gap-2 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <Sliders className="w-4 h-4 text-blue-400" />
                      <div>
                        <div>Mesa de Som Auxiliar (Mixer)</div>
                        <div className="text-[10px] text-slate-400 font-normal">Controle de volumes e mixagem individual</div>
                      </div>
                    </button>
                  )}

                  {/* Abrir Telão Auxiliar */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        projectionManager.openOnAllAuxiliaryScreens();
                        setOpenDropdown('none');
                      }}
                      className={`flex-1 px-2.5 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        isAuxConnected
                          ? 'bg-purple-950/60 text-purple-200 border border-purple-500/40'
                          : 'hover:bg-slate-800 text-slate-200 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Tv className="w-4 h-4 text-purple-400" />
                        <div>
                          <div>Abrir Telão Auxiliar</div>
                          <div className="text-[10px] text-slate-400 font-normal">Projetar em telas secundárias full-screen</div>
                        </div>
                      </div>
                      {isAuxConnected && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </button>
                    {onOpenProjectionConfig && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenProjectionConfig();
                          setOpenDropdown('none');
                        }}
                        className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Configurar Monitores de Telão"
                      >
                        <Sliders className="w-4 h-4 text-purple-400" />
                      </button>
                    )}
                  </div>

                  {/* Vídeos Semanais Oficiais */}
                  <button
                    type="button"
                    onClick={() => {
                      onOpenWeeklyMediaModal();
                      setOpenDropdown('none');
                    }}
                    className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold flex items-center gap-2 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <Video className="w-4 h-4 text-red-400" />
                    <div>
                      <div>Vídeos Oficiais da Semana</div>
                      <div className="text-[10px] text-slate-400 font-normal">Provai e Vede & Informativo Mundial</div>
                    </div>
                  </button>

                  {/* Procura Semanal */}
                  {onOpenWeeklySearchModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenWeeklySearchModal();
                        setOpenDropdown('none');
                      }}
                      className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold flex items-center gap-2 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <Youtube className="w-4 h-4 text-amber-400" />
                      <div>
                        <div>Procura Semanal (YouTube / Locutor)</div>
                        <div className="text-[10px] text-slate-400 font-normal">Buscar vídeos da semana na internet</div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* GRUPO 2: Gestão do Culto */}
            <div id="header-group-management" className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(prev => prev === 'management' ? 'none' : 'management')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Sessão Gestão: Finalizar Culto, Histórico, IA e Compartilhar"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Gestão</span>
                {archivedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-black border border-amber-500/40">
                    {archivedCount}
                  </span>
                )}
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${openDropdown === 'management' ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu Gestão */}
              {openDropdown === 'management' && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900/98 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                    Ações de Gestão & Liturgia
                  </div>

                  {/* Finalizar Culto */}
                  {onOpenFinishWorshipModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenFinishWorshipModal();
                        setOpenDropdown('none');
                      }}
                      className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-bold flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div>Finalizar & Arquivar Culto</div>
                        <div className="text-[10px] text-emerald-400/80 font-normal">Arquiva e prepara o próximo sábado</div>
                      </div>
                    </button>
                  )}

                  {/* Histórico */}
                  {onOpenArchivesModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenArchivesModal();
                        setOpenDropdown('none');
                      }}
                      className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-amber-400" />
                        <div>
                          <div>Histórico de Cultos</div>
                          <div className="text-[10px] text-slate-400 font-normal">Ver e restaurar cultos passados</div>
                        </div>
                      </div>
                      {archivedCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                          {archivedCount}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Compartilhar */}
                  <button
                    type="button"
                    onClick={() => {
                      onOpenShareModal();
                      setOpenDropdown('none');
                    }}
                    className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold flex items-center gap-2 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-blue-400" />
                    <div>
                      <div>Compartilhar Liturgia</div>
                      <div className="text-[10px] text-slate-400 font-normal">Gerar QR Code ou link para a igreja</div>
                    </div>
                  </button>

                  {/* Assistente IA */}
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAIAssistant();
                      setOpenDropdown('none');
                    }}
                    className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold flex items-center gap-2 hover:bg-slate-800 text-indigo-300 hover:text-indigo-200 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div>Assistente IA de Liturgia</div>
                      <div className="text-[10px] text-slate-400 font-normal">Sugestões de temas e ordem bíblica</div>
                    </div>
                  </button>

                  {/* Restaurar Modelo Padrão */}
                  <button
                    type="button"
                    onClick={() => {
                      onResetToDefault();
                      setOpenDropdown('none');
                    }}
                    className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold flex items-center gap-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer border-t border-slate-800 pt-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Restaurar Modelo Davi</span>
                  </button>
                </div>
              )}
            </div>

            {/* AÇÃO PRIORITÁRIA: Modo Ao Vivo */}
            <button
              id="open-sonoplastia-mode-btn"
              onClick={onOpenSonoplastiaMode}
              className="btn-sheen px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
              title="Abrir Modo Operação Ao Vivo em Tela Cheia"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Ao Vivo</span>
            </button>

            {/* SESSÃO DO USUÁRIO & LOGOUT */}
            {currentUser && (
              <div id="header-group-user" className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(prev => prev === 'user' ? 'none' : 'user')}
                  className="p-1.5 sm:px-2 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title={`Conectado como: ${currentUser.name} (${currentUser.role})`}
                >
                  <div className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                    <UserIcon className="w-3 h-3" />
                  </div>
                  <span className="hidden xl:inline text-xs font-medium text-slate-200 max-w-[90px] truncate">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Dropdown Menu Usuário */}
                {openDropdown === 'user' && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900/98 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-2.5 py-2 border-b border-slate-800">
                      <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">@{currentUser.username} • {currentUser.role === 'developer' ? 'Desenvolvedor' : 'Equipe de Culto'}</div>
                      <div className="text-[9px] text-emerald-400 mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{currentUser.rememberMe ? 'Conectado continuamente' : 'Sessão atual'}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown('none');
                        setActiveTab('church_admin');
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Church className="w-3.5 h-3.5 text-blue-400" />
                      <span>Gerenciar Igreja & Equipe</span>
                    </button>

                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown('none');
                          onLogout();
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/60 flex items-center gap-2 transition-colors cursor-pointer border-t border-slate-800 pt-2"
                      >
                        <LogOut className="w-3.5 h-3.5 text-red-400" />
                        <span>Sair da Conta</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar - 3 Grouped Tabs */}
        <div className="flex lg:hidden border-t border-slate-800 py-2 gap-1.5 overflow-x-auto text-xs scrollbar-none">
          <button
            onClick={() => setActiveTab('program')}
            className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-center transition-all ${
              activeTab === 'program' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 bg-slate-900/60'
            }`}
          >
            Liturgia
          </button>
          <button
            onClick={() => setActiveTab(isMediaActive ? activeTab : 'songs_catalog')}
            className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-center transition-all ${
              isMediaActive ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-slate-400 bg-slate-900/60'
            }`}
          >
            Músicas & Hinário
          </button>
          <button
            onClick={() => setActiveTab(isChurchTeamActive ? activeTab : 'church_admin')}
            className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-center transition-all ${
              isChurchTeamActive ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 bg-slate-900/60'
            }`}
          >
            Igreja & Equipe
          </button>
        </div>
      </div>
    </header>
  );
};
