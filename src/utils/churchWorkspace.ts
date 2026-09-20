export interface ChurchProfile {
  id: string; // slug, e.g. "iasd-vila-nova", "iasd-central"
  name: string;
  district?: string;
  city?: string;
  state?: string;
  createdAt: string;
}

const STORAGE_CHURCHES_LIST = 'iasd_registered_churches_v1';
const STORAGE_ACTIVE_CHURCH = 'iasd_active_church_id_v1';

export const DEFAULT_CHURCHES: ChurchProfile[] = [
  {
    id: 'iasd-vila-nova',
    name: 'IASD Vila Nova',
    district: 'Distrito Central Leste',
    city: 'São Paulo',
    state: 'SP',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'iasd-central',
    name: 'IASD Central',
    district: 'Distrito Central',
    city: 'São Paulo',
    state: 'SP',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'iasd-alvorada',
    name: 'IASD Alvorada',
    district: 'Distrito Alvorada',
    city: 'Campinas',
    state: 'SP',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'iasd-jardim-flores',
    name: 'IASD Jardim das Flores',
    district: 'Distrito Oeste',
    city: 'Curitiba',
    state: 'PR',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

/**
 * Normalizes a church name to a URL-friendly slug.
 */
export function slugifyChurchName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Gets the list of registered churches.
 */
export function getRegisteredChurches(): ChurchProfile[] {
  try {
    const saved = localStorage.getItem(STORAGE_CHURCHES_LIST);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar lista de igrejas:', e);
  }
  return DEFAULT_CHURCHES;
}

/**
 * Saves the list of registered churches.
 */
export function saveRegisteredChurches(list: ChurchProfile[]): void {
  try {
    localStorage.setItem(STORAGE_CHURCHES_LIST, JSON.stringify(list));
  } catch (e) {
    console.error('Erro ao salvar lista de igrejas:', e);
  }
}

/**
 * Registers a new church profile.
 */
export function registerChurch(name: string, district?: string, city?: string, state?: string): ChurchProfile {
  const slug = slugifyChurchName(name) || `igreja-${Date.now()}`;
  const existingList = getRegisteredChurches();
  
  const existing = existingList.find(c => c.id === slug);
  if (existing) {
    return existing;
  }

  const newChurch: ChurchProfile = {
    id: slug,
    name: name.trim(),
    district: district?.trim(),
    city: city?.trim(),
    state: state?.trim(),
    createdAt: new Date().toISOString(),
  };

  const updated = [...existingList, newChurch];
  saveRegisteredChurches(updated);
  return newChurch;
}

/**
 * Resolves the active church ID based on URL parameter (?igreja=... or ?church=...)
 * or fallback to localStorage.
 */
export function getActiveChurchId(): string {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlChurch = params.get('igreja') || params.get('church') || params.get('workspace');
    if (urlChurch) {
      const slug = slugifyChurchName(urlChurch);
      if (slug) return slug;
    }

    try {
      const stored = localStorage.getItem(STORAGE_ACTIVE_CHURCH);
      if (stored) return stored;
    } catch (e) {}
  }
  return DEFAULT_CHURCHES[0].id; // default: iasd-vila-nova
}

export const DEFAULT_CHURCH_ID = DEFAULT_CHURCHES[0].id;

/**
 * Retrieves the full ChurchProfile for the active church.
 */
export function getActiveChurchProfile(): ChurchProfile {
  const activeId = getActiveChurchId();
  const churches = getRegisteredChurches();
  const found = churches.find(c => c.id === activeId);
  if (found) return found;

  // If activeId is custom (e.g. from URL), create a fallback profile
  return {
    id: activeId,
    name: formatChurchNameFromSlug(activeId),
    createdAt: new Date().toISOString(),
  };
}

export const getActiveChurch = getActiveChurchProfile;

/**
 * Formats a slug like "iasd-central-sp" to "IASD Central Sp".
 */
export function formatChurchNameFromSlug(slug: string): string {
  return slug
    .split('-')
    .map(word => {
      if (word.toLowerCase() === 'iasd') return 'IASD';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Switches the active church, updates localStorage, URL parameter, and notifies subscribers.
 */
export function setActiveChurch(churchId: string, reloadPage = false): void {
  try {
    localStorage.setItem(STORAGE_ACTIVE_CHURCH, churchId);
  } catch (e) {}

  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.searchParams.set('igreja', churchId);
    window.history.replaceState({}, '', url.toString());

    // Dispatch cross-component event
    window.dispatchEvent(new CustomEvent('church_workspace_changed', { detail: churchId }));

    if (reloadPage) {
      window.location.reload();
    }
  }
}

/**
 * Subscribes to changes in the active church workspace.
 */
export function subscribeActiveChurch(listener: (church: ChurchProfile) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = () => {
    listener(getActiveChurchProfile());
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_ACTIVE_CHURCH) {
      listener(getActiveChurchProfile());
    }
  };

  window.addEventListener('church_workspace_changed', handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener('church_workspace_changed', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}

/**
 * Generates an isolated storage key prefixed with the church ID.
 * Example: getScopedKey('worship_program') -> 'iasd_worship_program_iasd-vila-nova'
 */
export function getScopedStorageKey(baseKey: string, churchId?: string): string {
  const cId = churchId || getActiveChurchId();
  return `iasd_${baseKey}_${cId}`;
}

/**
 * Returns a shareable URL directly linking to this specific church.
 */
export function getChurchShareUrl(churchId?: string): string {
  if (typeof window === 'undefined') return '';
  const cId = churchId || getActiveChurchId();
  const url = new URL(window.location.href);
  url.searchParams.set('igreja', cId);
  return url.toString();
}
