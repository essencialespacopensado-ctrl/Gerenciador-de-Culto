import { WorshipProgram, ActivityItem } from '../types';
import { getScopedStorageKey, getActiveChurchId, getActiveChurchProfile } from './churchWorkspace';
import { applyManualHymnsToProgram } from './liturgySync';

export interface ArchivedWorshipProgram {
  id: string;
  churchId: string;
  churchName: string;
  title: string;
  date: string; // "YYYY-MM-DD"
  dateFormatted: string; // "Sábado, 20 de Setembro de 2026"
  responsiblePerson: string;
  preacher?: string;
  theme?: string;
  specialEvent?: string;
  notes?: string;
  closingNotes?: string;
  activities: ActivityItem[];
  completedCount: number;
  totalCount: number;
  songsCount: number;
  archivedAt: string; // ISO string
}

const ARCHIVE_BASE_KEY = 'archived_worships_v1';

/**
 * Formats a YYYY-MM-DD date to a human readable Brazilian Portuguese date:
 * e.g., "Sábado, 20 de Setembro de 2026"
 */
export function formatWorshipDateLong(isoDate?: string): string {
  if (!isoDate) return 'Data não definida';
  try {
    // Append T12:00:00 to prevent timezone shifting
    const dateObj = new Date(isoDate.includes('T') ? isoDate : `${isoDate}T12:00:00`);
    if (isNaN(dateObj.getTime())) return isoDate;
    
    const formatted = dateObj.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    // Capitalize first letter (e.g. "sábado..." -> "Sábado...")
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return isoDate;
  }
}

/**
 * Formats a YYYY-MM-DD date into a short form: e.g. "Sáb, 20/09/2026"
 */
export function formatWorshipDateShort(isoDate?: string): string {
  if (!isoDate) return '—';
  try {
    const dateObj = new Date(isoDate.includes('T') ? isoDate : `${isoDate}T12:00:00`);
    if (isNaN(dateObj.getTime())) return isoDate;
    const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });
    const shortDay = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1).replace('.', '');
    return `${capitalizedWeekday}, ${shortDay}`;
  } catch {
    return isoDate;
  }
}

/**
 * Computes next Saturday's date in YYYY-MM-DD format.
 */
export function getNextSaturdayDate(baseDateInput?: Date | string): string {
  const d = baseDateInput 
    ? (typeof baseDateInput === 'string' ? new Date(`${baseDateInput}T12:00:00`) : new Date(baseDateInput))
    : new Date();
  
  const day = d.getDay(); // 0 = Sunday, 6 = Saturday
  let daysToAdd = (6 - day);
  if (daysToAdd <= 0) {
    daysToAdd += 7; // If today is Saturday or Sunday, go to the next Saturday
  }
  
  const nextSat = new Date(d);
  nextSat.setDate(d.getDate() + daysToAdd);
  return nextSat.toISOString().split('T')[0];
}

/**
 * Returns today's date in YYYY-MM-DD format.
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Retrieves all archived worship services for the current or specified church.
 */
export function getArchivedWorships(churchId?: string): ArchivedWorshipProgram[] {
  const key = getScopedStorageKey(ARCHIVE_BASE_KEY, churchId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Sort descending: most recent archives first
        return parsed.sort((a, b) => new Date(b.date || b.archivedAt).getTime() - new Date(a.date || a.archivedAt).getTime());
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar cultos arquivados:', e);
  }
  return [];
}

/**
 * Archives the current active worship program into church history.
 */
