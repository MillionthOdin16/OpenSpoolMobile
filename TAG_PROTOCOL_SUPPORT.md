# Tag Protocol Support

The OpenSpool Mobile app now supports multiple NFC tag protocols for reading and writing filament data.

## Supported Protocols

### OpenSpool Protocol v1.0
- **Default protocol** for OpenSpool ecosystem
- Focused on core filament parameters needed for 3D printing
- Fields: `color_hex`, `type`, `min_temp`, `max_temp`, `brand`, `diameter`, `weight`, `length`
- Simple JSON format compatible with existing OpenSpool ESP project

### OpenTag3D Protocol v1.0
- **Extended protocol** supporting additional metadata
- Compatible with broader 3D printing ecosystem
- Additional fields: `manufacturer`, `material`, `grade`, `batch_number`, `production_date`, `expiry_date`, `bed_temp`, `density`
- Field mapping for compatibility (e.g., `material` → `type`, `manufacturer` → `brand`)

## Features

### Protocol Auto-Detection
- When reading tags, the app attempts to parse with the selected protocol first
- If that fails, it automatically tries other protocols and notifies the user
- Seamless switching between different tag formats

### Protocol Selection
- New dropdown in the UI allows users to choose which protocol to use for writing
- Protocol selection persists between app sessions
- Visual indicators show which protocol was detected when reading

### Extensible Design
- Easy to add new protocols by implementing the `ProtocolHandler` interface
- Field mapping system handles differences between protocol schemas
- Future-proof architecture for emerging tag standards

## Usage

1. **Reading Tags**: Select preferred protocol, then tap "Read Tag". The app will auto-detect if the tag uses a different protocol.

2. **Writing Tags**: Choose the protocol from the dropdown, configure filament parameters, then tap "Write Tag".

3. **Protocol Compatibility**: Tags written in one protocol can be read by devices supporting that protocol, ensuring interoperability.

## Technical Implementation

### TagProtocolService
- Central service managing all protocol handlers
- Provides parsing, formatting, and validation for each protocol
- Singleton instance available throughout the app

### Protocol Handlers
- `OpenSpoolProtocolHandler`: Handles original OpenSpool format
- `OpenTag3DProtocolHandler`: Handles extended OpenTag3D format
- Each handler provides validation, parsing, and formatting methods

### Data Mapping
- Intelligent field mapping between protocols
- Graceful handling of missing or incompatible fields
- Preservation of protocol-specific metadata when possible