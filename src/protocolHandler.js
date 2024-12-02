const { exec } = require("child_process");
const { app } = require("electron");
const path = require("path");

function executeRegistryCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Registry command error: ${error}`);
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

function registerProtocolHandlers() {
  if (process.platform === "win32") {
    registerWindowsProtocols();
  } else if (process.platform === "darwin") {
    registerMacProtocols();
  }
}

async function registerWindowsProtocols() {
  const protocols = ["http", "https"];
  const exePath = app.getPath("exe");
  const appName = "Browser-o-matic";
  const appDescription = "Browser Selection Tool";

  try {
    for (const protocol of protocols) {
      const commands = [
        // Register application
        `reg add "HKCU\\Software\\Classes\\${appName}.${protocol}" /ve /d "${appDescription}" /f`,
        `reg add "HKCU\\Software\\Classes\\${appName}.${protocol}" /v "URL Protocol" /d "" /f`,

        // Application icon
        `reg add "HKCU\\Software\\Classes\\${appName}.${protocol}\\DefaultIcon" /ve /d "${exePath},0" /f`,

        // Command to execute
        `reg add "HKCU\\Software\\Classes\\${appName}.${protocol}\\shell\\open\\command" /ve /d "\\"${exePath}\\" \\"%1\\"" /f`,

        // Register capabilities
        `reg add "HKCU\\Software\\Clients\\StartMenuInternet\\${appName}\\Capabilities" /v "ApplicationName" /d "${appName}" /f`,
        `reg add "HKCU\\Software\\Clients\\StartMenuInternet\\${appName}\\Capabilities" /v "ApplicationDescription" /d "${appDescription}" /f`,
        `reg add "HKCU\\Software\\Clients\\StartMenuInternet\\${appName}\\Capabilities" /v "ApplicationIcon" /d "${exePath},0" /f`,

        // URL Associations
        `reg add "HKCU\\Software\\Clients\\StartMenuInternet\\${appName}\\Capabilities\\URLAssociations" /v "${protocol}" /d "${appName}.${protocol}" /f`,
        `reg add "HKCU\\Software\\Clients\\StartMenuInternet\\${appName}\\Capabilities\\StartMenu" /v "StartMenuInternet" /d "${appName}" /f`,

        // Default Programs registration
        `reg add "HKCU\\Software\\RegisteredApplications" /v "${appName}" /d "Software\\Clients\\StartMenuInternet\\${appName}\\Capabilities" /f`
      ];

      for (const command of commands) {
        await executeRegistryCommand(command);
      }
    }
    console.log("Protocol registration completed successfully");
  } catch (error) {
    console.error("Error in protocol registration:", error);
  }
}

function registerMacProtocols() {
  // macOS protocol handling is managed through Info.plist
  // which is configured in electron-builder config

  // Additional macOS-specific setup if needed
  if (app.isPackaged) {
    try {
      // Register as default protocol handler for http and https
      app.setAsDefaultProtocolClient("http");
      app.setAsDefaultProtocolClient("https");

      // For development: you might want to handle LSSetDefaultHandlerForURLScheme
      // but this requires additional permissions and entitlements
    } catch (error) {
      console.error("Error registering protocol handlers on macOS:", error);
    }
  }
}

// Helper function to check if protocols are registered
function checkProtocolRegistration() {
  return new Promise((resolve) => {
    if (process.platform !== "win32") {
      resolve(true);
      return;
    }

    const appName = "Browser-o-matic";
    exec(`reg query "HKCU\\Software\\Classes\\${appName}.http"`, (error) => {
      resolve(!error);
    });
  });
}

// Helper function to remove protocol registration
function unregisterProtocolHandlers() {
  if (process.platform !== "win32") return Promise.resolve();

  const appName = "Browser-o-matic";
  const keys = [
    `HKCU\\Software\\Classes\\${appName}.http`,
    `HKCU\\Software\\Classes\\${appName}.https`,
    `HKCU\\Software\\Clients\\StartMenuInternet\\${appName}`,
    `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\${appName}.exe`,
  ];

  return Promise.all(
    keys.map((key) => executeRegistryCommand(`reg delete "${key}" /f`))
  );
}

module.exports = {
  registerProtocolHandlers,
  checkProtocolRegistration,
  unregisterProtocolHandlers,
};
