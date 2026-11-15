const PREFERENCES_STORAGE_KEY = 'geohorizon-pro.preferences';
const VALID_DISTANCE_UNITS = ['m', 'km', 'nm'];
const VALID_COORDINATE_FORMATS = ['decimal', 'decimalMinutes', 'dms', 'utm'];
let userPreferences = {
  distanceUnit: 'km',
  coordinateFormat: 'decimal',
  cardinalDirections: true,
  initialMapLocation: { latitude: ABROLHOS.lat, longitude: ABROLHOS.lng },
  ringDistanceUnit: 'km',
  ringCount: 16,
  ringSpacingKm: 1.852
};

function initializePreferences() {
  const saved = localStorage.getItem(PREFERENCES_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const savedLocation = parsed.initialMapLocation;
      userPreferences = {
        distanceUnit: VALID_DISTANCE_UNITS.includes(parsed.distanceUnit) ? parsed.distanceUnit : 'km',
        coordinateFormat: VALID_COORDINATE_FORMATS.includes(parsed.coordinateFormat) ? parsed.coordinateFormat : 'decimal',
        cardinalDirections: typeof parsed.cardinalDirections === 'boolean' ? parsed.cardinalDirections : true,
        initialMapLocation: savedLocation
          && Number.isFinite(savedLocation.latitude) && savedLocation.latitude >= -90 && savedLocation.latitude <= 90
          && Number.isFinite(savedLocation.longitude) && savedLocation.longitude >= -180 && savedLocation.longitude <= 180
          ? { latitude: savedLocation.latitude, longitude: savedLocation.longitude }
          : { latitude: ABROLHOS.lat, longitude: ABROLHOS.lng },
        ringDistanceUnit: VALID_DISTANCE_UNITS.includes(parsed.ringDistanceUnit) ? parsed.ringDistanceUnit : 'km',
        ringCount: Number.isInteger(parsed.ringCount) && parsed.ringCount >= 1 && parsed.ringCount <= 100
          ? parsed.ringCount
          : 16,
        ringSpacingKm: Number.isFinite(parsed.ringSpacingKm) && parsed.ringSpacingKm > 0
          ? parsed.ringSpacingKm
          : 1.852
      };
    } catch (error) {
      showNotification('As configurações salvas são inválidas; serão usados os valores padrão.', 'error');
    }
  }

  document.getElementById('distanceUnit').value = userPreferences.distanceUnit;
  document.getElementById('coordinateFormat').value = userPreferences.coordinateFormat;
  document.getElementById('cardinalDirections').checked = userPreferences.cardinalDirections;
  document.getElementById('initialLatitude').value = userPreferences.initialMapLocation.latitude;
  document.getElementById('initialLongitude').value = userPreferences.initialMapLocation.longitude;
  document.getElementById('ringDistanceUnit').value = userPreferences.ringDistanceUnit;
  document.getElementById('ringCount').value = userPreferences.ringCount;
  updateRingSpacingInput();

  const distanceInput = document.getElementById('distancia');
  distanceInput.value = formatDistanceInput(
    convertKilometersToUnit(parseFloat(distanceInput.value), userPreferences.distanceUnit),
    userPreferences.distanceUnit
  );
  updateDistanceInputLabel();
}

function savePreferences() {
  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(userPreferences));
}

function distanceUnitLabel(unit = userPreferences.distanceUnit) {
  return { m: 'm', km: 'km', nm: 'NM' }[unit];
}

function convertKilometersToUnit(kilometers, unit = userPreferences.distanceUnit) {
  if (unit === 'm') return kilometers * 1000;
  if (unit === 'nm') return kilometers / 1.852;
  return kilometers;
}

function convertUnitToKilometers(value, unit = userPreferences.distanceUnit) {
  if (unit === 'm') return value / 1000;
  if (unit === 'nm') return value * 1.852;
  return value;
}

function distanceInputToKilometers(value) {
  const numericValue = parseFloat(value);
  return Number.isFinite(numericValue) ? convertUnitToKilometers(numericValue) : NaN;
}

function formatDistance(kilometers) {
  return formatDistanceInUnit(kilometers, userPreferences.distanceUnit);
}

