// ========== FUNÇÕES DE MAPA ==========
function createRings(centerLat, centerLng) {
  clearRings();
  
  if (!document.getElementById('toggleRings').checked) return;

  const showLabels = document.getElementById('toggleLabels').checked;

  for (let i = 1; i <= 16; i++) {
    const radius = i * NM_TO_METERS;
    const hue = 120 - (i * 7.5); // Verde para vermelho
    const color = `hsl(${hue}, 70%, 50%)`;
    
    const ring = L.circle([centerLat, centerLng], {
      radius: radius,
      color: color,
      fillColor: 'transparent',
      weight: 1,
      opacity: 0.6
    }).addTo(map);
    rings.push(ring);

    if (showLabels) {
      // Posicionar label no nordeste (45°)
      const point = turf.destination(
        turf.point([centerLng, centerLat]),
        i * 1.852,
        45
      );
      
      const label = L.marker([point.geometry.coordinates[1], point.geometry.coordinates[0]], {
        icon: L.divIcon({
          className: 'ring-label',
          html: `<div style="font-family: var(--font-body); font-size: 10px; font-weight: 700; color: white; background: ${color}; padding: 2px 6px; border-radius: 4px; border: 1px solid white; white-space: nowrap;">${i} NM</div>`,
          iconSize: [40, 20]
        })
      }).addTo(map);
      labels.push(label);
    }
  }
}

function updateMap() {
  const lat = parseFloat(document.getElementById('latitude').value);
  const lng = parseFloat(document.getElementById('longitude').value);

  if (isNaN(lat) || isNaN(lng)) return;

  clearMarkers();
  clearCircles();

  // Marcador do observador
  const observerMarker = L.marker([lat, lng], {
    icon: L.divIcon({
      className: 'observer-marker',
      html: `<div style="width: 16px; height: 16px; background: var(--color-accent-cyan); border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px var(--color-accent-cyan);"></div>`,
      iconSize: [22, 22]
    })
  }).addTo(map).bindPopup(`<strong>Observador</strong><br>Lat: ${lat.toFixed(6)}°<br>Lng: ${lng.toFixed(6)}°`);
  markers.push(observerMarker);

  createRings(lat, lng);
}