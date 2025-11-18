# Control Panel for Gravity Reduce

An Electron-based Windows desktop application for gravity reducing equipment control and monitoring via custom TCP communication. Features automatic 50Hz data transmission with 67 communication variables with a SIEMENS S7-1200 PLC

##. Features

- **50Hz Auto-Send (MAIN FUNCTION)**: Automatic continuous transmission of 16 control parameters at 50Hz (20ms interval)
- **Control Parameters**: 16 integers including Speed Mode, Target Speed, Position (X/Y/Z), Operation Mode, and Control Commands
- **24 Command Buttons**: Comprehensive equipment control (Start/Stop, Power, Servo, Axis Movement, Emergency Stops, etc.)
- **Status Monitoring**: 40 boolean indicators and 10 integer status values for real-time system monitoring
- **TCP Connection Management**: Connect/disconnect to TCP server with configurable host and port
- **Real-time Logging**: Monitor all operations, commands, and status updates
- **16:9 Optimized UI**: Professional control panel layout designed for Windows monitors

## Int2Byte Conversion

The application uses big-endian format to convert integers to bytes:

```javascript
bytes[0] = (0xff00 & i) >> 8;  // High byte
bytes[1] = 0xff & i;            // Low byte
```

Each integer (0-65535) is converted to 2 bytes, so 16 integers = 32 bytes sent.

## Data Protocol

### Sent Data (32 bytes)
- 16 integers × 2 bytes each = 32 bytes total
- Big-endian format ( MSB first )

### Received Data (26 bytes expected)
- **Bytes 0-4**: 40 boolean values ( 8 bools in 1 byte, `0xe = false, false, false, true` )
- **Bytes 5**: undefined Byte spared automatically by Siemens PLC.
- **Bytes 6-25**: 10 integers ( 2 bytes each, big-endian format )

## Installation

```bash
npm install
```

## Running the Application

- **If you need a test server**:
  
```bash
node test-server.js
```

```bash
npm start
```

- If you **DON'T** need a test server:

```bash
npm start
```

## Build

```bash
npm run build
```

## Usage

1. **Connect to Server**:
   - Enter the host address (default: localhost)
   - Enter the port number (default: 8080)
   - Click "Connect"
   - Auto-Send at 50Hz starts automatically (if enabled)

2. **Control Parameters** (sent automatically at 50Hz):
   - **Speed Mode** (0-4): Select speed profile
   - **Target Speed** (mm/s): Set movement speed
   - **Target X/Y/Z** (mm): Set position coordinates
   - **Operation Mode**: Select PID parameter set
   - **Control Command**: Automatically updated when command buttons are pressed and read the acknowledge to automatically switch to 0

3. **Command Buttons**:
   - Press any command button to set the Control Command value
   - The command is automatically sent in the next 50Hz transmission cycle
   - Examples: Start Experiment, Stop, Emergency Stop, Axis Movement, etc.

4. **Status Monitoring**:
   - 40 boolean indicators show system status (green = active)
   - 10 integer values display current positions, speed, force, tension, etc.

5. **Auto-Send Control**:
   - Enabled by default when connected
   - Toggle "Auto-Send (50Hz)" checkbox to enable/disable
   - "Send Data (Debug)" button available for manual single transmissions

6. **Monitor Activity**:
   - Check the log section for all operations and status updates

## Testing the Application

A test TCP server is included (`test-server.js`) that simulates PLC behavior:
- Generates realistic 40 boolean and 10 integer responses
- Simulates command processing delay (~200ms at 50Hz)
- Echoes back control commands in the 10th integer to test acknowledgment logic
- Uses proper bit-packed boolean format (5 bytes + 1 padding byte)

```bash
node test-server.js
```

Then connect the Electron app to `localhost:8080`.

## File Structure

```
├── main.js                    # Main Electron process and TCP connection handler
├── preload.js                 # IPC communication bridge (secure context isolation)
├── renderer.js                # Main UI logic, event handlers, and command management
├── renderer-refactored.js     # Refactored modular renderer (alternative implementation)
├── index.html                 # Main application UI structure
├── settings.html              # Settings window UI
├── styles.css                 # Application styling and 16:9 layout
├── config.js                  # Application configuration and constants
├── connection-manager.js      # TCP connection management module
├── data-handler.js            # Data collection and formatting module
├── ui-manager.js              # UI updates and display management module
├── settings-manager.js        # Settings persistence (localStorage) module
├── validation.js              # Input validation module
├── test-server.js             # TCP test server (simulates PLC with command acknowledgment)
├── package.json               # Project configuration and dependencies
├── README.md                  # This file
└── REFACTORING_SUMMARY.md     # Modular architecture documentation
```

## Key Implementation Details

### 50Hz Auto-Send
- Main operational mode for real-time equipment control
- Sends all 16 control parameters every 20ms
- Control Command (int-9) is automatically updated when command buttons are pressed
- Parameters can be adjusted in real-time; changes are sent in the next cycle

### Control Command Integration
- Command buttons update the 10th integer (int-9)
- No separate command transmission required
- Commands are integrated into the continuous 50Hz data stream
- This ensures synchronized control parameter and command transmission

### PLC Command Acknowledgment
- The PLC echoes back the control command in the 10th received integer (index 9)
- **Button Commands**: Automatically cleared when PLC acknowledges (button highlight removed, command reset to 0)
- **Axis Movement Commands** (X+/X-/Y+/Y-/Z+/Z-): Keep control highlighted while active
- Provides visual feedback that commands have been received and executed by the PLC

### Customization
- Boolean/Integer labels can be modified in `initializeDisplays()` function in `renderer.js`
- Data protocol can be adjusted in `parseReceivedData()` in `main.js`
- Command mappings can be updated in the HTML `data-cmd` attributes
