import { getEnabledScreens, loadGeneralSettings, ProjectionScreenConfig, getScreenById, GeneralProjectionSettings } from './screenConfig';
import { getActiveChurchId } from './churchWorkspace';

// Management and synchronization for Auxiliary Screen (Telão / Projetor) and Main Screen (Operador)
export interface ProjectedMedia {
  id?: string;
  title: string;
  urlOrQuery: string;
  youtubeId?: string | null;
  embedUrl?: string;
  videoUrl?: string; // For offline local video (blob or base64)
  isOffline?: boolean;
  videoDate?: string;
  synopsis?: string;
  timestamp: number;
}

export type ProjectionTarget = 'main' | 'auxiliary';

export interface ProjectionState {
  target: ProjectionTarget;
  activeMedia: ProjectedMedia | null;
  isPlaying: boolean;
  volume: number; // 0 to 100
  isAuxiliaryConnected: boolean;
  connectedScreensCount?: number;
}

class ProjectionManager {
  private channel: BroadcastChannel | null = null;
  private currentChurchId: string = 'iasd-vila-nova';
  private auxWindows: Map<string, Window> = new Map();
  private listeners: Set<(state: ProjectionState) => void> = new Set();
  
  private state: ProjectionState = {
    target: 'main',
    activeMedia: null,
    isPlaying: true,
    volume: 100,
    isAuxiliaryConnected: false,
    connectedScreensCount: 0,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.currentChurchId = getActiveChurchId();
      this.initChannel();

      // Fallback listener via localStorage
      window.addEventListener('storage', (e) => {
        if (e.key === this.getStorageKey() && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.state = { ...this.state, ...parsed };
            this.notifyListeners();
          } catch (err) {
            // ignore
          }
        }
      });