export function archiveCurrentWorship(
  program: WorshipProgram,
  closingNotes?: string,
  churchId?: string,
  churchName?: string
): ArchivedWorshipProgram {
  const cId = churchId || getActiveChurchId();
  const cProfile = getActiveChurchProfile();
  const cName = churchName || cProfile.name;
  
  const completedCount = program.activities.filter(a => a.completed).length;
  const totalCount = program.activities.length;
  
  // Count praise / song items
  const songsCount = program.activities.reduce((acc, act) => {
    let count = 0;
    if (act.congregational1?.title) count++;
    if (act.congregational2?.title) count++;
    if (act.congregational3?.title) count++;
    return acc + count;
  }, 0);

  const archiveItem: ArchivedWorshipProgram = {
    id: `arch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    churchId: cId,
    churchName: cName,
    title: program.title || 'Culto de Sábado',
    date: program.date || getTodayDate(),
    dateFormatted: formatWorshipDateLong(program.date || getTodayDate()),
    responsiblePerson: program.responsiblePerson || 'Operador',
    preacher: program.preacher,
    theme: program.theme,
    specialEvent: program.specialEvent,
    notes: program.notes,
    closingNotes: closingNotes?.trim(),
    activities: JSON.parse(JSON.stringify(program.activities)), // Deep copy
    completedCount,
    totalCount,
    songsCount,
    archivedAt: new Date().toISOString(),
  };

  const currentList = getArchivedWorships(cId);
  const updatedList = [archiveItem, ...currentList];
  
  const key = getScopedStorageKey(ARCHIVE_BASE_KEY, cId);
  try {
    localStorage.setItem(key, JSON.stringify(updatedList));
  } catch (e) {
    console.error('Erro ao salvar culto arquivado:', e);
  }

  return archiveItem;
}

/**
 * Deletes an archived worship service from history.
 */
export function deleteArchivedWorship(archiveId: string, churchId?: string): void {
  const cId = churchId || getActiveChurchId();
  const currentList = getArchivedWorships(cId);
  const updatedList = currentList.filter(item => item.id !== archiveId);
  
  const key = getScopedStorageKey(ARCHIVE_BASE_KEY, cId);
  try {
    localStorage.setItem(key, JSON.stringify(updatedList));
  } catch (e) {
    console.error('Erro ao excluir culto arquivado:', e);
  }
}

/**
 * Clears all archived worship services for this church.
 */
export function clearAllArchivedWorships(churchId?: string): void {
  const cId = churchId || getActiveChurchId();
  const key = getScopedStorageKey(ARCHIVE_BASE_KEY, cId);
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Erro ao limpar arquivo de cultos:', e);
  }
}

/**
 * Determines whether an activity happens every Saturday (fixed/recurring)
 * or is rotating (changes every week like praises, musical messages, sermon guest preacher).
 */
export function isActivityRecurring(activity: ActivityItem): boolean {
  if (typeof activity.isRecurring === 'boolean') {
    return activity.isRecurring;
  }
  
  const name = (activity.name || '').toLowerCase();
  const cat = activity.category;

  // 1. Official weekly media (Provai e Vede & Informativo das Missões)
  if (name.includes('informativo') || name.includes('provai') || cat === 'ofertas') {
    return true;
  }

  // 2. Standard welcoming, platform entrance
  if (name.includes('boas vindas') || name.includes('boas-vindas') || name.includes('entrada da plataforma')) {
    return true;
  }

  // 3. Prayers with standard reverent backgrounds
  if (cat === 'oracao' || name.includes('oração') || name.includes('oracao')) {
    return true;
  }

  // 4. Sabbath School Lesson study & Class divisions
  if (name.includes('lição') || name.includes('licao') || name.includes('estudo da lição') || name.includes('classes')) {
    return true;
  }

  // 5. Children entrance & story
  if (name.includes('crianças') || name.includes('criancas') || name.includes('adoração infantil') || name.includes('adoracao infantil')) {
    return true;
  }

  // 6. The sermon moment itself (as an order slot)
  if (cat === 'sermao' || name.includes('sermão') || name.includes('sermao')) {
    return true;
  }

  // Otherwise, default to rotating (louvores, mensagens musicais, avisos, videos especiais)
  return false;
}

/**
 * Cleans ONLY the rotating items in the liturgy while strictly preserving
 * everything that happens every Saturday (prayers with pads, weekly videos, lesson study, kids, platform).
 */
export function cleanRotatingLiturgyItems(
  program: WorshipProgram,
  targetDate?: string
): WorshipProgram {
  const newDate = targetDate || getNextSaturdayDate(program.date);
  const formattedDate = formatWorshipDateShort(newDate);

  // Everything that is rotativo is completely removed from the liturgy!
  // Only activities that happen every Saturday (isActivityRecurring) are preserved.
  const cleanedActivities: ActivityItem[] = program.activities
    .filter(act => isActivityRecurring(act))
    .map(act => {
      // PRESERVE INTACT: Fixed recurring activity that happens every Saturday!
      // Keep prayer background songs, weekly video links, entrance music, etc.
      // Clear only rotating temporary playbacks/songs (keeping background pads and weekly media slots)
      const keepC1 = act.congregational1?.isWeeklyMedia || 
        act.congregational1?.title.toLowerCase().includes('fundo musical') ||
        act.category === 'oracao' ||
        act.name.toLowerCase().includes('oração') ||
        act.name.toLowerCase().includes('informativo') ||
        act.name.toLowerCase().includes('provai');

      const keepC2 = act.congregational2?.isWeeklyMedia || 
        act.congregational2?.title.toLowerCase().includes('fundo musical') ||
        act.category === 'oracao';

      const keepC3 = act.congregational3?.isWeeklyMedia || 
        act.congregational3?.title.toLowerCase().includes('fundo musical') ||
        act.category === 'oracao';

      return {
        ...act,
        completed: false,
        isRecurring: true,
        congregational1: keepC1 ? act.congregational1 : undefined,
        congregational2: keepC2 ? act.congregational2 : undefined,
        congregational3: keepC3 ? act.congregational3 : undefined,
        responsible: act.category === 'sermao' ? '' : act.responsible,
        notes: act.notes?.toLowerCase().includes('obs:') ? undefined : act.notes,
      };
    });

  const updatedProgram: WorshipProgram = {
    ...program,
    id: `prog-${Date.now()}`,
    title: `Culto de Sábado - ${formattedDate}`,
    date: newDate,
    preacher: '', // Preacher changes weekly
    theme: '',    // Sermon theme changes weekly
    notes: program.notes?.includes('Sonoplastia:') ? program.notes : undefined,
    activities: cleanedActivities,
    updatedAt: new Date().toISOString(),
  };

  return applyManualHymnsToProgram(updatedProgram, newDate, true);
}

/**
 * Re-converts an archived worship program into an active WorshipProgram object.
 * Can be used to restore or duplicate as template for the next service.
 */
export function restoreArchivedWorshipToProgram(
  archive: ArchivedWorshipProgram, 
  asTemplateForNextService = false,
  cleanRotatingOnly = true
): WorshipProgram {
  const newDate = asTemplateForNextService 
    ? getNextSaturdayDate() 
    : (archive.date || getTodayDate());

  if (asTemplateForNextService && cleanRotatingOnly) {
    // Clean only rotating items, keeping fixed items intact!
    const baseProgram: WorshipProgram = {
      id: archive.id,
      title: archive.title,
      date: archive.date,
      responsiblePerson: archive.responsiblePerson,
      preacher: archive.preacher,
      theme: archive.theme,
      specialEvent: archive.specialEvent,
      notes: archive.notes,
      activities: archive.activities,
      updatedAt: archive.archivedAt,
    };
    return cleanRotatingLiturgyItems(baseProgram, newDate);
  }

  // If restoring exact archive or legacy mode
  const activities = archive.activities.map(a => ({
    ...a,
    completed: asTemplateForNextService ? false : a.completed,
    isRecurring: isActivityRecurring(a),
  }));

  return {
    id: `prog-${Date.now()}`,
    title: asTemplateForNextService ? `Culto de Sábado - ${formatWorshipDateShort(newDate)}` : archive.title,
    date: newDate,
    responsiblePerson: archive.responsiblePerson,
    preacher: asTemplateForNextService ? '' : archive.preacher,
    theme: asTemplateForNextService ? '' : archive.theme,
    specialEvent: archive.specialEvent,
    notes: archive.notes,
    activities,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Generates a clean WhatsApp-ready text summary of an archived service.
 */
export function generateArchiveShareText(archive: ArchivedWorshipProgram): string {
  const lines: string[] = [
    `⛪ *${archive.churchName.toUpperCase()}*`,
    `📋 *Relatório do Culto Arquivado*`,
    `📅 *Data:* ${archive.dateFormatted}`,
    `🎙️ *Responsável:* ${archive.responsiblePerson}`,
  ];

  if (archive.preacher) {
    lines.push(`📖 *Pregador:* ${archive.preacher}`);
  }
  if (archive.theme) {
    lines.push(`✨ *Tema:* ${archive.theme}`);
  }

  lines.push(`📊 *Atividades Executadas:* ${archive.completedCount} de ${archive.totalCount} (${Math.round((archive.completedCount / Math.max(archive.totalCount, 1)) * 100)}%)`);
  
  if (archive.closingNotes) {
    lines.push(`📝 *Anotações Finais:* ${archive.closingNotes}`);
  }

  lines.push('');
  lines.push(`🎶 *Louvores e Momentos Musicais:*`);
  
  archive.activities.forEach(act => {
    const medias = [act.congregational1, act.congregational2, act.congregational3].filter(Boolean);
    if (medias.length > 0) {
      lines.push(`• *${act.name}*:`);
      medias.forEach(m => {
        if (m?.title) {
          lines.push(`  - ${m.title}${m.note ? ` (${m.note})` : ''}`);
        }
      });
    }
  });

  lines.push('');
  lines.push(`_Gerado pelo Sistema Sonoplastia IASD_`);

  return lines.join('\n');
}
