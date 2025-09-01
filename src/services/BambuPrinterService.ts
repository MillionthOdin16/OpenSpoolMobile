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
    const brandLower = (brand || 'generic').toLowerCase().trim();

    // Enhanced brand matching with partial string matching
    const matchesBrand = (brandNames: string[]) =>
      brandNames.some(b => brandLower.includes(b.toLowerCase()) || b.toLowerCase().includes(brandLower));

    if (typeUpper === 'TPU') {
      return matchesBrand(['bambu', 'bambulab']) ? 'GFU01' : 'GFU99';
    } else if (typeUpper === 'PLA') {
      if (matchesBrand(['polyterra'])) {
        return 'GFL01';
      }
      if (matchesBrand(['polylite'])) {
        return 'GFL00';
      }
      if (matchesBrand(['sunlu'])) {
        return 'GFSNL03';
      }
      if (matchesBrand(['bambu', 'bambulab', 'bambu lab'])) {
        return 'GFA00';
      }
      if (matchesBrand(['polymaker'])) {
        return 'GFL02';
      }
      if (matchesBrand(['hatchbox'])) {
        return 'GFL03';
      }
      return 'GFL99';
    } else if (typeUpper === 'PETG') {
      if (matchesBrand(['sunlu'])) {
        return 'GFSNL08';
      }
      if (matchesBrand(['bambu', 'bambulab', 'bambu lab'])) {
        return 'GFG00';
      }
      if (matchesBrand(['polymaker'])) {
        return 'GFG01';
      }
      return 'GFG99';
    } else if (typeUpper === 'ABS') {
      return matchesBrand(['bambu', 'bambulab', 'bambu lab']) ? 'GFB00' : 'GFB99';
    } else if (typeUpper === 'ASA') {
      return matchesBrand(['bambu', 'bambulab', 'bambu lab']) ? 'GFB01' : 'GFB98';
    } else if (typeUpper === 'PC') {
      return matchesBrand(['bambu', 'bambulab', 'bambu lab']) ? 'GFC00' : 'GFC99';
    } else if (typeUpper === 'PA' || typeUpper === 'NYLON') {
      return matchesBrand(['bambu', 'bambulab', 'bambu lab']) ? 'GFN00' : 'GFN99';
    } else if (typeUpper === 'PA-CF' || typeUpper === 'NYLON-CF') {
      return matchesBrand(['bambu', 'bambulab', 'bambu lab']) ? 'GFN03' : 'GFN98';
    } else if (typeUpper === 'PLA-CF') {
      return matchesBrand(['bambu', 'bambulab', 'bambu lab']) ? 'GFL97' : 'GFL98';
    } else if (typeUpper === 'PVA') {
      return matchesBrand(['bambu', 'bambulab', 'bambu lab']) ? 'GFS00' : 'GFS99';
    } else if (typeUpper === 'SUPPORT') {
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
        const extendedData = filamentData as ExtendedFilamentData;

        // Ensure color hex has alpha channel and proper format
        let colorHex = filamentData.color_hex;
        if (colorHex.startsWith('#')) {
          colorHex = colorHex.substring(1);
        }
        if (colorHex.length === 6) {
          colorHex += 'FF'; // Add full opacity
        } else if (colorHex.length !== 8) {
          colorHex = 'FFFFFFFF'; // Default to white with full opacity
        }

        // Use manufacturer or brand field with preference for manufacturer
        const effectiveBrand = extendedData.manufacturer || filamentData.brand || 'Generic';
        const brandCode = BambuPrinterService.getBrandCode(filamentData.type, effectiveBrand);

        // Build comprehensive payload with available data
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

        // Add extended fields if available for enhanced printer integration
        const printPayload = payload.print as any;

        // Add bed temperature if available
        if (extendedData.bed_temp !== undefined) {
          printPayload.bed_temp_min = Math.max(0, extendedData.bed_temp - 5);
          printPayload.bed_temp_max = Math.min(120, extendedData.bed_temp + 5);
        }

        // Add diameter information if available
        if (extendedData.diameter !== undefined) {
          printPayload.tray_diameter = extendedData.diameter;
        }

        // Add weight information if available (useful for remaining filament calculation)
        if (extendedData.weight !== undefined) {
          printPayload.remain_weight = Math.round(extendedData.weight);
        }

        // Add density for volume calculations if available
        if (extendedData.density !== undefined) {
          printPayload.k_value = extendedData.density;
        }

        console.log('Sending comprehensive filament data:', JSON.stringify(payload, null, 2));

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