      // Load initial state
      try {
        const saved = localStorage.getItem(this.getStorageKey());
        if (saved) {
          this.state = { ...this.state, ...JSON.parse(saved) };
        }
      } catch (err) {
        // ignore
      }
    }
  }

  private getChannelName(): string {
    return `iasd_projection_sync_${this.currentChurchId}`;
  }

  private getStorageKey(): string {
    return `iasd_projection_state_${this.currentChurchId}`;
  }

  private initChannel() {
    try {
      if (this.channel) {
        this.channel.close();
      }
      if ('BroadcastChannel' in window) {
        this.channel = new BroadcastChannel(this.getChannelName());
        this.channel.onmessage = (event) => {
          this.handleChannelMessage(event.data);
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported or restricted, falling back to localStorage');
    }
  }

  public switchChurch(newChurchId: string) {
    if (this.currentChurchId !== newChurchId) {
      this.currentChurchId = newChurchId;
      this.initChannel();
      try {
        const saved = localStorage.getItem(this.getStorageKey());
        if (saved) {
          this.state = { ...this.state, ...JSON.parse(saved) };
        } else {
          this.state.activeMedia = null;
          this.state.isAuxiliaryConnected = false;
        }
        this.notifyListeners();
      } catch (e) {}
    }
  }

  public setChurchId(newChurchId: string) {
    this.switchChurch(newChurchId);
  }

  private handleChannelMessage(message: any) {
    if (!message || !message.type) return;

    switch (message.type) {
      case 'STATE_SYNC':
        this.state = { ...this.state, ...message.state };
        this.notifyListeners();
        break;
      case 'AUXILIARY_HELLO':
        this.state.isAuxiliaryConnected = true;
        this.notifyListeners();
        // Reply with current state
        this.postMessage({ type: 'STATE_SYNC', state: this.state });
        break;
      case 'AUXILIARY_BYE':
        this.state.isAuxiliaryConnected = false;
        this.notifyListeners();
        break;
      case 'VIDEO_ENDED':
        this.state.activeMedia = null;
        this.state.isPlaying = false;
        this.notifyListeners();
        this.closeAuxiliaryScreens();
        break;
      case 'SETTINGS_UPDATED':
        this.notifyListeners();
        break;
      case 'COMMAND':
        if (message.action === 'play') this.state.isPlaying = true;
        if (message.action === 'pause') this.state.isPlaying = false;
        if (message.action === 'volume') this.state.volume = message.value;
        if (message.action === 'close') {
          this.closeAuxiliaryScreens();
        }
        this.notifyListeners();
        break;
    }
  }

  private postMessage(data: any) {
    if (this.channel) {
      try {
        this.channel.postMessage(data);
      } catch (e) {
        // ignore
      }
    }
    // Also update localStorage for multi-window sync
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(this.state));
    } catch (e) {
      // ignore
    }
  }

  public getState(): ProjectionState {
    return { ...this.state };
  }

  public subscribe(callback: (state: ProjectionState) => void): () => void {
    this.listeners.add(callback);
    callback(this.getState());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (e) {
        console.error(e);
      }
    });
  }

  // Update the active projected media without re-opening windows
  public updateProjectedMedia(media: ProjectedMedia) {
    this.state.activeMedia = media;
    this.notifyListeners();
    this.postMessage({ type: 'STATE_SYNC', state: this.state });
  }

  // Transmit to Main Screen (Operator display)
  public transmitToMainScreen(media: ProjectedMedia) {
    this.state.target = 'main';
    this.state.activeMedia = media;
    this.state.isPlaying = true;
    this.notifyListeners();
    this.postMessage({ type: 'STATE_SYNC', state: this.state });
  }

  // Transmit directly to Auxiliary Screen (Opens on all non-primary screens with Fullscreen)
  public async transmitToAuxiliaryScreen(media: ProjectedMedia, autoFullscreen: boolean = true): Promise<boolean> {
    this.state.target = 'auxiliary';
    this.state.activeMedia = media;
    this.state.isPlaying = true;
    this.notifyListeners();
    this.postMessage({ type: 'STATE_SYNC', state: this.state });

    // Open on all screens other than the main screen synchronously with media directly attached
    const { openedCount } = await this.openOnAllAuxiliaryScreens(autoFullscreen, media);

    if (autoFullscreen) {
      this.postMessage({ type: 'COMMAND', action: 'fullscreen' });
      try {
        localStorage.setItem('iasd_fullscreen_trigger', String(Date.now()));
      } catch (e) {}
    }

    return openedCount > 0;
  }

  /**
   * Opens the video-only auxiliary display on screens that are not the primary screen.
   * Prioritizes synchronous window.open to prevent browser popup blockers.
   * Directly encodes media in URL query parameters so the Telão plays immediately on open.
   */
  public async openOnAllAuxiliaryScreens(
    autoFullscreen: boolean = true, 
    mediaToPlay?: ProjectedMedia
  ): Promise<{ openedCount: number; popupBlocked: boolean }> {
    if (typeof window === 'undefined') return { openedCount: 0, popupBlocked: false };

    // Clean up closed windows
    for (const [key, win] of this.auxWindows.entries()) {
      try {
        if (!win || win.closed) {
          this.auxWindows.delete(key);
        }
      } catch (e) {
        this.auxWindows.delete(key);
      }
    }

    const effectiveMedia = mediaToPlay || this.state.activeMedia;

    if (effectiveMedia) {
      this.state.target = 'auxiliary';
      this.state.activeMedia = effectiveMedia;
      this.state.isPlaying = true;
      this.notifyListeners();
      this.postMessage({ type: 'STATE_SYNC', state: this.state });
    }

    const enabledScreens = getEnabledScreens();
    const screensToOpen = enabledScreens.length > 0 ? enabledScreens : [
      {
        id: 'telao_principal',
        name: 'Telão Principal do Templo',
        description: 'Projetor ou Painel de LED voltado para a congregação (Nave)',
        type: 'projector' as const,
        enabled: true,
        autoFullscreen: true,
        autoCloseOnEnd: true,
        standbyMode: 'logo' as const,
      }
    ];

    let openedCount = 0;
    let popupBlocked = false;

    const screenWidth = window.screen.availWidth || 1920;
    const screenHeight = window.screen.availHeight || 1080;

    screensToOpen.forEach((screen, index) => {
      // 1. If window already open for this screen, bring it to focus and notify
      const existingWin = this.auxWindows.get(screen.id);
      if (existingWin && !existingWin.closed) {
        try {
          existingWin.focus();
          openedCount++;
          // Transmit current state to open window
          this.postMessage({ type: 'STATE_SYNC', state: this.state });
        } catch (e) {}
        return;
      }

      // 2. Open new window for this screen
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('view', 'auxiliar');
        url.searchParams.set('screenId', screen.id);
        url.searchParams.set('screenName', screen.name);
        if (autoFullscreen && screen.autoFullscreen) {
          url.searchParams.set('fullscreen', '1');
        }
        url.searchParams.set('autoplay', '1');

        // Pass media parameters directly in the URL for zero-delay instant playback
        if (effectiveMedia) {
          url.searchParams.set('target', 'auxiliary');
          url.searchParams.set('mediaTitle', encodeURIComponent(effectiveMedia.title));
          url.searchParams.set('urlOrQuery', encodeURIComponent(effectiveMedia.urlOrQuery));
          if (effectiveMedia.youtubeId) {
            url.searchParams.set('youtubeId', effectiveMedia.youtubeId);
          }
          if (effectiveMedia.embedUrl) {
            url.searchParams.set('embedUrl', encodeURIComponent(effectiveMedia.embedUrl));
          }
          if (effectiveMedia.videoUrl) {
            url.searchParams.set('videoUrl', encodeURIComponent(effectiveMedia.videoUrl));
          }
          if (effectiveMedia.videoDate) {
            url.searchParams.set('videoDate', encodeURIComponent(effectiveMedia.videoDate));
          }
          if (effectiveMedia.synopsis) {
            url.searchParams.set('synopsis', encodeURIComponent(effectiveMedia.synopsis));
          }
        }

        // Position on additional monitors or offset slightly
        const left = screenWidth + (index * 40);
        const top = index * 40;
        const features = `width=${screenWidth},height=${screenHeight},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`;

        const newWin = window.open(url.toString(), `IasdAuxiliaryDisplay_${screen.id}`, features);
        if (newWin) {
          this.auxWindows.set(screen.id, newWin);
          try {
            newWin.focus();
          } catch (e) {}
          openedCount++;
        } else {
          popupBlocked = true;
        }
      } catch (err) {
        console.warn(`Popup blocked during opening screen ${screen.name}:`, err);
        popupBlocked = true;
      }
    });

    this.state.isAuxiliaryConnected = this.auxWindows.size > 0;
    this.state.connectedScreensCount = this.auxWindows.size;
    this.notifyListeners();

    if (autoFullscreen) {
      this.postMessage({ type: 'COMMAND', action: 'fullscreen' });
      try {
        localStorage.setItem('iasd_fullscreen_trigger', String(Date.now()));
      } catch (e) {}
    }

    return { openedCount, popupBlocked };
  }

  /**
   * Opens a single specific configured screen (useful for testing screen positions)
   */
  public openSingleScreen(screen: ProjectionScreenConfig, autoFullscreen: boolean = true): Window | null {
    if (typeof window === 'undefined') return null;

    const screenWidth = window.screen.availWidth || 1920;
    const screenHeight = window.screen.availHeight || 1080;
    const features = `width=${screenWidth},height=${screenHeight},left=${screenWidth},top=0,menubar=no,toolbar=no,location=no,status=no,resizable=yes`;

    const url = new URL(window.location.href);
    url.searchParams.set('view', 'auxiliar');
    url.searchParams.set('screenId', screen.id);
    url.searchParams.set('screenName', screen.name);
    if (autoFullscreen && screen.autoFullscreen) {
      url.searchParams.set('fullscreen', '1');
    }
    url.searchParams.set('autoplay', '1');

    try {
      const win = window.open(url.toString(), `IasdAuxiliaryDisplay_${screen.id}`, features);
      if (win) {
        this.auxWindows.set(screen.id, win);
        try { win.focus(); } catch (e) {}
        this.state.isAuxiliaryConnected = true;
        this.state.connectedScreensCount = this.auxWindows.size;
        this.notifyListeners();
        return win;
      }
    } catch (err) {
      console.warn('Error opening single screen:', err);
    }
    return null;
  }

  public closeSingleScreen(screenId: string) {
    const win = this.auxWindows.get(screenId);
    if (win && !win.closed) {
      try { win.close(); } catch (e) {}
    }
    this.auxWindows.delete(screenId);
    this.state.isAuxiliaryConnected = this.auxWindows.size > 0;
    this.state.connectedScreensCount = this.auxWindows.size;
    this.notifyListeners();
  }

  public getOpenScreensCount(): number {
    let count = 0;
    for (const [key, win] of this.auxWindows.entries()) {
      try {
        if (win && !win.closed) count++;
        else this.auxWindows.delete(key);
      } catch (e) {
        this.auxWindows.delete(key);
      }
    }
    return count;
  }

  public ensureAuxiliaryWindowOpen(): boolean {
    this.openOnAllAuxiliaryScreens();
    return this.auxWindows.size > 0;
  }

  public togglePlayPause() {
    this.state.isPlaying = !this.state.isPlaying;
    this.notifyListeners();
    this.postMessage({ 
      type: 'COMMAND', 
      action: this.state.isPlaying ? 'play' : 'pause' 
    });
  }

  public setVolume(val: number) {
    this.state.volume = Math.max(0, Math.min(100, val));
    this.notifyListeners();
    this.postMessage({ type: 'COMMAND', action: 'volume', value: this.state.volume });
  }

  public setTarget(target: ProjectionTarget) {
    this.state.target = target;
    this.notifyListeners();
    this.postMessage({ type: 'STATE_SYNC', state: this.state });
    if (target === 'auxiliary') {
      this.ensureAuxiliaryWindowOpen();
    }
  }

  public clearActiveMedia() {
    this.state.activeMedia = null;
    this.state.isPlaying = false;
    this.notifyListeners();
    this.postMessage({ type: 'STATE_SYNC', state: this.state });
  }

  // Notifies that the projected video has finished and triggers automatic closing of the screen
  public notifyVideoEnded() {
    this.state.activeMedia = null;
    this.state.isPlaying = false;
    this.notifyListeners();
    this.postMessage({ type: 'VIDEO_ENDED' });
    try {
      localStorage.setItem('iasd_video_ended_trigger', String(Date.now()));
    } catch (e) {}

    const settings = loadGeneralSettings();
    if (settings.autoCloseAllOnEnd) {
      this.closeAuxiliaryScreens();
    }
  }

  // Closes all opened auxiliary screens (Telão) automatically
  public closeAuxiliaryScreens() {
    for (const [screenId, win] of this.auxWindows.entries()) {
      try {
        if (win && !win.closed) {
          win.close();
        }
      } catch (e) {
        console.warn('Could not close window directly:', e);
      }
    }
    this.auxWindows.clear();
    this.state.isAuxiliaryConnected = false;
    this.state.connectedScreensCount = 0;
    this.notifyListeners();
    this.postMessage({ type: 'COMMAND', action: 'close' });
    try {
      localStorage.setItem('iasd_close_auxiliary_trigger', String(Date.now()));
    } catch (e) {}
  }

  // Broadcasts settings update to all active screens and storage immediately
  public broadcastSettingsUpdate(settings: GeneralProjectionSettings) {
    this.postMessage({ type: 'SETTINGS_UPDATED', settings, timestamp: Date.now() });
    try {
      localStorage.setItem('iasd_screen_settings_updated', JSON.stringify({ settings, timestamp: Date.now() }));
    } catch (e) {}

    // Update active window titles and close windows that were disabled
    for (const screen of settings.screens) {
      const win = this.auxWindows.get(screen.id);
      if (win && !win.closed) {
        try {
          win.document.title = `${screen.name} - Sonoplastia IASD`;
        } catch (e) {}
        if (!screen.enabled) {
          try {
            win.close();
          } catch (e) {}
          this.auxWindows.delete(screen.id);
        }
      }
    }
    this.notifyListeners();
  }

  public notifyAuxiliaryReady() {
    this.state.isAuxiliaryConnected = true;
    this.notifyListeners();
    this.postMessage({ type: 'AUXILIARY_HELLO' });
  }

  public notifyAuxiliaryClosed() {
    this.state.isAuxiliaryConnected = false;
    this.notifyListeners();
    this.postMessage({ type: 'AUXILIARY_BYE' });
  }
}

export const projectionManager = new ProjectionManager();
