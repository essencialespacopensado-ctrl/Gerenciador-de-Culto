import React, { useState, useRef, useEffect } from 'react';
import { 
  Church, ChevronDown, Plus, Check, ExternalLink, Copy, 
  ShieldCheck, Sparkles, Building2, MapPin, X
} from 'lucide-react';
import { 
  ChurchProfile, 
  getRegisteredChurches, 
  getActiveChurchProfile, 
  registerChurch, 
  setActiveChurch,
  getChurchShareUrl 
} from '../utils/churchWorkspace';

interface ChurchWorkspaceSelectorProps {
  onNotify?: (msg: string) => void;
  onChurchSwitched?: (newChurch: ChurchProfile) => void;
}

export const ChurchWorkspaceSelector: React.FC<ChurchWorkspaceSelectorProps> = ({
  onNotify,
  onChurchSwitched,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isNewChurchModalOpen, setIsNewChurchModalOpen] = useState(false);
  const [churches, setChurches] = useState<ChurchProfile[]>(() => getRegisteredChurches());
  const [activeChurch, setActiveChurchState] = useState<ChurchProfile>(() => getActiveChurchProfile());
  const [copied, setCopied] = useState(false);

  // New Church Form State
  const [newChurchName, setNewChurchName] = useState('');
  const [newDistrict, setNewDistrict] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectChurch = (church: ChurchProfile) => {
    setActiveChurchState(church);
    setIsOpen(false);
    setActiveChurch(church.id, false);
    if (onChurchSwitched) {
      onChurchSwitched(church);
    }
    if (onNotify) {
      onNotify(`✓ Ambiente trocado para ${church.name}. Acessos 100% independentes.`);
    }
  };

  const handleCreateChurch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChurchName.trim()) return;

    const created = registerChurch(newChurchName, newDistrict, newCity, newState);
    setChurches(getRegisteredChurches());
    setIsNewChurchModalOpen(false);
    setNewChurchName('');
    setNewDistrict('');
    setNewCity('');
    setNewState('');

    handleSelectChurch(created);
  };

  const handleCopyDirectLink = (e: React.MouseEvent, churchId?: string) => {
    e.stopPropagation();
    const url = getChurchShareUrl(churchId || activeChurch.id);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    if (onNotify) {
      onNotify('✓ Link exclusivo copiado! Abra em qualquer aba ou aparelho sem interferir em outras igrejas.');
    }
  };

  return (
    <>
      <div className="relative inline-block text-left" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-white text-xs font-bold transition-all shadow-xs cursor-pointer group"
          title="Clique para alternar de igreja ou cadastrar nova congregação"
        >
          <div className="w-5 h-5 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0">
            <Church className="w-3 h-3" />
          </div>
          <span className="truncate max-w-[130px] sm:max-w-[170px] text-slate-200 group-hover:text-white">
            {activeChurch.name}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-slate-900 border border-slate-700/90 shadow-2xl shadow-black/80 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold uppercase tracking-wider text-slate-400 text-[10px]">
                  Ambiente da Congregação
                </span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3 h-3" /> Isolado & Seguro
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Cada igreja tem seu próprio console, histórico e louvores independentes.
              </p>
            </div>

            {/* List of Churches */}
            <div className="max-h-56 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
              {churches.map((church) => {
                const isActive = church.id === activeChurch.id;
                return (
                  <button
                    key={church.id}
                    onClick={() => handleSelectChurch(church)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                      isActive
                        ? 'bg-blue-600/20 text-white font-bold border border-blue-500/40'
                        : 'hover:bg-slate-800 text-slate-300 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Church className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                      <div className="truncate">
                        <div className="truncate font-semibold">{church.name}</div>
                        {(church.city || church.district) && (
                          <div className="text-[10px] text-slate-400 truncate">
                            {[church.district, church.city].filter(Boolean).join(' • ')}
                          </div>
                        )}
                      </div>
                    </div>
                    {isActive && (
                      <Check className="w-4 h-4 text-blue-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Actions at bottom of dropdown */}
            <div className="p-2 border-t border-slate-800 space-y-1 text-xs">
              <button
                onClick={(e) => handleCopyDirectLink(e)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold transition-colors cursor-pointer"
                title="Copia link direto que abre automaticamente nesta congregação"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span>{copied ? 'Link Exclusivo Copiado!' : 'Copiar Link Desta Igreja'}</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsNewChurchModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span>+ Cadastrar Outra Igreja</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Cadastrar Nova Igreja */}
      {isNewChurchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-white"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  Cadastrar Nova Igreja / Ambiente
                </h3>
              </div>
              <button
                onClick={() => setIsNewChurchModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateChurch} className="p-6 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Ao cadastrar sua igreja, ela ganha um espaço 100% exclusivo com suas próprias liturgias, arquivos e escala, sem interferir em outras igrejas.
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nome da Congregação *
                </label>
                <input
                  type="text"
                  required
                  value={newChurchName}
                  onChange={e => setNewChurchName(e.target.value)}
                  placeholder="Ex: IASD Central de Curitiba"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Distrito Pastoral
                </label>
                <input
                  type="text"
                  value={newDistrict}
                  onChange={e => setNewDistrict(e.target.value)}
                  placeholder="Ex: Distrito Central"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={e => setNewCity(e.target.value)}
                    placeholder="Ex: Curitiba"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    UF
                  </label>
                  <input
                    type="text"
                    value={newState}
                    onChange={e => setNewState(e.target.value)}
                    placeholder="PR"
                    maxLength={2}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-blue-500 outline-none uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewChurchModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/30 cursor-pointer"
                >
                  Criar e Acessar Espaço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
