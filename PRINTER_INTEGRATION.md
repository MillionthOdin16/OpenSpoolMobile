# OpenSpool Mobile - Comprehensive Bambu Lab Printer Integration

## Overview
The OpenSpool Mobile app now features comprehensive integration with Bambu Lab printers via MQTT, providing full bidirectional communication, status monitoring, and advanced control capabilities.

## Enhanced Features

### 1. Comprehensive MQTT Communication
- **Bidirectional Communication**: Real-time status updates and command responses
- **Status Monitoring**: Live printer state, temperatures, progress, and errors
- **Event Handling**: Configurable callbacks for status updates, errors, and responses
- **TLS Support**: Secure connection with proper certificate handling

### 2. Advanced Filament Management
- **Enhanced Payload**: Supports all available filament parameters including bed temperature, drying settings, weight tracking, and density
- **AMS Control**: Load/unload filament, control AMS operations (resume/pause/reset)
- **Multi-AMS Support**: Compatible with multiple AMS units and comprehensive tray management
- **Brand Detection**: Enhanced brand code mapping with partial matching support

### 3. Complete Print Control
- **Print Operations**: Start, stop, pause, and resume prints
- **Speed Control**: Set print speed levels (Silent, Standard, Sport, Ludicrous)
- **G-code Commands**: Send custom G-code commands directly to printer
- **File Management**: Start prints from local files with comprehensive options

### 4. Temperature & Fan Control
- **Temperature Setting**: Control nozzle and bed temperatures with validation
- **Fan Management**: Control part cooling, auxiliary, and chamber fans with speed validation
- **Real-time Monitoring**: Live temperature and fan status updates

### 5. System Commands
- **LED Control**: Control chamber and work lights with flashing patterns
- **Calibration**: Start calibration processes (bed leveling, vibration compensation, motor noise cancellation)
- **System Information**: Request firmware version, access codes, and system status
- **Auto Home**: Automatic homing functionality

### 6. Enhanced Error Handling
- **Comprehensive Validation**: Input validation for all parameters with detailed error messages
- **Connection Monitoring**: Real-time connection status and automatic error reporting
- **Command Responses**: Track command success/failure with detailed response handling
- **Timeout Management**: Proper timeout handling for all operations

## Technical Implementation

### Enhanced MQTT Architecture
```typescript
interface PrinterStatus {
  gcode_state: 'IDLE' | 'PREPARE' | 'RUNNING' | 'PAUSE' | 'FINISH' | 'FAILED';
  print_error: number;
  mc_percent: number;
  mc_remaining_time: number;
  layer_num: number;
  total_layer_num: number;
  nozzle_temper: number;
  bed_temper: number;
  chamber_temper?: number;
  // ... additional status fields
}
```

### Command Structure
```typescript
// All commands follow proper MQTT protocol with sequence IDs
{
  "print": {
    "sequence_id": "auto-generated",
    "command": "command_name",
    // ... command-specific parameters
  }
}
```

### Event Handling
```typescript
service.onStatusUpdate = (status: PrinterStatus) => {
  // Handle real-time status updates
};

service.onCommandResponse = (response: CommandResponse) => {
  // Handle command responses
};

service.onError = (error: string) => {
  // Handle errors and connection issues
};
```

## Comprehensive API Reference

### Connection Management
- `connect()`: Establish MQTT connection with full error handling
- `disconnect()`: Clean disconnection with resource cleanup
- `isConnected()`: Real-time connection status
- `getConnectionInfo()`: Detailed connection information

### Status & Monitoring
- `requestStatusUpdate()`: Force full status refresh
- `getCurrentStatus()`: Get latest printer status
- `getAMSStatus()`: Get AMS and filament tray status
- `getLightStatus()`: Get current light states

### Enhanced Filament Operations
```typescript
// Comprehensive filament data with all supported fields
await service.sendFilamentToSlot({
  color_hex: 'FF0000',
  type: 'PLA',
  min_temp: 190,
  max_temp: 230,
  brand: 'Bambu Lab',
  bed_temp: 60,
  diameter: 1.75,
  weight: 1000,
  density: 1.24,
  drying_temp: 50,
  drying_time: 8,
  material_base: 'PLA',
  manufacturer: 'Bambu Lab'
}, slot);
```