function formatDistanceInUnit(kilometers, unit) {
  const value = convertKilometersToUnit(kilometers, unit);
  const decimals = unit === 'm'
    ? (Math.abs(value) < 1 ? 2 : Math.abs(value) < 100 ? 1 : 0)
    : 2;
  return `${value.toFixed(decimals)} ${distanceUnitLabel(unit)}`;
}

function formatDistanceInput(value, unit) {
  const decimals = unit === 'nm' ? 4 : unit === 'm' ? 1 : 2;
  return value.toFixed(decimals);
}

function distanceDisplayMarkup(kilometers) {
  return `<span data-distance-km="${kilometers}">${formatDistance(kilometers)}</span>`;
}

function coordinateDisplayMarkup(latitude, longitude) {
  return `<span data-coordinate-lat="${latitude}" data-coordinate-lng="${longitude}">${formatCoordinates(latitude, longitude)}</span>`;
}

function updateDistanceInputLabel() {
  document.getElementById('distanceLabel').textContent = `Distância (${distanceUnitLabel()})`;
  document.getElementById('distancia').step = userPreferences.distanceUnit === 'nm'
    ? '0.0001'
    : userPreferences.distanceUnit === 'm' ? '0.01' : '0.1';
}

function updateRingSpacingInput() {
  const spacingInput = document.getElementById('ringSpacing');
  spacingInput.value = formatDistanceInput(
    convertKilometersToUnit(userPreferences.ringSpacingKm, userPreferences.ringDistanceUnit),
    userPreferences.ringDistanceUnit
  );
  spacingInput.step = userPreferences.ringDistanceUnit === 'nm' ? '0.0001'
    : userPreferences.ringDistanceUnit === 'm' ? '0.1' : '0.01';
  spacingInput.min = spacingInput.step;
  document.getElementById('ringSpacingLabel').textContent = `Intervalo entre anéis (${distanceUnitLabel(userPreferences.ringDistanceUnit)})`;
}

function changeRingSettings() {
  const countInput = document.getElementById('ringCount');
  const spacingInput = document.getElementById('ringSpacing');
  const count = Number(countInput.value);
  const spacingKm = convertUnitToKilometers(Number(spacingInput.value), userPreferences.ringDistanceUnit);
  if (!Number.isInteger(count) || count < 1 || count > 100 || !Number.isFinite(spacingKm) || spacingKm <= 0) {
    countInput.value = userPreferences.ringCount;
    updateRingSpacingInput();
    showNotification('Informe de 1 a 100 anéis e um intervalo maior que zero.', 'error');
    return false;
  }

  userPreferences.ringCount = count;
  userPreferences.ringSpacingKm = spacingKm;
  savePreferences();
  updateRingSpacingInput();
  const latitude = parseFloat(document.getElementById('latitude').value);
  const longitude = parseFloat(document.getElementById('longitude').value);
  createRings(latitude, longitude);
  return true;
}

function changeRingDistanceUnit(nextUnit) {
  if (!VALID_DISTANCE_UNITS.includes(nextUnit) || nextUnit === userPreferences.ringDistanceUnit) return;
  userPreferences.ringDistanceUnit = nextUnit;
  savePreferences();
  updateRingSpacingInput();
  const latitude = parseFloat(document.getElementById('latitude').value);
  const longitude = parseFloat(document.getElementById('longitude').value);
  createRings(latitude, longitude);
}

function saveInitialMapLocation() {
  const latitudeValue = document.getElementById('initialLatitude').value.trim();
  const longitudeValue = document.getElementById('initialLongitude').value.trim();
  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);
  if (!latitudeValue || !longitudeValue || !Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    showNotification('Informe uma latitude entre -90 e 90 e uma longitude entre -180 e 180.', 'error');
    return false;
  }

  userPreferences.initialMapLocation = { latitude, longitude };
  savePreferences();
  setCoordinates(latitude, longitude);
  map.setView([latitude, longitude], 11);
  updateMap();
  showNotification('Posição inicial salva e aplicada.', 'success');
  return true;
}

function useCurrentLocationAsInitial() {
  document.getElementById('initialLatitude').value = document.getElementById('latitude').value;
  document.getElementById('initialLongitude').value = document.getElementById('longitude').value;
  return saveInitialMapLocation();
}

