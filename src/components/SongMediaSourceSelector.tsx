import React, { useState, useRef, useEffect } from 'react';
import { 
  Youtube, HardDrive, Search, CheckCircle2, AlertTriangle, 
  Upload, X, Check, Music, Play, ExternalLink, RefreshCw,
  FolderOpen, Sparkles, Film
} from 'lucide-react';
import { MediaSourceType } from '../types';
import { extractYoutubeId, isValidTransmissionMedia } from '../utils/mediaUtils';
import { savePendriveMediaFile } from '../utils/offlineMediaStorage';
import { ADVENTIST_HYMNS, CURATED_MEDIA } from '../data/churchData';

interface SongMediaSourceSelectorProps {
  slotLabel: string;
  slotNumber: number;
  title: string;
  onChangeTitle: (title: string) => void;
  url: string;
  onChangeUrl: (url: string) => void;
  sourceType: MediaSourceType;
  onChangeSourceType: (type: MediaSourceType) => void;
  fileName?: string;
  onChangeFileName?: (name: string) => void;
  fileSize?: string;
  onChangeFileSize?: (size: string) => void;
  driveOrigin?: string;
  onChangeDriveOrigin?: (origin: string) => void;
  onClear?: () => void;
}

interface YouTubeSearchResult {
  videoId: string;
  title: string;
  channel: string;
  thumbnail?: string;
  duration?: string;
}

