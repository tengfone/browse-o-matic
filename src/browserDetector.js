const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const Registry = require('winreg');

function getWindowsBrowsers() {
  return new Promise((resolve) => {
    const browsers = [];
    const promises = [];

    // Registry paths for different browsers
    const registryPaths = [
      {
        name: 'Google Chrome',
        key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe',
        fallback: '\\Google\\Chrome\\Application\\chrome.exe'
      },
      {
        name: 'Microsoft Edge',
        key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\msedge.exe',
        fallback: '\\Microsoft\\Edge\\Application\\msedge.exe'
      },
      {
        name: 'Firefox',
        key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\firefox.exe',
        fallback: '\\Mozilla Firefox\\firefox.exe'
      },
      {
        name: 'Opera',
        key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\opera.exe',
        fallback: '\\Opera\\launcher.exe'
      },
      {
        name: 'Brave',
        key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\brave.exe',
        fallback: '\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
      }
    ];

    // Check registry for each browser
    registryPaths.forEach(browser => {
      const regKey = new Registry({
        hive: Registry.HKLM,
        key: browser.key
      });

      const promise = new Promise(resolve => {
        regKey.get('', (err, item) => {
          if (!err && item && item.value) {
            browsers.push({ name: browser.name, path: item.value });
            resolve();
          } else {
            // Fallback to traditional path checking
            const programFiles = [
              process.env['ProgramFiles'],
              process.env['ProgramFiles(x86)'],
              process.env['LocalAppData']
            ];

            for (const programDir of programFiles) {
              if (!programDir) continue;
              const fullPath = path.join(programDir, browser.fallback);
              if (fs.existsSync(fullPath)) {
                browsers.push({ name: browser.name, path: fullPath });
                break;
              }
            }
            resolve();
          }
        });
      });

      promises.push(promise);
    });

    Promise.all(promises).then(() => resolve(browsers));
  });
}

function getMacOSBrowsers() {
  return new Promise((resolve) => {
    exec('system_profiler SPApplicationsDataType -json', (error, stdout) => {
      const browsers = [];
      
      if (!error) {
        try {
          const data = JSON.parse(stdout);
          const apps = data.SPApplicationsDataType[0].items;
          
          const browserIdentifiers = {
            'com.google.Chrome': 'Google Chrome',
            'com.apple.Safari': 'Safari',
            'org.mozilla.firefox': 'Firefox',
            'com.microsoft.edgemac': 'Microsoft Edge',
            'com.operasoftware.Opera': 'Opera',
            'com.brave.Browser': 'Brave'
          };

          apps.forEach(app => {
            const bundleId = app['bundle_id'] || '';
            if (browserIdentifiers[bundleId]) {
              browsers.push({
                name: browserIdentifiers[bundleId],
                path: app.path,
                version: app.version
              });
            }
          });
        } catch (e) {
          console.error('Error parsing system_profiler output:', e);
        }
      }

      // Fallback to traditional path checking if system_profiler fails
      if (browsers.length === 0) {
        const browserPaths = [
          { name: 'Google Chrome', path: '/Applications/Google Chrome.app' },
          { name: 'Safari', path: '/Applications/Safari.app' },
          { name: 'Firefox', path: '/Applications/Firefox.app' },
          { name: 'Microsoft Edge', path: '/Applications/Microsoft Edge.app' },
          { name: 'Opera', path: '/Applications/Opera.app' },
          { name: 'Brave', path: '/Applications/Brave Browser.app' }
        ];

        browserPaths.forEach(browser => {
          if (fs.existsSync(browser.path)) {
            browsers.push(browser);
          }
        });
      }

      resolve(browsers);
    });
  });
}

async function detectBrowsers() {
  if (process.platform === 'win32') {
    return getWindowsBrowsers();
  } else if (process.platform === 'darwin') {
    return getMacOSBrowsers();
  }
  return [];
}

module.exports = { detectBrowsers };