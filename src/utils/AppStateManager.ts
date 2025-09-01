import { ExtendedFilamentData } from '../services/TagProtocolService';

// Simple state management for sharing data between screens
class AppStateManager {
  private static instance: AppStateManager;
  private lastScannedFilament: ExtendedFilamentData | null = null;
  private listeners: ((filament: ExtendedFilamentData | null) => void)[] = [];

  public static getInstance(): AppStateManager {
    if (!AppStateManager.instance) {
      AppStateManager.instance = new AppStateManager();
    }
    return AppStateManager.instance;
  }

  public setLastScannedFilament(filament: ExtendedFilamentData | null): void {
    this.lastScannedFilament = filament;
    this.notifyListeners();
  }

  public getLastScannedFilament(): ExtendedFilamentData | null {
    return this.lastScannedFilament;
  }

  public addListener(callback: (filament: ExtendedFilamentData | null) => void): void {
    this.listeners.push(callback);
  }

  public removeListener(callback: (filament: ExtendedFilamentData | null) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.lastScannedFilament));
  }
}

export const appStateManager = AppStateManager.getInstance();
