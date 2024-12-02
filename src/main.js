const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  protocol,
} = require("electron");
const path = require("path");
const { detectBrowsers } = require("./browserDetector");
const { addToHistory, getHistory, clearHistory } = require("./history");
const { registerProtocolHandlers } = require("./protocolHandler");

let mainWindow;
let tray;
let browsers = [];
let startupUrl;

// Add at the top of the file after the requires
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

// Handle macOS URL events
app.on("will-finish-launching", () => {
  // Handle URLs when app is not running (macOS)
  app.on("open-url", (event, url) => {
    event.preventDefault();
    if (mainWindow) {
      mainWindow.show();
      mainWindow.webContents.send("open-url", url);
    } else {
      startupUrl = url;
    }
  });
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();

      // On Windows, the URL might be in different positions depending on how it was launched
      const url =
        commandLine.find((arg) => arg.startsWith("http")) ||
        commandLine.find((arg) => arg.includes("http"));
      if (url) {
        mainWindow.webContents.send("open-url", url);
      }
    }
  });

  // Handle URLs on Windows when app is not running
  if (process.platform === "win32") {
    const url = process.argv.find((arg) => arg.startsWith("http"));
    if (url) {
      startupUrl = url;
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    frame: false,
    transparent: true,
    resizable: false,
    backgroundColor: "#00000000",
  });

  mainWindow.loadFile(path.join(__dirname, "../index.html"));

  mainWindow.on("minimize", (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

async function initialize() {
  browsers = await detectBrowsers();

  // Register protocol handlers
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient("http", process.execPath, [
        path.resolve(process.argv[1]),
      ]);
      app.setAsDefaultProtocolClient("https", process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient("http");
    app.setAsDefaultProtocolClient("https");
  }

  // Handle startup URL if any
  if (startupUrl) {
    mainWindow.webContents.send("open-url", startupUrl);
  }

  if (process.platform === "win32") {
    registerProtocolHandlers();
  }
}

app.on("ready", async () => {
  await initialize();
  createWindow();

  // Create tray icon
  tray = new Tray(path.join(__dirname, "../icon.ico"));
  const contextMenu = Menu.buildFromTemplate([
    { label: "Open Browser Selector", click: () => mainWindow.show() },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Browser-o-matic");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
});

// Handle URLs
app.on("open-url", (event, url) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.show();
    mainWindow.webContents.send("open-url", url);
  }
});

ipcMain.handle("get-browsers", async () => {
  return browsers;
});

ipcMain.on("open-in-browser", (event, { url, browserPath }) => {
  const { exec } = require("child_process");
  const browser = browsers.find((b) => b.path === browserPath);

  if (browser) {
    addToHistory(url, browser.name);

    if (process.platform === "win32") {
      exec(`"${browserPath}" "${url}"`);
    } else {
      exec(`open -a "${browserPath}" "${url}"`);
    }
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on("app-quit", () => {
  app.isQuitting = true;
  app.quit();
});

ipcMain.handle("get-history", () => {
  return getHistory();
});

ipcMain.on("clear-history", () => {
  clearHistory();
});

ipcMain.on("minimize-window", () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});
