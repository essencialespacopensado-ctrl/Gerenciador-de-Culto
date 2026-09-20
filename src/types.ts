export type MediaSourceType = 'youtube' | 'pendrive' | 'local';

export interface MediaLink {
  title: string;
  url?: string;
  note?: string;
  videoDate?: string;
  isWeeklyMedia?: boolean;
  sourceType?: MediaSourceType; // 'youtube' | 'pendrive' | 'local'
  fileName?: string; // Nome do arquivo quando levado no pen drive
  fileSize?: string; // Ex: "42.5 MB"
  driveOrigin?: string; // Ex: "Pen Drive (E:\)", "Pen Drive USB", "Pasta Local"
  isValidTransmission?: boolean; // Confirmado com link de transmissão correto
}

export type ActivitySection = 'escola_sabatina' | 'culto_divino' | 'culto_jovem' | 'outro';

export type ActivityCategory = 
  | 'louvor'
  | 'oracao'
  | 'video'
  | 'mensagem_musical'
  | 'infantil'
  | 'ofertas'
  | 'sermao'
  | 'anuncios'
  | 'abertura'
  | 'geral';

export interface ActivityItem {
  id: string;
  name: string;
  section: ActivitySection;
  category: ActivityCategory;
  responsible?: string;
  congregational1?: MediaLink;
  congregational2?: MediaLink;
  congregational3?: MediaLink;
  durationMinutes?: number;
  timeSlot?: string;
  notes?: string;
  completed?: boolean;
  isRecurring?: boolean; // true = Acontece todo sábado (fixo); false = Rotativo (limpo na virada de culto)
}

export interface WorshipProgram {
  id: string;
  title: string;
  date: string;
  responsiblePerson: string; // "Nome do Responsável: Davi"
  preacher?: string;
  theme?: string;
  specialEvent?: string;
  notes?: string;
  activities: ActivityItem[];
  updatedAt: string;
}

export interface WeeklyMediaItem {
  id: string;
  type: 'provai_e_vede' | 'informativo_missoes';
  title: string;
  dateText: string; // ex: "Sábado, 15 de Março de 2025"
  dateIso: string; // "2025-03-15"
  weekNumber: number;
  quarter: number;
  year: number;
  synopsis: string;
  duration: string;
  youtubeId: string;
  directEmbedUrl: string;
  downloadUrl: string;
  backupSearchQuery: string;
  isDownloaded?: boolean;
  downloadedAt?: string;
  narrator?: string; // ex: "Daniel Locutor"
  channelTitle?: string; // ex: "Daniel Gonçalves (Daniel Locutor)"
  channelUrl?: string; // ex: "https://www.youtube.com/@daniellocutor"
  autoLinkedFromChannel?: boolean;
  defaultTargetScreen?: 'main' | 'auxiliary';
  autoFullscreenAux?: boolean;
}

export interface WeeklySearchSlot {
  id: string;
  key: 'informativo' | 'provai' | string;
  name: string; // ex: "Informativo Mundial das Missões (Daniel Locutor)"
  category: 'escola_sabatina' | 'culto_divino' | 'outro';
  channelName: string; // ex: "Daniel Locutor (@daniellocutor)"
  channelUrl?: string; // ex: "https://www.youtube.com/@daniellocutor"
  searchQueryTemplate: string; // ex: "Daniel Locutor Informativo Mundial das Missões"
  autoLink: boolean; // se verdadeiro, vincula automaticamente para dar play sem procurar
  defaultTargetScreen: 'main' | 'auxiliary'; // 'auxiliary' para abrir no telão
  autoFullscreenAux: boolean; // se verdadeiro, já abre em tela cheia nas outras telas
  activeVideoId?: string;
  activeVideoTitle?: string;
  activeDuration?: string;
  thumbnailUrl?: string;
  enabled: boolean;
  updatedAt?: string;
}

export interface Hymn {
  number: number;
  title: string;
  category: string;
  key?: string;
  lyricsSnippet: string;
  fullLyrics?: string[];
  youtubeSearchQuery: string;
  suggestedUsage?: string;
}

export type MusicType = 'louvor' | 'mensagem_musical' | 'fundo_musical' | 'infantil';

export interface ChurchSong {
  id: string;
  title: string;
  artistOrGroup: string; // ex: "Arautos do Rei", "Leonardo Gonçalves", "Ministério de Louvor", "Solo"
  type: MusicType; // 'louvor' | 'mensagem_musical' | 'fundo_musical' | 'infantil'
  youtubeUrlOrId: string; // Direct YouTube link or 11-char ID
  key?: string; // Tom: e.g. "C", "D", "G", "F#"
  suggestedMoment?: string; // ex: "Abertura", "Apelo", "Ofertório", "Prelúdio", "Escola Sabatina"
  lyricsSnippet?: string; // Letra ou estrofe principal
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  isCustom?: boolean; // True if registered by user
}

export type LiturgyMomentPreset = 
  | 'abertura_culto'        // Abertura / Louvor Inicial do Culto Divino
  | 'ofertorio'             // Ofertório / Dízimos e Ofertas
  | 'oracao_intercessoria'  // Oração de Joelhos / Intercessória
  | 'mensagem_musical'      // Mensagem Musical Especial (Antes do Sermão)
  | 'apelo_pos_sermao'      // Apelo / Pós-Sermão
  | 'encerramento_culto'    // Encerramento / Hino Final do Culto Divino
  | 'escola_abertura'       // Abertura / Louvor da Escola Sabatina
  | 'escola_encerramento'   // Encerramento da Escola Sabatina
  | 'adoracao_infantil'     // Momento das Crianças / Adoração Infantil
  | 'personalizado';        // Personalizado / Escolher posição exata

