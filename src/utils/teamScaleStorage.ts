import { TeamMember, ScaleSettings } from '../types';

const TEAM_STORAGE_KEY = 'iasd_team_members_v1';
const SETTINGS_STORAGE_KEY = 'iasd_scale_settings_v1';
const SCALE_IMAGE_DB_KEY = 'iasd_scale_print_image';

export const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'tm-1',
    name: 'Davi Fonseca',
    role: 'Sonoplastia (Mesa de Som)',
    department: 'sonoplastia',
    phone: '11987654321',
    email: 'davi@iasd.org',
    isScheduled: true,
    scheduledDate: 'Próximo Sábado',
    notes: 'Responsável principal pela mesa, equalização e microfones do púlpito',
  },
  {
    id: 'tm-2',
    name: 'Marcos Oliveira',
    role: 'Projeção / Telão',
    department: 'sonoplastia',
    phone: '11976543210',
    email: 'marcos@iasd.org',
    isScheduled: true,
    scheduledDate: 'Próximo Sábado',
    notes: 'Operador de projeção: Provai e Vede, Informativo e Hinário',
  },
  {
    id: 'tm-3',
    name: 'Gabriel Santos',
    role: 'Transmissão & Câmeras',
    department: 'sonoplastia',
    phone: '11965432109',
    email: 'gabriel@iasd.org',
    isScheduled: false,
    scheduledDate: 'Próximo Sábado',
    notes: 'Controle de áudio para transmissão online',
  },
  {
    id: 'tm-4',
    name: 'Sara Cristina',
    role: 'Direção do Louvor',
    department: 'louvor',
    phone: '11954321098',
    email: 'sara@iasd.org',
    isScheduled: true,
    scheduledDate: 'Próximo Sábado',
    notes: 'Condução congregacional dos hinos e cânticos de abertura',
  },
  {
    id: 'tm-5',
    name: 'Thiago & Aline',
    role: 'Vocal / Canto',
    department: 'louvor',
    phone: '11943210987',
    email: 'thiago@iasd.org',
    isScheduled: true,
    scheduledDate: 'Próximo Sábado',
    notes: 'Apoio vocal com microfones sem fio',
  },
  {
    id: 'tm-6',
    name: 'Lucas Rocha',
    role: 'Teclado / Piano',
    department: 'louvor',
    phone: '11932109876',
    email: 'lucas@iasd.org',
    isScheduled: true,
    scheduledDate: 'Próximo Sábado',
    notes: 'Acompanhamento harmônico e fundo musical de oração',
  },
  {
    id: 'tm-7',
    name: 'Samuel Lima',
    role: 'Violão Acústico',
    department: 'louvor',
    phone: '11921098765',
    email: 'samuel@iasd.org',
    isScheduled: false,
    scheduledDate: 'Próximo Sábado',
    notes: 'Violão base para cânticos congregacionais',
  },
];

export const DEFAULT_SCALE_SETTINGS: ScaleSettings = {
  cultoDate: 'Sábado (Culto Divino & Escola Sabatina)',
  cultoTime: '09:00',
  churchName: 'Igreja Adventista do Sétimo Dia',
  autoRemindersEnabled: true,
};

// Clean Brazilian phone number for WhatsApp URL
export function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  // If no country code, prepend 55 (Brazil)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

// Display format (xx) xxxxx-xxxx
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Message text for 1 day before the service (Sexta-feira / Pôr do Sol)
 */
export function buildDayBeforeMessage(member: TeamMember, settings: ScaleSettings): string {
  return `Olá, *${member.name}*! Feliz Sábado e a paz do Senhor! 🙏✨\n\nLembramos com muito carinho que você está escalado(a) amanhã no ministério de *${member.role}* para o culto na *${settings.churchName}* (${settings.cultoDate} às *${settings.cultoTime}*).\n\n⏰ *Lembrete:* Por favor, chegue com 30 minutos de antecedência para oração com a equipe, alinhamento dos hinos e passagem de som.\n\nQue o Senhor use os seus talentos para a Sua honra e louvor! Nos vemos amanhã! 🎶🙌`;
}

/**
 * Message text for 2 hours before the service (Sábado de manhã)
 */
export function buildTwoHoursBeforeMessage(member: TeamMember, settings: ScaleSettings): string {
  return `Bom dia, *${member.name}*! ⏰ Faltam apenas *2 horas* para o início da nossa programação de culto (*${settings.cultoTime}*) na *${settings.churchName}*!\n\nSua responsabilidade no ministério de *${member.role}* é muito especial para a adoração de toda a igreja hoje.\n\nA equipe já está a postos organizando a sonoplastia, telão e instrumentos. Contamos com sua presença pontual! Deus te abençoe! 🙏🎺`;
}

/**
 * Build Direct WhatsApp URL
 */
export function getWhatsAppReminderUrl(member: TeamMember, messageText: string): string {
  const phone = formatPhoneForWhatsApp(member.phone);
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(messageText)}`;
}

// Load team members from local storage
export function loadTeamMembers(): TeamMember[] {
  try {
    const raw = localStorage.getItem(TEAM_STORAGE_KEY);
    if (!raw) return DEFAULT_TEAM_MEMBERS;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Erro ao carregar equipe:', e);
    return DEFAULT_TEAM_MEMBERS;
  }
}

// Save team members to local storage
export function saveTeamMembers(members: TeamMember[]): void {
  try {
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(members));
  } catch (e) {
    console.warn('Erro ao salvar equipe:', e);
  }
}

// Load scale settings
export function loadScaleSettings(): ScaleSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SCALE_SETTINGS;
    return { ...DEFAULT_SCALE_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Erro ao carregar configurações de escala:', e);
    return DEFAULT_SCALE_SETTINGS;
  }
}

// Save scale settings
export function saveScaleSettings(settings: ScaleSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Erro ao salvar configurações de escala:', e);
  }
}

// Save scale print image to IndexedDB or localStorage
export async function saveScalePrintImage(dataUrl: string): Promise<void> {
  try {
    localStorage.setItem(SCALE_IMAGE_DB_KEY, dataUrl);
  } catch (e) {
    // If quota exceeded in localStorage, try using shorter or IndexedDB
    try {
      sessionStorage.setItem(SCALE_IMAGE_DB_KEY, dataUrl);
    } catch (err) {
      console.warn('Erro ao salvar imagem do print:', err);
    }
  }
}

// Load scale print image
export function loadScalePrintImage(): string | null {
  try {
    return localStorage.getItem(SCALE_IMAGE_DB_KEY) || sessionStorage.getItem(SCALE_IMAGE_DB_KEY) || null;
  } catch (e) {
    return null;
  }
}

// Remove scale print image
export function removeScalePrintImage(): void {
  try {
    localStorage.removeItem(SCALE_IMAGE_DB_KEY);
    sessionStorage.removeItem(SCALE_IMAGE_DB_KEY);
  } catch (e) {
    console.warn(e);
  }
}
