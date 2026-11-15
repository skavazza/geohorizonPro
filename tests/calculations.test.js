const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

function createCalculationContext() {
  const values = {
    latitude: '-17.9',
    longitude: '-38.7',
    azimute: '350',
    declinacaoMagnetica: '20',
    distancia: '10',
    elevacao: '12'
  };
  const notifications = [];
  const context = vm.createContext({
    document: { getElementById: (id) => ({ value: values[id] }) },
    turf: {
      point: (coordinates) => ({ geometry: { coordinates } }),
      destination: (point, distance, bearing) => ({
        geometry: { coordinates: [point.geometry.coordinates[0] + distance, bearing] }
      })
    },
    distanceInputToKilometers: (value) => Number(value),
    showNotification: (message, type) => notifications.push({ message, type }),
    RAIO_TERRA: 6371,
    Number
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'src/js/calculations.js'), 'utf8'), context);
  return { context, values, notifications };
}

test('horizon and object range use the spherical Earth formulas', () => {
  const { context } = createCalculationContext();
  const expectedHorizon = Math.sqrt(2 * 6371 * 0.002 + 0.002 ** 2);
  assert.ok(Math.abs(context.calcularDistanciaHorizonte(2) - expectedHorizon) < 1e-12);
  assert.equal(
    context.calcularDistanciaObjeto(2, 50),
    context.calcularDistanciaHorizonte(2) + context.calcularDistanciaHorizonte(50)
  );
  assert.equal(context.calcularDistanciaHorizonte(0), 0);
});

test('projection applies magnetic declination and preserves entered parameters', () => {
  const { context } = createCalculationContext();
  const result = context.calcularProjecao();
  assert.equal(result.lat, 10);
  assert.ok(Math.abs(result.lng + 28.7) < 1e-12);
  assert.equal(result.azimuteMag, 350);
  assert.equal(result.declinacaoMag, 20);
  assert.equal(result.azVerdadeiro, 10);
  assert.equal(result.distancia, 10);
  assert.equal(result.elevacao, 12);
});

test('projection normalizes negative bearings and rejects invalid input', () => {
  const { context, values, notifications } = createCalculationContext();
  values.azimute = '5';
  values.declinacaoMagnetica = '-20';
  assert.equal(context.calcularProjecao().azVerdadeiro, 345);

  for (const [field, value] of [
    ['latitude', '91'],
    ['longitude', '-181'],
    ['azimute', ''],
    ['declinacaoMagnetica', '181'],
    ['distancia', '-1'],
    ['elevacao', '']
  ]) {
    values[field] = value;
    assert.equal(context.calcularProjecao(), null, `${field}=${value} should be rejected`);
    values[field] = ({
      latitude: '-17.9', longitude: '-38.7', azimute: '350',
      declinacaoMagnetica: '20', distancia: '10', elevacao: '12'
    })[field];
  }
  assert.equal(notifications.length, 6);
  assert.ok(notifications.every(({ type }) => type === 'error'));
});
