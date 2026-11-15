// ========== EVENT HANDLERS ==========
function handleCalcular() {
  const resultado = calcularProjecao();
  if (!resultado) return;

  clearCalculationLayers();

  const lat = parseFloat(document.getElementById('latitude').value);
  const lng = parseFloat(document.getElementById('longitude').value);

  // Adicionar marcador do alvo
  const targetMarker = L.marker([resultado.lat, resultado.lng], {
    icon: L.divIcon({
      className: 'target-marker',
      html: `<div style="width: 20px; height: 20px; background: var(--color-accent-orange); border: 3px solid white; border-radius: 50%; box-shadow: 0 0 15px var(--color-accent-orange);"></div>`,
      iconSize: [26, 26]
    })
  }).addTo(map).bindPopup(() => `
    <strong>Alvo Projetado</strong><br>
    ${coordinateDisplayMarkup(resultado.lat, resultado.lng)}<br>
    Azimute Mag: ${resultado.azimuteMag.toFixed(2)}°<br>
    Azimute Real: ${resultado.azVerdadeiro.toFixed(2)}°<br>
    Distância: ${distanceDisplayMarkup(resultado.distancia)}
  `).openPopup();
  calculationLayers.push(targetMarker);

  // Linha do observador ao alvo
  const projectionLine = L.polyline([[lat, lng], [resultado.lat, resultado.lng]], {
    color: 'var(--color-accent-orange)',
    weight: 2,
    dashArray: '5, 10'
  }).addTo(map);
  calculationLayers.push(projectionLine);

  lastResult = {
    modo: 'projecao',
    calculadoEm: new Date().toISOString(),
    parametros: {
      distanciaKm: resultado.distancia,
      azimuteMagneticoGraus: resultado.azimuteMag,
      declinacaoMagneticaGraus: resultado.declinacaoMag,
      elevacaoM: resultado.elevacao
    },
    resultado: {
      alvo: { latitude: resultado.lat, longitude: resultado.lng },
      azimuteVerdadeiroGraus: resultado.azVerdadeiro
    }
  };

  // Mostrar resultados
  document.getElementById('resultados').style.display = 'block';
  document.getElementById('resultsContent').innerHTML = `
    <div class="result-item">
      <span class="result-label">Coordenadas do Alvo</span>
      <span class="result-value">${coordinateDisplayMarkup(resultado.lat, resultado.lng)}</span>
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
      <span class="result-value">${distanceDisplayMarkup(resultado.distancia)}</span>
    </div>
  `;

  showNotification('Projeção calculada com sucesso!', 'success');
}

function handleCalcularHorizonte() {
  const altura = parseFloat(document.getElementById('alturaObservador').value);
  const lat = parseFloat(document.getElementById('latitude').value);
  const lng = parseFloat(document.getElementById('longitude').value);

  if (isNaN(altura) || altura < 0 || isNaN(lat) || isNaN(lng)) {
    showNotification('Por favor, preencha todos os campos', 'error');
    return;
  }

  const distancia = calcularDistanciaHorizonte(altura);

  clearCalculationLayers();

  // Círculo do horizonte
  const horizonCircle = L.circle([lat, lng], {
    radius: distancia * 1000,
    color: 'var(--color-accent-cyan)',
    fillColor: 'var(--color-accent-cyan)',
    fillOpacity: 0.1,
    weight: 2
  }).addTo(map);
  calculationLayers.push(horizonCircle);

  lastResult = {
    modo: 'horizonte',
    calculadoEm: new Date().toISOString(),
    parametros: { alturaObservadorM: altura },
    resultado: { distanciaKm: distancia }
  };

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
      <span class="result-value">${distanceDisplayMarkup(distancia)}</span>
    </div>
  `;

  showNotification(`Distância ao horizonte: ${formatDistance(distancia)}`, 'success');
}

function handleCalcularObjeto() {
  const alturaObs = parseFloat(document.getElementById('alturaObservadorObj').value);
  const alturaObj = parseFloat(document.getElementById('alturaObjeto').value);
  const lat = parseFloat(document.getElementById('latitude').value);
  const lng = parseFloat(document.getElementById('longitude').value);

  if (isNaN(alturaObs) || alturaObs < 0 || isNaN(alturaObj) || alturaObj < 0 || isNaN(lat) || isNaN(lng)) {
    showNotification('Por favor, preencha todos os campos', 'error');
    return;
  }

  const distancia = calcularDistanciaObjeto(alturaObs, alturaObj);

  clearCalculationLayers();

  // Círculo do objeto
  const objectCircle = L.circle([lat, lng], {
    radius: distancia * 1000,
    color: 'var(--color-accent-orange)',
    fillColor: 'var(--color-accent-orange)',
    fillOpacity: 0.1,
    weight: 2,
    dashArray: '10, 10'
  }).addTo(map);
  calculationLayers.push(objectCircle);

  lastResult = {
    modo: 'objeto',
    calculadoEm: new Date().toISOString(),
    parametros: { alturaObservadorM: alturaObs, alturaObjetoM: alturaObj },
    resultado: { distanciaKm: distancia }
  };

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
      <span class="result-value">${distanceDisplayMarkup(distancia)}</span>
    </div>
  `;

  showNotification(`Distância até o objeto: ${formatDistance(distancia)}`, 'success');
}

function handleMapClick(e) {
  // Modo de seleção de coordenadas
  if (mapPickingActive) {
    setCoordinates(e.latlng.lat, e.latlng.lng);
    
    // Desativar modo de seleção
    mapPickingActive = false;
    document.getElementById('pickFromMap').textContent = '🗺️ Selecionar no Mapa';
    document.getElementById('pickFromMap').classList.remove('btn-primary');
    document.getElementById('pickFromMap').classList.add('btn-success');
    map.getContainer().classList.remove('crosshair-cursor');
    
    // Atualizar mapa com nova localização
    updateMap();
    
    showNotification(`Coordenadas selecionadas: ${formatCoordinates(e.latlng.lat, e.latlng.lng)}`, 'success');
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
      }).addTo(map).bindPopup(() => `
        <strong>Distância Medida</strong><br>
        ${distanceDisplayMarkup(distance)}
      `).openPopup();

      lastResult = {
        modo: 'medicao',
        calculadoEm: new Date().toISOString(),
        parametros: {
          inicio: { latitude: from.lat, longitude: from.lng },
          fim: { latitude: to.lat, longitude: to.lng }
        },
        resultado: { distanciaKm: distance }
      };

      // Mostrar resultados
      document.getElementById('resultados').style.display = 'block';
      document.getElementById('resultsContent').innerHTML = `
        <div class="result-item">
          <span class="result-label">Distância Medida</span>
          <span class="result-value">${distanceDisplayMarkup(distance)}</span>
        </div>
      `;

      showNotification(`Distância: ${formatDistance(distance)}`, 'success');
    }
  }
}