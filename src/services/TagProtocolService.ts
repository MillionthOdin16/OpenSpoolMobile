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
  material_base?: string; // OpenTag3D v0.003 spec field
  material_mod?: string; // OpenTag3D v0.003 spec field
  grade?: string;
  batch_number?: string;
  production_date?: string;
  expiry_date?: string;
  bed_temp?: number;
  density?: number;

  // Additional OpenTag3D v0.003 fields
  color_name?: string;
  online_data_url?: string;
  measured_tolerance?: number;
  empty_spool_weight?: number;
  measured_filament_length?: number;
  max_dry_temp?: number;
  dry_time?: number;
  mfi_temp?: number;
  mfi_load?: number;
  mfi_value?: number;

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

      // Validate required OpenSpool fields per specification
      if (!jsonData.color_hex || !jsonData.type ||
          jsonData.min_temp === undefined || jsonData.max_temp === undefined) {
        return null;
      }

      // Ensure brand is present - default to 'Generic' per spec
      const brand = jsonData.brand || 'Generic';

      return {
        color_hex: jsonData.color_hex,
        type: jsonData.type.toLowerCase(), // Normalize to lowercase for consistency
        min_temp: Number(jsonData.min_temp),
        max_temp: Number(jsonData.max_temp),
        brand: brand,
        protocol: jsonData.protocol || 'openspool',
        version: jsonData.version || '1.0',
        diameter: jsonData.diameter,
        weight: jsonData.weight,
        length: jsonData.length,
      };
    } catch (error) {
      console.error('Failed to parse OpenSpool tag data:', error);
      return null;
    }
  }

  formatTagData(data: ExtendedFilamentData): string {
    // Follow exact OpenSpool specification field order: protocol first, then version
    const openSpoolData: any = {
      protocol: this.protocol,
      version: this.version,
      type: data.type,
      color_hex: data.color_hex,
      brand: data.brand || 'Generic',
      min_temp: data.min_temp,
      max_temp: data.max_temp,
    };

    // Add optional fields if present (these are extensions to the core spec)
    if (data.diameter !== undefined) {openSpoolData.diameter = data.diameter;}
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
    // Validate all required OpenSpool specification fields
    return !!(
      data.color_hex &&
      data.color_hex.length > 0 &&
      data.type &&
      data.type.length > 0 &&
      (data.brand && data.brand.length > 0) &&
      typeof data.min_temp === 'number' &&
      typeof data.max_temp === 'number' &&
      data.min_temp < data.max_temp &&
      data.min_temp > 0 &&
      data.max_temp > 0
    );
  }
}

export class OpenTag3DProtocolHandler implements ProtocolHandler {
  protocol = TagProtocol.OPENTAG3D;
  name = 'OpenTag3D Protocol';
  version = '0.003';

