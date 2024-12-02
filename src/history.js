const Store = require('electron-store');

const store = new Store({
  name: 'url-history', // Name of the storage file
  defaults: {
    urls: [] // Default empty array for URLs
  }
});

function addToHistory(url, browserName) {
  const urls = store.get('urls');
  const timestamp = new Date().toISOString();
  
  // Add new URL to the beginning of the array
  urls.unshift({
    url,
    browserName,
    timestamp
  });

  // Keep only the last 100 URLs
  if (urls.length > 100) {
    urls.pop();
  }

  store.set('urls', urls);
}

function getHistory() {
  return store.get('urls');
}

function clearHistory() {
  store.set('urls', []);
}

module.exports = {
  addToHistory,
  getHistory,
  clearHistory
}; 