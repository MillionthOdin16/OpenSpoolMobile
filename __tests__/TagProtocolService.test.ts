import {
  TagProtocolService,
  TagProtocol,
  OpenSpoolProtocolHandler,
  OpenTag3DProtocolHandler,
  ExtendedFilamentData,
} from '../src/services/TagProtocolService';

describe('TagProtocolService', () => {
  let service: TagProtocolService;

  beforeEach(() => {
    service = new TagProtocolService();
  });

  describe('initialization', () => {
    it('should initialize with OpenSpool and OpenTag3D handlers', () => {
      const protocols = service.getAllProtocols();
      expect(protocols).toHaveLength(2);
      expect(protocols.find(p => p.value === TagProtocol.OPENSPOOL)).toBeDefined();
      expect(protocols.find(p => p.value === TagProtocol.OPENTAG3D)).toBeDefined();
    });
  });

  describe('protocol handlers', () => {
    it('should return correct handler for each protocol', () => {
      const openSpoolHandler = service.getHandler(TagProtocol.OPENSPOOL);
      const openTag3DHandler = service.getHandler(TagProtocol.OPENTAG3D);

      expect(openSpoolHandler).toBeInstanceOf(OpenSpoolProtocolHandler);
      expect(openTag3DHandler).toBeInstanceOf(OpenTag3DProtocolHandler);
    });

    it('should return undefined for unknown protocol', () => {
      const unknownHandler = service.getHandler('unknown' as TagProtocol);
      expect(unknownHandler).toBeUndefined();
    });
  });

  describe('parseTagData', () => {
    it('should parse OpenSpool format correctly', () => {
      const openSpoolData = JSON.stringify({
        version: '1.0',
        protocol: 'openspool',
        color_hex: 'FF0000',
        type: 'PLA',
        min_temp: 190,
        max_temp: 220,
        brand: 'Bambu',
        diameter: 1.75,
      });

      const result = service.parseTagData(openSpoolData, TagProtocol.OPENSPOOL);

      expect(result).toBeDefined();
      expect(result?.protocol).toBe(TagProtocol.OPENSPOOL);
      expect(result?.data.color_hex).toBe('FF0000');
      expect(result?.data.type).toBe('pla');
      expect(result?.data.min_temp).toBe(190);
      expect(result?.data.max_temp).toBe(220);
      expect(result?.data.brand).toBe('Bambu');
    });

    it('should parse OpenTag3D format correctly', () => {
      const openTag3DData = JSON.stringify({
        version: '1.0',
        protocol: 'opentag3d',
        manufacturer: 'TestBrand',
        material: 'PLA',
        color_hex: '00FF00',
        nozzle_temp_min: 195,
        nozzle_temp_max: 215,
        bed_temp: 60,
        diameter: 1.75,
      });

      const result = service.parseTagData(openTag3DData, TagProtocol.OPENTAG3D);

      expect(result).toBeDefined();
      expect(result?.protocol).toBe(TagProtocol.OPENTAG3D);
      expect(result?.data.color_hex).toBe('00FF00');
      expect(result?.data.type).toBe('pla');
      expect(result?.data.min_temp).toBe(195);
      expect(result?.data.max_temp).toBe(215);
      expect(result?.data.manufacturer).toBe('TestBrand');
      expect(result?.data.bed_temp).toBe(60);
    });

    it('should auto-detect protocol when not specified', () => {
      const openSpoolData = JSON.stringify({
        protocol: 'openspool',
        color_hex: 'FF0000',
        type: 'PLA',
        min_temp: 190,
        max_temp: 220,
        brand: 'Generic',
      });

      const result = service.parseTagData(openSpoolData);

      expect(result).toBeDefined();
      expect(result?.protocol).toBe(TagProtocol.OPENSPOOL);
    });

    it('should return null for invalid data', () => {
      const invalidData = 'invalid json';
      const result = service.parseTagData(invalidData, TagProtocol.OPENSPOOL);

      expect(result).toBeNull();
    });
  });

  describe('formatTagData', () => {
    it('should format OpenSpool data correctly', () => {
      const filamentData: ExtendedFilamentData = {
        color_hex: 'FF0000',
        type: 'pla',
        min_temp: 190,
        max_temp: 220,
        brand: 'Bambu',
        diameter: 1.75,
      };

      const result = service.formatTagData(filamentData, TagProtocol.OPENSPOOL);
      expect(result).toBeDefined();

      const parsed = JSON.parse(result!);
      expect(parsed.protocol).toBe('openspool');
      expect(parsed.color_hex).toBe('FF0000');
      expect(parsed.type).toBe('pla');
      expect(parsed.min_temp).toBe(190);
      expect(parsed.max_temp).toBe(220);
      expect(parsed.brand).toBe('Bambu');
    });

    it('should format OpenTag3D data correctly', () => {
      const filamentData: ExtendedFilamentData = {
        color_hex: '00FF00',
        type: 'petg',
        min_temp: 220,
        max_temp: 250,
        brand: 'TestBrand',
        manufacturer: 'TestBrand',
        bed_temp: 80,
        diameter: 1.75,
      };

      const result = service.formatTagData(filamentData, TagProtocol.OPENTAG3D);
      expect(result).toBeDefined();

      const parsed = JSON.parse(result!);
      expect(parsed.protocol).toBe('opentag3d');
      expect(parsed.manufacturer).toBe('TestBrand');
      expect(parsed.material).toBe('petg');
      expect(parsed.nozzle_temp_min).toBe(220);
      expect(parsed.nozzle_temp_max).toBe(250);
      expect(parsed.bed_temp).toBe(80);
    });

    it('should return null for invalid data', () => {
      const invalidData: ExtendedFilamentData = {
        color_hex: '',
        type: '',
        min_temp: 300,
        max_temp: 200, // Invalid: max < min
        brand: '',
      };

      const result = service.formatTagData(invalidData, TagProtocol.OPENSPOOL);
      expect(result).toBeNull();
    });
  });

  describe('getDefaultDataForProtocol', () => {
    it('should return OpenSpool defaults', () => {
      const defaults = service.getDefaultDataForProtocol(TagProtocol.OPENSPOOL);
      expect(defaults.protocol).toBe(TagProtocol.OPENSPOOL);
      expect(defaults.version).toBe('1.0');
      expect(defaults.diameter).toBe(1.75);
      expect(defaults.brand).toBe('Generic');
    });

    it('should return OpenTag3D defaults', () => {
      const defaults = service.getDefaultDataForProtocol(TagProtocol.OPENTAG3D);
      expect(defaults.protocol).toBe(TagProtocol.OPENTAG3D);
      expect(defaults.version).toBe('0.003');
      expect(defaults.diameter).toBe(1.75);
      expect(defaults.manufacturer).toBe('Generic');
    });

    it('should return empty object for unknown protocol', () => {
      const defaults = service.getDefaultDataForProtocol('unknown' as TagProtocol);
      expect(defaults).toEqual({});
    });
  });
});

