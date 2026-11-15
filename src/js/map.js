// ========== FUNÇÕES DE MAPA ==========
function createRings(centerLat, centerLng) {
  clearRings();
  
  if (!document.getElementById('toggleRings').checked) return;

  const showLabels = document.getElementById('toggleLabels').checked;

  for (let i = 1; i <= userPreferences.ringCount; i++) {
    const distanceKm = i * userPreferences.ringSpacingKm;
    const radius = distanceKm * 1000;
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
        distanceKm,
        45
      );
      
      const label = L.marker([point.geometry.coordinates[1], point.geometry.coordinates[0]], {
        icon: L.divIcon({
          className: 'ring-label',
          html: `<span class="ring-label-text">${formatDistanceInUnit(distanceKm, userPreferences.ringDistanceUnit)}</span>`,
          iconSize: [90, 20]
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

  if (observerMarker) {
    const previousLocation = observerMarker.getLatLng();
    if (previousLocation.lat !== lat || previousLocation.lng !== lng) {
      if (calculationLayers.length && currentMode !== 'medicao') {
        document.getElementById('resultados').style.display = 'none';
      }
      clearCalculationLayers();
    }
    map.removeLayer(observerMarker);
  }

  // Marcador do observador
  observerMarker = L.marker([lat, lng], {
    icon: L.divIcon({
      className: 'observer-marker',
      html: `<div style="width: 16px; height: 16px; background: var(--color-accent-cyan); border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px var(--color-accent-cyan);"></div>`,
      iconSize: [22, 22]
    })
  }).addTo(map).bindPopup(() => `<strong>Observador</strong><br>${coordinateDisplayMarkup(lat, lng)}`);
  createRings(lat, lng);
}
