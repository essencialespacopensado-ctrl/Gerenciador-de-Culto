import React, { useState, useEffect } from 'react';
import { 
  Church, Shield, KeyRound, UserCheck, LogOut, CheckCircle2, 
  Copy, ExternalLink, Phone, MessageSquare, Mail, MapPin, 
  Calendar, Edit3, Plus, Search, FileText, Printer, 
  Share2, Save, RotateCcw, AlertTriangle, Terminal, 
  Cpu, HardDrive, Download, Upload, Eye, EyeOff, Sparkles,
  Building2, Users, Music, Mic2, Clock, Check, X
} from 'lucide-react';
import { 
  ChurchDetails, PastorRecommendation, AuthUser, UserRole, 
  RecommendationType, RecommendationStatus 
} from '../types';
import { 
  getStoredChurchDetails, saveStoredChurchDetails, 
  getStoredRecommendations, saveStoredRecommendations, 
  getStoredAuthSession, saveAuthSession, 
  authenticateCredentials, PRECONFIGURED_ACCOUNTS,
  DEFAULT_CHURCH_DETAILS
} from '../utils/churchAdminStorage';
import { SimultaneousChurchesManager } from './SimultaneousChurchesManager';

interface ChurchAdminViewProps {
  onNotify?: (msg: string) => void;
}