function changeDistanceUnit(nextUnit) {
  if (!VALID_DISTANCE_UNITS.includes(nextUnit) || nextUnit === userPreferences.distanceUnit) return;

  const distanceInput = document.getElementById('distancia');
  const distanceKm = distanceInputToKilometers(distanceInput.value);
  userPreferences.distanceUnit = nextUnit;
  if (Number.isFinite(distanceKm)) {
    distanceInput.value = formatDistanceInput(convertKilometersToUnit(distanceKm, nextUnit), nextUnit);
  }

  updateDistanceInputLabel();
  savePreferences();
  refreshDistanceDisplays();
}

function changeCoordinateFormat(nextFormat) {
  if (!VALID_COORDINATE_FORMATS.includes(nextFormat)) return;
  userPreferences.coordinateFormat = nextFormat;
  savePreferences();
  renderCoordinateInputs();
  refreshCoordinateDisplays();
  if (nextFormat === 'utm') {
    const latitude = parseFloat(document.getElementById('latitude').value);
    if (latitude < -80 || latitude > 84) {
      showNotification('O formato UTM só é válido entre 80° S e 84° N.', 'error');
    } else if (typeof window.proj4 !== 'function') {
      showNotification('A conversão UTM não está disponível. Verifique a conexão e recarregue a página.', 'error');
    }
  }
}

function changeCardinalDirections(enabled) {
  userPreferences.cardinalDirections = enabled;
  savePreferences();
  renderCoordinateInputs();
  refreshCoordinateDisplays();
}

function refreshDistanceDisplays() {
  document.querySelectorAll('[data-distance-km]').forEach((element) => {
    element.textContent = formatDistance(parseFloat(element.dataset.distanceKm));
  });
}

function createDistanceScaleControl(mapInstance) {
  const control = L.control({ position: 'bottomright' });

  control.onAdd = function(leafletMap) {
    this._container = L.DomUtil.create('div', 'unit-distance-scale');
    this._container.setAttribute('aria-label', 'Escala de distância do mapa');
    leafletMap.on('moveend zoomend resize', this.update, this);
    this.update();
    return this._container;
  };

  control.onRemove = function(leafletMap) {
    leafletMap.off('moveend zoomend resize', this.update, this);
  };

  control.update = function() {
    if (!this._container) return;

    const mapSize = mapInstance.getSize();
    const maxWidth = Math.min(120, mapSize.x / 3);
    if (maxWidth <= 0 || mapSize.y <= 0) return;

    const y = mapSize.y / 2;
    const center = mapSize.x / 2;
    const start = mapInstance.containerPointToLatLng([center - maxWidth / 2, y]);
    const end = mapInstance.containerPointToLatLng([center + maxWidth / 2, y]);
    const metersPerPixel = mapInstance.distance(start, end) / maxWidth;
    const unitMeters = userPreferences.distanceUnit === 'm'
      ? 1
      : userPreferences.distanceUnit === 'nm' ? 1852 : 1000;
    const roughValue = (maxWidth * metersPerPixel) / unitMeters;
    if (!Number.isFinite(roughValue) || roughValue <= 0) return;

    const magnitude = Math.pow(10, Math.floor(Math.log10(roughValue)));
    const normalized = roughValue / magnitude;
    const scaleValue = (normalized >= 5 ? 5 : normalized >= 2 ? 2 : 1) * magnitude;
    const width = Math.min(maxWidth, (scaleValue * unitMeters) / metersPerPixel);
    this._container.innerHTML = `<span>${formatDistance((scaleValue * unitMeters) / 1000)}</span><div class="unit-distance-scale-bar" style="width: ${width}px"></div>`;
  };

  return control;
}

function getUtmZone(longitude, latitude) {
  let zone = Math.min(60, Math.floor((longitude + 180) / 6) + 1);
  if (latitude >= 56 && latitude < 64 && longitude >= 3 && longitude < 12) zone = 32;
  if (latitude >= 72 && latitude <= 84) {
    if (longitude >= 0 && longitude < 9) zone = 31;
    else if (longitude >= 9 && longitude < 21) zone = 33;
    else if (longitude >= 21 && longitude < 33) zone = 35;
    else if (longitude >= 33 && longitude < 42) zone = 37;
  }
  return zone;
}

function utmProjection(zone, hemisphere) {
  return `+proj=utm +zone=${zone} ${hemisphere === 'S' ? '+south ' : ''}+datum=WGS84 +units=m +no_defs`;
}

