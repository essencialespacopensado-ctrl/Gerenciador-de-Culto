export type ScreenType = 'projector' | 'stage_display' | 'foyer' | 'nursery' | 'side_screen' | 'custom';

export interface ProjectionScreenConfig {
  id: string;
  name: string;
  description: string;
  type: ScreenType;
  enabled: boolean;
  autoFullscreen: boolean;
  autoCloseOnEnd: boolean;
  standbyMode: 'logo' | 'clock_logo' | 'black';
  monitorIndex?: number;
  resolution?: string;
  isCustom?: boolean;
}

export interface GeneralProjectionSettings {
  screens: ProjectionScreenConfig[];
  autoCloseAllOnEnd: boolean;
  autoFullscreenAll: boolean;
  showTitleOverlayOnStart: boolean;
}

export const DEFAULT_PROJECTION_SCREENS: ProjectionScreenConfig[] = [
  {
    id: 'telao_principal',
    name: 'Telão Principal do Templo',
    description: 'Projetor ou Painel de LED voltado para a congregação (Nave)',
    type: 'projector',
    enabled: true,
    autoFullscreen: true,
    autoCloseOnEnd: true,
    standbyMode: 'logo',
    resolution: '1920x1080',
  },
  {
    id: 'retorno_pulpito',
    name: 'Retorno de Púlpito (Confidence Monitor)',
    description: 'Monitor voltado para o pastor, pregador e cantores no altar',
    type: 'stage_display',
    enabled: true,
    autoFullscreen: true,
    autoCloseOnEnd: true,
    standbyMode: 'clock_logo',
    resolution: '1920x1080',
  },
  {
    id: 'tv_foyer',
    name: 'TV do Foyer / Recepção',
    description: 'Televisor no hall de entrada para recepcionistas e visitantes',
    type: 'foyer',
    enabled: false,
    autoFullscreen: true,
    autoCloseOnEnd: true,
    standbyMode: 'logo',
    resolution: '1920x1080',
  },
  {
    id: 'tv_bercario',
    name: 'TV do Berçário / Sala dos Pais',
    description: 'Televisor na sala de mães, pais e crianças pequenas',
    type: 'nursery',
    enabled: false,
    autoFullscreen: true,
    autoCloseOnEnd: true,
    standbyMode: 'logo',
    resolution: '1920x1080',
  },
  {
    id: 'telao_lateral',
    name: 'Telão Lateral / Retorno do Coral',
    description: 'Monitor lateral voltado para a equipe de louvor e músicos',
    type: 'side_screen',
    enabled: false,
    autoFullscreen: true,
    autoCloseOnEnd: true,
    standbyMode: 'black',
    resolution: '1920x1080',
  },
];

export const DEFAULT_GENERAL_SETTINGS: GeneralProjectionSettings = {
  screens: DEFAULT_PROJECTION_SCREENS,
  autoCloseAllOnEnd: true,
  autoFullscreenAll: true,
  showTitleOverlayOnStart: true,
};

const STORAGE_KEY = 'iasd_projection_screens_config_v2';
const SETTINGS_EVENT = 'iasd_screens_config_changed';

export function loadGeneralSettings(): GeneralProjectionSettings {
  if (typeof window === 'undefined') return DEFAULT_GENERAL_SETTINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.screens) && parsed.screens.length > 0) {
        // Merge any new default screens if not present
        const existingIds = new Set(parsed.screens.map((s: ProjectionScreenConfig) => s.id));
        const missingDefaults = DEFAULT_PROJECTION_SCREENS.filter(s => !existingIds.has(s.id));
        return {
          ...DEFAULT_GENERAL_SETTINGS,
          ...parsed,
          screens: [...parsed.screens, ...missingDefaults],
        };
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar configurações de telas:', err);
  }
  return DEFAULT_GENERAL_SETTINGS;
}

export function saveGeneralSettings(settings: GeneralProjectionSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: settings }));
  } catch (err) {
    console.warn('Erro ao salvar configurações de telas:', err);
  }
}

export function getEnabledScreens(): ProjectionScreenConfig[] {
  const settings = loadGeneralSettings();
  return settings.screens.filter(s => s.enabled);
}

export function getScreenById(id: string): ProjectionScreenConfig | undefined {
  const settings = loadGeneralSettings();
  return settings.screens.find(s => s.id === id);
}

export function subscribeScreensConfig(callback: (settings: GeneralProjectionSettings) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e: any) => {
    callback(e.detail || loadGeneralSettings());
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback(loadGeneralSettings());
    }
  };

  window.addEventListener(SETTINGS_EVENT, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  // Initial call
  callback(loadGeneralSettings());

  return () => {
    window.removeEventListener(SETTINGS_EVENT, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}