export interface SongLiturgyDestination {
  mode: 'new_activity' | 'existing_activity';
  
  // Para nova atividade:
  section: ActivitySection;
  presetMoment?: LiturgyMomentPreset;
  placement: 'preset' | 'start_of_section' | 'end_of_section' | 'before_activity' | 'after_activity';
  targetActivityId?: string; // ID da atividade de referência quando before ou after
  activityName: string;
  durationMinutes: number;
  responsible: string;
  notes?: string;
  isRecurring?: boolean; // Se a atividade criada acontece todo sábado (fixa) ou é rotativa

  // Para vincular a atividade existente:
  targetSlot?: 'c1' | 'c2' | 'c3';
}

export interface PlaybackItem {
  id: string;
  title: string;
  artistOrType: string;
  category: 'playback' | 'fundo_musical' | 'video_oficial' | 'hino' | 'adoracao_infantil';
  youtubeQuery: string;
  recommendedFor: string;
  directUrl?: string;
}

export type TeamDepartment = 'sonoplastia' | 'louvor';

export interface TeamMember {
  id: string;
  name: string;
  role: string; // ex: "Sonoplastia (Mesa de Som)", "Direção do Louvor"
  department: TeamDepartment;
  phone: string; // WhatsApp: (xx) xxxxx-xxxx ou com ddd
  email?: string;
  isScheduled: boolean; // Escalado para o próximo culto
  scheduledDate?: string; // Data da escala
  notes?: string;
  reminderSentDayBefore?: string; // Timestamp ISO quando enviado
  reminderSentTwoHoursBefore?: string; // Timestamp ISO quando enviado
}

export interface ScaleSettings {
  cultoDate: string; // Ex: "Sábado, 15 de Março" ou YYYY-MM-DD
  cultoTime: string; // Ex: "09:00"
  churchName: string; // Ex: "IASD Central"
  scaleImageBlobId?: string; // ID no IndexedDB
  scaleImageDataUrl?: string; // Base64 preview
  scaleImageUpdatedAt?: string;
  autoRemindersEnabled?: boolean;
}

// Authentication & Roles
export type UserRole = 'user' | 'developer';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email?: string;
  churchId?: string;
  churchName?: string;
  loggedInAt: string;
  rememberMe?: boolean;
}

export interface ChurchAccount {
  id: string; // slug, ex: "iasd-vila-nova"
  name: string;
  district?: string;
  city?: string;
  state?: string;
  login: string; // usuário para autenticação
  password: string; // senha da congregação
  adminContact?: string;
  createdAt: string;
}

// Church Information
export interface ChurchDetails {
  id: string;
  name: string;
  district: string;
  association: string;
  union: string;
  codeOrCnpj?: string;
  pastorName: string;
  pastorPhone: string;
  pastorEmail: string;
  headElderName: string;
  headElderPhone: string;
  musicDirectorName: string;
  soundDirectorName: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  regularServiceTimes: string;
  youtubeChannelUrl?: string;
  instagramUrl?: string;
  driveFolderUrl?: string;
  wifiCredentials?: string;
  capacity?: number;
  notes?: string;
  updatedAt: string;
}

// Pastor Recommendations & Pastoral Communications
export type RecommendationStatus = 'approved' | 'pending' | 'completed' | 'archived';
export type RecommendationType = 'pregador' | 'musica_louvor' | 'comunicado_pastoral' | 'visita_oficial' | 'outro';

export interface PastorRecommendation {
  id: string;
  code: string; // e.g. "REC-2026-001"
  type: RecommendationType;
  status: RecommendationStatus;
  title: string;
  recommendedPerson: string; // Nome do pregador, cantor, grupo ou membro recomendado
  originChurch: string; // IASD de Origem
  destinationChurch: string; // IASD de Destino
  serviceDate: string; // Data do culto ou visita
  pastorName: string; // Nome do pastor emitente
  pastorPhone: string;
  pastorDistrict?: string;
  ministryOrTalent: string; // Ex: "Pregação do Sermão Bíblico", "Ministério Musical / Quarteto"
  content: string; // Texto oficial eclesiástico
  observations?: string;
  issuedAt: string;
  isOfficialLetter: boolean; // Se possui timbre pastoral oficial
}

// Itens da aba Escola Sabatina e Culto (Louvores Congregacionais e Mensagens Musicais)
export interface WorshipPraiseItem {
  id: string;
  kind: 'louvor_congregacional' | 'mensagem_musical';
  title: string;
  artistOrGroup: string;
  key?: string; // Tom musical (ex: C, D, G, F#)
  section: ActivitySection; // 'escola_sabatina' | 'culto_divino'
  momentDescription?: string; // Ex: "Momento de Louvor 1", "Antes do Sermão", "Hino Inicial", etc.
  youtubeUrlOrQuery: string;
  notes?: string;
  order: number;
  isRecurring?: boolean; // Se acontece sempre (Todo Sábado / Fixo) ou se é rotativo (limpo no culto)
  targetActivityId?: string; // ID da atividade vinculada na Liturgia Principal
  sourceFromManual?: boolean; // Se foi obtido automaticamente do Manual da Escola Sabatina
}

