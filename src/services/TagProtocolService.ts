export enum TagProtocol {
  OPENSPOOL = 'openspool',
  OPENTAG3D = 'opentag3d',
}

export interface ExtendedFilamentData {
  // Common fields across protocols
  color_hex: string;
  type: string;
  min_temp: number;
  max_temp: number;
  brand: string;

  // Protocol-specific fields
  protocol?: string;
  version?: string;

  // OpenSpool specific fields
  diameter?: number;
  weight?: number;
  length?: number;

  // OpenTag3D specific fields
  manufacturer?: string;
  material?: string;
  grade?: string;
  batch_number?: string;
  production_date?: string;
  expiry_date?: string;
  bed_temp?: number;
  density?: number;

  // Extensible for future protocols
  [key: string]: any;
}

export interface ProtocolHandler {
  protocol: TagProtocol;
  name: string;
  version: string;

  parseTagData(rawData: string): ExtendedFilamentData | null;
  formatTagData(data: ExtendedFilamentData): string;
  getDefaultData(): Partial<ExtendedFilamentData>;
  validateData(data: ExtendedFilamentData): boolean;
}

export class OpenSpoolProtocolHandler implements ProtocolHandler {
  protocol = TagProtocol.OPENSPOOL;
  name = 'OpenSpool Protocol';
  version = '1.0';

  parseTagData(rawData: string): ExtendedFilamentData | null {
    try {
      const jsonData = JSON.parse(rawData);

      // Validate required OpenSpool fields
      if (!jsonData.color_hex || !jsonData.type ||
          jsonData.min_temp === undefined || jsonData.max_temp === undefined) {
        return null;
      }

      return {
        color_hex: jsonData.color_hex,
        type: jsonData.type.toLowerCase(),
        min_temp: Number(jsonData.min_temp),
        max_temp: Number(jsonData.max_temp),
        brand: jsonData.brand || 'Generic',
        protocol: jsonData.protocol || 'openspool',
        version: jsonData.version || '1.0',
        diameter: jsonData.diameter || 1.75,
        weight: jsonData.weight,
        length: jsonData.length,
      };
    } catch (error) {
      console.error('Failed to parse OpenSpool tag data:', error);
      return null;
    }
  }

  formatTagData(data: ExtendedFilamentData): string {
    const openSpoolData: any = {
      version: this.version,
      protocol: this.protocol,
      color_hex: data.color_hex,
      type: data.type,
      min_temp: data.min_temp,
      max_temp: data.max_temp,
      brand: data.brand || 'Generic',
      diameter: data.diameter || 1.75,
    };

    // Add optional fields if present
    if (data.weight !== undefined) {openSpoolData.weight = data.weight;}
    if (data.length !== undefined) {openSpoolData.length = data.length;}

    return JSON.stringify(openSpoolData);
  }

  getDefaultData(): Partial<ExtendedFilamentData> {
    return {
      protocol: this.protocol,
      version: this.version,
      diameter: 1.75,
      brand: 'Generic',
    };
  }

  validateData(data: ExtendedFilamentData): boolean {
    return !!(
      data.color_hex &&
      data.type &&
      typeof data.min_temp === 'number' &&
      typeof data.max_temp === 'number' &&
      data.min_temp < data.max_temp
    );
  }
}

export class OpenTag3DProtocolHandler implements ProtocolHandler {
  protocol = TagProtocol.OPENTAG3D;
  name = 'OpenTag3D Protocol';
  version = '1.0';

  parseTagData(rawData: string): ExtendedFilamentData | null {
    try {
      const jsonData = JSON.parse(rawData);

      // OpenTag3D uses different field names, map them
      const material = jsonData.material || jsonData.type || '';
      const manufacturer = jsonData.manufacturer || jsonData.brand || 'Generic';

      // Try to extract color from hex field or color name
      let color_hex = jsonData.color_hex || jsonData.color || 'FFFFFF';
      if (color_hex && !color_hex.startsWith('#') && color_hex.length === 6) {
        // Assume it's already hex without #
      } else if (color_hex.startsWith('#')) {
        color_hex = color_hex.substring(1);
      }

      return {
        color_hex: color_hex,
        type: material.toLowerCase(),
        min_temp: Number(jsonData.nozzle_temp_min || jsonData.min_temp || 190),
        max_temp: Number(jsonData.nozzle_temp_max || jsonData.max_temp || 220),
        brand: manufacturer,
        protocol: 'opentag3d',
        version: jsonData.version || '1.0',
        manufacturer: manufacturer,
        material: material,
        grade: jsonData.grade,
        batch_number: jsonData.batch_number,
        production_date: jsonData.production_date,
        expiry_date: jsonData.expiry_date,
        bed_temp: jsonData.bed_temp ? Number(jsonData.bed_temp) : undefined,
        density: jsonData.density ? Number(jsonData.density) : undefined,
        diameter: jsonData.diameter ? Number(jsonData.diameter) : 1.75,
      };
    } catch (error) {
      console.error('Failed to parse OpenTag3D tag data:', error);
      return null;
    }
  }

