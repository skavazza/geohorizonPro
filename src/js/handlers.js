// ========== EVENT HANDLERS ==========
function handleCalcular() {
  const resultado = calcularProjecao();
  if (!resultado) return;

  clearCircles();

  const lat = parseFloat(document.getElementById('latitude').value);
  const lng = parseFloat(document.getElementById('longitude').value);

  // Adicionar marcador do alvo
  const targetMarker = L.marker([resultado.lat, resultado.lng], {
    icon: L.divIcon({
      className: 'target-marker',
      html: `<div style="width: 20px; height: 20px; background: var(--color-accent-orange); border: 3px solid white; border-radius: 50%; box-shadow: 0 0 15px var(--color-accent-orange);"></div>`,
      iconSize: [26, 26]
    })
  }).addTo(map).bindPopup(`
    <strong>Alvo Projetado</strong><br>
    Lat: ${resultado.lat.toFixed(6)}°<br>
    Lng: ${resultado.lng.toFixed(6)}°<br>
    Azimute Mag: ${resultado.azimuteMag.toFixed(2)}°<br>
    Azimute Real: ${resultado.azVerdadeiro.toFixed(2)}°<br>
    Distância: ${resultado.distancia} km
  `).openPopup();
  markers.push(targetMarker);

  // Linha do observador ao alvo
  L.polyline([[lat, lng], [resultado.lat, resultado.lng]], {
    color: 'var(--color-accent-orange)',
    weight: 2,
    dashArray: '5, 10'
  }).addTo(map);

  // Mostrar resultados
  document.getElementById('resultados').style.display = 'block';
  document.getElementById('resultsContent').innerHTML = `
    <div class="result-item">
      <span class="result-label">Latitude Alvo</span>
      <span class="result-value">${resultado.lat.toFixed(6)}°</span>
    </div>
    <div class="result-item">
      <span class="result-label">Longitude Alvo</span>
      <span class="result-value">${resultado.lng.toFixed(6)}°</span>
    </div>
    <div class="result-item">
      <span class="result-label">Azimute Magnético</span>
      <span class="result-value">${resultado.azimuteMag.toFixed(2)}°</span>
    </div>
    <div class="result-item">
      <span class="result-label">Azimute Verdadeiro</span>
      <span class="result-value">${resultado.azVerdadeiro.toFixed(2)}°</span>
    </div>
    <div class="result-item">
      <span class="result-label">Distância</span>
      <span class="result-value">${resultado.distancia.toFixed(2)} km</span>
    </div>
  `;

  showNotification('Projeção calculada com sucesso!', 'success');
}

function handleCalcularHorizonte() {
  const altura = parseFloat(document.getElementById('alturaObservador').value);
  const lat = parseFloat(document.getElementById('latitude').value);
  const lng = parseFloat(document.getElementById('longitude').value);

  if (isNaN(altura) || isNaN(lat) || isNaN(lng)) {
    showNotification('Por favor, preencha todos os campos', 'error');
    return;
  }

  const distancia = calcularDistanciaHorizonte(altura);

  clearCircles();

  // Círculo do horizonte
  const horizonCircle = L.circle([lat, lng], {
    radius: distancia * 1000,
    color: 'var(--color-accent-cyan)',
    fillColor: 'var(--color-accent-cyan)',
    fillOpacity: 0.1,
    weight: 2
  }).addTo(map);
  circles.push(horizonCircle);

  // Ajustar visualização
  map.fitBounds(horizonCircle.getBounds());

  // Mostrar resultados
  document.getElementById('resultados').style.display = 'block';
  document.getElementById('resultsContent').innerHTML = `
    <div class="result-item">
      <span class="result-label">Altura do Observador</span>
      <span class="result-value">${altura.toFixed(2)} m</span>
    </div>
    <div class="result-item">
      <span class="result-label">Distância ao Horizonte</span>
      <span class="result-value">${distancia.toFixed(2)} km</span>
    </div>
    <div class="result-item">
      <span class="result-label">Distância em Milhas Náuticas</span>
      <span class="result-value">${(distancia / 1.852).toFixed(2)} NM</span>
    </div>
  `;

  showNotification(`Distância ao horizonte: ${distancia.toFixed(2)} km`, 'success');
}

