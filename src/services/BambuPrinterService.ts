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

// Enhanced interfaces for comprehensive MQTT support
export interface PrinterStatus {
  gcode_state: 'IDLE' | 'PREPARE' | 'RUNNING' | 'PAUSE' | 'FINISH' | 'FAILED';
  print_error: number;
  mc_percent: number;
  mc_remaining_time: number;
  layer_num: number;
  total_layer_num: number;
  nozzle_temper: number;
  nozzle_target_temper: number;
  bed_temper: number;
  bed_target_temper: number;
  chamber_temper?: number;
  cooling_fan_speed: string;
  big_fan1_speed: string; // Auxiliary fan
  big_fan2_speed: string; // Chamber fan
  heatbreak_fan_speed: string;
  wifi_signal: string;
  subtask_name: string;
  gcode_file: string;
}

export interface AMSStatus {
  ams_exist_bits: string;
  tray_now: string;
  ams_status: number;
  ams: Array<{
    id: string;
    humidity: string;
    temp: string;
    tray: Array<{
      id: string;
      tray_type: string;
      tray_color: string;
      nozzle_temp_min: string;
      nozzle_temp_max: string;
      tray_info_idx: string;
      remain: number;
      tray_weight: string;
    }>;
  }>;
}

export interface LightStatus {
  chamber_light: 'on' | 'off' | 'flashing';
  work_light: 'on' | 'off' | 'flashing';
}

export enum PrintSpeed {
  SILENT = 1,
  STANDARD = 2,
  SPORT = 3,
  LUDICROUS = 4,
}

export enum CalibrationOption {
  BED_LEVELING = 1 << 1,
  VIBRATION_COMPENSATION = 1 << 2,
  MOTOR_NOISE_CANCELLATION = 1 << 3,
}

// Command response interface
export interface CommandResponse {
  result: 'success' | 'failed';
  reason?: string;
  sequence_id: string;
}

export class BambuPrinterService {
  private client: any = null;
  private settings: PrinterSettings | null = null;
  private connected: boolean = false;
  private sequenceId: number = 0;
  private commandTopic: string = '';
  private reportTopic: string = '';
  private lastStatus: PrinterStatus | null = null;
  private lastAMSStatus: AMSStatus | null = null;
  private lightStatus: LightStatus = { chamber_light: 'off', work_light: 'off' };

