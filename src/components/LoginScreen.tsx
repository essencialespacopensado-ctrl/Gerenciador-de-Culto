import React, { useState } from 'react';
import { 
  Church, Lock, User, Eye, EyeOff, ShieldCheck, 
  CheckCircle2, AlertCircle, ArrowRight, PlusCircle, 
  HelpCircle, MapPin, KeyRound, Building2
} from 'lucide-react';
import { AuthUser, ChurchAccount } from '../types';
import { 
  authenticateCredentials, 
  saveAuthSession, 
  getStoredChurchAccounts,
  registerNewChurchAccount,
  PRECONFIGURED_ACCOUNTS 
} from '../utils/churchAdminStorage';
import { getActiveChurchProfile } from '../utils/churchWorkspace';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentialsHelper, setShowCredentialsHelper] = useState(false);

  // Register church form state
  const [newChurchName, setNewChurchName] = useState('');
  const [newChurchCity, setNewChurchCity] = useState('');
  const [newChurchState, setNewChurchState] = useState('SP');
  const [newChurchDistrict, setNewChurchDistrict] = useState('');
  const [newChurchLogin, setNewChurchLogin] = useState('');
  const [newChurchPassword, setNewChurchPassword] = useState('');
  const [newChurchContact, setNewChurchContact] = useState('');

  const activeChurch = getActiveChurchProfile();
  const registeredAccounts = getStoredChurchAccounts();

  // Handlers
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!username.trim() || !password.trim()) {
      setError('Por favor, digite o usuário e a senha de acesso.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const user = authenticateCredentials(username, password);
      if (user) {
        user.rememberMe = rememberMe;
        saveAuthSession(user, rememberMe);
        onLoginSuccess(user);
      } else {
        setError('Usuário ou senha incorretos. Acesso restrito a congregações cadastradas e desenvolvedores.');
        setIsLoading(false);
      }
    }, 250);
  };

  const handleRegisterChurchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!newChurchName.trim()) {
      setError('Informe o nome da igreja adventista.');
      return;
    }
    if (!newChurchLogin.trim()) {
      setError('Informe o login de acesso que esta igreja usará.');
      return;
    }
    if (!newChurchPassword.trim() || newChurchPassword.length < 4) {
      setError('A senha deve conter no mínimo 4 caracteres.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = registerNewChurchAccount({
        name: newChurchName,
        login: newChurchLogin,
        password: newChurchPassword,
        city: newChurchCity,
        state: newChurchState,
        district: newChurchDistrict,
        adminContact: newChurchContact,
      });

      if (!res.success) {
        setError(res.message);
        setIsLoading(false);
        return;
      }

      // Automatically authenticate as this new church
      const authenticatedUser = authenticateCredentials(newChurchLogin, newChurchPassword);
      if (authenticatedUser) {
        authenticatedUser.rememberMe = rememberMe;
        saveAuthSession(authenticatedUser, rememberMe);
        setSuccessMessage(res.message);
        setTimeout(() => {
          onLoginSuccess(authenticatedUser);
        }, 300);
      } else {
        setIsLoading(false);
        setActiveMode('login');
        setUsername(newChurchLogin);
        setSuccessMessage('Igreja cadastrada! Digite sua senha para entrar.');
      }
    }, 300);
  };

  const handleFillDemo = (login: string, pass: string) => {
    setUsername(login);
    setPassword(pass);
    setError(null);
    setShowCredentialsHelper(false);
  };

  return (
    <div className="app-aurora-bg min-h-screen w-full text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background Decorative Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[600px] h-96 sm:h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 animate-fade-slide-up">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="logo-breathe inline-flex p-3.5 rounded-3xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-purple-600 text-white shadow-xl shadow-blue-900/40 border border-blue-400/20 mb-3">
            <Church className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gradient-brand tracking-tight">
            Sonoplastia IASD
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Sistema Multi-Igrejas de Liturgia, Som & Telão
          </p>
        </div>

        {/* Main Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 card-lift">
          {/* Mode Selector (Login vs Cadastrar Nova Igreja) */}
          <div className="flex p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMode === 'login'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Entrar no Sistema</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('register');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMode === 'register'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cadastrar Nova Igreja</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE 1: LOGIN FORM */}
          {activeMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Login da Igreja ou Desenvolvedor</span>
                  <span className="text-[10px] text-slate-500 font-normal">Ex: iasdvilanova ou dev</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nome de usuário / login da igreja"
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-950/90 border border-slate-700/90 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Senha de Acesso</span>
                  <span className="text-[10px] text-slate-500 font-normal">Ex: iasd123 ou dev2026</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha de congregação"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/90 border border-slate-700/90 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Manter Conectado Checkbox */}
              <div className="pt-0.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 transition-all cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                      Manter conectado neste computador
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Entrar direto na liturgia nas próximas sessões
                    </span>
                  </div>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar na Liturgia</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 2: REGISTER NEW CHURCH FORM */}
          {activeMode === 'register' && (
            <form onSubmit={handleRegisterChurchSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Nome da Igreja *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={newChurchName}
                    onChange={(e) => {
                      setNewChurchName(e.target.value);
                      // Sugestão de login automático
                      if (!newChurchLogin || newChurchLogin === 'iasd') {
                        const sug = e.target.value
                          .toLowerCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/[^a-z0-9]/g, '');
                        if (sug) setNewChurchLogin(sug);
                      }
                    }}
                    placeholder="Ex: IASD Jardim América"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-950/90 border border-slate-700/90 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={newChurchCity}
                    onChange={(e) => setNewChurchCity(e.target.value)}
                    placeholder="Ex: Campinas"
                    className="w-full px-3 py-2 bg-slate-950/90 border border-slate-700/90 rounded-2xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Estado (UF)
                  </label>
                  <input
                    type="text"
                    value={newChurchState}
                    onChange={(e) => setNewChurchState(e.target.value.toUpperCase())}
                    maxLength={2}
                    placeholder="SP"
                    className="w-full px-3 py-2 bg-slate-950/90 border border-slate-700/90 rounded-2xl text-white text-xs uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Login de Acesso *
                  </label>
                  <input
                    type="text"
                    value={newChurchLogin}
                    onChange={(e) => setNewChurchLogin(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="Ex: iasdjardimamerica"
                    className="w-full px-3 py-2 bg-slate-950/90 border border-slate-700/90 rounded-2xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Senha da Igreja *
                  </label>
                  <input
                    type="text"
                    value={newChurchPassword}
                    onChange={(e) => setNewChurchPassword(e.target.value)}
                    placeholder="Mín. 4 caracteres"
                    className="w-full px-3 py-2 bg-slate-950/90 border border-slate-700/90 rounded-2xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Responsável / Diretor do Som (opcional)
                </label>
                <input
                  type="text"
                  value={newChurchContact}
                  onChange={(e) => setNewChurchContact(e.target.value)}
                  placeholder="Ex: Irmão Marcos (11 98888-7777)"
                  className="w-full px-3 py-2 bg-slate-950/90 border border-slate-700/90 rounded-2xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Submit Register Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Cadastrando congregação...</span>
                  </>
                ) : (
                  <>
                    <span>Cadastrar e Entrar na Liturgia</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Credentials Helper Toggle (Accordion) */}
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowCredentialsHelper(!showCredentialsHelper)}
              className="w-full py-1.5 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                <span>Ver logins do Desenvolvedor e Congregações</span>
              </span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                {showCredentialsHelper ? 'Ocultar' : 'Ver'}
              </span>
            </button>

            {showCredentialsHelper && (
              <div className="mt-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2.5 animate-in fade-in duration-150">
                {/* Dev Universal Master */}
                <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Desenvolvedor Universal (Master)</span>
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                      Login: <strong className="text-white">dev</strong> • Senha: <strong className="text-white">dev2026</strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFillDemo('dev', 'dev2026')}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-bold border border-amber-500/40 cursor-pointer"
                  >
                    Usar
                  </button>
                </div>

                {/* Preconfigured Church Accounts */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Igrejas Ativas no Sistema:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {registeredAccounts.map((acc) => (
                      <div 
                        key={acc.id}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-1"
                      >
                        <div className="truncate">
                          <div className="font-semibold text-slate-200 text-xs truncate">{acc.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {acc.login} • {acc.password}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleFillDemo(acc.login, acc.password)}
                          className="px-2 py-0.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-[10px] font-bold border border-blue-500/30 shrink-0 cursor-pointer"
                        >
                          Usar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-500 mt-4">
          Igreja Adventista do Sétimo Dia • Plataforma Multi-Igrejas
        </p>
      </div>
    </div>
  );
};