export const SongMediaSourceSelector: React.FC<SongMediaSourceSelectorProps> = ({
  slotLabel,
  slotNumber,
  title,
  onChangeTitle,
  url,
  onChangeUrl,
  sourceType,
  onChangeSourceType,
  fileName,
  onChangeFileName,
  fileSize,
  onChangeFileSize,
  driveOrigin = 'Pen Drive (USB)',
  onChangeDriveOrigin,
  onClear,
}) => {
  const [isSearchingYoutube, setIsSearchingYoutube] = useState(false);
  const [youtubeResults, setYoutubeResults] = useState<YouTubeSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isImportingFile, setIsImportingFile] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(driveOrigin || 'Pen Drive (USB)');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verifica se o link atual é válido para transmissão na liturgia
  const currentMedia = {
    title,
    url,
    sourceType,
    fileName,
  };
  const isTransmissionReady = isValidTransmissionMedia(currentMedia);
  const ytId = extractYoutubeId(url);

  // Executa busca no YouTube quando o usuário clica em buscar ou digita o nome
  const handleSearchYoutube = async (queryText?: string) => {
    const q = (queryText !== undefined ? queryText : title).trim();
    if (!q) return;

    setIsSearchingYoutube(true);
    setHasSearched(true);
    try {
      const searchQuery = `${q} playback adventista`;
      const res = await fetch(`/api/search-weekly-videos?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.videos && Array.isArray(data.videos)) {
          setYoutubeResults(data.videos.slice(0, 6));
        } else {
          setYoutubeResults([]);
        }
      } else {
        setYoutubeResults([]);
      }
    } catch (err) {
      console.warn('Erro ao buscar no YouTube:', err);
      setYoutubeResults([]);
    } finally {
      setIsSearchingYoutube(false);
    }
  };

  // Seleciona um resultado encontrado no YouTube
  const handleSelectYoutubeVideo = (video: YouTubeSearchResult) => {
    const directUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
    onChangeUrl(directUrl);
    onChangeSourceType('youtube');
    if (!title.trim() || title.toLowerCase().includes('buscar') || title.length < 4) {
      // Limpa termos como "playback", "adventista", etc. do título
      const cleanName = video.title
        .replace(/\(playback\)/gi, '')
        .replace(/playback/gi, '')
        .replace(/adventista/gi, '')
        .replace(/letra/gi, '')
        .replace(/oficial/gi, '')
        .trim();
      onChangeTitle(cleanName || video.title);
    }
    setYoutubeResults([]);
  };

  // Importa arquivo do pen drive
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingFile(true);
    try {
      const saved = await savePendriveMediaFile(file, title || file.name, selectedDrive);
      onChangeUrl(saved.url);
      onChangeSourceType('pendrive');
      onChangeFileName?.(saved.fileName);
      onChangeFileSize?.(saved.fileSize);
      onChangeDriveOrigin?.(saved.driveOrigin);

      // Se o título não foi preenchido, define com o nome limpo do arquivo
      if (!title.trim()) {
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        onChangeTitle(baseName.replace(/_/g, ' ').replace(/-/g, ' '));
      }
    } catch (err: any) {
      alert(`Erro ao carregar arquivo do pen drive: ${err?.message || 'Arquivo inválido'}`);
    } finally {
      setIsImportingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-xs">
      {/* Header do Slot com Badge de Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-xs font-bold shrink-0">
            {slotNumber}
          </span>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            {slotLabel}
          </span>
        </div>

        {/* Indicador de Status para a Liturgia */}
        <div className="flex items-center gap-1.5">
          {title.trim() ? (
            isTransmissionReady ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Link Correto (Aparece na Liturgia)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Link Pendente (Não aparecerá na liturgia)</span>
              </span>
            )
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">Slot não preenchido</span>
          )}

          {(title || url || fileName) && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Limpar este louvor"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Campo: Nome da Música ou Louvor */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-blue-600" />
            Nome da Música ou Louvor
          </span>
          {title.trim() && sourceType === 'youtube' && (
            <button
              type="button"
              onClick={() => handleSearchYoutube()}
              disabled={isSearchingYoutube}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              {isSearchingYoutube ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Search className="w-3 h-3" />
              )}
              Buscar no YouTube
            </button>
          )}
        </label>
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={e => onChangeTitle(e.target.value)}
            placeholder="Ex: 10 Mil Razões, Porque Ele Vive, Só Tu És Santo..."
            className="w-full pl-3 pr-24 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden transition-all"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSearchYoutube()}
              disabled={isSearchingYoutube || !title.trim()}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              title="Pesquisar este louvor no YouTube"
            >
              {isSearchingYoutube ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Search className="w-3 h-3" />
              )}
              <span>Buscar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Espaço de Escolha de Origem: De onde o vídeo vai sair */}
      <div className="space-y-2 pt-1">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5 text-slate-600" />
          De onde o vídeo vai sair? (Origem da Transmissão)
        </label>

        {/* Abas de Escolha: YouTube vs Pen Drive */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => onChangeSourceType('youtube')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              sourceType === 'youtube'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Youtube className="w-4 h-4" />
            <span>YouTube (Online)</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeSourceType('pendrive')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              sourceType === 'pendrive' || sourceType === 'local'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Pen Drive / Arquivo Local</span>
          </button>
        </div>

        {/* PAINEL 1: YOUTUBE */}
        {sourceType === 'youtube' && (
          <div className="space-y-2.5 p-3 rounded-xl bg-red-50/50 border border-red-200">
            {/* Campo de Link direto ou busca */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Youtube className="w-3.5 h-3.5 text-red-600" />
                  Link de Transmissão do YouTube (URL ou ID)
                </span>
                {ytId && (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                    ID: {ytId}
                  </span>
                )}
              </span>
              <input
                type="text"
                value={url}
                onChange={e => onChangeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... ou pesquise pelo nome acima"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-hidden"
              />
            </div>

            {/* Resultados da Busca no YouTube */}
            {isSearchingYoutube && (
              <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-600 font-medium">
                <RefreshCw className="w-4 h-4 animate-spin text-red-600" />
                <span>Buscando playbacks e louvores oficiais no YouTube...</span>
              </div>
            )}

            {!isSearchingYoutube && hasSearched && youtubeResults.length === 0 && (
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-500 text-center">
                Nenhum resultado direto encontrado no YouTube para esta busca. Você pode colar o link do vídeo diretamente no campo acima.
              </div>
            )}

            {!isSearchingYoutube && youtubeResults.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  Resultados encontrados no YouTube (Clique para vincular):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {youtubeResults.map(video => {
                    const isSelected = ytId === video.videoId;
                    return (
                      <button
                        key={video.videoId}
                        type="button"
                        onClick={() => handleSelectYoutubeVideo(video)}
                        className={`p-2 rounded-lg border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-red-600 text-white border-red-700 shadow-xs ring-2 ring-red-400'
                            : 'bg-white hover:bg-red-50 text-slate-800 border-slate-200 hover:border-red-300'
                        }`}
                      >
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt=""
                            className="w-16 h-10 object-cover rounded shrink-0 bg-slate-200"
                          />
                        ) : (
                          <div className="w-16 h-10 rounded bg-slate-200 flex items-center justify-center shrink-0">
                            <Youtube className="w-5 h-5 text-red-600" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold line-clamp-2 leading-tight">
                            {video.title}
                          </p>
                          <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-red-100' : 'text-slate-500'}`}>
                            {video.channel}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-white shrink-0 mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PAINEL 2: PEN DRIVE / ARQUIVO LOCAL */}
        {(sourceType === 'pendrive' || sourceType === 'local') && (
          <div className="space-y-3 p-3 rounded-xl bg-blue-50/50 border border-blue-200">
            {/* Espaço de seleção: De onde o vídeo vai sair */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                Unidade / Local do Pen Drive:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {['Pen Drive (USB)', 'Disco Removível E:\\', 'Disco F:\\', 'Pasta Local no PC'].map(loc => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      setSelectedDrive(loc);
                      onChangeDriveOrigin?.(loc);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      selectedDrive === loc
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Input oculto de arquivo */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/mp4,video/webm,video/*,audio/mp3,audio/mpeg,audio/*"
              className="hidden"
            />

            {/* Cartão de Arquivo Carregado OU Botão de Selecionar */}
            {fileName ? (
              <div className="p-3 bg-white rounded-xl border border-blue-300 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {fileName}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>{selectedDrive}</span>
                        {fileSize && <span>• {fileSize}</span>}
                        <span className="text-emerald-700 font-bold bg-emerald-100 px-1 rounded text-[10px]">
                          Pronto Offline
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImportingFile}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      title="Trocar arquivo do pen drive"
                    >
                      Trocar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImportingFile}
                className="w-full p-4 rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-white hover:bg-blue-50/50 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-blue-900 block">
                    {isImportingFile ? 'Carregando arquivo do pen drive...' : 'Selecionar Arquivo do Pen Drive / Computador'}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Formatos suportados: MP4 (H.264), WebM, MP3 • Vídeo reproduzido 100% offline
                  </span>
                </div>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
