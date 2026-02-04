// ========== CÁLCULOS ==========
function calcularDistanciaHorizonte(altura) {
  const h = altura / 1000; // converter para km
  return Math.sqrt(2 * RAIO_TERRA * h + h * h);
}

function calcularDistanciaObjeto(hObs, hObj) {
  const dObs = calcularDistanciaHorizonte(hObs);
  const dObj = calcularDistanciaHorizonte(hObj);
  return dObs + dObj;
}

function calcularProjecao() {
  const lat = parseFloat(document.getElementById('latitude').value);
  const lng = parseFloat(document.getElementById('longitude').value);
  const azimuteMag = parseFloat(document.getElementById('azimute').value);
  const distancia = parseFloat(document.getElementById('distancia').value);
  const elevacao = parseFloat(document.getElementById('elevacao').value);

  if (isNaN(lat) || isNaN(lng) || isNaN(azimuteMag) || isNaN(distancia)) {
    showNotification('Por favor, preencha todos os campos com valores válidos', 'error');
    return null;
  }

  // Corrigir declinação magnética
  const azVerdadeiro = ((azimuteMag + DECLINACAO_MAGNETICA) % 360 + 360) % 360;

  // Usar Turf.js para projeção precisa
  const point = turf.point([lng, lat]);
  const destination = turf.destination(point, distancia, azVerdadeiro);

  return {
    lat: destination.geometry.coordinates[1],
    lng: destination.geometry.coordinates[0],
    azimuteMag,
    azVerdadeiro,
    distancia,
    elevacao
  };
}