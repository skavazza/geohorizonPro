// ========== FUNÇÕES AUXILIARES ==========
function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = 'notification show';
  
  if (type === 'error') {
    notification.classList.add('error');
  } else if (type === 'success') {
    notification.classList.add('success');
  }
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

function showLoading(show, text = 'Carregando...') {
  const loading = document.getElementById('loading');
  const loadingText = document.getElementById('loadingText');
  loadingText.textContent = text;
  loading.className = show ? 'loading show' : 'loading';
}

function clearCalculationLayers() {
  calculationLayers.forEach(layer => map.removeLayer(layer));
  calculationLayers = [];
  if (lastResult && lastResult.modo !== 'medicao') lastResult = null;
}

function clearRings() {
  rings.forEach(r => map.removeLayer(r));
  labels.forEach(l => map.removeLayer(l));
  rings = [];
  labels = [];
}

function clearMeasurements() {
  measurementMarkers.forEach(m => map.removeLayer(m));
  measurementMarkers = [];
  if (measurementLine) {
    map.removeLayer(measurementLine);
    measurementLine = null;
  }
  if (lastResult && lastResult.modo === 'medicao') lastResult = null;
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const systemTheme = prefersDark ? 'dark' : 'light';
  
  const theme = savedTheme || systemTheme;
  document.documentElement.setAttribute('data-theme', theme);
  
  const themeToggle = document.getElementById('theme-toggle-checkbox');
  if (themeToggle) {
    themeToggle.checked = theme === 'dark';
  }
}