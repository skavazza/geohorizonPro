const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'js', 'preferences.js'),
  'utf8'
);
const context = vm.createContext({ window: {} });
vm.runInContext(source, context);

function setPreferences(coordinateFormat, cardinalDirections = true, distanceUnit = 'km') {
  vm.runInContext(
    `userPreferences.coordinateFormat = ${JSON.stringify(coordinateFormat)};
     userPreferences.cardinalDirections = ${cardinalDirections};
     userPreferences.distanceUnit = ${JSON.stringify(distanceUnit)};`,
    context
  );
}

test('distance units convert to and from internal kilometers', () => {
  assert.equal(context.convertUnitToKilometers(1000, 'm'), 1);
  assert.equal(context.convertUnitToKilometers(1, 'nm'), 1.852);
  assert.equal(context.convertKilometersToUnit(1.852, 'nm'), 1);
  setPreferences('decimal', true, 'nm');
  assert.equal(context.formatDistance(1.852), '1.00 NM');
});

test('decimal-degree coordinates parse cardinal directions and decimal commas', () => {
  setPreferences('decimal');
  assert.equal(context.parseGeographicCoordinate('17.962813° S', 'lat'), -17.962813);
  assert.equal(context.parseGeographicCoordinate('38,702645° W', 'lng'), -38.702645);
  assert.ok(Number.isNaN(context.parseGeographicCoordinate('17° N', 'lng')));
  assert.ok(Number.isNaN(context.parseGeographicCoordinate('91° N', 'lat')));
});

test('decimal-minute and DMS coordinates parse into signed decimal degrees', () => {
  setPreferences('decimalMinutes');
  assert.ok(Math.abs(context.parseGeographicCoordinate("17° 57,7688' S", 'lat') + 17.9628133333) < 1e-9);

  setPreferences('dms');
  assert.ok(Math.abs(context.parseGeographicCoordinate(`17° 57' 46.1" S`, 'lat') + 17.9628055556) < 1e-9);
  assert.ok(Number.isNaN(context.parseGeographicCoordinate(`17° 60' 00" S`, 'lat')));
});

test('coordinate formatting emits the selected format and cardinal suffix', () => {
  setPreferences('decimal');
  assert.equal(context.formatGeographicCoordinate(-17.962813, 'lat'), '17.962813° S');

  setPreferences('decimalMinutes');
  assert.equal(context.formatGeographicCoordinate(-17.9628133333, 'lat'), `17° 57.7688' S`);

  setPreferences('dms', false);
  assert.equal(context.formatGeographicCoordinate(-17.9628055556, 'lat'), `-17° 57' 46.1"`);
});

test('UTM zone selection covers standard and Norway/Svalbard zones', () => {
  assert.equal(context.getUtmZone(-38.7, -17.9), 24);
  assert.equal(context.getUtmZone(6, 60), 32);
  assert.equal(context.getUtmZone(15, 75), 33);
});
