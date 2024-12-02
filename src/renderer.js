const { ipcRenderer } = require('electron');

window.addEventListener('unload', () => {
  // Clean up any renderer process resources
  window.removeEventListener('DOMContentLoaded', null);
  document.getElementById('exitButton')?.removeEventListener('click', null);
  document.getElementById('historyButton')?.removeEventListener('click', null);
  document.getElementById('closeHistory')?.removeEventListener('click', null);
});

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow-lg text-sm transition-opacity duration-300';
  errorDiv.style.opacity = '0';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);

  // Fade in
  requestAnimationFrame(() => {
    errorDiv.style.opacity = '1';
  });

  // Fade out and remove
  setTimeout(() => {
    errorDiv.style.opacity = '0';
    setTimeout(() => {
      errorDiv.remove();
    }, 300); // Match the duration of the transition
  }, 2700);
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI
  document.getElementById('app').innerHTML = `
    <div class="w-80 relative">
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-bold text-gray-800">Browser-o-matic</h1>
          <button id="historyButton" class="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100" style="-webkit-app-region: no-drag" title="View History">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V12L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>
        <div class="flex items-center gap-2">
          <button id="minimizeButton" class="text-gray-500 hover:text-gray-800 hover:bg-gray-100 p-1 rounded-full font-bold" style="-webkit-app-region: no-drag" title="Minimize">―</button>
          <button id="exitButton" class="text-gray-500 hover:text-gray-800 hover:bg-gray-100 p-1 rounded-full" style="-webkit-app-region: no-drag">✖</button>
        </div>
      </div>
      
      <div class="mb-4">
        <input 
          type="text" 
          id="urlInput" 
          placeholder="Paste your URL here" 
          class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style="-webkit-app-region: no-drag"
        />
      </div>
      
      <div id="browserList" class="space-y-2" style="-webkit-app-region: no-drag">
        <!-- Browsers will be listed here -->
      </div>

      <div id="historyPanel" class="hidden fixed top-1/2 right-4 transform -translate-y-1/2 h-3/4 w-64 bg-white shadow-lg flex flex-col rounded-lg" 
        style="
          scrollbar-width: thin;
          scrollbar-color: #CBD5E1 transparent;
        "
      >
        <div class="p-4 border-b border-gray-200 flex-shrink-0">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-medium">History</h2>
            <button id="closeHistory" class="text-gray-500 hover:text-gray-800 hover:bg-gray-100 p-1 rounded-full">✖</button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto p-4">
          <div id="historyListPanel" class="space-y-2">
            <!-- History items will be listed here -->
          </div>
        </div>
      </div>
    </div>
  `;

  // Add event listeners
  document.getElementById('exitButton').addEventListener('click', () => {
    ipcRenderer.send('app-quit');
  });

  document.getElementById('historyButton').addEventListener('click', () => {
    const historyPanel = document.getElementById('historyPanel');
    historyPanel.classList.toggle('hidden');
    
    // Use setTimeout to ensure the transition happens after hidden is removed
    setTimeout(() => {
      historyPanel.classList.toggle('visible');
    }, 0);
    
    if (!historyPanel.classList.contains('hidden')) {
      loadHistory();
    }
  });

  document.getElementById('closeHistory').addEventListener('click', () => {
    const historyPanel = document.getElementById('historyPanel');
    historyPanel.classList.remove('visible');
    // Wait for transition to complete before hiding
    setTimeout(() => {
      historyPanel.classList.add('hidden');
    }, 300);
  });

  document.getElementById('minimizeButton').addEventListener('click', () => {
    ipcRenderer.send('minimize-window');
  });

  // Load and display browsers
  loadBrowsers();
});

function isValidUrl(string) {
  try {
    const url = new URL(string.includes('://') ? string : `http://${string}`);
    return url.hostname.includes('.');
  } catch (err) {
    return false;
  }
}

async function loadBrowsers() {
  await Promise.all([
    (async () => {
      const browsers = await ipcRenderer.invoke('get-browsers');
      const browserList = document.getElementById('browserList');
      
      browserList.innerHTML = browsers.map(browser => `
        <button 
          class="w-full px-4 py-3 text-left rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center space-x-3 bg-white"
          data-browser-path="${browser.path}"
        >
          <span class="font-medium text-gray-700">${browser.name}</span>
        </button>
      `).join('');

      // Add click handlers
      browserList.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => {
          const url = document.getElementById('urlInput').value.trim();
          
          if (!url) {
            showError('Please enter a URL');
            return;
          }

          if (!isValidUrl(url)) {
            showError('Please enter a valid HTTP or HTTPS URL');
            return;
          }

          ipcRenderer.send('open-in-browser', {
            url,
            browserPath: button.dataset.browserPath
          });
          document.getElementById('urlInput').value = '';
        });
      });
    })(),
    loadHistory()
  ]);
}

// Handle URLs received from main process
ipcRenderer.on('open-url', (event, url) => {
  document.getElementById('urlInput').value = url;
  // Show the window if it's hidden
  document.getElementById('app').style.display = 'block';
  // Focus the first browser button to make it obvious to the user
  const firstBrowserButton = document.querySelector('#browserList button');
  if (firstBrowserButton) {
    firstBrowserButton.focus();
  }
});
// Initial load
loadBrowsers();

// Add this function to load and display history
async function loadHistory() {
  const history = await ipcRenderer.invoke('get-history');
  const historyListPanel = document.getElementById('historyListPanel');
  
  if (historyListPanel) {
    historyListPanel.innerHTML = history.map(item => `
      <div class="p-2 hover:bg-gray-50 rounded-lg border border-gray-100">
        <div class="flex items-center justify-between gap-2">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate" title="${item.url}">${item.url}</p>
            <p class="text-xs text-gray-500 truncate">
              ${item.browserName} • ${new Date(item.timestamp).toLocaleString()}
            </p>
          </div>
          <button 
            class="shrink-0 text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"
            onclick="reloadUrl('${item.url}')"
            title="Open URL"
          >
            ↗
          </button>
        </div>
      </div>
    `).join('');
  }
}

// Function to reload a URL from history
function reloadUrl(url) {
  document.getElementById('urlInput').value = url;
  document.getElementById('historyPanel').classList.add('hidden');
  // Focus the first browser button
  const firstBrowserButton = document.querySelector('#browserList button');
  if (firstBrowserButton) {
    firstBrowserButton.focus();
  }
}

// Add history clearing functionality
function clearHistory() {
  ipcRenderer.send('clear-history');
  loadHistory();
}