export const ChurchAdminView: React.FC<ChurchAdminViewProps> = ({ onNotify }) => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredAuthSession());
  const [loginRole, setLoginRole] = useState<UserRole>('user');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState<string | null>(null);

  // Sub-tabs within Church Admin
  const [activeSubSection, setActiveSubSection] = useState<'church_data' | 'simultaneous_churches' | 'pastor_letters' | 'developer_panel'>('church_data');

  // Church Details State
  const [church, setChurch] = useState<ChurchDetails>(() => getStoredChurchDetails());
  const [isEditingChurch, setIsEditingChurch] = useState(false);
  const [churchForm, setChurchForm] = useState<ChurchDetails>(church);
  const [churchSaveSuccess, setChurchSaveSuccess] = useState(false);

  // Recommendations / Pastoral Letters State
  const [recommendations, setRecommendations] = useState<PastorRecommendation[]>(() => getStoredRecommendations());
  const [selectedFilterType, setSelectedFilterType] = useState<string>('all');
  const [letterSearchQuery, setLetterSearchQuery] = useState('');
  
  // Modals
  const [isNewLetterModalOpen, setIsNewLetterModalOpen] = useState(false);
  const [viewingLetter, setViewingLetter] = useState<PastorRecommendation | null>(null);
  const [editingLetter, setEditingLetter] = useState<PastorRecommendation | null>(null);

  // Developer Panel State
  const [devPingStatus, setDevPingStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [devPingLatency, setDevPingLatency] = useState<number | null>(null);
  const [devLogs, setDevLogs] = useState<string[]>([
    'Servidor Express ativo na porta 3000',
    'Vite integrando frontend e backend',
    'Payload JSON estendido para 35MB para upload de imagens da escala',
    'Fallback litúrgico e musical da IASD operacional'
  ]);

  // Sync to storage when recommendations change
  const handleSaveRecommendations = (newList: PastorRecommendation[]) => {
    setRecommendations(newList);
    saveStoredRecommendations(newList);
  };

  // Login handler
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);

    const user = authenticateCredentials(usernameInput, passwordInput);
    if (user) {
      setCurrentUser(user);
      saveAuthSession(user);
      setLoginSuccessMessage(`Bem-vindo(a), ${user.name}!`);
      setUsernameInput('');
      setPasswordInput('');
      setTimeout(() => setLoginSuccessMessage(null), 3000);
      if (user.role === 'developer') {
        setActiveSubSection('developer_panel');
      } else {
        setActiveSubSection('church_data');
      }
    } else {
      setLoginError('Usuário ou senha incorretos. Verifique as credenciais.');
    }
  };

  // Quick login helper
  const handleQuickLogin = (role: UserRole) => {
    const acc = PRECONFIGURED_ACCOUNTS[role];
    const user = authenticateCredentials(acc.username, acc.password);
    if (user) {
      setCurrentUser(user);
      saveAuthSession(user);
      setLoginError(null);
      setLoginSuccessMessage(`Conectado como ${acc.name}!`);
      setTimeout(() => setLoginSuccessMessage(null), 3000);
      if (role === 'developer') {
        setActiveSubSection('developer_panel');
      } else {
        setActiveSubSection('church_data');
      }
    }
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    saveAuthSession(null);
    setActiveSubSection('church_data');
  };

  // Church save
  const handleSaveChurchDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setChurch(churchForm);
    saveStoredChurchDetails(churchForm);
    setIsEditingChurch(false);
    setChurchSaveSuccess(true);
    setTimeout(() => setChurchSaveSuccess(false), 3000);
  };

  // Copy church card text
  const handleCopyChurchCard = () => {
    const text = `🏛️ *${church.name}*
Distrito: ${church.district} • ${church.association}
📍 Endereço: ${church.address}, ${church.neighborhood} - ${church.city}/${church.state} (CEP: ${church.zipCode})
👤 Pastor Distrital: ${church.pastorName} (${church.pastorPhone})
⛪ 1º Ancião: ${church.headElderName} (${church.headElderPhone})
🕒 Cultos: ${church.regularServiceTimes}
🌐 YouTube: ${church.youtubeChannelUrl || 'Não informado'}
📷 Instagram: ${church.instagramUrl || 'Não informado'}
📶 Wi-Fi da Igreja: ${church.wifiCredentials || 'Consulte os diáconos'}`;

    navigator.clipboard.writeText(text);
    alert('Ficha oficial da igreja copiada para a área de transferência!');
  };

  // Letter Form State
  const [letterForm, setLetterForm] = useState<Partial<PastorRecommendation>>({
    type: 'pregador',
    status: 'approved',
    title: 'Carta de Recomendação Eclesiástica',
    recommendedPerson: '',
    originChurch: church.name,
    destinationChurch: '',
    serviceDate: 'Próximo Sábado',
    pastorName: church.pastorName,
    pastorPhone: church.pastorPhone,
    pastorDistrict: church.district,
    ministryOrTalent: 'Sermão Bíblico',
    content: '',
    observations: '',
    isOfficialLetter: true
  });

  // Open New Letter Modal with Pre-fill
  const handleOpenNewLetter = (type: RecommendationType = 'pregador') => {
    let defaultContent = '';
    let defaultTitle = '';
    let defaultMinistry = '';

    if (type === 'pregador') {
      defaultTitle = 'Carta de Recomendação para Pregador Visitante';
      defaultMinistry = 'Pregação da Palavra de Deus (Culto Divino)';
      defaultContent = `Saudações na bendita esperança do retorno de Jesus! Por meio desta, recomendamos o estimado irmão à vossa congregação, atestando que se trata de membro regular em plena comunhão com a Igreja Adventista do Sétimo Dia, zeloso na doutrina e consagrado na ministração da Palavra.`;
    } else if (type === 'musica_louvor') {
      defaultTitle = 'Recomendação Eclesiástica para Grupo Musical / Louvor';
      defaultMinistry = 'Ministério Musical e Louvor Congregacional';
      defaultContent = `É com muita alegria que recomendamos os irmãos para a programação musical em vossa congregação. Todos são membros ativos e consagrados, cujos talentos e repertório estão em total conformidade com as diretrizes e filosofia de música da Igreja Adventista.`;
    } else {
      defaultTitle = 'Comunicado Pastoral Oficial';
      defaultMinistry = 'Orientações Pastorais para Sonoplastia e Liturgia';
      defaultContent = `Estimada equipe de louvor e sonoplastia da igreja: Gostaria de alinhar com vocês as diretrizes para a liturgia do próximo culto solene.`;
    }

    setLetterForm({
      type,
      status: 'approved',
      title: defaultTitle,
      recommendedPerson: '',
      originChurch: church.name,
      destinationChurch: 'IASD Destino',
      serviceDate: 'Próximo Sábado',
      pastorName: church.pastorName,
      pastorPhone: church.pastorPhone,
      pastorDistrict: church.district,
      ministryOrTalent: defaultMinistry,
      content: defaultContent,
      observations: 'Recomendação emitida com o consentimento da comissão da igreja.',
      isOfficialLetter: true
    });
    setEditingLetter(null);
    setIsNewLetterModalOpen(true);
  };

  // Submit Letter Form
  const handleSaveLetterForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!letterForm.recommendedPerson || !letterForm.content) {
      alert('Por favor, preencha o nome do recomendado/destinatário e o texto da recomendação.');
      return;
    }

    if (editingLetter) {
      const updated = recommendations.map(rec => 
        rec.id === editingLetter.id 
          ? ({ ...rec, ...letterForm } as PastorRecommendation)
          : rec
      );
      handleSaveRecommendations(updated);
    } else {
      const newLetter: PastorRecommendation = {
        id: `rec-${Date.now()}`,
        code: `REC-2026-${Math.floor(100 + Math.random() * 900)}`,
        type: letterForm.type as RecommendationType || 'pregador',
        status: letterForm.status as RecommendationStatus || 'approved',
        title: letterForm.title || 'Carta de Recomendação',
        recommendedPerson: letterForm.recommendedPerson || '',
        originChurch: letterForm.originChurch || church.name,
        destinationChurch: letterForm.destinationChurch || 'IASD',
        serviceDate: letterForm.serviceDate || 'Próximo Sábado',
        pastorName: letterForm.pastorName || church.pastorName,
        pastorPhone: letterForm.pastorPhone || church.pastorPhone,
        pastorDistrict: letterForm.pastorDistrict || church.district,
        ministryOrTalent: letterForm.ministryOrTalent || 'Ministério',
        content: letterForm.content || '',
        observations: letterForm.observations || '',
        issuedAt: new Date().toISOString().split('T')[0],
        isOfficialLetter: true
      };
      handleSaveRecommendations([newLetter, ...recommendations]);
    }

    setIsNewLetterModalOpen(false);
    setEditingLetter(null);
  };

  // Delete Letter
  const handleDeleteLetter = (id: string) => {
    if (confirm('Deseja realmente remover esta carta de recomendação?')) {
      handleSaveRecommendations(recommendations.filter(r => r.id !== id));
    }
  };

  // Copy Letter Text
  const handleCopyLetter = (rec: PastorRecommendation) => {
    const text = `📜 *${rec.title.toUpperCase()}*
Código de Registro: ${rec.code}
Igreja Emissora: ${rec.originChurch}
Igreja de Destino: ${rec.destinationChurch}
Data Prevista: ${rec.serviceDate}

👤 Recomendado: *${rec.recommendedPerson}*
Ministério / Dom: ${rec.ministryOrTalent}

📄 *Texto Oficial:*
"${rec.content}"

${rec.observations ? `📌 Observações: ${rec.observations}\n` : ''}
✍️ Pastor Responsável: ${rec.pastorName} (${rec.pastorPhone})
Distrito: ${rec.pastorDistrict || church.district}
Emitido em: ${rec.issuedAt}`;

    navigator.clipboard.writeText(text);
    alert('Carta de recomendação copiada com sucesso!');
  };

  // Share on WhatsApp
  const handleWhatsAppShare = (rec: PastorRecommendation) => {
    const text = `📜 *${rec.title.toUpperCase()}* (%23${rec.code})%0A%0A` +
      `👤 *Recomendado:* ${encodeURIComponent(rec.recommendedPerson)}%0A` +
      `⛪ *Origem:* ${encodeURIComponent(rec.originChurch)} -> *Destino:* ${encodeURIComponent(rec.destinationChurch)}%0A` +
      `🗓️ *Data:* ${encodeURIComponent(rec.serviceDate)}%0A` +
      `🎙️ *Ministério:* ${encodeURIComponent(rec.ministryOrTalent)}%0A%0A` +
      `📄 *Conteúdo da Recomendação:*%0A"${encodeURIComponent(rec.content)}"%0A%0A` +
      `✍️ *Pastor:* ${encodeURIComponent(rec.pastorName)} (${encodeURIComponent(rec.pastorPhone)})`;

    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Developer Test Ping
  const handleRunDevPing = async () => {
    setDevPingStatus('testing');
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      const end = performance.now();
      const lat = Math.round(end - start);
      setDevPingLatency(lat);
      setDevPingStatus(res.ok ? 'ok' : 'error');
      setDevLogs(prev => [
        `[${new Date().toLocaleTimeString()}] Health Ping OK (${lat}ms) - Servidor ativo`,
        ...prev.slice(0, 10)
      ]);
    } catch (e: any) {
      setDevPingStatus('error');
      setDevLogs(prev => [
        `[${new Date().toLocaleTimeString()}] Erro no Health Ping: ${e.message}`,
        ...prev.slice(0, 10)
      ]);
    }
  };

  // Developer Download Backup
  const handleDownloadBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      church: getStoredChurchDetails(),
      recommendations: getStoredRecommendations(),
      program: localStorage.getItem('adventist_worship_program_v1'),
      teamMembers: localStorage.getItem('adventist_team_scale_members_v1'),
      scaleSettings: localStorage.getItem('adventist_team_scale_settings_v1')
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-iasd-liturgia-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter recommendations
  const filteredRecommendations = recommendations.filter(rec => {
    const matchesFilter = selectedFilterType === 'all' || rec.type === selectedFilterType;
    const matchesSearch = 
      rec.recommendedPerson.toLowerCase().includes(letterSearchQuery.toLowerCase()) ||
      rec.title.toLowerCase().includes(letterSearchQuery.toLowerCase()) ||
      rec.originChurch.toLowerCase().includes(letterSearchQuery.toLowerCase()) ||
      rec.destinationChurch.toLowerCase().includes(letterSearchQuery.toLowerCase()) ||
      rec.pastorName.toLowerCase().includes(letterSearchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* TOP BANNER & AUTHENTICATION BAR */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 md:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  PORTAL DA IGREJA & ACESSO RESTRITO
                </span>
                {currentUser && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black border flex items-center gap-1 ${
                    currentUser.role === 'developer'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Sessão Ativa: {currentUser.role === 'developer' ? 'Desenvolvedor' : 'Usuário da Igreja'}
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {church.name}
              </h2>
              <p className="text-sm text-slate-300 max-w-2xl font-medium">
                Gestão dos dados oficiais da congregação, canais pastorais e emissão de cartas de recomendação para pregadores, músicos e visitantes.
              </p>
            </div>

            {/* Quick Session Status / Logout / Switch */}
            <div className="shrink-0 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col gap-2 min-w-[240px]">
              {currentUser ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        currentUser.role === 'developer' ? 'bg-amber-500 text-slate-950' : 'bg-blue-500 text-white'
                      }`}>
                        {currentUser.role === 'developer' ? <Terminal className="w-4 h-4" /> : <Church className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight">{currentUser.name}</p>
                        <p className="text-[10px] text-slate-300">@{currentUser.username}</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Encerrar Sessão
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-center md:text-left">
                  <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5 justify-center md:justify-start">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    Área Protegida por Senha
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Acesse com login de <b>Usuário</b> ou <b>Desenvolvedor</b> abaixo.
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => handleQuickLogin('user')}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                    >
                      Entrar Igreja
                    </button>
                    <button
                      onClick={() => handleQuickLogin('developer')}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                    >
                      Entrar Dev
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubSection('church_data')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeSubSection === 'church_data'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Dados da Igreja
          </button>

          <button
            onClick={() => setActiveSubSection('simultaneous_churches')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeSubSection === 'simultaneous_churches'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <KeyRound className="w-4 h-4 text-emerald-600" />
            Igrejas & Acessos Simultâneos
          </button>

          <button
            onClick={() => setActiveSubSection('pastor_letters')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeSubSection === 'pastor_letters'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-4 h-4 text-purple-600" />
            Cartas de Recomendação dos Pastores ({recommendations.length})
          </button>

          <button
            onClick={() => setActiveSubSection('developer_panel')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeSubSection === 'developer_panel'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Terminal className="w-4 h-4 text-amber-600" />
            Painel do Desenvolvedor
            {currentUser?.role === 'developer' && (
              <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-950 text-[10px] font-black">
                ATIVO
              </span>
            )}
          </button>
        </div>
      </div>

      {/* LOGIN BOX: Visible if NOT authenticated or when user explicitly wants to authenticate */}
      {!currentUser && (
        <div className="bg-white rounded-3xl border-2 border-blue-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  Acesso Restrito ao Sistema
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Faça login para editar as informações da congregação, emitir cartas de recomendação ou acessar as ferramentas técnicas.
              </p>
            </div>

            {/* Role switch toggle */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setLoginRole('user')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  loginRole === 'user' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Usuário da Igreja
              </button>
              <button
                type="button"
                onClick={() => setLoginRole('developer')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  loginRole === 'developer' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Desenvolvedor
              </button>
            </div>
          </div>

          {/* Quick Credential Hints Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-slate-800">
                Credenciais Padrão Pré-configuradas:
              </p>
              <div className="flex flex-wrap items-center gap-4 text-slate-600">
                <span>
                  👤 <b>Usuário:</b> <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-bold">igreja</code> | Senha: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-bold">iasd123</code>
                </span>
                <span>
                  🛠️ <b>Desenvolvedor:</b> <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-bold">dev</code> | Senha: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-bold">dev2026</code>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin(loginRole)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Preencher e Entrar (1 Clique)
              </button>
            </div>
          </div>

          {/* Manual Login Form */}
          <form onSubmit={handleLogin} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome de Usuário / Identificador
              </label>
              <input
                type="text"
                placeholder={loginRole === 'user' ? 'ex: igreja ou usuario' : 'ex: dev'}
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Senha de Acesso
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={loginRole === 'user' ? 'Senha do usuário' : 'Senha do desenvolvedor'}
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                Acessar Sistema
              </button>
            </div>
          </form>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {loginError}
            </div>
          )}

          {loginSuccessMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {loginSuccessMessage}
            </div>
          )}
        </div>
      )}

      {/* SUB-SECTION 1: DADOS DA IGREJA */}
      {activeSubSection === 'church_data' && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Church className="w-5 h-5 text-blue-600" />
                Ficha Cadastral da Congregação
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Mantenha os canais e contatos eclesiásticos atualizados para a equipe e visitantes
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCopyChurchCard}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copiar dados para enviar no WhatsApp"
              >
                <Copy className="w-4 h-4" />
                Copiar Ficha
              </button>

              {!isEditingChurch ? (
                <button
                  onClick={() => {
                    setChurchForm(church);
                    setIsEditingChurch(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar Dados da Igreja
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingChurch(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar Edição
                </button>
              )}
            </div>
          </div>

          {churchSaveSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-black flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              Dados da igreja salvos com sucesso no sistema!
            </div>
          )}

          {/* VIEW OR EDIT MODE */}
          {!isEditingChurch ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Identificação e Liderança Pastoral */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Church className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">
                    Organização & Liderança
                  </h4>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Nome Oficial</span>
                    <p className="font-black text-slate-900 text-sm">{church.name}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Distrito Pastoral</span>
                    <p className="font-semibold text-slate-800">{church.district}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Associação & União</span>
                    <p className="font-semibold text-slate-800">{church.association} • {church.union}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Pastor Distrital</span>
                    <p className="font-black text-blue-950 text-sm">{church.pastorName}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <a
                        href={`https://api.whatsapp.com/send?phone=55${church.pastorPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg hover:bg-emerald-100 border border-emerald-200"
                      >
                        <MessageSquare className="w-3 h-3" />
                        WhatsApp: {church.pastorPhone}
                      </a>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">1º Ancião / Líder Local</span>
                    <p className="font-bold text-slate-800">{church.headElderName}</p>
                    <p className="text-slate-600">{church.headElderPhone}</p>
                  </div>
                </div>
              </div>

              {/* Card 2: Localização, Horários e Wi-Fi */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">
                    Localização & Cultos
                  </h4>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Endereço do Templo</span>
                    <p className="font-semibold text-slate-800">
                      {church.address}, {church.neighborhood}
                    </p>
                    <p className="text-slate-600">{church.city} - {church.state} • CEP {church.zipCode}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Horários dos Cultos</span>
                    <p className="font-semibold text-slate-800 leading-relaxed">
                      {church.regularServiceTimes}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Rede Wi-Fi do Templo</span>
                    <p className="font-mono bg-slate-100 p-2 rounded-xl text-[11px] font-bold text-slate-700">
                      {church.wifiCredentials || 'Não cadastrado'}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Capacidade do Templo</span>
                    <p className="font-bold text-slate-800">{church.capacity ? `${church.capacity} lugares sentados` : '280 pessoas'}</p>
                  </div>
                </div>
              </div>

              {/* Card 3: Sonoplastia, Mídia & Canais Oficiais */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Mic2 className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">
                    Sonoplastia & Canais
                  </h4>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Diretor de Sonoplastia</span>
                    <p className="font-bold text-slate-800">{church.soundDirectorName}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Direção de Louvor & Vozes</span>
                    <p className="font-bold text-slate-800">{church.musicDirectorName}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Canais Oficiais</span>
                    {church.youtubeChannelUrl && (
                      <a
                        href={church.youtubeChannelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-red-600 font-bold hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Canal do YouTube (Transmissões)
                      </a>
                    )}
                    {church.instagramUrl && (
                      <a
                        href={church.instagramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-pink-600 font-bold hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Instagram da Igreja
                      </a>
                    )}
                    {church.driveFolderUrl && (
                      <a
                        href={church.driveFolderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-blue-600 font-bold hover:underline"
                      >
                        <HardDrive className="w-3.5 h-3.5" />
                        Pasta Google Drive (Mídias & Letras)
                      </a>
                    )}
                  </div>

                  {church.notes && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">Equipamentos & Notas</span>
                      <p className="text-slate-600 italic">{church.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* EDIT FORM */
            <form onSubmit={handleSaveChurchDetails} className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h4 className="text-base font-black text-slate-900">
                  Editar Informações Oficiais da Igreja
                </h4>
                <span className="text-xs text-slate-500">
                  Todos os campos são salvos localmente
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome da Igreja / Congregação</label>
                  <input
                    type="text"
                    value={churchForm.name}
                    onChange={e => setChurchForm({ ...churchForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Distrito Pastoral</label>
                  <input
                    type="text"
                    value={churchForm.district}
                    onChange={e => setChurchForm({ ...churchForm, district: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Associação / Missão</label>
                  <input
                    type="text"
                    value={churchForm.association}
                    onChange={e => setChurchForm({ ...churchForm, association: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">União</label>
                  <input
                    type="text"
                    value={churchForm.union}
                    onChange={e => setChurchForm({ ...churchForm, union: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pastor Distrital (Nome)</label>
                  <input
                    type="text"
                    value={churchForm.pastorName}
                    onChange={e => setChurchForm({ ...churchForm, pastorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">WhatsApp / Telefone do Pastor</label>
                  <input
                    type="text"
                    value={churchForm.pastorPhone}
                    onChange={e => setChurchForm({ ...churchForm, pastorPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">E-mail do Pastor</label>
                  <input
                    type="email"
                    value={churchForm.pastorEmail}
                    onChange={e => setChurchForm({ ...churchForm, pastorEmail: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">1º Ancião (Nome)</label>
                  <input
                    type="text"
                    value={churchForm.headElderName}
                    onChange={e => setChurchForm({ ...churchForm, headElderName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone do 1º Ancião</label>
                  <input
                    type="text"
                    value={churchForm.headElderPhone}
                    onChange={e => setChurchForm({ ...churchForm, headElderPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Diretor de Sonoplastia</label>
                  <input
                    type="text"
                    value={churchForm.soundDirectorName}
                    onChange={e => setChurchForm({ ...churchForm, soundDirectorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Diretor de Louvor</label>
                  <input
                    type="text"
                    value={churchForm.musicDirectorName}
                    onChange={e => setChurchForm({ ...churchForm, musicDirectorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Endereço (Rua e Número)</label>
                  <input
                    type="text"
                    value={churchForm.address}
                    onChange={e => setChurchForm({ ...churchForm, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bairro, Cidade e UF</label>
                  <input
                    type="text"
                    value={`${churchForm.neighborhood} - ${churchForm.city}/${churchForm.state}`}
                    onChange={e => {
                      const parts = e.target.value.split('-');
                      setChurchForm({
                        ...churchForm,
                        neighborhood: parts[0]?.trim() || '',
                        city: parts[1]?.trim() || churchForm.city
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">CEP</label>
                  <input
                    type="text"
                    value={churchForm.zipCode}
                    onChange={e => setChurchForm({ ...churchForm, zipCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Wi-Fi (Rede e Senha)</label>
                  <input
                    type="text"
                    value={churchForm.wifiCredentials || ''}
                    onChange={e => setChurchForm({ ...churchForm, wifiCredentials: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">Horários dos Cultos Regulares</label>
                  <input
                    type="text"
                    value={churchForm.regularServiceTimes}
                    onChange={e => setChurchForm({ ...churchForm, regularServiceTimes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">Notas sobre Som, Projeção e Equipamentos</label>
                  <textarea
                    rows={2}
                    value={churchForm.notes || ''}
                    onChange={e => setChurchForm({ ...churchForm, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingChurch(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* SUB-SECTION 2: CARTAS DE RECOMENDAÇÃO DOS PASTORES */}
      {activeSubSection === 'pastor_letters' && (
        <div className="space-y-6">
          {/* Header & New Letter Bar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  Cartas de Recomendação Pastoral & Comunicados
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Área oficial para comunicação entre pastores, validação de pregadores convidados, solistas e grupos musicais visitantes.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleOpenNewLetter('pregador')}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Nova Carta de Pregador
              </button>
              <button
                onClick={() => handleOpenNewLetter('musica_louvor')}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Nova Carta de Louvor
              </button>
              <button
                onClick={() => handleOpenNewLetter('comunicado_pastoral')}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Comunicado Pastoral
              </button>
            </div>
          </div>

          {/* Search & Filter Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedFilterType('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  selectedFilterType === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas ({recommendations.length})
              </button>
              <button
                onClick={() => setSelectedFilterType('pregador')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  selectedFilterType === 'pregador'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pregadores Convidados
              </button>
              <button
                onClick={() => setSelectedFilterType('musica_louvor')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  selectedFilterType === 'musica_louvor'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Música & Louvor
              </button>
              <button
                onClick={() => setSelectedFilterType('comunicado_pastoral')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  selectedFilterType === 'comunicado_pastoral'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Comunicados Pastorais
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nome, igreja, pastor..."
                value={letterSearchQuery}
                onChange={e => setLetterSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Letters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredRecommendations.map(rec => (
              <div
                key={rec.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition-all relative overflow-hidden"
              >
                {/* Top Badge Strip */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {rec.code}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      rec.type === 'pregador'
                        ? 'bg-purple-100 text-purple-800'
                        : rec.type === 'musica_louvor'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {rec.type === 'pregador' ? 'Pregador Visitante' : rec.type === 'musica_louvor' ? 'Ministério de Música' : 'Comunicado Pastoral'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-slate-900 leading-snug">
                      {rec.title}
                    </h4>
                    <p className="text-xs font-bold text-slate-700 mt-1">
                      Recomendado: <span className="text-blue-700 font-extrabold">{rec.recommendedPerson}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 font-bold block text-[9px] uppercase">Origem</span>
                      <p className="font-semibold text-slate-800 truncate" title={rec.originChurch}>{rec.originChurch}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[9px] uppercase">Destino</span>
                      <p className="font-semibold text-slate-800 truncate" title={rec.destinationChurch}>{rec.destinationChurch}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[9px] uppercase">Data do Culto</span>
                      <p className="font-semibold text-slate-800">{rec.serviceDate}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[9px] uppercase">Ministério / Dom</span>
                      <p className="font-semibold text-slate-800 truncate" title={rec.ministryOrTalent}>{rec.ministryOrTalent}</p>
                    </div>
                  </div>

                  {/* Letter Content Preview */}
                  <div className="text-xs text-slate-600 bg-amber-50/60 border border-amber-200/60 p-3.5 rounded-2xl relative italic">
                    <p className="line-clamp-3">
                      "{rec.content}"
                    </p>
                  </div>

                  {/* Pastor Signature Info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>
                      ✍️ <b>{rec.pastorName}</b>
                    </span>
                    <span>Emitida em {rec.issuedAt}</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setViewingLetter(rec)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Visualizar Carta Completa"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Visualizar
                    </button>
                    <button
                      onClick={() => handleCopyLetter(rec)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Copiar texto"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copiar
                    </button>
                    <button
                      onClick={() => handleWhatsAppShare(rec)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-emerald-200"
                      title="Compartilhar no WhatsApp do Pastor"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      WhatsApp
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingLetter(rec);
                        setLetterForm(rec);
                        setIsNewLetterModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Editar Carta"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteLetter(rec.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Remover Carta"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredRecommendations.length === 0 && (
              <div className="col-span-full bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-600">
                  Nenhuma carta de recomendação encontrada para os filtros aplicados.
                </p>
                <button
                  onClick={() => handleOpenNewLetter('pregador')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                >
                  Emitir Nova Carta Agora
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-SECTION 3: PAINEL DO DESENVOLVEDOR */}
      {activeSubSection === 'developer_panel' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 md:p-8 rounded-3xl border border-slate-800 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    Central de Diagnóstico & Suporte Técnico
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950 uppercase">
                      Dev Tools
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Monitoramento de conectividade, backups da aplicação e saúde dos modelos Gemini
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleRunDevPing}
                  disabled={devPingStatus === 'testing'}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Cpu className="w-4 h-4" />
                  {devPingStatus === 'testing' ? 'Testando API...' : 'Testar Latência do Servidor'}
                </button>

                <button
                  onClick={handleDownloadBackup}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Baixar Backup JSON
                </button>
              </div>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Servidor Local</span>
                <p className="text-emerald-400 font-mono font-bold text-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Porta 3000 (Express)
                </p>
                <p className="text-[11px] text-slate-400">Payload Max: 35MB</p>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Gemini Fallback</span>
                <p className="text-blue-400 font-mono font-bold text-sm">
                  gemini-3.1-flash-lite
                </p>
                <p className="text-[11px] text-slate-400">Multi-modelos com 100% uptime</p>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Ping do Servidor</span>
                <p className="text-amber-400 font-mono font-bold text-sm">
                  {devPingLatency ? `${devPingLatency} ms` : 'Não testado'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Status: {devPingStatus === 'ok' ? 'Online' : devPingStatus === 'error' ? 'Falhou' : 'Pronto'}
                </p>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Armazenamento Local</span>
                <p className="text-purple-400 font-mono font-bold text-sm">
                  {recommendations.length} cartas salvas
                </p>
                <p className="text-[11px] text-slate-400">LocalStorage + IndexedDB</p>
              </div>
            </div>

            {/* Dev Logs Console */}
            <div className="space-y-2 pt-2">
              <span className="text-slate-400 text-xs font-bold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                Console de Eventos Técnicos
              </span>
              <div className="bg-black/60 font-mono text-xs text-slate-300 p-4 rounded-2xl border border-slate-800 max-h-48 overflow-y-auto space-y-1">
                {devLogs.map((log, idx) => (
                  <p key={idx} className="leading-relaxed">
                    <span className="text-emerald-400">»</span> {log}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION: IGREJAS & ACESSOS SIMULTÂNEOS */}
      {activeSubSection === 'simultaneous_churches' && (
        <SimultaneousChurchesManager 
          currentUser={currentUser} 
          onNotify={onNotify} 
        />
      )}

      {/* MODAL: NOVA CARTA / EDITAR CARTA */}
      {isNewLetterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden my-8">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingLetter ? 'Editar Carta de Recomendação' : 'Emitir Carta de Recomendação Pastoral'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Timbre oficial eclesiástico Adventista
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewLetterModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLetterForm} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Documento</label>
                  <select
                    value={letterForm.type}
                    onChange={e => setLetterForm({ ...letterForm, type: e.target.value as RecommendationType })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="pregador">Pregador Visitante</option>
                    <option value="musica_louvor">Grupo Musical / Cantor</option>
                    <option value="comunicado_pastoral">Comunicado Pastoral Oficial</option>
                    <option value="outro">Outra Recomendação</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Título do Documento</label>
                  <input
                    type="text"
                    value={letterForm.title}
                    onChange={e => setLetterForm({ ...letterForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome do Recomendado / Destinatário</label>
                  <input
                    type="text"
                    placeholder="Ex: Pr. João Silva, Quarteto Maranata..."
                    value={letterForm.recommendedPerson}
                    onChange={e => setLetterForm({ ...letterForm, recommendedPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ministério / Dom a Exercer</label>
                  <input
                    type="text"
                    placeholder="Ex: Sermão do Culto Divino, Mensagens Musicais..."
                    value={letterForm.ministryOrTalent}
                    onChange={e => setLetterForm({ ...letterForm, ministryOrTalent: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Igreja de Origem</label>
                  <input
                    type="text"
                    value={letterForm.originChurch}
                    onChange={e => setLetterForm({ ...letterForm, originChurch: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Igreja de Destino</label>
                  <input
                    type="text"
                    value={letterForm.destinationChurch}
                    onChange={e => setLetterForm({ ...letterForm, destinationChurch: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data Prevista do Culto</label>
                  <input
                    type="text"
                    placeholder="Ex: Próximo Sábado (10h15)"
                    value={letterForm.serviceDate}
                    onChange={e => setLetterForm({ ...letterForm, serviceDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pastor Emitente / Responsável</label>
                  <input
                    type="text"
                    value={letterForm.pastorName}
                    onChange={e => setLetterForm({ ...letterForm, pastorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Texto da Carta de Recomendação Eclesiástica
                </label>
                <textarea
                  rows={4}
                  value={letterForm.content}
                  onChange={e => setLetterForm({ ...letterForm, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="Redija o texto oficial recomendando a idoneidade, doutrina e ministério do membro..."
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações / Equipamentos / Ata</label>
                <input
                  type="text"
                  placeholder="Ex: Aprovado em Ata nº 12/2026. Necessitará de microfone sem fio."
                  value={letterForm.observations}
                  onChange={e => setLetterForm({ ...letterForm, observations: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewLetterModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Salvar e Registrar Carta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VISUALIZAÇÃO COM TIMBRE OFICIAL */}
      {viewingLetter && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden my-8 p-6 sm:p-8 space-y-6">
            {/* Eclesiastical Header */}
            <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                IGREJA ADVENTISTA DO SÉTIMO DIA
              </p>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase">
                {viewingLetter.title}
              </h3>
              <p className="text-xs text-slate-600 font-semibold">
                Registro Eclesiástico nº {viewingLetter.code} • Distrito de {viewingLetter.pastorDistrict || church.district}
              </p>
            </div>

            {/* Body */}
            <div className="space-y-4 text-xs leading-relaxed text-slate-800">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Recomendado(a)</span>
                  <p className="font-extrabold text-blue-900">{viewingLetter.recommendedPerson}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Ministério / Dom</span>
                  <p className="font-bold text-slate-800">{viewingLetter.ministryOrTalent}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Origem</span>
                  <p className="font-semibold text-slate-700">{viewingLetter.originChurch}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Destino</span>
                  <p className="font-semibold text-slate-700">{viewingLetter.destinationChurch}</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 text-slate-800 space-y-2">
                <p className="font-bold text-slate-900">À congregação receptora:</p>
                <p className="italic leading-relaxed">
                  "{viewingLetter.content}"
                </p>
              </div>

              {viewingLetter.observations && (
                <p className="text-slate-600 text-xs">
                  <b>Observações Adicionais:</b> {viewingLetter.observations}
                </p>
              )}

              {/* Pastor Signature Box */}
              <div className="pt-8 text-center space-y-1">
                <div className="w-56 mx-auto border-b border-slate-900" />
                <p className="font-black text-slate-900">{viewingLetter.pastorName}</p>
                <p className="text-[11px] text-slate-500 font-medium">Pastor Distrital / Ministro Ordenado</p>
                <p className="text-[11px] text-slate-500">Contato: {viewingLetter.pastorPhone}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-2">
              <button
                onClick={() => handleWhatsAppShare(viewingLetter)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                Compartilhar via WhatsApp
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyLetter(viewingLetter)}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir
                </button>
                <button
                  onClick={() => setViewingLetter(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