function handleCalcularObjeto() {
  const alturaObs = parseFloat(document.getElementById('alturaObservadorObj').value);
  const alturaObj = parseFloat(document.getElementById('alturaObjeto').value);
  const lat = parseFloat(document.getElementById('latitude').value);
  const lng = parseFloat(document.getElementById('longitude').value);

  if (isNaN(alturaObs) || isNaN(alturaObj) || isNaN(lat) || isNaN(lng)) {
    showNotification('Por favor, preencha todos os campos', 'error');
    return;
  }

  const distancia = calcularDistanciaObjeto(alturaObs, alturaObj);

  clearCircles();

  // Círculo do objeto
  const objectCircle = L.circle([lat, lng], {
    radius: distancia * 1000,
    color: 'var(--color-accent-orange)',
    fillColor: 'var(--color-accent-orange)',
    fillOpacity: 0.1,
    weight: 2,
    dashArray: '10, 10'
  }).addTo(map);
  circles.push(objectCircle);

  // Ajustar visualização
  map.fitBounds(objectCircle.getBounds());

  // Mostrar resultados
  document.getElementById('resultados').style.display = 'block';
  document.getElementById('resultsContent').innerHTML = `
    <div class="result-item">
      <span class="result-label">Altura do Observador</span>
      <span class="result-value">${alturaObs.toFixed(2)} m</span>
    </div>
    <div class="result-item">
      <span class="result-label">Altura do Objeto</span>
      <span class="result-value">${alturaObj.toFixed(2)} m</span>
    </div>
    <div class="result-item">
      <span class="result-label">Distância até o Objeto</span>
      <span class="result-value">${distancia.toFixed(2)} km</span>
    </div>
    <div class="result-item">
      <span class="result-label">Distância em Milhas Náuticas</span>
      <span class="result-value">${(distancia / 1.852).toFixed(2)} NM</span>
    </div>
  `;

  showNotification(`Distância até o objeto: ${distancia.toFixed(2)} km`, 'success');
}

function handleMapClick(e) {
  // Modo de seleção de coordenadas
  if (mapPickingActive) {
    document.getElementById('latitude').value = e.latlng.lat.toFixed(6);
    document.getElementById('longitude').value = e.latlng.lng.toFixed(6);
    
    // Desativar modo de seleção
    mapPickingActive = false;
    document.getElementById('pickFromMap').textContent = '🗺️ Selecionar no Mapa';
    document.getElementById('pickFromMap').classList.remove('btn-primary');
    document.getElementById('pickFromMap').classList.add('btn-success');
    map.getContainer().classList.remove('crosshair-cursor');
    
    // Atualizar mapa com nova localização
    updateMap();
    
    showNotification(`Coordenadas selecionadas: ${e.latlng.lat.toFixed(6)}°, ${e.latlng.lng.toFixed(6)}°`, 'success');
    return;
  }

  // Modo de medição de distância
  if (!measurementActive) return;

  if (measurementMarkers.length < 2) {
    const marker = L.marker(e.latlng, {
      icon: L.divIcon({
        className: 'measurement-marker',
        html: `<div style="width: 12px; height: 12px; background: var(--color-accent-green); border: 2px solid white; border-radius: 50%; box-shadow: 0 0 8px var(--color-accent-green);"></div>`,
        iconSize: [16, 16]
      })
    }).addTo(map);
    measurementMarkers.push(marker);

    if (measurementMarkers.length === 2) {
      const from = measurementMarkers[0].getLatLng();
      const to = measurementMarkers[1].getLatLng();
      
      const fromPoint = turf.point([from.lng, from.lat]);
      const toPoint = turf.point([to.lng, to.lat]);
      const distance = turf.distance(fromPoint, toPoint);

      measurementLine = L.polyline([from, to], {
        color: 'var(--color-accent-green)',
        weight: 3,
        dashArray: '5, 10'
      }).addTo(map).bindPopup(`
        <strong>Distância Medida</strong><br>
        ${distance.toFixed(2)} km<br>
        ${(distance / 1.852).toFixed(2)} NM
      `).openPopup();

      // Mostrar resultados
      document.getElementById('resultados').style.display = 'block';
      document.getElementById('resultsContent').innerHTML = `
        <div class="result-item">
          <span class="result-label">Distância Medida</span>
          <span class="result-value">${distance.toFixed(2)} km</span>
        </div>
        <div class="result-item">
          <span class="result-label">Distância em Milhas Náuticas</span>
          <span class="result-value">${(distance / 1.852).toFixed(2)} NM</span>
        </div>
      `;

      showNotification(`Distância: ${distance.toFixed(2)} km`, 'success');
    }
  }
}