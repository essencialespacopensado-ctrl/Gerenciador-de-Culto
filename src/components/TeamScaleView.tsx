import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, UserPlus, Image as ImageIcon, MessageSquare, Send, 
  Calendar, Clock, CheckCircle2, AlertCircle, Phone, Mail, 
  Trash2, Edit3, Eye, ZoomIn, ZoomOut, Upload, Copy, Check, 
  Sparkles, Church, Bell, Music, Sliders, ExternalLink, ShieldCheck, X,
  Loader2, RefreshCw, Wand2, RotateCcw
} from 'lucide-react';
import { TeamMember, ScaleSettings, TeamDepartment } from '../types';
import { 
  DEFAULT_TEAM_MEMBERS,
  loadTeamMembers, saveTeamMembers, 
  loadScaleSettings, saveScaleSettings, 
  loadScalePrintImage, saveScalePrintImage, removeScalePrintImage,
  buildDayBeforeMessage, buildTwoHoursBeforeMessage, 
  getWhatsAppReminderUrl, formatPhoneDisplay, formatPhoneForWhatsApp
} from '../utils/teamScaleStorage';

export const TeamScaleView: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>(() => loadTeamMembers());
  const [settings, setSettings] = useState<ScaleSettings>(() => loadScaleSettings());
  const [scaleImage, setScaleImage] = useState<string | null>(() => loadScalePrintImage());
  
  // AI Scanning state
  const [isScanningImage, setIsScanningImage] = useState(false);
  const [scanStatusMessage, setScanStatusMessage] = useState<string>('');
  const [scanSuccessSummary, setScanSuccessSummary] = useState<{
    count: number;
    churchName?: string | null;
    cultoDate?: string | null;
    time: string;
  } | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // UI filter & modals
  const [filterDepartment, setFilterDepartment] = useState<'all' | 'sonoplastia' | 'louvor' | 'scheduled'>('all');
  const [isEditingMemberModalOpen, setIsEditingMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isPreviewImageModalOpen, setIsPreviewImageModalOpen] = useState(false);
  
  // Message preview modal
  const [messageModal, setMessageModal] = useState<{
    isOpen: boolean;
    member: TeamMember | null;
    type: 'day_before' | 'two_hours';
    text: string;
  }>({
    isOpen: false,
    member: null,
    type: 'day_before',
    text: '',
  });

  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 4500);
  };

  // Sync members to storage
  useEffect(() => {
    saveTeamMembers(members);
  }, [members]);

  // Sync settings to storage
  useEffect(() => {
    saveScaleSettings(settings);
  }, [settings]);

  // Read scale image with Gemini Vision, replace and update team list
  const scanAndApplyScaleImage = async (dataUrl: string) => {
    setIsScanningImage(true);
    setScanStatusMessage('Lendo foto da escala com Inteligência Artificial...');

    try {
      const res = await fetch('/api/gemini/parse-scale-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Falha no processamento da imagem.');
      }

      const data = await res.json();

      if (data.members && Array.isArray(data.members) && data.members.length > 0) {
        const parsedMembers: TeamMember[] = data.members.map((m: any, idx: number) => {
          const cleanPhone = m.phone ? String(m.phone).replace(/[^0-9]/g, '') : '';
          const dept: TeamDepartment = m.department === 'louvor' ? 'louvor' : 'sonoplastia';
          return {
            id: `tm-${Date.now()}-${idx}`,
            name: (m.name || `Voluntário ${idx + 1}`).trim(),
            role: (m.role || (dept === 'louvor' ? 'Louvor' : 'Sonoplastia')).trim(),
            department: dept,
            phone: cleanPhone,
            email: '',
            isScheduled: true,
            scheduledDate: data.cultoDate || settings.cultoDate,
            notes: m.notes?.trim() || 'Identificado automaticamente na foto da escala',
          };
        });

        // 1. Replace and update the team list
        setMembers(parsedMembers);
        saveTeamMembers(parsedMembers);

        // 2. Update church settings if detected in image
        if (data.churchName || data.cultoDate || data.cultoTime) {
          setSettings(prev => ({
            ...prev,
            ...(data.churchName ? { churchName: data.churchName } : {}),
            ...(data.cultoDate ? { cultoDate: data.cultoDate } : {}),
            ...(data.cultoTime ? { cultoTime: data.cultoTime } : {}),
          }));
        }

        setScanSuccessSummary({
          count: parsedMembers.length,
          churchName: data.churchName,
          cultoDate: data.cultoDate,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        });

        showToast(`✨ Escala lida com sucesso! ${parsedMembers.length} voluntários identificados e lista atualizada.`);
      } else {
        showToast('⚠️ A imagem foi salva, mas nenhum nome de voluntário foi identificado. Verifique a nitidez ou adicione manualmente.');
      }
    } catch (err: any) {
      console.error('Erro na leitura da escala via IA:', err);
      showToast(`⚠️ Não foi possível ler os nomes automaticamente (${err.message || 'erro de rede'}). A foto foi mantida.`);
    } finally {
      setIsScanningImage(false);
    }
  };

  // Global Paste listener (Ctrl+V anywhere to paste screenshot)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const result = event.target?.result as string;
              if (result) {
                setScaleImage(result);
                saveScalePrintImage(result);
                showToast('📋 Foto colada via Ctrl+V! Lendo escala e atualizando lista...');
                scanAndApplyScaleImage(result);
              }
            };
            reader.readAsDataURL(blob);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Handle file input upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setScaleImage(result);
        saveScalePrintImage(result);
        showToast('🖼️ Foto da escala carregada! Lendo e atualizando lista...');
        scanAndApplyScaleImage(result);
      }
    };
    reader.readAsDataURL(file);
    // Reset file input so user can re-select same file if needed
    e.target.value = '';
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setScaleImage(result);
          saveScalePrintImage(result);
          showToast('🖼️ Foto recebida! Lendo e atualizando a lista de voluntários...');
          scanAndApplyScaleImage(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    if (confirm('Deseja remover o print da escala atual?')) {
      setScaleImage(null);
      removeScalePrintImage();
      setScanSuccessSummary(null);
      showToast('Print da escala removido');
    }
  };

  const handleRestoreDefaultMembers = () => {
    if (confirm('Deseja restaurar a lista padrão de voluntários da igreja?')) {
      setMembers(DEFAULT_TEAM_MEMBERS);
      saveTeamMembers(DEFAULT_TEAM_MEMBERS);
      setScanSuccessSummary(null);
      showToast('Lista padrão de voluntários restaurada');
    }
  };

  // Toggle member scheduled status
  const handleToggleScheduled = (id: string) => {
    setMembers(prev =>
      prev.map(m => (m.id === id ? { ...m, isScheduled: !m.isScheduled } : m))
    );
  };

  // Open Message Preview
  const handleOpenMessageModal = (member: TeamMember, type: 'day_before' | 'two_hours') => {
    const text = type === 'day_before' 
      ? buildDayBeforeMessage(member, settings)
      : buildTwoHoursBeforeMessage(member, settings);

    setMessageModal({
      isOpen: true,
      member,
      type,
      text,
    });
  };

  // Send WhatsApp and mark as sent
  const handleSendWhatsApp = (member: TeamMember, type: 'day_before' | 'two_hours') => {
    const text = type === 'day_before' 
      ? buildDayBeforeMessage(member, settings)
      : buildTwoHoursBeforeMessage(member, settings);

    const nowIso = new Date().toISOString();
    setMembers(prev =>
      prev.map(m => {
        if (m.id === member.id) {
          return {
            ...m,
            reminderSentDayBefore: type === 'day_before' ? nowIso : m.reminderSentDayBefore,
            reminderSentTwoHoursBefore: type === 'two_hours' ? nowIso : m.reminderSentTwoHoursBefore,
          };
        }
        return m;
      })
    );

    const url = getWhatsAppReminderUrl(member, text);
    window.open(url, '_blank');
    showToast(`📲 Abrindo WhatsApp para ${member.name}...`);
  };

  // Copy text to clipboard
  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
    showToast('Mensagem copiada para a área de transferência');
  };

  // Save member form (create or edit)
  const handleSaveMember = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string).trim();
    const role = (formData.get('role') as string).trim();
    const department = formData.get('department') as TeamDepartment;
    const phone = (formData.get('phone') as string).trim();
    const email = (formData.get('email') as string).trim();
    const notes = (formData.get('notes') as string).trim();
    const isScheduled = formData.get('isScheduled') === 'on';

    if (!name || !role) {
      alert('Preencha o nome e a função do membro');
      return;
    }

    if (editingMember) {
      setMembers(prev =>
        prev.map(m =>
          m.id === editingMember.id
            ? { ...m, name, role, department, phone, email, notes, isScheduled }
            : m
        )
      );
      showToast(`Membro "${name}" atualizado com sucesso!`);
    } else {
      const newMember: TeamMember = {
        id: `tm-${Date.now()}`,
        name,
        role,
        department,
        phone,
        email,
        notes,
        isScheduled,
        scheduledDate: settings.cultoDate,
      };
      setMembers(prev => [...prev, newMember]);
      showToast(`Membro "${name}" cadastrado na equipe!`);
    }

    setIsEditingMemberModalOpen(false);
    setEditingMember(null);
  };

  const handleDeleteMember = (id: string, name: string) => {
    if (confirm(`Deseja remover "${name}" da lista de equipe?`)) {
      setMembers(prev => prev.filter(m => m.id !== id));
      showToast(`Membro "${name}" removido`);
    }
  };

  // Filtered members list
  const filteredMembers = members.filter(m => {
    if (filterDepartment === 'scheduled') return m.isScheduled;
    if (filterDepartment === 'sonoplastia') return m.department === 'sonoplastia';
    if (filterDepartment === 'louvor') return m.department === 'louvor';
    return true;
  });

  const scheduledCount = members.filter(m => m.isScheduled).length;
  const sonoplastiaCount = members.filter(m => m.department === 'sonoplastia').length;
  const louvorCount = members.filter(m => m.department === 'louvor').length;

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Top Banner & Quick Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                  <Church className="w-3.5 h-3.5" />
                  {settings.churchName}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {settings.cultoDate} • Início: {settings.cultoTime}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Equipe & Escala de Louvor e Sonoplastia
              </h2>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Cadastro de membros, print da escala do culto e lembretes automáticos via WhatsApp (1 dia antes e até 2 horas antes do culto).
              </p>
            </div>

            {/* Quick Action Button */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  setEditingMember(null);
                  setIsEditingMemberModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-102 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Cadastrar Membro
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
                title="Subir foto ou print da escala da semana"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                Carregar Print da Escala
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Total na Equipe
              </span>
              <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">
                {members.length} voluntários
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Escalados no Dia
              </span>
              <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">
                {scheduledCount} pessoas
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider block">
                Sonoplastia & Telão
              </span>
              <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">
                {sonoplastiaCount} membros
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
                Louvor & Músicos
              </span>
              <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">
                {louvorCount} membros
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden File Input for Image */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* SECTION: PRINT DA ESCALA (Dedicated Highlight Area) */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-white rounded-3xl border transition-all overflow-hidden ${
          isDraggingFile 
            ? 'border-blue-500 ring-4 ring-blue-500/20 shadow-xl' 
            : 'border-slate-200 shadow-xs'
        }`}
      >
        <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                Print da Escala do Culto
                {isScanningImage ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1.5 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                    Lendo com IA...
                  </span>
                ) : scaleImage ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Foto Sincronizada
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-200 text-slate-600">
                    Aguardando Imagem
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Cole o print do WhatsApp ou planilha com <kbd className="px-1.5 py-0.5 bg-slate-200 rounded font-mono text-[10px] font-bold">Ctrl + V</kbd>, arraste uma foto ou selecione no computador
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {scaleImage && (
              <>
                <button
                  onClick={() => scanAndApplyScaleImage(scaleImage)}
                  disabled={isScanningImage}
                  className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200 disabled:opacity-50"
                  title="Fazer nova leitura da foto da escala com IA"
                >
                  {isScanningImage ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  Re-escanear com IA
                </button>
                <button
                  onClick={() => setIsPreviewImageModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver em Tela Cheia
                </button>
                <button
                  onClick={handleRemoveImage}
                  className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remover
                </button>
              </>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              {scaleImage ? 'Substituir Foto' : 'Carregar Imagem da Escala'}
            </button>
          </div>
        </div>

        {/* AI Scanning Progress Banner */}
        {isScanningImage && (
          <div className="bg-blue-600 text-white px-6 py-3 flex items-center justify-between gap-3 text-xs font-medium animate-pulse">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
              <span>{scanStatusMessage || 'Processando OCR e identificando voluntários da igreja...'}</span>
            </div>
            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider hidden sm:inline">
              Visão Computacional Gemini
            </span>
          </div>
        )}

        {/* Print Preview Area */}
        <div className="p-6">
          {scaleImage ? (
            <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center max-h-[520px]">
              <img
                src={scaleImage}
                alt="Print da escala do culto"
                className={`w-full h-auto max-h-[520px] object-contain cursor-pointer transition-transform group-hover:scale-[1.01] ${
                  isScanningImage ? 'opacity-40 blur-[1px]' : ''
                }`}
                onClick={() => setIsPreviewImageModalOpen(true)}
              />

              {isScanningImage && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center animate-bounce">
                    <Wand2 className="w-7 h-7 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">
                      Lendo a Escala do Culto
                    </h4>
                    <p className="text-xs text-slate-300 max-w-sm mt-1">
                      A Inteligência Artificial está extraindo os nomes, funções (som e louvor) e contatos para substituir a lista abaixo automaticamente.
                    </p>
                  </div>
                  <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full animate-pulse w-3/4"></div>
                  </div>
                </div>
              )}

              {!isScanningImage && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 pointer-events-none">
                  <span className="px-4 py-2 rounded-xl bg-white/90 backdrop-blur-md text-slate-900 text-xs font-bold flex items-center gap-2 shadow-lg">
                    <ZoomIn className="w-4 h-4 text-blue-600" />
                    Clique para ampliar o print
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${
                isDraggingFile
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30'
              }`}
            >
              <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h4 className="text-base font-bold text-slate-800">
                  {isDraggingFile ? 'Solte a foto da escala aqui!' : 'Nenhum print da escala anexado ainda'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Envie a foto ou aperte <strong className="text-slate-800 font-bold">Ctrl + V</strong> agora. O sistema faz a <strong className="text-blue-700">leitura automática imediata</strong>, substitui e atualiza a lista de voluntários!
                </p>
              </div>
              <span className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-xs">
                Formatos aceitos: PNG, JPG, JPEG, WEBP • Leitura Instantânea com IA
              </span>
            </div>
          )}
        </div>
      </div>

      {/* SECTION: CONFIGURAÇÃO DO CULTO & CRONOGRAMA DE LEMBRETES */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                Cronograma de Lembretes Automáticos
              </h4>
              <p className="text-xs text-slate-400">
                Lembretes programados para enviar aos membros escalados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              Lembretes Prontos para Disparo
            </span>
          </div>
        </div>

        {/* Schedule Timing Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rule 1: 1 Day Before */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                1º Lembrete: 1 Dia Antes
              </span>
              <span className="text-xs font-bold text-slate-400">
                Sexta-feira (Pôr do Sol)
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              "Feliz Sábado! Lembramos que você está escalado amanhã no ministério para o culto das {settings.cultoTime}. Chegue 30 min antes para oração e passagem de som."
            </p>
          </div>

          {/* Rule 2: 2 Hours Before */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30">
                2º Lembrete: 2 Horas Antes
              </span>
              <span className="text-xs font-bold text-slate-400">
                Sábado de Manhã (07:00)
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              "Bom dia! Faltam 2 horas para o início do culto ({settings.cultoTime}). A equipe já está alinhando microfones, sonoplastia e telão. Contamos com você!"
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Status / Success Feedback after AI Scan */}
      {scanSuccessSummary && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-black text-emerald-950">
                  Escala lida e lista de voluntários atualizada com sucesso!
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-200 text-emerald-900 border border-emerald-300">
                  {scanSuccessSummary.count} membros identificados
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-1 font-medium">
                {scanSuccessSummary.churchName ? `${scanSuccessSummary.churchName} • ` : ''}
                {scanSuccessSummary.cultoDate ? `Data: ${scanSuccessSummary.cultoDate} • ` : ''}
                Leitura realizada às {scanSuccessSummary.time}. A lista abaixo já foi sincronizada com as funções e contatos extraídos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRestoreDefaultMembers}
              className="px-3.5 py-2 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Voltar para a lista padrão da igreja"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar Lista Padrão
            </button>
          </div>
        </div>
      )}

      {/* SECTION: LISTA DE MEMBROS E DISPARADORES DE WHATSAPP */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filter Header */}
        <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                Voluntários de Louvor e Sonoplastia
                {scanSuccessSummary && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Sincronizado da Imagem
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {filteredMembers.length} pessoas exibidas • Dispare mensagens individuais ou em massa
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setFilterDepartment('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterDepartment === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Todos ({members.length})
              </button>
              <button
                onClick={() => setFilterDepartment('scheduled')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterDepartment === 'scheduled'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Escalados no Dia ({scheduledCount})
              </button>
              <button
                onClick={() => setFilterDepartment('sonoplastia')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterDepartment === 'sonoplastia'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Sonoplastia ({sonoplastiaCount})
              </button>
              <button
                onClick={() => setFilterDepartment('louvor')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterDepartment === 'louvor'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Louvor & Vozes ({louvorCount})
              </button>
            </div>

            <button
              onClick={handleRestoreDefaultMembers}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Restaurar voluntários padrão"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restaurar Padrão</span>
            </button>
          </div>
        </div>

        {/* Member Cards Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMembers.map(member => (
            <div
              key={member.id}
              className={`rounded-2xl border p-5 transition-all flex flex-col justify-between space-y-4 ${
                member.isScheduled
                  ? 'bg-white border-emerald-200 shadow-sm ring-1 ring-emerald-500/20'
                  : 'bg-slate-50/70 border-slate-200 text-slate-600'
              }`}
            >
              {/* Member Top Info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-extrabold text-slate-900">
                        {member.name}
                      </h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        member.department === 'sonoplastia'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-purple-100 text-purple-800 border border-purple-200'
                      }`}>
                        {member.department === 'sonoplastia' ? 'Sonoplastia' : 'Louvor'}
                      </span>
                      {member.isScheduled ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Escalado(a)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-slate-500 bg-slate-200">
                          Reserva
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-700">
                      {member.role}
                    </p>
                  </div>

                  {/* Quick toggle scheduled checkbox */}
                  <button
                    onClick={() => handleToggleScheduled(member.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      member.isScheduled
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                    title={member.isScheduled ? 'Desmarcar da escala de hoje' : 'Marcar na escala de hoje'}
                  >
                    {member.isScheduled ? 'Escalado ✓' : '+ Escalar'}
                  </button>
                </div>

                {/* Contact info & Notes */}
                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    {member.phone && (
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        {formatPhoneDisplay(member.phone)}
                      </span>
                    )}
                    {member.email && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {member.email}
                      </span>
                    )}
                  </div>
                  {member.notes && (
                    <p className="text-slate-600 italic bg-slate-100 p-2 rounded-xl text-[11px]">
                      "{member.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* REMINDER BUTTONS: 1 Day Before & 2 Hours Before */}
              <div className="pt-3 border-t border-slate-200/80 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* 1 Day Before Button */}
                  <button
                    onClick={() => handleSendWhatsApp(member, 'day_before')}
                    disabled={!member.phone}
                    className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all hover:scale-102 cursor-pointer disabled:opacity-50"
                    title="Enviar mensagem de Feliz Sábado e lembrete na véspera"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>1 Dia Antes</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </button>

                  {/* 2 Hours Before Button */}
                  <button
                    onClick={() => handleSendWhatsApp(member, 'two_hours')}
                    disabled={!member.phone}
                    className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all hover:scale-102 cursor-pointer disabled:opacity-50"
                    title="Enviar mensagem urgente 2 horas antes do culto"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>2 Horas Antes</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </button>
                </div>

                {/* Status of reminders sent */}
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    {member.reminderSentDayBefore && (
                      <span className="text-amber-700 font-semibold flex items-center gap-0.5">
                        <Check className="w-3 h-3 text-amber-600" />
                        1º Enviado
                      </span>
                    )}
                    {member.reminderSentTwoHoursBefore && (
                      <span className="text-red-700 font-semibold flex items-center gap-0.5">
                        <Check className="w-3 h-3 text-red-600" />
                        2º Enviado
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenMessageModal(member, 'day_before')}
                      className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                    >
                      Ver Mensagem
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => {
                        setEditingMember(member);
                        setIsEditingMemberModalOpen(true);
                      }}
                      className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                    >
                      Editar
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => handleDeleteMember(member.id, member.name)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: ADD / EDIT MEMBER */}
      {isEditingMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-400" />
                {editingMember ? 'Editar Voluntário' : 'Novo Voluntário na Equipe'}
              </h3>
              <button
                onClick={() => setIsEditingMemberModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingMember?.name || ''}
                  required
                  placeholder="Ex: Davi Fonseca"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ministério *
                  </label>
                  <select
                    name="department"
                    defaultValue={editingMember?.department || 'sonoplastia'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
                  >
                    <option value="sonoplastia">Sonoplastia & Telão</option>
                    <option value="louvor">Louvor & Música</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Função Específica *
                  </label>
                  <input
                    type="text"
                    name="role"
                    defaultValue={editingMember?.role || ''}
                    required
                    placeholder="Ex: Mesa de Som / Telão / Vocal"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp (Celular com DDD) *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={editingMember?.phone || ''}
                    required
                    placeholder="Ex: 11987654321"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail (Opcional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingMember?.email || ''}
                    placeholder="exemplo@iasd.org"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações
                </label>
                <input
                  type="text"
                  name="notes"
                  defaultValue={editingMember?.notes || ''}
                  placeholder="Ex: Traz violão próprio, equalização específica"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isScheduled"
                  name="isScheduled"
                  defaultChecked={editingMember ? editingMember.isScheduled : true}
                  className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="isScheduled" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Marcar como escalado(a) para o culto deste Sábado
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingMemberModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20"
                >
                  Salvar Voluntário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW FULLSCREEN SCALE PRINT */}
      {isPreviewImageModalOpen && scaleImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-5xl w-full max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 text-white">
              <span className="text-sm font-bold flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                Visualização da Escala em Tela Cheia
              </span>
              <button
                onClick={() => setIsPreviewImageModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto rounded-2xl bg-black flex items-center justify-center border border-slate-800">
              <img
                src={scaleImage}
                alt="Escala em alta resolução"
                className="w-full h-auto max-h-[85vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MESSAGE PREVIEW & COPY */}
      {messageModal.isOpen && messageModal.member && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold">
                  {messageModal.type === 'day_before' 
                    ? 'Lembrete: 1 Dia Antes (Véspera)' 
                    : 'Lembrete: 2 Horas Antes do Culto'}
                </h3>
              </div>
              <button
                onClick={() => setMessageModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span>Destinatário: <strong className="text-slate-900">{messageModal.member.name}</strong></span>
                <span>WhatsApp: <strong className="text-emerald-700 font-mono">{formatPhoneDisplay(messageModal.member.phone)}</strong></span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Texto da Mensagem Formatada:
                </label>
                <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono whitespace-pre-wrap leading-relaxed border border-slate-800">
                  {messageModal.text}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => handleCopyMessage(messageModal.text)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      Copiar Texto
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    handleSendWhatsApp(messageModal.member!, messageModal.type);
                    setMessageModal(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Abrir e Enviar no WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {notificationToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notificationToast}</span>
        </div>
      )}
    </div>
  );
};
