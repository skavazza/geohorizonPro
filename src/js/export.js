// ========== EXPORTAÇÃO ==========
function exportGPX() {
  const lat = parseFloat(document.getElementById('latitude').value);
  const lng = parseFloat(document.getElementById('longitude').value);

  if (isNaN(lat) || isNaN(lng)) {
    showNotification('Nenhuma coordenada para exportar', 'error');
    return;
  }

  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GeoHorizon Pro">
  <wpt lat="${lat}" lon="${lng}">
    <name>Observador</name>
    <time>${new Date().toISOString()}</time>
  </wpt>
</gpx>`;
  
  const blob = new Blob([gpx], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'geohorizon-pro.gpx';
  a.click();
  URL.revokeObjectURL(url);
  
  showNotification('GPX exportado com sucesso!', 'success');
}

function exportKML() {
  const lat = parseFloat(document.getElementById('latitude').value);
  const lng = parseFloat(document.getElementById('longitude').value);

  if (isNaN(lat) || isNaN(lng)) {
    showNotification('Nenhuma coordenada para exportar', 'error');
    return;
  }

  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>GeoHorizon Pro</name>
    <Placemark>
      <name>Observador</name>
      <Point>
        <coordinates>${lng},${lat},0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`;
  
  const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'geohorizon-pro.kml';
  a.click();
  URL.revokeObjectURL(url);
  
  showNotification('KML exportado com sucesso!', 'success');
}

function exportJSON() {
  const lat = parseFloat(document.getElementById('latitude').value);
  const lng = parseFloat(document.getElementById('longitude').value);

  if (isNaN(lat) || isNaN(lng)) {
    showNotification('Nenhuma coordenada para exportar', 'error');
    return;
  }

  const data = {
    observador: { latitude: lat, longitude: lng },
    modo: currentMode,
    timestamp: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'geohorizon-pro.json';
  a.click();
  URL.revokeObjectURL(url);
  
  showNotification('JSON exportado com sucesso!', 'success');
}