  parseTagData(rawData: string): ExtendedFilamentData | null {
    try {
      const jsonData = JSON.parse(rawData);

      // OpenTag3D v0.003 uses specific field names from the spec
      const material_base = jsonData.material_base || jsonData.material || jsonData.type || '';
      const manufacturer = jsonData.manufacturer || jsonData.brand || 'Generic';

      // Handle color - spec uses RGBA but also supports hex for compatibility
      let color_hex = jsonData.color_hex || jsonData.color || 'FFFFFF';
      if (color_hex && !color_hex.startsWith('#') && color_hex.length === 6) {
        // Assume it's already hex without #
      } else if (color_hex.startsWith('#')) {
        color_hex = color_hex.substring(1);
      }

      // Temperature handling - OpenTag3D spec uses scaling factor of 5
      let min_temp = 190; // Default
      let max_temp = 220; // Default

      if (jsonData.min_print_temp !== undefined) {
        min_temp = Number(jsonData.min_print_temp) * 5;
      } else if (jsonData.print_temp !== undefined) {
        // If only one temp given, use it as base and calculate range
        const baseTemp = Number(jsonData.print_temp) * 5;
        min_temp = baseTemp - 10;
        max_temp = baseTemp + 10;
      } else if (jsonData.nozzle_temp_min !== undefined) {
        min_temp = Number(jsonData.nozzle_temp_min);
      } else if (jsonData.min_temp !== undefined) {
        min_temp = Number(jsonData.min_temp);
      }

      if (jsonData.max_print_temp !== undefined) {
        max_temp = Number(jsonData.max_print_temp) * 5;
      } else if (jsonData.nozzle_temp_max !== undefined) {
        max_temp = Number(jsonData.nozzle_temp_max);
      } else if (jsonData.max_temp !== undefined) {
        max_temp = Number(jsonData.max_temp);
      }

      // Bed temperature with scaling
      let bed_temp;
      if (jsonData.bed_temp !== undefined) {
        if (Number(jsonData.bed_temp) <= 50) {
          // Assume it's already scaled (divided by 5), so multiply
          bed_temp = Number(jsonData.bed_temp) * 5;
        } else {
          // Assume it's in normal degrees
          bed_temp = Number(jsonData.bed_temp);
        }
      }

      // Diameter handling - spec uses micrometers (µm), convert to mm
      let diameter = 1.75; // Default
      if (jsonData.target_diameter !== undefined) {
        diameter = Number(jsonData.target_diameter) * 0.001; // Convert µm to mm
      } else if (jsonData.diameter !== undefined) {
        diameter = Number(jsonData.diameter);
      }

      // Weight handling
      let weight;
      if (jsonData.target_weight !== undefined) {
        weight = Number(jsonData.target_weight);
      } else if (jsonData.measured_filament_weight !== undefined) {
        weight = Number(jsonData.measured_filament_weight);
      } else if (jsonData.weight !== undefined) {
        weight = Number(jsonData.weight);
      }

      // Density handling - spec uses µg/cm³, convert to g/cm³
      let density;
      if (jsonData.density !== undefined) {
        if (Number(jsonData.density) > 100) {
          // Assume it's in µg/cm³, convert to g/cm³
          density = Number(jsonData.density) * 0.001;
        } else {
          // Assume it's already in g/cm³
          density = Number(jsonData.density);
        }
      }

      return {
        color_hex: color_hex,
        type: material_base.toLowerCase(),
        min_temp: min_temp,
        max_temp: max_temp,
        brand: manufacturer,
        protocol: 'opentag3d',
        version: jsonData.tag_version ? String(jsonData.tag_version * 0.001) : '0.003',
        manufacturer: manufacturer,
        material: material_base,
        material_base: material_base,
        material_mod: jsonData.material_mod,
        grade: jsonData.grade || jsonData.material_mod,
        batch_number: jsonData.batch_number || jsonData.serial,
        production_date: jsonData.production_date || jsonData.mfg_date,
        expiry_date: jsonData.expiry_date,
        bed_temp: bed_temp,
        density: density,
        diameter: diameter,
        weight: weight,
        // Additional OpenTag3D v0.003 fields
        color_name: jsonData.color_name,
        online_data_url: jsonData.online_data_url,
        measured_tolerance: jsonData.measured_tolerance,
        empty_spool_weight: jsonData.empty_spool_weight,
        measured_filament_length: jsonData.measured_filament_length,
        max_dry_temp: jsonData.max_dry_temp ? Number(jsonData.max_dry_temp) * 5 : undefined,
        dry_time: jsonData.dry_time,
        mfi_temp: jsonData.mfi_temp ? Number(jsonData.mfi_temp) * 5 : undefined,
        mfi_load: jsonData.mfi_load ? Number(jsonData.mfi_load) * 10 : undefined,
        mfi_value: jsonData.mfi_value ? Number(jsonData.mfi_value) * 10 : undefined,
      };
    } catch (error) {
      console.error('Failed to parse OpenTag3D tag data:', error);
      return null;
    }
  }

