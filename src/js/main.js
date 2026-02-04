// ========== VARIÁVEIS GLOBAIS ==========
let map;
let currentMode = 'projecao';
let markers = [];
let circles = [];
let rings = [];
let labels = [];
let measurementMarkers = [];
let measurementLine = null;
let measurementActive = false;
let mapPickingActive = false;
let baseLayer = null;
let compassHeading = 0;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar tema
  initializeTheme();
  
  // Inicializar mapa
  map = L.map('map', {
    zoomControl: false
  }).setView([ABROLHOS.lat, ABROLHOS.lng], 11);

  // Camadas do mapa
  const tileLayers = {
    streets: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }),
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri'
    }),
    terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenTopoMap'
    })
  };

  baseLayer = tileLayers.streets;
  baseLayer.addTo(map);

  // Controles do mapa
  L.control.zoom({ position: 'topright' }).addTo(map);
  L.control.scale({ position: 'bottomright', metric: true, imperial: false }).addTo(map);

  // Botão de centralizar
  const CenterControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function() {
      const button = L.DomUtil.create('button', 'center-button');
      button.innerHTML = '⌖';
      button.title = 'Centralizar em Abrolhos';
      button.onclick = () => {
        map.setView([ABROLHOS.lat, ABROLHOS.lng], 11);
        document.getElementById('latitude').value = ABROLHOS.lat;
        document.getElementById('longitude').value = ABROLHOS.lng;
        updateMap();
      };
      return button;
    }
  });
  new CenterControl().addTo(map);

  // Click no mapa
  map.on('click', handleMapClick);

  // Inicializar coordenadas
  document.getElementById('latitude').value = ABROLHOS.lat;
  document.getElementById('longitude').value = ABROLHOS.lng;
  updateMap();

  // Event Listeners - Mode Selector
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      currentMode = e.target.dataset.mode;
      
      // Esconder todos os parâmetros
      document.querySelectorAll('[id^="params-"]').forEach(p => p.style.display = 'none');
      
      // Mostrar parâmetros do modo selecionado
      document.getElementById(`params-${currentMode}`).style.display = 'block';
      
      // Limpar medições se não estiver em modo medição
      if (currentMode !== 'medicao') {
        measurementActive = false;
        document.getElementById('toggleMeasurement').textContent = 'Ativar Medição';
        document.getElementById('toggleMeasurement').classList.remove('btn-primary');
        document.getElementById('toggleMeasurement').classList.add('btn-success');
        clearMeasurements();
      }
      
      // Esconder resultados
      document.getElementById('resultados').style.display = 'none';
    });
  });

  // Event Listeners - Theme Toggle
  document.getElementById('theme-toggle-checkbox').addEventListener('change', toggleTheme);

  // Event Listeners - Botões
  document.getElementById('getLocation').addEventListener('click', () => {
    if (!navigator.geolocation) {
      showNotification('Geolocalização não suportada', 'error');
      return;
    }

    showLoading(true, 'Obtendo localização...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        document.getElementById('latitude').value = position.coords.latitude;
        document.getElementById('longitude').value = position.coords.longitude;
        map.setView([position.coords.latitude, position.coords.longitude], 13);
        updateMap();
        showLoading(false);
        showNotification('Localização obtida com sucesso!', 'success');
      },
      (error) => {
        showLoading(false);
        showNotification('Erro ao obter localização', 'error');
        console.error(error);
      }
    );
  });

  document.getElementById('pickFromMap').addEventListener('click', (e) => {
    mapPickingActive = !mapPickingActive;
    
    if (mapPickingActive) {
      e.target.textContent = '✖️ Cancelar Seleção';
      e.target.classList.remove('btn-success');
      e.target.classList.add('btn-primary');
      map.getContainer().classList.add('crosshair-cursor');
      showNotification('Clique no mapa para selecionar as coordenadas', 'success');
      
      // Desativar medição se estiver ativa
      if (measurementActive) {
        measurementActive = false;
        document.getElementById('toggleMeasurement').textContent = 'Ativar Medição';
        document.getElementById('toggleMeasurement').classList.remove('btn-primary');
        document.getElementById('toggleMeasurement').classList.add('btn-success');
      }
    } else {
      e.target.textContent = '🗺️ Selecionar no Mapa';
      e.target.classList.remove('btn-primary');
      e.target.classList.add('btn-success');
      map.getContainer().classList.remove('crosshair-cursor');
    }
  });

  document.getElementById('calcular').addEventListener('click', handleCalcular);
  document.getElementById('calcularHorizonte').addEventListener('click', handleCalcularHorizonte);
  document.getElementById('calcularObjeto').addEventListener('click', handleCalcularObjeto);

  document.getElementById('toggleMeasurement').addEventListener('click', (e) => {
    measurementActive = !measurementActive;
    
    if (measurementActive) {
      e.target.textContent = 'Desativar Medição';
      e.target.classList.remove('btn-success');
      e.target.classList.add('btn-primary');
      showNotification('Clique no mapa para marcar 2 pontos', 'success');
    } else {
      e.target.textContent = 'Ativar Medição';
      e.target.classList.remove('btn-primary');
      e.target.classList.add('btn-success');
      clearMeasurements();
      document.getElementById('resultados').style.display = 'none';
    }
  });

  document.getElementById('clearMeasurement').addEventListener('click', () => {
    clearMeasurements();
    document.getElementById('resultados').style.display = 'none';
    showNotification('Medições limpas', 'success');
  });

  // Event Listeners - Configurações
  document.getElementById('toggleRings').addEventListener('change', (e) => {
    if (e.target.checked) {
      updateMap();
    } else {
      clearRings();
    }
  });

  document.getElementById('toggleLabels').addEventListener('change', () => {
    updateMap();
  });

  document.getElementById('toggleCompass').addEventListener('change', (e) => {
    document.getElementById('compass').style.display = e.target.checked ? 'flex' : 'none';
  });

  document.getElementById('mapStyle').addEventListener('change', (e) => {
    map.removeLayer(baseLayer);
    baseLayer = tileLayers[e.target.value];
    baseLayer.addTo(map);
  });

  // Event Listeners - Coordenadas
  document.getElementById('latitude').addEventListener('change', updateMap);
  document.getElementById('longitude').addEventListener('change', updateMap);

  // Event Listeners - Exportação
  document.getElementById('exportGPX').addEventListener('click', exportGPX);
  document.getElementById('exportKML').addEventListener('click', exportKML);
  document.getElementById('exportJSON').addEventListener('click', exportJSON);

  // Bússola
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (e) => {
      const heading = e.webkitCompassHeading || (e.alpha ? 360 - e.alpha : 0);
      document.getElementById('compassNeedle').style.transform = `rotate(${heading}deg)`;
    });
  }
});