import React, { useState, useEffect } from 'react';
import { 
  X, Play, Download, RefreshCw, Calendar, CheckCircle2, 
  Video, Sparkles, AlertCircle, ExternalLink, Link2, Check,
  HardDrive, CheckCircle, Upload, Monitor, Tv, Sliders
} from 'lucide-react';
import { WeeklyMediaItem, WorshipProgram } from '../types';
import { 
  getVideoFromIndexedDB, 
  autoCacheWeeklyVideo, 
  downloadVideoBlobToUserDisk,
  autoFindAndDownloadAllWeeklyVideos,
  OfflineStoredVideo 
} from '../utils/offlineMediaStorage';

interface WeeklyMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  weeklyMedia: {
    informativo: WeeklyMediaItem;
    provaiEVede: WeeklyMediaItem;
  };
  onRefreshWeeklyMedia: () => Promise<void>;
  onPlayMedia: (title: string, queryOrUrl: string, videoDate?: string, downloadUrl?: string, synopsis?: string, targetScreen?: 'main' | 'auxiliary') => void;
  onLinkToProgram: (type: 'informativo' | 'provai', mediaItem: WeeklyMediaItem) => void;
  onOpenWeeklySearchConfig?: () => void;
}

export const WeeklyMediaModal: React.FC<WeeklyMediaModalProps> = ({
  isOpen,
  onClose,
  weeklyMedia,
  onRefreshWeeklyMedia,
  onPlayMedia,
  onLinkToProgram,
  onOpenWeeklySearchConfig,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAutoDownloading, setIsAutoDownloading] = useState(false);
  const [autoDownloadMessage, setAutoDownloadMessage] = useState<string | null>(null);
  const [linkedStatus, setLinkedStatus] = useState<{ [key: string]: boolean }>({});
  const [offlineStatus, setOfflineStatus] = useState<{
    info: OfflineStoredVideo | null;
    provai: OfflineStoredVideo | null;
    loading: boolean;
  }>({
    info: null,
    provai: null,
    loading: false,
  });

  const checkOffline = async () => {
    const info = await getVideoFromIndexedDB('video_informativo');
    const provai = await getVideoFromIndexedDB('video_provai');
    setOfflineStatus({
      info,
      provai,
      loading: false,
    });
  };

  useEffect(() => {
    if (isOpen) {
      checkOffline();
    }
  }, [isOpen, weeklyMedia]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshWeeklyMedia();
      await checkOffline();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAutoFindAndDownload = async () => {
    setIsAutoDownloading(true);
    setAutoDownloadMessage('Buscando automaticamente os vídeos da semana...');
    try {
      const res = await autoFindAndDownloadAllWeeklyVideos((msg) => {
        setAutoDownloadMessage(msg);
      });
      if (res.success) {
        setAutoDownloadMessage('✓ Provai e Vede e Informativo Mundial das Missões baixados com sucesso!');
        await checkOffline();
      }
    } catch (e: any) {
      setAutoDownloadMessage('Erro ao baixar vídeos automaticamente: ' + (e.message || ''));
    } finally {
      setIsAutoDownloading(false);
    }
  };

  const handleDownloadFileToDisk = async (type: 'informativo' | 'provai') => {
    const success = await downloadVideoBlobToUserDisk(type);
    if (success) {
      setAutoDownloadMessage(`✓ Download do ${type === 'informativo' ? 'Informativo' : 'Provai e Vede'} salvo para seu computador!`);
    }
  };

  if (!isOpen) return null;

  const handleLink = (type: 'informativo' | 'provai', item: WeeklyMediaItem) => {
    onLinkToProgram(type, item);
    setLinkedStatus(prev => ({ ...prev, [type]: true }));
    setTimeout(() => {
      setLinkedStatus(prev => ({ ...prev, [type]: false }));
    }, 3000);
  };

  const handleForceCache = async (type: 'informativo' | 'provai') => {
    const item = type === 'informativo' ? weeklyMedia.informativo : weeklyMedia.provaiEVede;
    setOfflineStatus(prev => ({ ...prev, loading: true }));
    try {
      await autoCacheWeeklyVideo(type, {
        title: item.title,
        dateText: item.dateText,
        synopsis: item.synopsis,
        downloadUrl: item.downloadUrl,
      });
      await checkOffline();
    } finally {
      setOfflineStatus(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20 shrink-0">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold leading-tight">
                  Vídeos Oficiais da Semana
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Baixados para Uso Offline
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Provai e Vede & Informativo Mundial das Missões • Baixados no computador para tocar sem internet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenWeeklySearchConfig && (
              <button
                onClick={onOpenWeeklySearchConfig}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-red-600/20 cursor-pointer"
                title="Configurar campos de busca semanal de vídeos da internet & canais do YouTube"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Procura Semanal (Internet)</span>
                <span className="sm:hidden">Internet</span>
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Buscar última edição semanal dos vídeos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar Semana</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* AUTO FIND & DOWNLOAD BANNER */}
          <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200/90 rounded-3xl flex flex-col gap-3 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-900">
                      Encontrar e Baixar Vídeos Automaticamente
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                      Provai e Vede + Missões
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    {autoDownloadMessage || 'Localiza os vídeos oficiais da DSA da semana e salva na memória local para tocar 100% offline'}
                  </p>
                </div>
              </div>

              <button
                id="weekly-auto-find-download-btn"
                type="button"
                onClick={handleAutoFindAndDownload}
                disabled={isAutoDownloading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                title="Pesquisa e baixa automaticamente ambos os vídeos semanais"
              >
                <RefreshCw className={`w-4 h-4 ${isAutoDownloading ? 'animate-spin' : ''}`} />
                <span>{isAutoDownloading ? 'Baixando Vídeos...' : 'Baixar Vídeos Automaticamente'}</span>
              </button>
            </div>

            {/* QUICK ACTIONS WHEN VIDEOS ARE DOWNLOADED */}
            {(offlineStatus.info?.isOfflineReady || offlineStatus.provai?.isOfflineReady) && (
              <div className="pt-3 border-t border-blue-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Vídeos prontos no computador! Reproduzir agora:</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {offlineStatus.info?.isOfflineReady && (
                    <div className="flex items-center gap-1.5 bg-white/80 px-2.5 py-1 rounded-xl border border-blue-200 shadow-xs">
                      <span className="text-[11px] font-black text-slate-700">Informativo:</span>
                      <button
                        onClick={() =>
                          onPlayMedia(
                            weeklyMedia.informativo.title,
                            'offline:informativo',
                            weeklyMedia.informativo.dateText,
                            weeklyMedia.informativo.downloadUrl,
                            weeklyMedia.informativo.synopsis,
                            'main'
                          )
                        }
                        className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        title="Tocar na Tela 1 (Operador)"
                      >
                        <Monitor className="w-3 h-3" /> Tela 1
                      </button>
                      <button
                        onClick={() =>
                          onPlayMedia(
                            weeklyMedia.informativo.title,
                            'offline:informativo',
                            weeklyMedia.informativo.dateText,
                            weeklyMedia.informativo.downloadUrl,
                            weeklyMedia.informativo.synopsis,
                            'auxiliary'
                          )
                        }
                        className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        title="Tocar na Tela 2 (Telão)"
                      >
                        <Tv className="w-3 h-3 text-purple-200" /> Tela 2
                      </button>
                    </div>
                  )}

                  {offlineStatus.provai?.isOfflineReady && (
                    <div className="flex items-center gap-1.5 bg-white/80 px-2.5 py-1 rounded-xl border border-amber-200 shadow-xs">
                      <span className="text-[11px] font-black text-slate-700">Provai e Vede:</span>
                      <button
                        onClick={() =>
                          onPlayMedia(
                            weeklyMedia.provaiEVede.title,
                            'offline:provai',
                            weeklyMedia.provaiEVede.dateText,
                            weeklyMedia.provaiEVede.downloadUrl,
                            weeklyMedia.provaiEVede.synopsis,
                            'main'
                          )
                        }
                        className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        title="Tocar na Tela 1 (Operador)"
                      >
                        <Monitor className="w-3 h-3" /> Tela 1
                      </button>
                      <button
                        onClick={() =>
                          onPlayMedia(
                            weeklyMedia.provaiEVede.title,
                            'offline:provai',
                            weeklyMedia.provaiEVede.dateText,
                            weeklyMedia.provaiEVede.downloadUrl,
                            weeklyMedia.provaiEVede.synopsis,
                            'auxiliary'
                          )
                        }
                        className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        title="Tocar na Tela 2 (Telão)"
                      >
                        <Tv className="w-3 h-3 text-purple-200" /> Tela 2
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* INFORMATIVO MUNDIAL DAS MISSÕES */}
            <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 flex flex-col justify-between space-y-5 hover:border-slate-300 transition-all shadow-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider">
                      Escola Sabatina
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      Canal Daniel Locutor
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    ⏱️ {weeklyMedia.informativo.duration}
                  </span>
                </div>

                <h4 className="text-lg font-extrabold text-slate-900 leading-tight">
                  {weeklyMedia.informativo.title}
                </h4>

                {/* Auto-link indicator for Daniel Locutor */}
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Link Automático Ativo:</strong> Vídeo oficial do canal Daniel Locutor (@daniellocutor) pronto para reproduzir com 1 clique.
                  </span>
                </div>

                {/* Date highlight */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Data: <strong>{weeklyMedia.informativo.dateText}</strong></span>
                  </div>

                  {offlineStatus.info?.isOfflineReady ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Offline ({((offlineStatus.info.sizeBytes || 0) / (1024 * 1024)).toFixed(1)} MB)</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleForceCache('informativo')}
                      disabled={offlineStatus.loading}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 text-indigo-800 text-xs font-bold cursor-pointer"
                    >
                      <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Baixar p/ PC</span>
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {weeklyMedia.informativo.synopsis}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-200/80">
                {/* 1-Click Dual Screen Play Buttons (Tela 1 vs Tela 2) */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="play-informativo-screen-1-btn"
                    onClick={() =>
                      onPlayMedia(
                        weeklyMedia.informativo.title,
                        offlineStatus.info?.isOfflineReady
                          ? 'offline:informativo'
                          : weeklyMedia.informativo.directEmbedUrl || weeklyMedia.informativo.youtubeId || 'offline:informativo',
                        weeklyMedia.informativo.dateText,
                        weeklyMedia.informativo.downloadUrl,
                        weeklyMedia.informativo.synopsis,
                        'main'
                      )
                    }
                    className="py-3 px-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
                    title="Reproduzir na Tela 1 (Monitor do Operador)"
                  >
                    <Monitor className="w-4 h-4 shrink-0" />
                    <span>Tela 1 (Operador)</span>
                  </button>

                  <button
                    id="play-informativo-screen-2-btn"
                    onClick={() =>
                      onPlayMedia(
                        weeklyMedia.informativo.title,
                        offlineStatus.info?.isOfflineReady
                          ? 'offline:informativo'
                          : weeklyMedia.informativo.directEmbedUrl || weeklyMedia.informativo.youtubeId || 'offline:informativo',
                        weeklyMedia.informativo.dateText,
                        weeklyMedia.informativo.downloadUrl,
                        weeklyMedia.informativo.synopsis,
                        'auxiliary'
                      )
                    }
                    className="py-3 px-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/25 flex items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
                    title="Reproduzir diretamente na Tela 2 (Telão da Igreja em Tela Cheia)"
                  >
                    <Tv className="w-4 h-4 text-purple-200 shrink-0" />
                    <span>Tela 2 (Telão Cheio)</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {offlineStatus.info?.isOfflineReady ? (
                    <button
                      type="button"
                      onClick={() => handleDownloadFileToDisk('informativo')}
                      className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-center cursor-pointer shadow-xs"
                      title="Salvar arquivo do vídeo no computador ou pen drive"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-200" />
                      Salvar Arquivo no PC
                    </button>
                  ) : (
                    <a
                      href={weeklyMedia.informativo.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-center cursor-pointer"
                      title="Baixar MP4 oficial para sonoplastia offline"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      Link DSA Oficial
                    </a>
                  )}

                  <button
                    onClick={() => handleLink('informativo', weeklyMedia.informativo)}
                    className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {linkedStatus['informativo'] ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Vinculado!
                      </>
                    ) : (
                      <>
                        <Link2 className="w-3.5 h-3.5 text-blue-600" />
                        Vincular ao Culto
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* PROVAI E VEDE */}
            <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 flex flex-col justify-between space-y-5 hover:border-slate-300 transition-all shadow-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-xl bg-red-600 text-white text-[11px] font-bold uppercase tracking-wider">
                    Culto Divino / Ofertas
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    ⏱️ {weeklyMedia.provaiEVede.duration}
                  </span>
                </div>

                <h4 className="text-lg font-extrabold text-slate-900 leading-tight">
                  {weeklyMedia.provaiEVede.title}
                </h4>

                {/* Date highlight */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Data: <strong>{weeklyMedia.provaiEVede.dateText}</strong></span>
                  </div>

                  {offlineStatus.provai?.isOfflineReady ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Offline ({((offlineStatus.provai.sizeBytes || 0) / (1024 * 1024)).toFixed(1)} MB)</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleForceCache('provai')}
                      disabled={offlineStatus.loading}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 text-indigo-800 text-xs font-bold cursor-pointer"
                    >
                      <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Baixar p/ PC</span>
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {weeklyMedia.provaiEVede.synopsis}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-200/80">
                {/* 1-Click Dual Screen Play Buttons (Tela 1 vs Tela 2) */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="play-provai-screen-1-btn"
                    onClick={() =>
                      onPlayMedia(
                        weeklyMedia.provaiEVede.title,
                        offlineStatus.provai?.isOfflineReady
                          ? 'offline:provai'
                          : weeklyMedia.provaiEVede.directEmbedUrl || weeklyMedia.provaiEVede.youtubeId || 'offline:provai',
                        weeklyMedia.provaiEVede.dateText,
                        weeklyMedia.provaiEVede.downloadUrl,
                        weeklyMedia.provaiEVede.synopsis,
                        'main'
                      )
                    }
                    className="py-3 px-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md shadow-red-600/25 flex items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
                    title="Reproduzir na Tela 1 (Monitor do Operador)"
                  >
                    <Monitor className="w-4 h-4 shrink-0" />
                    <span>Tela 1 (Operador)</span>
                  </button>

                  <button
                    id="play-provai-screen-2-btn"
                    onClick={() =>
                      onPlayMedia(
                        weeklyMedia.provaiEVede.title,
                        offlineStatus.provai?.isOfflineReady
                          ? 'offline:provai'
                          : weeklyMedia.provaiEVede.directEmbedUrl || weeklyMedia.provaiEVede.youtubeId || 'offline:provai',
                        weeklyMedia.provaiEVede.dateText,
                        weeklyMedia.provaiEVede.downloadUrl,
                        weeklyMedia.provaiEVede.synopsis,
                        'auxiliary'
                      )
                    }
                    className="py-3 px-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/25 flex items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
                    title="Reproduzir na Tela 2 (Telão da Igreja em Tela Cheia)"
                  >
                    <Tv className="w-4 h-4 text-purple-200 shrink-0" />
                    <span>Tela 2 (Telão Cheio)</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {offlineStatus.provai?.isOfflineReady ? (
                    <button
                      type="button"
                      onClick={() => handleDownloadFileToDisk('provai')}
                      className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-center cursor-pointer shadow-xs"
                      title="Salvar arquivo do vídeo no computador ou pen drive"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-200" />
                      Salvar Arquivo no PC
                    </button>
                  ) : (
                    <a
                      href={weeklyMedia.provaiEVede.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-center cursor-pointer"
                      title="Baixar MP4 oficial para sonoplastia offline"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      Link DSA Oficial
                    </a>
                  )}

                  <button
                    onClick={() => handleLink('provai', weeklyMedia.provaiEVede)}
                    className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {linkedStatus['provai'] ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Vinculado!
                      </>
                    ) : (
                      <>
                        <Link2 className="w-3.5 h-3.5 text-red-600" />
                        Vincular ao Culto
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-600">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Vídeos salvos automaticamente no computador assim que iniciado. Não precisa buscar no YouTube.</span>
            </span>
            <span className="font-semibold text-slate-500 shrink-0">
              Armazenamento IndexedDB Seguro
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Concluir & Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