  formatTagData(data: ExtendedFilamentData): string {
    const openTag3DData: any = {
      version: this.version,
      protocol: this.protocol,
      manufacturer: data.brand || data.manufacturer || 'Generic',
      material: data.type,
      color_hex: data.color_hex,
      nozzle_temp_min: data.min_temp,
      nozzle_temp_max: data.max_temp,
      diameter: data.diameter || 1.75,
    };

    // Add optional OpenTag3D specific fields if present
    if (data.grade) {openTag3DData.grade = data.grade;}
    if (data.batch_number) {openTag3DData.batch_number = data.batch_number;}
    if (data.production_date) {openTag3DData.production_date = data.production_date;}
    if (data.expiry_date) {openTag3DData.expiry_date = data.expiry_date;}
    if (data.bed_temp !== undefined) {openTag3DData.bed_temp = data.bed_temp;}
    if (data.density !== undefined) {openTag3DData.density = data.density;}

    return JSON.stringify(openTag3DData);
  }

  getDefaultData(): Partial<ExtendedFilamentData> {
    return {
      protocol: this.protocol,
      version: this.version,
      diameter: 1.75,
      manufacturer: 'Generic',
    };
  }

  validateData(data: ExtendedFilamentData): boolean {
    return !!(
      data.color_hex &&
      data.type &&
      typeof data.min_temp === 'number' &&
      typeof data.max_temp === 'number' &&
      data.min_temp < data.max_temp
    );
  }
}

export class TagProtocolService {
  private handlers: Map<TagProtocol, ProtocolHandler> = new Map();

  constructor() {
    this.registerHandler(new OpenSpoolProtocolHandler());
    this.registerHandler(new OpenTag3DProtocolHandler());
  }

  registerHandler(handler: ProtocolHandler) {
    this.handlers.set(handler.protocol, handler);
  }

  getHandler(protocol: TagProtocol): ProtocolHandler | undefined {
    return this.handlers.get(protocol);
  }

  getAllProtocols(): Array<{ label: string; value: TagProtocol; version: string }> {
    return Array.from(this.handlers.values()).map(handler => ({
      label: handler.name,
      value: handler.protocol,
      version: handler.version,
    }));
  }

  parseTagData(rawData: string, preferredProtocol?: TagProtocol): { data: ExtendedFilamentData; protocol: TagProtocol } | null {
    // Try preferred protocol first if specified
    if (preferredProtocol) {
      const handler = this.handlers.get(preferredProtocol);
      if (handler) {
        const parsed = handler.parseTagData(rawData);
        if (parsed) {
          return { data: parsed, protocol: preferredProtocol };
        }
      }
    }

    // Try to auto-detect protocol by attempting to parse with each handler
    for (const [protocol, handler] of this.handlers.entries()) {
      if (protocol === preferredProtocol) {continue;} // Already tried

      const parsed = handler.parseTagData(rawData);
      if (parsed) {
        return { data: parsed, protocol };
      }
    }

    return null;
  }

  formatTagData(data: ExtendedFilamentData, protocol: TagProtocol): string | null {
    const handler = this.handlers.get(protocol);
    if (!handler) {
      console.error(`No handler found for protocol: ${protocol}`);
      return null;
    }

    if (!handler.validateData(data)) {
      console.error('Invalid data for protocol:', protocol);
      return null;
    }

    return handler.formatTagData(data);
  }

  getDefaultDataForProtocol(protocol: TagProtocol): Partial<ExtendedFilamentData> {
    const handler = this.handlers.get(protocol);
    return handler ? handler.getDefaultData() : {};
  }
}

// Export singleton instance
export const tagProtocolService = new TagProtocolService();
