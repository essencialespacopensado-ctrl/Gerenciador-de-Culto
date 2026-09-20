import { ChurchDetails, PastorRecommendation, AuthUser, UserRole, ChurchAccount } from '../types';
import { 
  getScopedStorageKey, 
  getActiveChurchId, 
  getActiveChurchProfile, 
  setActiveChurch, 
  registerChurch, 
  slugifyChurchName 
} from './churchWorkspace';

// Default Church Details
export const DEFAULT_CHURCH_DETAILS: ChurchDetails = {
  id: 'church-main-01',
  name: 'IASD Vila Nova',
  district: 'Distrito Central Leste',
  association: 'Associação Paulista Leste (APL)',
  union: 'União Central Brasileira (UCB)',
  codeOrCnpj: 'IASD-4091 / CNPJ 00.000.000/0001-00',
  pastorName: 'Pr. Marcos Silveira',
  pastorPhone: '(11) 98765-4321',
  pastorEmail: 'marcos.silveira@paulista.org.br',
  headElderName: 'Carlos Eduardo Mendes',
  headElderPhone: '(11) 99123-4567',
  musicDirectorName: 'Juliana Rocha',
  soundDirectorName: 'Davi Oliveira',
  address: 'Rua das Oliveiras, 450',
  neighborhood: 'Jardim Esperança',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '03000-000',
  regularServiceTimes: 'Sábado: 08h45 (Escola Sabatina) e 10h15 (Culto Divino) • Domingo: 19h00 (Culto Evangelístico) • Quarta: 19h30 (Oração & Família)',
  youtubeChannelUrl: 'https://youtube.com/@iasdvilanova',
  instagramUrl: 'https://instagram.com/iasdvilanova',
  driveFolderUrl: 'https://drive.google.com/drive/folders/iasd-sonoplastia',
  wifiCredentials: 'Rede: IASD_CONVIDADOS | Senha: maranatajesusvem',
  capacity: 280,
  notes: 'Mesa de som digital Behringer X32, 4 retornos de chão e 4 microfones sem fio Shure. Projetor HDMI no púlpito.',
  updatedAt: new Date().toISOString(),
};

// Initial Pastor Recommendations and Communications
export const DEFAULT_RECOMMENDATIONS: PastorRecommendation[] = [
  {
    id: 'rec-01',
    code: 'REC-2026-018',
    type: 'pregador',
    status: 'approved',
    title: 'Carta de Recomendação para Pregador Visitante',
    recommendedPerson: 'Pr. Ricardo Antunes (Evangelista)',
    originChurch: 'IASD Central de Campinas - APAC',
    destinationChurch: 'IASD Vila Nova',
    serviceDate: 'Próximo Sábado - Culto Divino (10h15)',
    pastorName: 'Pr. Fernando Queiroz',
    pastorPhone: '(19) 98111-2233',
    pastorDistrict: 'Distrito Campinas Leste',
    ministryOrTalent: 'Sermão Bíblico e Apelo Evangelístico',
    content: 'Prezados irmãos e líderes da IASD Vila Nova e estimado Pr. Marcos Silveira: Temos a honra e alegria de recomendar nosso prezado irmão e colega de ministério, Pr. Ricardo Antunes, membro regular em plena comunhão com nossa igreja. O irmão possui sólida fundamentação bíblica, fidelidade aos princípios da Igreja Adventista do Sétimo Dia e ministério abençoado na pregação da Palavra. Rogamos as bênçãos divinas sobre a programação.',
    observations: 'Recomendação aprovada pela Comissão da Igreja de Origem em Ata nº 14/2026.',
    issuedAt: '2026-09-08',
    isOfficialLetter: true,
  },
  {
    id: 'rec-02',
    code: 'REC-2026-022',
    type: 'musica_louvor',
    status: 'approved',
    title: 'Recomendação Eclesiástica para Grupo Vocal Harmonia Celeste',
    recommendedPerson: 'Grupo Vocal Harmonia Celeste (6 integrantes)',
    originChurch: 'IASD Tatuapé - Associação Paulista Leste',
    destinationChurch: 'IASD Vila Nova',
    serviceDate: 'Próximo Sábado - Culto Jovem (JA 17h00)',
    pastorName: 'Pr. Samuel Albuquerque',
    pastorPhone: '(11) 97333-8899',
    pastorDistrict: 'Distrito Tatuapé',
    ministryOrTalent: 'Louvor Congregacional e Mensagens Musicais Especiais',
    content: 'Saudações na bendita esperança do breve retorno de Cristo! Por meio desta, recomendamos os integrantes do Grupo Vocal Harmonia Celeste, todos membros batizados e atuantes nesta congregação, idôneos em sua conduta e consagrados em seu ministério musical, plenamente alinhados com a filosofia bíblica de música da Igreja Adventista do Sétimo Dia.',
    observations: 'Grupo trará playbacks próprios no pendrive e solicita 4 microfones sem fio.',
    issuedAt: '2026-09-10',
    isOfficialLetter: true,
  },
  {
    id: 'rec-03',
    code: 'COM-2026-005',
    type: 'comunicado_pastoral',
    status: 'approved',
    title: 'Orientação Pastoral: Culto de Santa Ceia e Batismo',
    recommendedPerson: 'Toda a Equipe de Sonoplastia e Louvor',
    originChurch: 'Distrito Pastoral Central Leste',
    destinationChurch: 'IASD Vila Nova',
    serviceDate: 'Último Sábado do Mês',
    pastorName: 'Pr. Marcos Silveira (Pastor Distrital)',
    pastorPhone: '(11) 98765-4321',
    pastorDistrict: 'Distrito Central Leste',
    ministryOrTalent: 'Coordenação de Áudio, Transmissão e Fundos Musicais Solenes',
    content: 'Estimada equipe de Sonoplastia e Ministério de Louvor: No próximo culto de Santa Ceia, solicitamos que os microfones dos oficiantes e diáconos sejam pré-testados às 08h15. Durante o rito do lava-pés, manteremos uma playlist solene e instrumental com hinos clássicos do Hinário Adventista em volume ambiente moderado. Deus abençoe ricamente a dedicação de cada um de vocês!',
    observations: 'Transmissão ao vivo deverá ser pausada durante o rito da comunhão e retomada na celebração.',
    issuedAt: '2026-09-11',
    isOfficialLetter: true,
  },
];