function coordinatesToUtm(latitude, longitude) {
  if (latitude < -80 || latitude > 84 || typeof window.proj4 !== 'function') return null;

  const zone = getUtmZone(longitude, latitude);
  const hemisphere = latitude < 0 ? 'S' : 'N';
  const coordinates = window.proj4('EPSG:4326', utmProjection(zone, hemisphere), [longitude, latitude]);
  return { zone, hemisphere, easting: coordinates[0], northing: coordinates[1] };
}

function formatCoordinates(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return '—';
  if (userPreferences.coordinateFormat === 'utm') {
    const utm = coordinatesToUtm(latitude, longitude);
    if (!utm) return 'UTM indisponível para esta coordenada';
    return `${utm.zone}${utm.hemisphere} · ${utm.easting.toFixed(0)} m E · ${utm.northing.toFixed(0)} m N`;
  }

  return `${formatGeographicCoordinate(latitude, 'lat')}, ${formatGeographicCoordinate(longitude, 'lng')}`;
}

function formatGeographicCoordinate(value, axis) {
  const absolute = Math.abs(value);
  const direction = axis === 'lat'
    ? (value < 0 ? 'S' : 'N')
    : (value < 0 ? 'W' : 'E');
  const sign = value < 0 ? '-' : '';

  if (userPreferences.coordinateFormat === 'decimal') {
    const formatted = absolute.toFixed(6);
    return userPreferences.cardinalDirections ? `${formatted}° ${direction}` : `${sign}${formatted}°`;
  }

  const degrees = Math.floor(absolute);
  if (userPreferences.coordinateFormat === 'decimalMinutes') {
    let minutes = Number(((absolute - degrees) * 60).toFixed(4));
    let adjustedDegrees = degrees;
    if (minutes >= 60) {
      adjustedDegrees += 1;
      minutes = 0;
    }
    const degreeText = adjustedDegrees.toString().padStart(axis === 'lat' ? 2 : 3, '0');
    const formatted = `${degreeText}° ${minutes.toFixed(4)}'`;
    return userPreferences.cardinalDirections ? `${formatted} ${direction}` : `${sign}${formatted}`;
  }

  let minutes = Math.floor((absolute - degrees) * 60);
  let seconds = Number(((((absolute - degrees) * 60) - minutes) * 60).toFixed(1));
  let adjustedDegrees = degrees;
  if (seconds >= 60) {
    seconds = 0;
    minutes += 1;
  }
  if (minutes >= 60) {
    minutes = 0;
    adjustedDegrees += 1;
  }
  const degreeText = adjustedDegrees.toString().padStart(axis === 'lat' ? 2 : 3, '0');
  const formatted = `${degreeText}° ${minutes.toString().padStart(2, '0')}' ${seconds.toFixed(1)}"`;
  return userPreferences.cardinalDirections ? `${formatted} ${direction}` : `${sign}${formatted}`;
}

