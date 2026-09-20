import React, { useState } from 'react';
import { 
  Church, ShieldCheck, Plus, Trash2, KeyRound, Copy, 
  ExternalLink, CheckCircle2, AlertCircle, Building2, 
  Eye, EyeOff, User, MapPin, Sparkles, RefreshCw
} from 'lucide-react';
import { ChurchAccount, AuthUser } from '../types';
import { 
  getStoredChurchAccounts, 
  registerNewChurchAccount, 
  deleteChurchAccount 
} from '../utils/churchAdminStorage';
import { 
  getActiveChurchId, 
  setActiveChurch, 
  getChurchShareUrl 
} from '../utils/churchWorkspace';

interface SimultaneousChurchesManagerProps {
  currentUser: AuthUser | null;
  onNotify?: (msg: string) => void;
}

export const SimultaneousChurchesManager: React.FC<SimultaneousChurchesManagerProps> = ({
  currentUser,
  onNotify,
}) => {
  const [accounts, setAccounts] = useState<ChurchAccount[]>(() => getStoredChurchAccounts());
  const [activeChurchId, setActiveChurchIdState] = useState<string>(() => getActiveChurchId());
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  
  // New church registration form modal/state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [contact, setContact] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSwitchChurch = (churchId: string, churchName: string) => {
    setActiveChurch(churchId, false);
    setActiveChurchIdState(churchId);
    if (onNotify) {
      onNotify(`Espaço alternado para "${churchName}". Liturgia e dados carregados!`);
    }
  };

  const handleCopyLink = (churchId: string, churchName: string) => {
    const url = getChurchShareUrl(churchId);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      if (onNotify) {
        onNotify(`Link de acesso direto da igreja "${churchName}" copiado!`);
      }
    }
  };

  const handleDelete = (id: string, churchName: string) => {
    if (accounts.length <= 1) {
      alert('Não é possível excluir a única congregação cadastrada.');
      return;
    }
    if (confirm(`Tem certeza que deseja remover o cadastro da congregação "${churchName}"?`)) {
      deleteChurchAccount(id);
      const updated = getStoredChurchAccounts();
      setAccounts(updated);
      if (onNotify) {
        onNotify(`Cadastro da igreja "${churchName}" removido.`);
      }
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const res = registerNewChurchAccount({
      name,
      district,
      city,
      state,
      login,
      password,
      adminContact: contact,
    });

    if (!res.success) {
      setFormError(res.message);
      return;
    }

    setFormSuccess(res.message);
    setAccounts(getStoredChurchAccounts());
    setName('');
    setDistrict('');
    setCity('');
    setLogin('');
    setPassword('');
    setContact('');
    setTimeout(() => {
      setIsRegisterOpen(false);
      setFormSuccess(null);
    }, 1500);

    if (onNotify) {
      onNotify(`Nova congregação cadastrada com sucesso!`);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span>Igrejas Cadastradas para Uso Simultâneo</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Cadastre congregações, consulte logins de acesso e alterne instantaneamente entre liturgias
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsRegisterOpen(true);
            setFormError(null);
            setFormSuccess(null);
          }}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Igreja</span>
        </button>
      </div>

      {/* UNIVERSAL DEVELOPER ACCESS CARD */}
      <div className="bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-950 p-5 rounded-3xl border border-amber-500/40 text-slate-100 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Acesso Universal do Desenvolvedor
              </div>
              <div className="text-sm font-black text-white mt-0.5">
                Login Master para Gestão Global & Suporte Simultâneo
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                O desenvolvedor possui acesso irrestrito para supervisionar qualquer igreja e gerenciar credenciais.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/90 px-3.5 py-2 rounded-xl border border-slate-700 text-xs font-mono shrink-0">
            <span className="text-slate-400">Usuário:</span>
            <strong className="text-amber-300">dev</strong>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Senha:</span>
            <strong className="text-amber-300">dev2026</strong>
          </div>
        </div>
      </div>

      {/* CHURCH ACCOUNTS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((acc) => {
          const isActive = acc.id === activeChurchId;
          const isPasswordVisible = !!visiblePasswords[acc.id];

          return (
            <div 
              key={acc.id}
              className={`p-5 rounded-3xl border transition-all ${
                isActive 
                  ? 'bg-blue-50/50 border-blue-500/50 shadow-md ring-2 ring-blue-500/20' 
                  : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <Church className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>{acc.name}</span>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white">
                          ATIVA
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{acc.city || 'Cidade'} - {acc.state || 'UF'}</span>
                      {acc.district && <span className="text-slate-400">• {acc.district}</span>}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(acc.id, acc.name)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Remover cadastro da igreja"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Credentials Box */}
              <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Login:</span>
                  </span>
                  <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                    {acc.login}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    <span>Senha:</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                      {isPasswordVisible ? acc.password : '••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(acc.id)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                      title={isPasswordVisible ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {acc.adminContact && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
                    <span>Responsável:</span>
                    <span className="font-semibold text-slate-700">{acc.adminContact}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleSwitchChurch(acc.id, acc.name)}
                  disabled={isActive}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isActive 
                      ? 'bg-slate-100 text-slate-400 cursor-default' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isActive ? 'Conectado Agora' : 'Alternar para esta Igreja'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyLink(acc.id, acc.name)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="Copiar link de acesso desta congregação"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* REGISTRATION MODAL */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Cadastrar Nova Igreja Simultânea
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gere login e senha exclusivos para a equipe desta congregação
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Nome Oficial da IASD *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!login) {
                      const clean = e.target.value
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]/g, '');
                      setLogin(clean);
                    }
                  }}
                  placeholder="Ex: IASD Central de Campinas"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Cidade</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Campinas"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Estado (UF)</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    placeholder="SP"
                    maxLength={2}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Login de Acesso *</label>
                  <input
                    type="text"
                    value={login}
                    onChange={(e) => setLogin(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="iasdcentralcampinas"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Senha de Acesso *</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 4 dígitos"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Distrito Eclesiástico</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Ex: Distrito Campinas Central"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Responsável / Contato Local</label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Ex: Pr. Daniel (19 99999-1234)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
