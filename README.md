# Browser-o-matic

A lightweight Electron application that allows users to open URLs in different browsers installed on their system. The app sits in the system tray and provides a quick way to manage browser selections and URL history. **_This project is entirely built through AI pair programming using Claude 3.5 Sonnet_**

## Features

- **Multi-Browser Support**: Automatically detects installed browsers on your system
- **URL History**: Keeps track of recently opened URLs and which browsers were used
- **System Tray Integration**: Runs quietly in the system tray for easy access
- **Modern UI**: Clean, minimal interface with Tailwind CSS
- **Cross-Platform**: Works on Windows and macOS(Untested)
- **Default Browser Integration**: Can be set as system default browser
- **Protocol Handler**: Properly handles http/https protocols on both Windows and macOS

## Demo

![Demo](./demo.gif)

## Technical Implementation

### Core Components

1. **Protocol Handler** (`src/protocolHandler.js`)

   - Windows Registry integration for browser registration
   - macOS protocol handling through Info.plist
   - Default browser capability registration
   - Clean unregistration process

2. **Main Process** (`src/main.js`)

   - Window management and IPC communication
   - URL scheme handling
   - Single instance lock
   - Protocol registration

3. **Browser Detection** (`src/browserDetector.js`)

   - Registry-based browser detection on Windows
   - System Profiler integration on macOS
   - Fallback paths for common browsers

4. **History Management** (`src/history.js`)
   - URL history storage using electron-store
   - Browser selection tracking
   - Timestamp-based sorting

### AI Development Insights

1. **Protocol Handler Implementation**

   - AI helped understand Windows Registry structure
   - Guided implementation of proper protocol registration
   - Solved default browser integration challenges

2. **Cross-Platform Challenges**

   - AI provided platform-specific solutions
   - Handled different browser detection methods
   - Managed protocol registration differences

3. **UI/UX Improvements**

   - AI suggested modern design patterns
   - Implemented smooth transitions
   - Added error handling and user feedback

4. **Security Considerations**
   - Safe registry manipulation
   - Proper URL validation
   - Secure IPC communication

### Key Technical Learnings

1. **Windows Registry**

   - Proper HKEY_CURRENT_USER manipulation
   - Browser capability registration
   - Clean uninstallation process

2. **macOS Integration**

   - Info.plist configuration
   - System Profiler usage
   - Protocol handler entitlements

3. **Electron Best Practices**

   - Single instance management
   - IPC pattern implementation
   - Window state preservation

4. **Error Handling**
   - Registry operation fallbacks
   - Browser detection resilience
   - URL validation and sanitization

## Development Setup

1. Install dependencies:

```bash
npm install
```

2. Run in development mode:

```bash
npm start
```

3. Build for production:

```bash
npm run build
```

## Project Structure

```
browser-o-matic/
├── src/
│ ├── main.js # Main process
│ ├── renderer.js # Renderer process
│ ├── protocolHandler.js# Protocol registration
│ ├── browserDetector.js# Browser detection
│ ├── history.js # History management
│ └── styles/
│ ├── input.css # Tailwind input
│ └── styles.css # Compiled styles
├── build/
│ └── Info.plist # macOS configuration
├── index.html # Main window
└── package.json # Project configuration
```

## AI Collaboration Highlights

1. **Problem Solving**

   - Protocol handler implementation
   - Cross-platform compatibility
   - Browser detection strategies

2. **Code Quality**

   - Clean architecture suggestions
   - Error handling patterns
   - Documentation practices

3. **Feature Implementation**

   - Default browser integration
   - History management
   - UI/UX improvements

4. **Testing and Debugging**
   - Error scenario handling
   - Cross-platform testing
   - Performance optimization

## Future Improvements

1. **Feature Additions**

   - Browser profiles support
   - Custom browser commands
   - URL filtering and search
   - Export/import settings

2. **Technical Enhancements**

   - Virtual scrolling for history
   - Improved browser detection
   - Cache optimization
   - Update mechanism

3. **UI Improvements**
   - Dark mode support
   - Customizable themes
   - Keyboard shortcuts
   - Drag-and-drop support

## Caveats

- This project is not a full-fledged browser, it only opens URLs in the default browser or the one specified in the settings.
- It does not handle browser updates or extensions.
- Have not tested on MacOS yet.
- Have not consider unloading of unwanted registry entries in Windows.
- User will have to manually set the application as default browser in Windows.

## Main prompt used

```text
build me a electron app with tailwind css that looks very sleek and minimalist. the app has 3 main functions:

function 1 is that it is able to scan, detect and display all available browsers like edge/safari/chrome within the operating system, for macos and windows.

function 2 is that users are able to paste url into the app and can choose from the browser scanned from function 1

finally the most important function is that the app can be exited into the system tray, being able to listen on click of any url in the system and the app will pop up prompting the user to choose which browser for the url to be opened in
```

Subsequent prompts were used to guide the AI to add more features and fix bugs.

## Contributing

Contributions are welcome! This project demonstrates the potential of AI-assisted development, and I encourage continued collaboration with AI tools for improvements and new features.