  formatTagData(data: ExtendedFilamentData): string {
    const openTag3DData: any = {
      tag_format: 'OT', // Required OpenTag3D identifier
      tag_version: 3, // Version 0.003 as integer (3 * 0.001)
      protocol: this.protocol,
      manufacturer: data.brand || data.manufacturer || 'Generic',
      material_base: data.material || data.material_base || data.type,
      color_hex: data.color_hex,
      target_diameter: Math.round((data.diameter || 1.75) * 1000), // Convert mm to µm
    };

    // Temperature handling with scaling factor of 5
    if (data.min_temp !== undefined) {
      openTag3DData.min_print_temp = Math.round(data.min_temp / 5);
    }
    if (data.max_temp !== undefined) {
      openTag3DData.max_print_temp = Math.round(data.max_temp / 5);
    }
    // Use average as the main print temp if we have min/max
    if (data.min_temp !== undefined && data.max_temp !== undefined) {
      openTag3DData.print_temp = Math.round((data.min_temp + data.max_temp) / 2 / 5);
    }

    if (data.bed_temp !== undefined) {
      openTag3DData.bed_temp_scaled = Math.round(data.bed_temp / 5); // OpenTag3D v0.003 spec field
    }

    // Weight handling
    if (data.weight !== undefined) {
      openTag3DData.target_weight = data.weight;
    }

    // Density handling - convert g/cm³ to µg/cm³
    if (data.density !== undefined) {
      openTag3DData.density = Math.round(data.density * 1000);
    }

    // Add optional OpenTag3D v0.003 specific fields if present
    if (data.material_mod || data.grade) {
      openTag3DData.material_mod = data.material_mod || data.grade;
    }
    if (data.color_name) {openTag3DData.color_name = data.color_name;}
    if (data.batch_number) {openTag3DData.serial = data.batch_number;}
    if (data.production_date) {openTag3DData.mfg_date = data.production_date;}
    if (data.online_data_url) {openTag3DData.online_data_url = data.online_data_url;}
    if (data.measured_tolerance !== undefined) {openTag3DData.measured_tolerance = data.measured_tolerance;}
    if (data.empty_spool_weight !== undefined) {openTag3DData.empty_spool_weight = data.empty_spool_weight;}
    if (data.measured_filament_length !== undefined) {openTag3DData.measured_filament_length = data.measured_filament_length;}

    // For compatibility, include legacy field names with original values
    openTag3DData.material = data.material || data.material_base || data.type;
    openTag3DData.nozzle_temp_min = data.min_temp;
    openTag3DData.nozzle_temp_max = data.max_temp;
    // Keep original bed_temp for compatibility
    if (data.bed_temp !== undefined) {
      openTag3DData.bed_temp = data.bed_temp;
    }

    // Temperature fields with scaling
    if (data.max_dry_temp !== undefined) {
      openTag3DData.max_dry_temp = Math.round(data.max_dry_temp / 5);
    }
    if (data.dry_time !== undefined) {openTag3DData.dry_time = data.dry_time;}

    // MFI fields with scaling
    if (data.mfi_temp !== undefined) {
      openTag3DData.mfi_temp = Math.round(data.mfi_temp / 5);
    }
    if (data.mfi_load !== undefined) {
      openTag3DData.mfi_load = Math.round(data.mfi_load / 10);
    }
    if (data.mfi_value !== undefined) {
      openTag3DData.mfi_value = Math.round(data.mfi_value / 10);
    }

    return JSON.stringify(openTag3DData);
  }

  getDefaultData(): Partial<ExtendedFilamentData> {
    return {
      protocol: this.protocol,
      version: this.version,
      diameter: 1.75,
      manufacturer: 'Generic',
      material_base: 'PLA',
    };
  }

  validateData(data: ExtendedFilamentData): boolean {
    // OpenTag3D v0.003 spec requires: manufacturer, material_base, color, target_diameter,
    // target_weight, print_temp, bed_temp, density
    return !!(
      (data.brand || data.manufacturer) &&
      (data.material_base || data.material || data.type) &&
      data.color_hex &&
      typeof data.min_temp === 'number' &&
      typeof data.max_temp === 'number' &&
      data.min_temp < data.max_temp &&
      data.diameter &&
      data.diameter > 0
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
