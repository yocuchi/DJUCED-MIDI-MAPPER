# DJUCED MIDI Mapper

Electron application for mapping MIDI controllers (Hercules 500/200 and others) to DJUCED controls. Vibe Coding. For me it's usefull to get the codes of keys, validate your custom mappings before loading in Djuced, and to test outputs and see the leds flashing.

## Features

- **MIDI device detection**: Lists and connects available MIDI devices
- **Command recording**: Records MIDI commands in real-time from your controller
- **Mapping editor**: Assigns MIDI commands to DJUCED actions
- **Action database**: Automatically extracts all available actions from reference .djm files
- **.djm file generation**: Saves your mappings in DJUCED-compatible format
- **Test mode**: Tests your mappings by simulating or sending real commands to DJUCED

## Requirements

- Node.js 18 or higher
- npm or yarn
- Compatible MIDI controller (Hercules 500, Hercules 200, etc.)

## Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

## Development

To run the application in development mode:

```bash
npm run dev
```

This will compile TypeScript and run the Electron application with automatic reload.

## Build

To build the application:

```bash
npm run build
```

To create an executable:

```bash
npm run package
```

## Usage

1. **Connect MIDI device**:
   - Select your MIDI input controller in the "MIDI Devices" panel
   - Optionally select an output device if you want to test commands
   - Click "Connect"

2. **Record commands**:
   - Click "Record New Command"
   - Press a key or move a control on your controller
   - The MIDI command will be captured and displayed

3. **Create mapping**:
   - After recording a command, you'll be asked for a control name
   - A dialog will open to select the DJUCED action
   - Select the action, channel, and parameters
   - Save the mapping

4. **Test mappings**:
   - Use the "Test Mappings" panel to see what actions would be executed
   - "Simulate" mode: Shows what action would be executed without sending MIDI
   - "Send to DJUCED" mode: Sends real MIDI commands (requires DJUCED to be open)

5. **Save mapping**:
   - Click "Save Mapping"
   - Choose a name and location for the .djm file
   - The file will be compatible with DJUCED

## Project Structure

```
djuced-midi-mapper/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # Entry point
│   │   ├── preload.ts     # Preload script
│   │   └── midi-handler.ts # MIDI handling
│   ├── renderer/          # Renderer process
│   │   ├── app.ts         # Main logic
│   │   ├── index.html     # Main UI
│   │   ├── styles.css     # Styles
│   │   ├── components/    # UI components
│   │   └── utils/         # Utilities (parsers, generators)
│   └── shared/            # Shared code
│       └── types.ts       # TypeScript types
├── todos/                 # Reference .djm files
└── package.json
```

## Technologies

- **Electron**: Desktop application framework
- **TypeScript**: Main language
- **easymidi**: MIDI handling library
- **DOMParser**: For parsing XML from .djm files

## Notes

- Reference .djm files in the `todos/` folder are used to extract all available DJUCED actions
- The application works best with Hercules controllers, but should work with any standard MIDI device
- To test real commands, make sure DJUCED is open and configured to receive MIDI

## License

MIT