// Preconfigured default church accounts for simultaneous usage
export const DEFAULT_CHURCH_ACCOUNTS: ChurchAccount[] = [
  {
    id: 'iasd-vila-nova',
    name: 'IASD Vila Nova',
    district: 'Distrito Central Leste',
    city: 'São Paulo',
    state: 'SP',
    login: 'iasdvilanova',
    password: 'iasd123',
    adminContact: 'Juliana Rocha (Som)',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'iasd-central',
    name: 'IASD Central',
    district: 'Distrito Central',
    city: 'São Paulo',
    state: 'SP',
    login: 'iasdcentral',
    password: 'central123',
    adminContact: 'Pr. Marcos Silveira',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'iasd-alvorada',
    name: 'IASD Alvorada',
    district: 'Distrito Alvorada',
    city: 'Campinas',
    state: 'SP',
    login: 'iasdalvorada',
    password: 'alvorada123',
    adminContact: 'Coordenação de Áudio',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'iasd-jardim-flores',
    name: 'IASD Jardim das Flores',
    district: 'Distrito Oeste',
    city: 'Curitiba',
    state: 'PR',
    login: 'iasdflores',
    password: 'flores123',
    adminContact: 'Ministério de Louvor',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const STORAGE_CHURCH_ACCOUNTS = 'iasd_church_accounts_v1';

/**
 * Retorna a lista de contas de igrejas cadastradas para uso simultâneo.
 */
export function getStoredChurchAccounts(): ChurchAccount[] {
  try {
    const saved = localStorage.getItem(STORAGE_CHURCH_ACCOUNTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Erro ao ler contas de igrejas:', e);
  }
  return DEFAULT_CHURCH_ACCOUNTS;
}

/**
 * Salva a lista de contas de igrejas cadastradas.
 */
export function saveStoredChurchAccounts(accounts: ChurchAccount[]): void {
  try {
    localStorage.setItem(STORAGE_CHURCH_ACCOUNTS, JSON.stringify(accounts));
  } catch (e) {
    console.error('Erro ao salvar contas de igrejas:', e);
  }
}

/**
 * Cadastra uma nova igreja para uso simultâneo com login e senha próprios.
 */
export function registerNewChurchAccount(params: {
  name: string;
  login: string;
  password: string;
  district?: string;
  city?: string;
  state?: string;
  adminContact?: string;
}): { success: boolean; message: string; account?: ChurchAccount } {
  const cleanName = params.name.trim();
  const cleanLogin = params.login.trim().toLowerCase();
  const cleanPass = params.password.trim();

  if (!cleanName) {
    return { success: false, message: 'O nome da igreja é obrigatório.' };
  }
  if (!cleanLogin || cleanLogin.length < 3) {
    return { success: false, message: 'O login deve ter pelo menos 3 caracteres.' };
  }
  if (!cleanPass || cleanPass.length < 4) {
    return { success: false, message: 'A senha deve ter pelo menos 4 caracteres.' };
  }

  // Verificar se o login não coincide com logins reservados do sistema
  if (['dev', 'desenvolvedor', 'admin', 'suporte', 'universal'].includes(cleanLogin)) {
    return { success: false, message: 'Este login é reservado para o Desenvolvedor do sistema.' };
  }

  const existingAccounts = getStoredChurchAccounts();
  const loginConflict = existingAccounts.find(
    a => a.login.toLowerCase() === cleanLogin
  );
  if (loginConflict) {
    return { success: false, message: `O login "${cleanLogin}" já está sendo usado pela igreja ${loginConflict.name}. Escolha outro.` };
  }

  const churchSlug = slugifyChurchName(cleanName) || `igreja-${Date.now()}`;
  
  // Registra também no catálogo de perfis de igrejas (para isolamento de dados)
  registerChurch(cleanName, params.district, params.city, params.state);

  const newAccount: ChurchAccount = {
    id: churchSlug,
    name: cleanName,
    district: params.district?.trim() || 'Distrito Local',
    city: params.city?.trim() || 'São Paulo',
    state: params.state?.trim() || 'SP',
    login: cleanLogin,
    password: cleanPass,
    adminContact: params.adminContact?.trim() || 'Operador Local',
    createdAt: new Date().toISOString(),
  };

  const updated = [...existingAccounts, newAccount];
  saveStoredChurchAccounts(updated);

  return { 
    success: true, 
    message: `Igreja "${cleanName}" cadastrada com sucesso! Login: ${cleanLogin}`,
    account: newAccount
  };
}

/**
 * Remove o cadastro de uma igreja.
 */
export function deleteChurchAccount(id: string): void {
  const existing = getStoredChurchAccounts();
  const filtered = existing.filter(a => a.id !== id);
  saveStoredChurchAccounts(filtered);
}

// Preconfigured accounts (Developer Master Universal)
export const PRECONFIGURED_ACCOUNTS = {
  developer: {
    username: 'dev',
    aliases: ['desenvolvedor', 'admin', 'suporte', 'universal'],
    password: 'dev2026',
    name: 'Desenvolvedor Master & Suporte',
    role: 'developer' as UserRole,
    email: 'dev@iasd.org',
    churchName: 'Central Global de Engenharia IASD',
  },
};

// Storage operations
export function getStoredChurchDetails(churchId?: string): ChurchDetails {
  const cId = churchId || getActiveChurchId();
  const key = getScopedStorageKey('church_details_v1', cId);
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
    // Fallback: check legacy un-scoped key
    if (cId === 'iasd-vila-nova') {
      const legacy = localStorage.getItem('iasd_church_details_v1');
      if (legacy) {
        return JSON.parse(legacy);
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar dados da igreja:', e);
  }

  const profile = getActiveChurchProfile();
  return {
    ...DEFAULT_CHURCH_DETAILS,
    id: `church-${cId}`,
    name: profile.name || DEFAULT_CHURCH_DETAILS.name,
    district: profile.district || DEFAULT_CHURCH_DETAILS.district,
    city: profile.city || DEFAULT_CHURCH_DETAILS.city,
    state: profile.state || DEFAULT_CHURCH_DETAILS.state,
  };
}

export function saveStoredChurchDetails(details: ChurchDetails, churchId?: string): void {
  const cId = churchId || getActiveChurchId();
  const key = getScopedStorageKey('church_details_v1', cId);
  try {
    const updated = { ...details, updatedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.error('Erro ao salvar dados da igreja:', e);
  }
}

export function getStoredRecommendations(churchId?: string): PastorRecommendation[] {
  const cId = churchId || getActiveChurchId();
  const key = getScopedStorageKey('pastor_recommendations_v1', cId);
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
    if (cId === 'iasd-vila-nova') {
      const legacy = localStorage.getItem('iasd_pastor_recommendations_v1');
      if (legacy) {
        return JSON.parse(legacy);
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar cartas pastorais:', e);
  }
  return DEFAULT_RECOMMENDATIONS;
}

export function saveStoredRecommendations(list: PastorRecommendation[], churchId?: string): void {
  const cId = churchId || getActiveChurchId();
  const key = getScopedStorageKey('pastor_recommendations_v1', cId);
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.error('Erro ao salvar cartas pastorais:', e);
  }
}

// Authentication Session helpers
export function getStoredAuthSession(churchId?: string): AuthUser | null {
  const cId = churchId || getActiveChurchId();
  const key = getScopedStorageKey('auth_session_v1', cId);
  try {
    // 1. Try sessionStorage first (current active tab/browser session)
    const sessionData = sessionStorage.getItem(key);
    if (sessionData) {
      return JSON.parse(sessionData);
    }

    // 2. Try localStorage (persistent "remember me" session)
    const localData = localStorage.getItem(key);
    if (localData) {
      const parsed: AuthUser = JSON.parse(localData);
      if (parsed && parsed.rememberMe !== false) {
        return parsed;
      }
    }

    const legacy = localStorage.getItem('iasd_auth_session_v1');
    if (legacy) {
      const parsed: AuthUser = JSON.parse(legacy);
      if (parsed && parsed.rememberMe !== false) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar sessão de login:', e);
  }
  return null;
}

export function saveAuthSession(user: AuthUser | null, rememberMe = true, churchId?: string): void {
  const cId = churchId || getActiveChurchId();
  const key = getScopedStorageKey('auth_session_v1', cId);
  try {
    if (user) {
      const toSave = { ...user, rememberMe };
      const serialized = JSON.stringify(toSave);
      
      // Always keep in sessionStorage for the active window
      sessionStorage.setItem(key, serialized);

      if (rememberMe) {
        // Keep in persistent storage
        localStorage.setItem(key, serialized);
      } else {
        // Clear from persistent storage so next visit asks for login
        localStorage.removeItem(key);
      }
    } else {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
      localStorage.removeItem('iasd_auth_session_v1');
    }
  } catch (e) {
    console.error('Erro ao atualizar sessão de autenticação:', e);
  }
}

export function authenticateCredentials(usernameInput: string, passwordInput: string): AuthUser | null {
  const cleanUser = usernameInput.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  // 1. Check Developer Universal Master Login
  const devAccount = PRECONFIGURED_ACCOUNTS.developer;
  if (
    (cleanUser === devAccount.username || devAccount.aliases.includes(cleanUser)) &&
    cleanPass === devAccount.password
  ) {
    return {
      id: 'auth-dev-01',
      username: devAccount.username,
      name: devAccount.name,
      role: 'developer',
      email: devAccount.email,
      churchName: devAccount.churchName,
      loggedInAt: new Date().toISOString(),
    };
  }

  // 2. Check Registered Simultaneous Church Accounts
  const churchAccounts = getStoredChurchAccounts();
  const matchingChurch = churchAccounts.find(
    a => a.login.toLowerCase() === cleanUser && a.password === cleanPass
  );

  if (matchingChurch) {
    // Switch active workspace to this church automatically upon successful login
    setActiveChurch(matchingChurch.id, false);

    return {
      id: `auth-${matchingChurch.id}`,
      username: matchingChurch.login,
      name: `${matchingChurch.name} (Operador)`,
      role: 'user',
      churchId: matchingChurch.id,
      churchName: matchingChurch.name,
      loggedInAt: new Date().toISOString(),
    };
  }

  // 3. Fallback check for legacy default credentials (iasd-vila-nova)
  if (
    (cleanUser === 'igreja' || cleanUser === 'som' || cleanUser === 'operador') &&
    cleanPass === 'iasd123'
  ) {
    const vilaNova = churchAccounts.find(a => a.id === 'iasd-vila-nova') || churchAccounts[0];
    if (vilaNova) {
      setActiveChurch(vilaNova.id, false);
    }
    return {
      id: 'auth-user-vila-nova',
      username: 'iasdvilanova',
      name: 'IASD Vila Nova (Operador)',
      role: 'user',
      churchId: 'iasd-vila-nova',
      churchName: 'IASD Vila Nova',
      loggedInAt: new Date().toISOString(),
    };
  }

  return null;
}