function parseGeographicCoordinate(value, axis) {
  const text = value.trim().toUpperCase();
  if (!text) return NaN;

  const directionMatch = text.match(/[NSEW]$/);
  const direction = directionMatch ? directionMatch[0] : null;
  const validDirections = axis === 'lat' ? ['N', 'S'] : ['E', 'W'];
  if (direction && !validDirections.includes(direction)) return NaN;

  const numericText = (direction ? text.slice(0, -1) : text)
    .replace(/[°ºD'′M"″S]/g, ' ')
    .trim();
  const parts = numericText.split(/\s+/).map((part) => {
    const normalized = part.includes(',') && !part.includes('.') ? part.replace(',', '.') : part;
    return Number(normalized);
  });
  const expectedParts = userPreferences.coordinateFormat === 'dms'
    ? 3
    : userPreferences.coordinateFormat === 'decimalMinutes' ? 2 : 1;
  if (parts.length !== expectedParts || parts.some((part) => !Number.isFinite(part))) return NaN;

  const [degrees, minutes = 0, seconds = 0] = parts;
  if (minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) return NaN;
  if (direction && degrees < 0 && (direction === 'N' || direction === 'E')) return NaN;

  const magnitude = Math.abs(degrees) + minutes / 60 + seconds / 3600;
  const limit = axis === 'lat' ? 90 : 180;
  if (magnitude > limit || (magnitude === limit && (minutes !== 0 || seconds !== 0))) return NaN;

  const negative = direction ? direction === 'S' || direction === 'W' : degrees < 0;
  return negative ? -magnitude : magnitude;
}

function readCoordinatesFromInputs() {
  if (userPreferences.coordinateFormat !== 'utm') {
    const latitude = parseGeographicCoordinate(document.getElementById('latitudeEntry').value, 'lat');
    const longitude = parseGeographicCoordinate(document.getElementById('longitudeEntry').value, 'lng');
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  }

  const zone = parseInt(document.getElementById('utmZone').value, 10);
  const hemisphere = document.getElementById('utmHemisphere').value;
  const easting = parseFloat(document.getElementById('utmEasting').value);
  const northing = parseFloat(document.getElementById('utmNorthing').value);
  if (!Number.isInteger(zone) || zone < 1 || zone > 60 || !['N', 'S'].includes(hemisphere)
    || !Number.isFinite(easting) || easting < 100000 || easting > 900000
    || !Number.isFinite(northing) || northing < 0 || northing > 10000000) return null;
  if (typeof window.proj4 !== 'function') {
    showNotification('A conversão UTM não está disponível. Verifique a conexão e recarregue a página.', 'error');
    return null;
  }

  const coordinates = window.proj4(utmProjection(zone, hemisphere), 'EPSG:4326', [easting, northing]);
  const [longitude, latitude] = coordinates;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
    || latitude < -80 || latitude > 84 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

function renderCoordinateInputs() {
  const geographicInputs = document.getElementById('geographicCoordinateInputs');
  const utmInputs = document.getElementById('utmCoordinateInputs');
  const useUtm = userPreferences.coordinateFormat === 'utm';
  geographicInputs.style.display = useUtm ? 'none' : 'grid';
  utmInputs.style.display = useUtm ? 'grid' : 'none';

  const latitude = parseFloat(document.getElementById('latitude').value);
  const longitude = parseFloat(document.getElementById('longitude').value);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

  if (useUtm) {
    const utm = coordinatesToUtm(latitude, longitude);
    if (!utm) {
      document.getElementById('utmZone').value = '';
      document.getElementById('utmEasting').value = '';
      document.getElementById('utmNorthing').value = '';
      return;
    }
    document.getElementById('utmZone').value = utm.zone;
    document.getElementById('utmHemisphere').value = utm.hemisphere;
    document.getElementById('utmEasting').value = utm.easting.toFixed(2);
    document.getElementById('utmNorthing').value = utm.northing.toFixed(2);
    return;
  }

  document.getElementById('latitudeEntry').value = formatGeographicCoordinate(latitude, 'lat');
  document.getElementById('longitudeEntry').value = formatGeographicCoordinate(longitude, 'lng');
  document.getElementById('latitudeEntry').placeholder = coordinatePlaceholder('lat');
  document.getElementById('longitudeEntry').placeholder = coordinatePlaceholder('lng');
}

function coordinatePlaceholder(axis) {
  const isLatitude = axis === 'lat';
  const direction = isLatitude ? 'S' : 'W';
  const suffix = userPreferences.cardinalDirections ? ` ${direction}` : '';
  if (userPreferences.coordinateFormat === 'dms') {
    const example = isLatitude ? `17° 57' 46.1"` : `038° 42' 09.5"`;
    return `Ex.: ${example}${suffix}`;
  }
  if (userPreferences.coordinateFormat === 'decimalMinutes') return `Ex.: ${isLatitude ? "17° 57.7688'" : "038° 42.1587'"}${suffix}`;
  return `Ex.: ${isLatitude ? '17.962813°' : '38.702645°'}${suffix}`;
}

function setCoordinates(latitude, longitude) {
  document.getElementById('latitude').value = latitude;
  document.getElementById('longitude').value = longitude;
  renderCoordinateInputs();
}

function applyCoordinateInputs() {
  const coordinates = readCoordinatesFromInputs();
  if (!coordinates) {
    showNotification('Coordenadas inválidas para o formato selecionado', 'error');
    return false;
  }
  setCoordinates(coordinates.latitude, coordinates.longitude);
  return true;
}

function refreshCoordinateDisplays() {
  document.querySelectorAll('[data-coordinate-lat][data-coordinate-lng]').forEach((element) => {
    element.textContent = formatCoordinates(
      parseFloat(element.dataset.coordinateLat),
      parseFloat(element.dataset.coordinateLng)
    );
  });
}
