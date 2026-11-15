const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

function createApp(standalone) {
  const elements = {};
  const values = {
    latitude: '-17',
    longitude: '-38',
    azimute: '0',
    declinacaoMagnetica: '0',
    distancia: '10',
    elevacao: '0',
    alturaObservador: '2',
    alturaObservadorObj: '2',
    alturaObjeto: '50'
  };
  for (const [id, value] of Object.entries(values)) {
    elements[id] = { value };
  }
  elements.toggleRings = { checked: false };
  elements.resultados = { style: { display: 'none' } };
  elements.resultsContent = { innerHTML: '' };
  elements.notification = { classList: { add() {}, remove() {} } };

  const layers = new Set();
  const fakeMap = {
    addLayer(layer) { layers.add(layer); },
    removeLayer(layer) { layers.delete(layer); },
    fitBounds() {}
  };
  function makeLayer(kind, coordinates) {
    return {
      kind,
      addTo(map) { map.addLayer(this); return this; },
      bindPopup() { return this; },
      openPopup() { return this; },
      getLatLng() {
        return Array.isArray(coordinates)
          ? { lat: coordinates[0], lng: coordinates[1] }
          : coordinates;
      },
      getBounds() { return {}; }
    };
  }
  const context = vm.createContext({
    document: {
      addEventListener() {},
      getElementById(id) { return elements[id]; }
    },
    fakeMap,
    setTimeout() {},
    L: {
      divIcon(options) { return options; },
      marker(coordinates, options) { return makeLayer(options.icon.className, coordinates); },
      circle(coordinates) { return makeLayer('circle', coordinates); },
      polyline(coordinates) { return makeLayer('line', coordinates); }
    },
    turf: {
      point(coordinates) { return coordinates; },
      destination(point, distance) {
        return { geometry: { coordinates: [point[0] + distance / 100, point[1]] } };
      },
      distance() { return 1; }
    },
    distanceInputToKilometers: Number,
    distanceDisplayMarkup: String,
    coordinateDisplayMarkup: (lat, lng) => `${lat}, ${lng}`,
    formatDistance: String,
    formatCoordinates: (lat, lng) => `${lat}, ${lng}`,
    userPreferences: { distanceUnit: 'km', coordinateFormat: 'decimal', cardinalDirections: true }
  });

  if (standalone) {
    const html = fs.readFileSync(path.join(root, 'geohorizonPro.html'), 'utf8');
    const script = html.match(/<script>\s*\/\/ ========== CONSTANTES ==========[\s\S]*?<\/script>/);
    assert.ok(script, 'standalone application script exists');
    vm.runInContext(script[0].replace(/^<script>/, '').replace(/<\/script>$/, ''), context);
  } else {
    for (const file of ['constants.js', 'utils.js', 'calculations.js', 'map.js', 'handlers.js', 'main.js']) {
      vm.runInContext(fs.readFileSync(path.join(root, 'src', 'js', file), 'utf8'), context);
    }
  }
  vm.runInContext(fs.readFileSync(path.join(root, 'src', 'js', 'export.js'), 'utf8'), context);
  vm.runInContext('map = fakeMap; updateMap();', context);
  return { context, elements, layers };
}