### Print Control
```typescript
// Start print with comprehensive options
await service.startPrint('model.3mf', {
  useAMS: true,
  amsMapping: [0, 1, 2, 3],
  skipObjects: [1, 5],
  bedLeveling: true,
  flowCalibration: true,
  vibrationCalibration: true,
  layerInspection: true
});

// Basic print control
await service.stopPrint();
await service.pausePrint();
await service.resumePrint();
await service.setPrintSpeed(PrintSpeed.SPORT);
```

### Temperature & Fan Control
```typescript
// Temperature control with validation
await service.setNozzleTemperature(210);
await service.setBedTemperature(60);

// Fan control with speed validation (0-255)
await service.setPartFanSpeed(128);
await service.setAuxFanSpeed(255);
await service.setChamberFanSpeed(100);
```

### System Commands
```typescript
// LED control with advanced options
await service.setLight('chamber_light', 'flashing', {
  onTime: 500,
  offTime: 500,
  loopTimes: 5,
  intervalTime: 1000
});

// Calibration with options
await service.startCalibration({
  bedLeveling: true,
  vibrationCompensation: true,
  motorNoiseCancellation: true
});

// System utilities
await service.autoHome();
await service.getAccessCode();
await service.getVersionInfo();
```

### AMS Control
```typescript
// Filament management
await service.loadFilament(0, 1); // AMS 0, Tray 1
await service.unloadFilament();
await service.controlAMS('resume');
```

## MQTT Protocol Compliance

### Supported Commands
- **Print Control**: `stop`, `pause`, `resume`, `print_speed`, `gcode_line`, `project_file`
- **Filament Management**: `ams_filament_setting`, `ams_change_filament`, `ams_control`
- **System Commands**: `ledctrl`, `calibration`, `get_access_code`, `get_version`
- **Status Requests**: `pushall` for comprehensive status updates

### Topics
- **Command Topic**: `device/{SERIAL_NUMBER}/request`
- **Report Topic**: `device/{SERIAL_NUMBER}/report` (subscribed for status updates)

### Enhanced Payload Fields
The service now supports all documented MQTT payload fields:
- Basic filament data (type, color, temperatures, brand)
- Extended parameters (bed temperature, drying settings, weight, density)
- AMS configuration (tray IDs, brand codes, remaining amounts)
- System settings (calibration options, LED patterns, fan speeds)

## Integration Workflow

### Enhanced Setup Process
1. **Configure Settings**: IP address, serial number, access code
2. **Establish Connection**: Secure MQTT connection with error handling
3. **Subscribe to Updates**: Automatic subscription to printer reports
4. **Status Synchronization**: Initial status request and continuous monitoring

### Advanced Usage Pattern
1. **Monitor Status**: Real-time printer state and progress updates
2. **Manage Filaments**: Complete filament lifecycle management
3. **Control Operations**: Start/stop prints, adjust settings, run maintenance
4. **Handle Errors**: Comprehensive error reporting and recovery

## Error Handling & Reliability

### Connection Management
- Automatic connection timeout (10 seconds)
- Real-time connection monitoring
- Detailed error messages with troubleshooting guidance
- Clean disconnection handling

### Command Validation
- Parameter validation before sending commands
- Temperature range checking (0-500°C for nozzle, 0-120°C for bed)
- Fan speed validation (0-255)
- G-code syntax validation

### Status Monitoring
- Sequence ID tracking for command responses
- Error state detection and reporting
- Connection loss detection and notification
- Comprehensive status parsing with error recovery

## Testing & Quality Assurance
- **Comprehensive Test Coverage**: Enhanced test suite covering all new functionality
- **Type Safety**: Full TypeScript implementation with proper interfaces
- **Error Scenarios**: Testing of connection failures, invalid parameters, and edge cases
- **Mock Integration**: Proper mocking for unit testing without hardware dependencies

This comprehensive implementation provides full-featured Bambu Lab printer integration with professional-grade error handling, monitoring, and control capabilities.