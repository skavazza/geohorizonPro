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
  const declinacaoMag = parseFloat(document.getElementById('declinacaoMagnetica').value);
  const distancia = distanceInputToKilometers(document.getElementById('distancia').value);
  const elevacao = parseFloat(document.getElementById('elevacao').value);

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180
    || isNaN(azimuteMag) || isNaN(declinacaoMag) || isNaN(distancia) || distancia < 0
    || !Number.isFinite(elevacao)) {
    showNotification('Por favor, preencha todos os campos com valores válidos', 'error');
    return null;
  }

  if (declinacaoMag < -180 || declinacaoMag > 180) {
    showNotification('A declinação magnética deve estar entre -180° e 180°', 'error');
    return null;
  }

  // Corrigir declinação magnética
  const azVerdadeiro = ((azimuteMag + declinacaoMag) % 360 + 360) % 360;

  // Usar Turf.js para projeção precisa
  const point = turf.point([lng, lat]);
  const destination = turf.destination(point, distancia, azVerdadeiro);

  return {
    lat: destination.geometry.coordinates[1],
    lng: destination.geometry.coordinates[0],
    azimuteMag,
    declinacaoMag,
    azVerdadeiro,
    distancia,
    elevacao
  };
}