describe('OpenSpoolProtocolHandler', () => {
  let handler: OpenSpoolProtocolHandler;

  beforeEach(() => {
    handler = new OpenSpoolProtocolHandler();
  });

  describe('validateData', () => {
    it('should validate correct data', () => {
      const validData: ExtendedFilamentData = {
        color_hex: 'FF0000',
        type: 'pla',
        min_temp: 190,
        max_temp: 220,
        brand: 'Generic',
      };

      expect(handler.validateData(validData)).toBe(true);
    });

    it('should reject invalid data', () => {
      const invalidData: ExtendedFilamentData = {
        color_hex: '',
        type: 'pla',
        min_temp: 250,
        max_temp: 200, // max < min
        brand: 'Generic',
      };

      expect(handler.validateData(invalidData)).toBe(false);
    });
  });
});

describe('OpenTag3DProtocolHandler', () => {
  let handler: OpenTag3DProtocolHandler;

  beforeEach(() => {
    handler = new OpenTag3DProtocolHandler();
  });

  describe('parseTagData', () => {
    it('should handle different field name mappings', () => {
      const tag3DData = JSON.stringify({
        manufacturer: 'TestBrand',
        material: 'PETG',
        color: 'blue',
        nozzle_temp_min: 230,
        nozzle_temp_max: 270,
      });

      const result = handler.parseTagData(tag3DData);

      expect(result).toBeDefined();
      expect(result?.type).toBe('petg');
      expect(result?.manufacturer).toBe('TestBrand');
      expect(result?.brand).toBe('TestBrand');
      expect(result?.min_temp).toBe(230);
      expect(result?.max_temp).toBe(270);
    });

    it('should handle hex color formats', () => {
      const dataWithHash = JSON.stringify({
        material: 'PLA',
        color_hex: '#FF0000',
        nozzle_temp_min: 190,
        nozzle_temp_max: 220,
      });

      const result = handler.parseTagData(dataWithHash);
      expect(result?.color_hex).toBe('FF0000'); // # should be stripped
    });
  });
});
