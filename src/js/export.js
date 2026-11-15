// ========== EXPORTAÇÃO ==========
function getExportData() {
  const latitude = parseFloat(document.getElementById('latitude').value);
  const longitude = parseFloat(document.getElementById('longitude').value);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
    || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    showNotification('Nenhuma coordenada válida para exportar', 'error');
    return null;
  }

  let result = lastResult && lastResult.modo === currentMode ? lastResult : null;
  if (result && result.modo === 'projecao') {
    result = {
      ...result,
      resultado: { ...result.resultado, alvo: exportPoint(result.resultado.alvo) }
    };
  } else if (result && result.modo === 'medicao') {
    result = {
      ...result,
      parametros: {
        ...result.parametros,
        inicio: exportPoint(result.parametros.inicio),
        fim: exportPoint(result.parametros.fim)
      }
    };
  }
  const declination = result && result.modo === 'projecao'
    ? result.parametros.declinacaoMagneticaGraus
    : parseFloat(document.getElementById('declinacaoMagnetica').value);

  return {
    observador: { latitude, longitude },
    modo: currentMode,
    declinacaoMagnetica: Number.isFinite(declination) ? declination : null,
    configuracoes: {
      unidadeDistancia: userPreferences.distanceUnit,
      formatoCoordenadas: userPreferences.coordinateFormat,
      siglasCardinais: userPreferences.cardinalDirections
    },
    calculo: result,
    timestamp: new Date().toISOString()
  };
}

function exportPoint(point) {
  const longitude = point.longitude;
  return {
    latitude: point.latitude,
    longitude: longitude >= -180 && longitude <= 180
      ? longitude
      : ((longitude + 180) % 360 + 360) % 360 - 180
  };
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[character]);
}

function splitAtAntimeridian(points) {
  const segments = [[points[0]]];
  for (let i = 1; i < points.length; i++) {
    const previous = points[i - 1];
    const point = points[i];
    const difference = point.longitude - previous.longitude;
    if (Math.abs(difference) > 180) {
      const boundary = difference < 0 ? 180 : -180;
      const adjustedLongitude = point.longitude + (difference < 0 ? 360 : -360);
      const fraction = (boundary - previous.longitude) / (adjustedLongitude - previous.longitude);
      const latitude = previous.latitude + fraction * (point.latitude - previous.latitude);
      segments[segments.length - 1].push({ latitude, longitude: boundary });
      segments.push([{ latitude, longitude: -boundary }]);
    }
    segments[segments.length - 1].push(point);
  }
  return segments;
}

function getExportGeometry(data) {
  const waypoints = [{ name: 'Observador', point: data.observador }];
  const paths = [];
  const calculation = data.calculo;
  if (!calculation) return { waypoints, paths };

  if (calculation.modo === 'projecao') {
    waypoints.push({ name: 'Alvo projetado', point: calculation.resultado.alvo });
    paths.push({
      name: 'Projeção',
      segments: splitAtAntimeridian([data.observador, calculation.resultado.alvo])
    });
  } else if (calculation.modo === 'medicao') {
    const { inicio, fim } = calculation.parametros;
    waypoints.push({ name: 'Início da medição', point: inicio }, { name: 'Fim da medição', point: fim });
    paths.push({ name: 'Medição', segments: splitAtAntimeridian([inicio, fim]) });
  } else {
    const radius = calculation.resultado.distanciaKm;
    if (radius >= Math.PI * RAIO_TERRA) {
      showNotification('O raio é grande demais para exportar um contorno geográfico. Exporte em JSON.', 'error');
      return null;
    }
    if (radius > 0) {
      const center = turf.point([data.observador.longitude, data.observador.latitude]);
      const points = [];
      for (let i = 0; i < 64; i++) {
        const [longitude, latitude] = turf.destination(center, radius, i * 360 / 64).geometry.coordinates;
        points.push(exportPoint({ latitude, longitude }));
      }
      points.push(points[0]);
      paths.push({
        name: calculation.modo === 'horizonte' ? 'Horizonte' : 'Objeto',
        segments: splitAtAntimeridian(points)
      });
    }
  }
  return { waypoints, paths };
}

function buildGPX(data, geometry) {
  const longitude = point => Math.min(point.longitude, 179.999999999).toFixed(9);
  const latitude = point => point.latitude.toFixed(9);
  const waypoints = geometry.waypoints.map(({ name, point }) =>
    `  <wpt lat="${latitude(point)}" lon="${longitude(point)}"><name>${escapeXml(name)}</name></wpt>`
  ).join('\n');
  const tracks = geometry.paths.map(path => {
    const segments = path.segments.map(segment =>
      `    <trkseg>${segment.map(point =>
        `<trkpt lat="${latitude(point)}" lon="${longitude(point)}"></trkpt>`
      ).join('')}</trkseg>`
    ).join('\n');
    return `  <trk><name>${escapeXml(path.name)}</name>\n${segments}\n  </trk>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GeoHorizon Pro" xmlns="http://www.topografix.com/GPX/1/1" xmlns:geohorizon="urn:geohorizon-pro:1">
  <metadata><time>${data.timestamp}</time><extensions><geohorizon:dados>${escapeXml(JSON.stringify(data))}</geohorizon:dados></extensions></metadata>
${waypoints}
${tracks}
</gpx>`;
}

function buildKML(data, geometry) {
  const waypoints = geometry.waypoints.map(({ name, point }) =>
    `    <Placemark><name>${escapeXml(name)}</name><Point><coordinates>${point.longitude},${point.latitude},0</coordinates></Point></Placemark>`
  ).join('\n');
  const paths = geometry.paths.map(path => {
    const lines = path.segments.map(segment =>
      `<LineString><coordinates>${segment.map(point => `${point.longitude},${point.latitude},0`).join(' ')}</coordinates></LineString>`
    ).join('');
    return `    <Placemark><name>${escapeXml(path.name)}</name><MultiGeometry>${lines}</MultiGeometry></Placemark>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>GeoHorizon Pro</name>
    <ExtendedData><Data name="geohorizonPro"><value>${escapeXml(JSON.stringify(data))}</value></Data></ExtendedData>
${waypoints}
${paths}
  </Document>
</kml>`;
}

function downloadExport(content, type, extension) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `geohorizon-pro.${extension}`;
  link.click();
  URL.revokeObjectURL(url);
  showNotification(`${extension.toUpperCase()} exportado com sucesso!`, 'success');
}

function exportGPX() {
  const data = getExportData();
  if (!data) return;
  const geometry = getExportGeometry(data);
  if (!geometry) return;
  downloadExport(buildGPX(data, geometry), 'application/gpx+xml', 'gpx');
}

function exportKML() {
  const data = getExportData();
  if (!data) return;
  const geometry = getExportGeometry(data);
  if (!geometry) return;
  downloadExport(buildKML(data, geometry), 'application/vnd.google-earth.kml+xml', 'kml');
}

function exportJSON() {
  const data = getExportData();
  if (!data) return;
  downloadExport(JSON.stringify(data, null, 2), 'application/json', 'json');
}
