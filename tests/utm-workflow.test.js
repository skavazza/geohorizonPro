const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const preferencesSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'js', 'preferences.js'),
  'utf8'
);

function createUtmContext() {
  const elements = Object.fromEntries([
    'latitude', 'longitude', 'latitudeEntry', 'longitudeEntry', 'utmZone',
    'utmHemisphere', 'utmEasting', 'utmNorthing',
    'geographicCoordinateInputs', 'utmCoordinateInputs', 'notification'
  ].map((id) => [id, { value: '', style: {}, textContent: '', classList: { add() {}, remove() {} } }]));
  elements.latitude.value = '-17.962813';
  elements.longitude.value = '-38.702645';

  const calls = [];
  const proj4 = (from, to, coordinates) => {
    calls.push({ from, to, coordinates: [...coordinates] });
    if (from === 'EPSG:4326') return [500000 + coordinates[0] * 100, 10000000 + coordinates[1] * 100];
    return [(coordinates[0] - 500000) / 100, (coordinates[1] - 10000000) / 100];
  };
  const context = vm.createContext({
    document: {
      getElementById: (id) => elements[id],
      querySelectorAll: () => []
    },
    window: { proj4 },
    localStorage: { getItem() { return null; }, setItem() {} },
    setTimeout() {},
    Number
  });
  vm.runInContext(preferencesSource, context);
  vm.runInContext("userPreferences.coordinateFormat = 'utm';", context);
  return { context, elements, calls };
}

test('WGS84 coordinates select the expected UTM zone and hemisphere', () => {
  const { context, calls } = createUtmContext();
  const result = context.coordinatesToUtm(-17.962813, -38.702645);
  assert.equal(result.zone, 24);
  assert.equal(result.hemisphere, 'S');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].from, 'EPSG:4326');
  assert.match(calls[0].to, /\+zone=24 \+south .*\+datum=WGS84/);
  assert.deepEqual(calls[0].coordinates, [-38.702645, -17.962813]);
});

test('UTM input converts to geographic coordinates and refreshes displayed inputs', () => {
  const { context, elements, calls } = createUtmContext();
  elements.utmZone.value = '24';
  elements.utmHemisphere.value = 'S';
  elements.utmEasting.value = '496129.7355';
  elements.utmNorthing.value = '9998203.7187';

  assert.equal(context.applyCoordinateInputs(), true);
  assert.ok(Math.abs(Number(elements.latitude.value) + 17.962813) < 1e-9);
  assert.ok(Math.abs(Number(elements.longitude.value) + 38.702645) < 1e-9);
  assert.equal(elements.utmZone.value, 24);
  assert.equal(elements.utmHemisphere.value, 'S');
  assert.match(calls[0].from, /\+zone=24 \+south .*\+datum=WGS84/);
  assert.equal(calls[0].to, 'EPSG:4326');
});

test('invalid UTM bounds are rejected without calling the projection library', () => {
  const { context, elements, calls } = createUtmContext();
  elements.utmZone.value = '61';
  elements.utmHemisphere.value = 'S';
  elements.utmEasting.value = '500000';
  elements.utmNorthing.value = '8000000';
  assert.equal(context.readCoordinatesFromInputs(), null);
  assert.equal(calls.length, 0);

  elements.utmZone.value = '24';
  elements.utmNorthing.value = '10000001';
  assert.equal(context.readCoordinatesFromInputs(), null);
  assert.equal(calls.length, 0);

  assert.equal(context.coordinatesToUtm(-81, -38), null);
  assert.equal(calls.length, 0);
});
