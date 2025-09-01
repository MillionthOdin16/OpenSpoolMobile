import MQTT from 'sp-react-native-mqtt';
import { ExtendedFilamentData } from './TagProtocolService';

export interface PrinterSettings {
  ipAddress: string;
  serialNumber: string;
  accessCode?: string;
}

// Keep original interface for backwards compatibility
export interface FilamentData {
  color_hex: string;
  type: string;
  min_temp: number;
  max_temp: number;
  brand: string;
}

// Type alias for extended data
export type FilamentDataInput = FilamentData | ExtendedFilamentData;

export interface SlotInfo {
  id: string;
  label: string;
  amsId: number;
  trayId: number;
}

export class BambuPrinterService {
  private client: any = null;
  private settings: PrinterSettings | null = null;
  private connected: boolean = false;

  // Available slots for filament
  static getAvailableSlots(): SlotInfo[] {
    return [
      { id: 'external', label: 'External Spool', amsId: 255, trayId: 254 },
      { id: 'ams1', label: 'AMS Slot 1', amsId: 0, trayId: 0 },
      { id: 'ams2', label: 'AMS Slot 2', amsId: 0, trayId: 1 },
      { id: 'ams3', label: 'AMS Slot 3', amsId: 0, trayId: 2 },
      { id: 'ams4', label: 'AMS Slot 4', amsId: 0, trayId: 3 },
    ];
  }

  // Get brand code mapping with enhanced brand detection
  static getBrandCode(type: string, brand: string): string {
    const typeUpper = type.toUpperCase();
    const brandLower = (brand || 'generic').toLowerCase();

    if (typeUpper === 'TPU') {
      return brandLower === 'bambu' ? 'GFU01' : 'GFU99';
    } else if (typeUpper === 'PLA') {
      if (brandLower.includes('polyterra')) {
        return 'GFL01';
      }
      if (brandLower.includes('polylite')) {
        return 'GFL00';
      }
      if (brandLower.includes('sunlu')) {
        return 'GFSNL03';
      }
      if (brandLower === 'bambu' || brandLower.includes('bambu')) {
        return 'GFA00';
      }
      return 'GFL99';
    } else if (typeUpper === 'PETG') {
      if (brandLower.includes('sunlu')) {
        return 'GFSNL08';
      }
      return 'GFG99';
    } else if (typeUpper === 'ABS') {
      return (brandLower === 'bambu' || brandLower.includes('bambu')) ? 'GFB00' : 'GFB99';
    } else if (typeUpper === 'ASA') {
      return 'GFB98';
    } else if (typeUpper === 'PC') {
      return (brandLower === 'bambu' || brandLower.includes('bambu')) ? 'GFC00' : 'GFC99';
    } else if (typeUpper === 'PA' || typeUpper === 'NYLON') {
      return 'GFN99';
    } else if (typeUpper === 'PA-CF') {
      return (brandLower === 'bambu' || brandLower.includes('bambu')) ? 'GFN03' : 'GFN98';
    } else if (typeUpper === 'PLA-CF') {
      return 'GFL98';
    } else if (typeUpper === 'PVA') {
      return 'GFS99';
    }

    return 'GFL99'; // Default to generic PLA
  }

  configure(settings: PrinterSettings) {
    this.settings = settings;
  }

  async connect(): Promise<boolean> {
    if (!this.settings) {
      throw new Error('Printer settings not configured');
    }

    return new Promise((resolve, reject) => {
      try {
        const uri = `mqtt://${this.settings!.ipAddress}:1883`;

        MQTT.createClient({
          uri,
          clientId: `openspool_mobile_${Date.now()}`,
          user: 'bblp',
          pass: this.settings!.accessCode || '',
          keepalive: 30,
        }).then((client) => {
          this.client = client;

          client.on('connect', () => {
            console.log('Connected to Bambu printer');
            this.connected = true;
            resolve(true);
          });

          client.on('error', (error: any) => {
            console.error('MQTT connection error:', error);
            this.connected = false;
            reject(error);
          });

          client.on('closed', () => {
            console.log('MQTT connection closed');
            this.connected = false;
          });

          // Timeout after 10 seconds
          setTimeout(() => {
            if (!this.isConnected()) {
              reject(new Error('Connection timeout'));
            }
          }, 10000);

          // Start the connection
          client.connect();
        }).catch((error) => {
          console.error('Failed to create MQTT client:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async sendFilamentToSlot(filamentData: FilamentDataInput, slot: SlotInfo): Promise<boolean> {
    if (!this.client || !this.isConnected()) {
      throw new Error('Not connected to printer');
    }

    if (!this.settings) {
      throw new Error('Printer settings not configured');
    }

    return new Promise((resolve, reject) => {
      try {
        const topic = `device/${this.settings!.serialNumber}/request`;

        // Ensure color hex has alpha channel
        let colorHex = filamentData.color_hex;
        if (colorHex.length === 6) {
          colorHex += 'FF'; // Add full opacity
        }

        // Use manufacturer or brand field with preference for manufacturer
        const effectiveBrand = (filamentData as ExtendedFilamentData).manufacturer || filamentData.brand || 'Generic';
        const brandCode = BambuPrinterService.getBrandCode(filamentData.type, effectiveBrand);

        const payload = {
          print: {
            sequence_id: '0',
            command: 'ams_filament_setting',
            ams_id: slot.amsId,
            tray_id: slot.trayId,
            tray_color: colorHex,
            nozzle_temp_min: filamentData.min_temp,
            nozzle_temp_max: filamentData.max_temp,
            tray_type: filamentData.type.toUpperCase(),
            setting_id: '',
            tray_info_idx: brandCode,
          },
        };

        console.log('Sending filament data:', JSON.stringify(payload, null, 2));

        // sp-react-native-mqtt publish API: publish(topic, payload, qos, retain)
        this.client.publish(topic, JSON.stringify(payload), 0, false);

        console.log('Filament data sent successfully');
        resolve(true);
      } catch (error) {
        console.error('Failed to send filament data:', error);
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected && this.client !== null;
  }

  // Getter for testing purposes
  getSettings(): PrinterSettings | null {
    return this.settings;
  }
}

export const bambuPrinterService = new BambuPrinterService();