  // Event handlers
  public onStatusUpdate: ((status: PrinterStatus) => void) | null = null;
  public onAMSUpdate: ((amsStatus: AMSStatus) => void) | null = null;
  public onCommandResponse: ((response: CommandResponse) => void) | null = null;
  public onError: ((error: string) => void) | null = null;

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
    this.commandTopic = `device/${settings.serialNumber}/request`;
    this.reportTopic = `device/${settings.serialNumber}/report`;
  }

  // Generate next sequence ID
  private getNextSequenceId(): string {
    return (++this.sequenceId).toString();
  }

  // Send command to printer
  private async sendCommand(payload: any): Promise<boolean> {
    if (!this.client || !this.isConnected()) {
      throw new Error('Not connected to printer');
    }

    return new Promise((resolve, reject) => {
      try {
        const message = JSON.stringify(payload);
        console.log('Sending command:', message);
        
        // sp-react-native-mqtt publish API: publish(topic, payload, qos, retain)
        this.client.publish(this.commandTopic, message, 0, false);
        resolve(true);
      } catch (error) {
        console.error('Failed to send command:', error);
        reject(error);
      }
    });
  }

  // Handle incoming messages from printer
  private handleMessage(topic: string, message: string) {
    try {
      const data = JSON.parse(message);
      console.log('Received message:', topic, data);

      // Handle different message types
      if (data.print) {
        this.handlePrintMessage(data.print);
      }
      if (data.info) {
        this.handleInfoMessage(data.info);
      }
      if (data.system) {
        this.handleSystemMessage(data.system);
      }
      if (data.upgrade) {
        this.handleUpgradeMessage(data.upgrade);
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
      if (this.onError) {
        this.onError(`Failed to parse message: ${error}`);
      }
    }
  }

  // Handle print status messages
  private handlePrintMessage(printData: any) {
    // Extract status information
    if (printData.command === 'push_status' || !printData.command) {
      const status: PrinterStatus = {
        gcode_state: printData.gcode_state || 'IDLE',
        print_error: printData.print_error || 0,
        mc_percent: printData.mc_percent || 0,
        mc_remaining_time: printData.mc_remaining_time || 0,
        layer_num: printData.layer_num || 0,
        total_layer_num: printData.total_layer_num || 0,
        nozzle_temper: printData.nozzle_temper || 0,
        nozzle_target_temper: printData.nozzle_target_temper || 0,
        bed_temper: printData.bed_temper || 0,
        bed_target_temper: printData.bed_target_temper || 0,
        chamber_temper: printData.chamber_temper,
        cooling_fan_speed: printData.cooling_fan_speed || '0',
        big_fan1_speed: printData.big_fan1_speed || '0',
        big_fan2_speed: printData.big_fan2_speed || '0',
        heatbreak_fan_speed: printData.heatbreak_fan_speed || '0',
        wifi_signal: printData.wifi_signal || '',
        subtask_name: printData.subtask_name || '',
        gcode_file: printData.gcode_file || '',
      };

      this.lastStatus = status;
      if (this.onStatusUpdate) {
        this.onStatusUpdate(status);
      }

      // Handle AMS status if present
      if (printData.ams) {
        const amsStatus: AMSStatus = {
          ams_exist_bits: printData.ams_exist_bits || '0',
          tray_now: printData.tray_now || '255',
          ams_status: printData.ams_status || 0,
          ams: printData.ams.ams || [],
        };

        this.lastAMSStatus = amsStatus;
        if (this.onAMSUpdate) {
          this.onAMSUpdate(amsStatus);
        }
      }

      // Handle light status if present
      if (printData.lights_report) {
        for (const light of printData.lights_report) {
          if (light.node === 'chamber_light') {
            this.lightStatus.chamber_light = light.mode;
          } else if (light.node === 'work_light') {
            this.lightStatus.work_light = light.mode;
          }
        }
      }
    }

    // Handle command responses
    if (printData.result && printData.sequence_id) {
      const response: CommandResponse = {
        result: printData.result,
        reason: printData.reason,
        sequence_id: printData.sequence_id,
      };

      if (this.onCommandResponse) {
        this.onCommandResponse(response);
      }
    }
  }

  // Handle system messages
  private handleSystemMessage(systemData: any) {
    if (systemData.result && systemData.sequence_id) {
      const response: CommandResponse = {
        result: systemData.result,
        reason: systemData.reason,
        sequence_id: systemData.sequence_id,
      };

      if (this.onCommandResponse) {
        this.onCommandResponse(response);
      }
    }
  }

  // Handle info messages
  private handleInfoMessage(infoData: any) {
    // Handle version info, etc.
    console.log('Info message received:', infoData);
  }

  // Handle upgrade messages
  private handleUpgradeMessage(upgradeData: any) {
    // Handle firmware upgrade status
    console.log('Upgrade message received:', upgradeData);
  }

  async connect(): Promise<boolean> {
    if (!this.settings) {
      throw new Error('Printer settings not configured');
    }

    return new Promise((resolve, reject) => {
      try {
        const uri = `mqtt://${this.settings!.ipAddress}:8883`;

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
            
            // Subscribe to printer reports
            client.subscribe(this.reportTopic, 0);
            
            // Request initial status
            this.requestStatusUpdate();
            
            resolve(true);
          });

          client.on('message', (msg: { data: string; qos: number; retain: boolean; topic: string }) => {
            this.handleMessage(msg.topic, msg.data);
          });

          client.on('error', (error: any) => {
            console.error('MQTT connection error:', error);
            this.connected = false;
            if (this.onError) {
              this.onError(`Connection error: ${error}`);
            }
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

  // Request full status update from printer
  async requestStatusUpdate(): Promise<boolean> {
    const payload = {
      pushing: {
        sequence_id: this.getNextSequenceId(),
        command: 'pushall',
        version: 1,
        push_target: 1,
      },
    };

    return this.sendCommand(payload);
  }

  // Request printer version info
  async getVersionInfo(): Promise<boolean> {
    const payload = {
      info: {
        sequence_id: this.getNextSequenceId(),
        command: 'get_version',
      },
    };

    return this.sendCommand(payload);
  }

  async sendFilamentToSlot(filamentData: FilamentDataInput, slot: SlotInfo): Promise<boolean> {
    if (!this.client || !this.isConnected()) {
      throw new Error('Not connected to printer');
    }

    if (!this.settings) {
      throw new Error('Printer settings not configured');
    }

    try {
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

      // Build comprehensive payload with all available data
      const payload = {
        print: {
          sequence_id: this.getNextSequenceId(),
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
        printPayload.bed_temp = extendedData.bed_temp;
        printPayload.bed_temp_type = '0'; // Auto type
      }

      // Add diameter information if available
      if (extendedData.diameter !== undefined) {
        printPayload.tray_diameter = extendedData.diameter.toString();
      }

      // Add weight information if available (useful for remaining filament calculation)
      if (extendedData.weight !== undefined) {
        printPayload.tray_weight = Math.round(extendedData.weight).toString();
        printPayload.remain = Math.round(extendedData.weight); // Assume full spool
      }

      // Add density for volume calculations if available
      if (extendedData.density !== undefined) {
        printPayload.k_value = extendedData.density;
      }

      // Add drying parameters if available
      if (extendedData.drying_temp !== undefined) {
        printPayload.drying_temp = extendedData.drying_temp.toString();
      }
      if (extendedData.drying_time !== undefined) {
        printPayload.drying_time = extendedData.drying_time.toString();
      }

      // Add material identification
      if (extendedData.material_base) {
        printPayload.tray_sub_brands = extendedData.material_base;
      }

      console.log('Sending comprehensive filament data:', JSON.stringify(payload, null, 2));

      return this.sendCommand(payload);
    } catch (error) {
      console.error('Failed to send filament data:', error);
      throw error;
    }
  }

  // === PRINT CONTROL COMMANDS ===

  // Start print from file
  async startPrint(fileName: string, options: {
    useAMS?: boolean;
    amsMapping?: number[];
    skipObjects?: number[];
    bedLeveling?: boolean;
    flowCalibration?: boolean;
    vibrationCalibration?: boolean;
    layerInspection?: boolean;
  } = {}): Promise<boolean> {
    const payload = {
      print: {
        sequence_id: this.getNextSequenceId(),
        command: 'project_file',
        param: 'Metadata/plate_1.gcode',
        file: fileName,
        project_id: '0',
        profile_id: '0',
        task_id: '0',
        subtask_id: '0',
        subtask_name: '',
        url: `file:///mnt/sdcard/${fileName}`,
        md5: '',
        timelapse: true,
        bed_type: 'auto',
        bed_levelling: options.bedLeveling ?? true,
        flow_cali: options.flowCalibration ?? true,
        vibration_cali: options.vibrationCalibration ?? true,
        layer_inspect: options.layerInspection ?? true,
        ams_mapping: options.amsMapping || [],
        use_ams: options.useAMS ?? false,
        skip_objects: options.skipObjects || [],
      },
    };

    return this.sendCommand(payload);
  }

  // Stop current print
  async stopPrint(): Promise<boolean> {
    const payload = {
      print: {
        sequence_id: this.getNextSequenceId(),
        command: 'stop',
        param: '',
      },
    };

    return this.sendCommand(payload);
  }

  // Pause current print
  async pausePrint(): Promise<boolean> {
    const payload = {
      print: {
        sequence_id: this.getNextSequenceId(),
        command: 'pause',
        param: '',
      },
    };

    return this.sendCommand(payload);
  }

  // Resume current print
  async resumePrint(): Promise<boolean> {
    const payload = {
      print: {
        sequence_id: this.getNextSequenceId(),
        command: 'resume',
        param: '',
      },
    };

    return this.sendCommand(payload);
  }

  // Set print speed level
  async setPrintSpeed(speedLevel: PrintSpeed): Promise<boolean> {
    const payload = {
      print: {
        sequence_id: this.getNextSequenceId(),
        command: 'print_speed',
        param: speedLevel.toString(),
      },
    };

    return this.sendCommand(payload);
  }

  // Send G-code command
  async sendGcode(gcode: string): Promise<boolean> {
    const payload = {
      print: {
        sequence_id: this.getNextSequenceId(),
        command: 'gcode_line',
        param: gcode,
      },
    };

    return this.sendCommand(payload);
  }

  // === TEMPERATURE CONTROL ===

  // Set nozzle temperature
  async setNozzleTemperature(temperature: number): Promise<boolean> {
    return this.sendGcode(`M104 S${temperature}`);
  }

  // Set bed temperature
  async setBedTemperature(temperature: number): Promise<boolean> {
    return this.sendGcode(`M140 S${temperature}`);
  }

  // === FAN CONTROL ===

  // Set part cooling fan speed (0-255)
  async setPartFanSpeed(speed: number): Promise<boolean> {
    if (speed < 0 || speed > 255) {
      throw new Error('Fan speed must be between 0 and 255');
    }
    return this.sendGcode(`M106 P1 S${speed}`);
  }

  // Set auxiliary fan speed (0-255)
  async setAuxFanSpeed(speed: number): Promise<boolean> {
    if (speed < 0 || speed > 255) {
      throw new Error('Fan speed must be between 0 and 255');
    }
    return this.sendGcode(`M106 P2 S${speed}`);
  }

  // Set chamber fan speed (0-255)
  async setChamberFanSpeed(speed: number): Promise<boolean> {
    if (speed < 0 || speed > 255) {
      throw new Error('Fan speed must be between 0 and 255');
    }
    return this.sendGcode(`M106 P3 S${speed}`);
  }

  // === AMS CONTROL ===

  // Load filament from AMS
  async loadFilament(amsId: number, trayId: number): Promise<boolean> {
    const target = (amsId * 4) + trayId;
    const payload = {
      print: {
        sequence_id: this.getNextSequenceId(),
        command: 'ams_change_filament',
        target: target,
        curr_temp: 0,
        tar_temp: 0,
      },
    };

    return this.sendCommand(payload);
  }

  // Unload current filament
  async unloadFilament(): Promise<boolean> {
    const payload = {
      print: {
        sequence_id: this.getNextSequenceId(),
        command: 'ams_change_filament',
        target: 254, // Unload target
        curr_temp: 0,
        tar_temp: 0,
      },
    };

    return this.sendCommand(payload);
  }

  // Control AMS operations
  async controlAMS(operation: 'resume' | 'pause' | 'reset'): Promise<boolean> {
    const payload = {
      print: {
        sequence_id: this.getNextSequenceId(),
        command: 'ams_control',
        param: operation,
      },
    };

    return this.sendCommand(payload);
  }

  // === SYSTEM COMMANDS ===

  // Control LED lights
  async setLight(light: 'chamber_light' | 'work_light', mode: 'on' | 'off' | 'flashing', options?: {
    onTime?: number;
    offTime?: number;
    loopTimes?: number;
    intervalTime?: number;
  }): Promise<boolean> {
    const payload = {
      system: {
        sequence_id: this.getNextSequenceId(),
        command: 'ledctrl',
        led_node: light,
        led_mode: mode,
        led_on_time: options?.onTime || 500,
        led_off_time: options?.offTime || 500,
        loop_times: options?.loopTimes || 1,
        interval_time: options?.intervalTime || 1000,
      },
    };

    return this.sendCommand(payload);
  }

  // Start calibration
  async startCalibration(options: {
    bedLeveling?: boolean;
    vibrationCompensation?: boolean;
    motorNoiseCancellation?: boolean;
  } = {}): Promise<boolean> {
    let bitmask = 0;
    if (options.bedLeveling !== false) bitmask |= CalibrationOption.BED_LEVELING;
    if (options.vibrationCompensation !== false) bitmask |= CalibrationOption.VIBRATION_COMPENSATION;
    if (options.motorNoiseCancellation !== false) bitmask |= CalibrationOption.MOTOR_NOISE_CANCELLATION;

    const payload = {
      print: {
        sequence_id: this.getNextSequenceId(),
        command: 'calibration',
        option: bitmask,
      },
    };

    return this.sendCommand(payload);
  }

  // Auto home printer
  async autoHome(): Promise<boolean> {
    return this.sendGcode('G28');
  }

  // Get access code
  async getAccessCode(): Promise<boolean> {
    const payload = {
      system: {
        sequence_id: this.getNextSequenceId(),
        command: 'get_access_code',
      },
    };

    return this.sendCommand(payload);
  }

  // === STATUS GETTERS ===

  // Get current printer status
  getCurrentStatus(): PrinterStatus | null {
    return this.lastStatus;
  }

  // Get current AMS status
  getAMSStatus(): AMSStatus | null {
    return this.lastAMSStatus;
  }

  // Get light status
  getLightStatus(): LightStatus {
    return this.lightStatus;
  }

  // Get connection status with more detail
  getConnectionInfo(): {
    connected: boolean;
    settings: PrinterSettings | null;
    lastStatusUpdate: PrinterStatus | null;
  } {
    return {
      connected: this.connected,
      settings: this.settings,
      lastStatusUpdate: this.lastStatus,
    };
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
