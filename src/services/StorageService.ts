import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrinterSettings } from './BambuPrinterService';

const PRINTER_SETTINGS_KEY = 'openspool_printer_settings';

export class StorageService {
  static async savePrinterSettings(settings: PrinterSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(PRINTER_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save printer settings:', error);
      throw error;
    }
  }

  static async loadPrinterSettings(): Promise<PrinterSettings | null> {
    try {
      const settings = await AsyncStorage.getItem(PRINTER_SETTINGS_KEY);
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Failed to load printer settings:', error);
      return null;
    }
  }

  static async clearPrinterSettings(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PRINTER_SETTINGS_KEY);
    } catch (error) {
      console.error('Failed to clear printer settings:', error);
      throw error;
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  }
}