for (const standalone of [false, true]) {
  const version = standalone ? 'standalone' : 'modular';

  test(`${version}: recalculation replaces only previous calculation layers`, () => {
    const { context, elements, layers } = createApp(standalone);
    context.handleCalcular();
    const firstLayers = vm.runInContext('calculationLayers.slice()', context);
    const observer = vm.runInContext('observerMarker', context);
    assert.equal(firstLayers.length, 2);

    elements.distancia.value = '-1';
    context.handleCalcular();
    assert.ok(firstLayers.every(layer => layers.has(layer)));

    elements.distancia.value = '20';
    elements.elevacao.value = '';
    context.handleCalcular();
    assert.ok(firstLayers.every(layer => layers.has(layer)));
    assert.match(elements.notification.textContent, /valores válidos/i);
    elements.elevacao.value = '0';
    context.handleCalcular();
    assert.ok(firstLayers.every(layer => !layers.has(layer)));
    assert.equal(vm.runInContext('calculationLayers.length', context), 2);
    assert.ok(layers.has(observer));

    const projectionLayers = vm.runInContext('calculationLayers.slice()', context);
    context.handleCalcularHorizonte();
    assert.ok(projectionLayers.every(layer => !layers.has(layer)));
    const horizon = vm.runInContext('calculationLayers[0]', context);
    context.handleCalcularObjeto();
    assert.ok(!layers.has(horizon));
    assert.equal(vm.runInContext('calculationLayers.length', context), 1);
    assert.ok(layers.has(observer));
  });

  test(`${version}: location changes remove calculations but preserve measurements`, () => {
    const { context, elements, layers } = createApp(standalone);
    context.handleCalcular();
    const previousCalculation = vm.runInContext('calculationLayers.slice()', context);
    context.updateMap();
    assert.ok(previousCalculation.every(layer => layers.has(layer)));

    vm.runInContext("currentMode = 'medicao'; measurementActive = true;", context);
    context.handleMapClick({ latlng: { lat: -17, lng: -38 } });
    context.handleMapClick({ latlng: { lat: -18, lng: -39 } });
    const measurementLayers = vm.runInContext('[...measurementMarkers, measurementLine]', context);
    elements.latitude.value = '-18';
    context.updateMap();
    assert.ok(previousCalculation.every(layer => !layers.has(layer)));
    assert.ok(measurementLayers.every(layer => layers.has(layer)));
    assert.equal(elements.resultados.style.display, 'block');
    assert.equal(vm.runInContext('observerMarker.getLatLng().lat', context), -18);

    vm.runInContext("currentMode = 'projecao';", context);
    context.handleCalcular();
    elements.longitude.value = '-39';
    context.updateMap();
    assert.equal(vm.runInContext('calculationLayers.length', context), 0);
    assert.equal(elements.resultados.style.display, 'none');
    assert.ok(measurementLayers.every(layer => layers.has(layer)));
  });

  test(`${version}: exports preserve calculation snapshots and matching geographic geometry`, () => {
    const { context, elements } = createApp(standalone);
    elements.longitude.value = '179';
    elements.distancia.value = '200';
    context.updateMap();
    context.handleCalcular();
    elements.distancia.value = '50';
    elements.declinacaoMagnetica.value = '15';

    const data = context.getExportData();
    assert.equal(data.calculo.parametros.distanciaKm, 200);
    assert.equal(data.declinacaoMagnetica, 0);
    assert.equal(data.calculo.resultado.alvo.longitude, -179);
    const geometry = context.getExportGeometry(data);
    assert.equal(geometry.waypoints.length, 2);
    assert.equal(geometry.paths[0].segments.length, 2);
    assert.equal(geometry.paths[0].segments[0][1].longitude, 180);
    assert.equal(geometry.paths[0].segments[1][0].longitude, -180);
    const expectedMetadata = context.escapeXml(JSON.stringify(data));
    const gpx = context.buildGPX(data, geometry);
    assert.ok(gpx.includes(expectedMetadata));
    assert.ok(gpx.includes('lon="179.999999999"'));
    assert.ok(!gpx.includes('lon="180.000000000"'));
    assert.ok(context.buildKML(data, geometry).includes(expectedMetadata));

    elements.latitude.value = '-18';
    context.updateMap();
    assert.equal(context.getExportData().calculo, null);
  });

  test(`${version}: exports horizon, object and measurement results`, () => {
    const { context, elements } = createApp(standalone);
    vm.runInContext("currentMode = 'horizonte';", context);
    context.handleCalcularHorizonte();
    let data = context.getExportData();
    assert.equal(data.calculo.parametros.alturaObservadorM, 2);
    assert.ok(data.calculo.resultado.distanciaKm > 0);
    let geometry = context.getExportGeometry(data);
    assert.equal(geometry.paths[0].segments[0].length, 65);

    vm.runInContext("currentMode = 'objeto';", context);
    context.handleCalcularObjeto();
    data = context.getExportData();
    assert.equal(data.calculo.parametros.alturaObjetoM, 50);
    assert.ok(data.calculo.resultado.distanciaKm > 0);
    geometry = context.getExportGeometry(data);
    assert.equal(geometry.paths[0].name, 'Objeto');

    vm.runInContext("currentMode = 'medicao'; measurementActive = true;", context);
    context.handleMapClick({ latlng: { lat: -17, lng: 179 } });
    context.handleMapClick({ latlng: { lat: -18, lng: -179 } });
    data = context.getExportData();
    assert.equal(data.calculo.resultado.distanciaKm, 1);
    geometry = context.getExportGeometry(data);
    assert.equal(geometry.waypoints.length, 3);
    assert.equal(geometry.paths[0].segments.length, 2);
    context.clearMeasurements();
    assert.equal(context.getExportData().calculo, null);

    vm.runInContext("currentMode = 'horizonte';", context);
    elements.alturaObservador.value = '0';
    context.handleCalcularHorizonte();
    assert.equal(context.getExportGeometry(context.getExportData()).paths.length, 0);
    elements.alturaObservador.value = '100000000';
    context.handleCalcularHorizonte();
    assert.equal(context.getExportGeometry(context.getExportData()), null);
    assert.match(elements.notification.textContent, /raio.*grande/i);

    elements.latitude.value = '91';
    assert.equal(context.getExportData(), null);
    assert.match(elements.notification.textContent, /coordenada válida/i);
  });
}
