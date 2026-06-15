'use strict';
/* ============================================================
   Gefahren-Feldbuch · app.js
   Statische PWA · keine Keys · alle Daten lokal (IndexedDB)
   ============================================================ */

/* ---------- Stammdaten: 12 Gefahren (aus dem Report) ---------- */
const M = {
  volume:    { label: 'Volumen',           unit: 'm³' },
  distance:  { label: 'Distanz / Auslauf', unit: 'm' },
  length:    { label: 'Länge',             unit: 'm' },
  width:     { label: 'Breite',            unit: 'm' },
  height:    { label: 'Höhe / Mächtigkeit',unit: 'm' },
  slope:     { label: 'Neigung',           unit: '°' },
  snowDepth: { label: 'Schneehöhe',        unit: 'cm' },
  free:      { label: 'Freies Maß',        unit: '', text: true },
};
const HAZARDS = [
  { id: 'steinschlag', name: 'Steinschlag', icon: '🪨', region: 'Alpen',
    measures: [ ['volume','Blockgröße / Volumen'], ['distance','Sturz- / Auslaufdistanz'], ['slope'], ['free','Sonstiges','Frequenz, Auslösung, Sturzbahn'] ] },
  { id: 'muren', name: 'Muren / Murgänge', icon: '🌊', region: 'Alpen',
    measures: [ ['volume'], ['distance','Reichweite / Auslauf'], ['width','Gerinnebreite'], ['slope'], ['free','Sonstiges','Geschiebe, Front, Schübe'] ] },
  { id: 'felssturz', name: 'Berg- / Felsstürze (Felslawinen)', icon: '🏔️', region: 'Alpen',
    measures: [ ['volume'], ['distance','Auslaufdistanz'], ['height','Abbruchhöhe'], ['slope'], ['free','Sonstiges','Kluftbild, Wasser, Vorläufer'] ] },
  { id: 'permafrost', name: 'Permafrost-Degradation und Hanginstabilität', icon: '🌡️', region: 'Alpen',
    measures: [ ['slope'], ['length','Hanglänge'], ['height','Mächtigkeit'], ['free','Bewegungsrate / Indikator','z. B. 20 mm/a, Anrisse, Setzungen'] ] },
  { id: 'schadstoff', name: 'Schadstoff- / Schwermetallfreisetzung in Gewässer', icon: '🧪', region: 'Arktis',
    measures: [ ['distance','betroffener Gewässerabschnitt'], ['free','Beobachtung','Verfärbung, Trübung, pH, Geruch, Fischsterben'] ] },
  { id: 'gletscherspalten', name: 'Gletscherspalten', icon: '🕳️', region: 'Alpen',
    measures: [ ['width','Spaltenbreite'], ['height','Spaltentiefe'], ['length','Spaltenlänge'], ['slope'], ['free','Sonstiges','Schneebrücke, Verlauf, Sturzraum'] ] },
  { id: 'gletscherrueckgang', name: 'Gletscherrückgang und Eisinstabilität (Séracs / Eisabbrüche)', icon: '🧊', region: 'Alpen',
    measures: [ ['volume','Sérac- / Eisvolumen'], ['distance','Rückzug / Abstand'], ['slope'], ['free','Beobachtung','Spaltenbildung, Wasseraustritt, Geschwindigkeit'] ] },
  { id: 'lawinen', name: 'Lawinen (alle Typen)', icon: '🌨️', region: 'Alpen',
    measures: [ ['snowDepth'], ['height','Anrissmächtigkeit','cm'], ['width','Anrissbreite'], ['distance','Auslaufdistanz'], ['slope','Hangneigung'], ['free','Lawinenart / Problem','Triebschnee, Nassschnee, Gleitschnee'] ] },
  { id: 'glof', name: 'Gletscherseeausbrüche (GLOF)', icon: '💧', region: 'Alpen',
    measures: [ ['volume','Seevolumen'], ['distance','Auslauf / Reichweite'], ['free','Pegel / Damm','Pegeländerung, Moränen- / Eisdamm'] ] },
  { id: 'schelfeis', name: 'Schelfeis-Kollaps / Kalben', icon: '🧱', region: 'Antarktis',
    measures: [ ['length','Kante / Eisberg-Länge'], ['width','Breite'], ['height','Mächtigkeit'], ['free','Beobachtung','Riss, Kalbung, Eisbergmaße'] ] },
  { id: 'meereis', name: 'Meereisrückgang', icon: '🌐', region: 'Arktis',
    measures: [ ['distance','Abstand zur Eiskante'], ['free','Konzentration / Dicke','z. B. 7/10 Bedeckung, Eisdicke, Presseis'] ] },
  { id: 'thermokarst', name: 'Thermokarst und Methan- / biogeochemische Freisetzung', icon: '💨', region: 'Arktis',
    measures: [ ['height','Senkungstiefe'], ['length','betroffene Länge'], ['free','Beobachtung','Senkung, Methanaustritt, Thermokarstsee'] ] },
];
const HZ = Object.fromEntries(HAZARDS.map(h => [h.id, h]));
const REGIONS = ['Alpen', 'Arktis', 'Antarktis'];
const AMPEL = { gruen: 'Grün', gelb: 'Gelb', rot: 'Rot' };

/* ---------- WMO-Wettercodes (kurz, deutsch) ---------- */
const WMO = {
  0:['Klar','☀️'],1:['Überw. klar','🌤️'],2:['Teils bewölkt','⛅'],3:['Bedeckt','☁️'],
  45:['Nebel','🌫️'],48:['Reifnebel','🌫️'],51:['Leichter Niesel','🌦️'],53:['Niesel','🌦️'],55:['Starker Niesel','🌧️'],
  56:['Gefr. Niesel','🌧️'],57:['Gefr. Niesel','🌧️'],61:['Leichter Regen','🌦️'],63:['Regen','🌧️'],65:['Starker Regen','🌧️'],
  66:['Gefr. Regen','🌧️'],67:['Gefr. Regen','🌧️'],71:['Leichter Schnee','🌨️'],73:['Schnee','🌨️'],75:['Starker Schnee','❄️'],
  77:['Schneegriesel','🌨️'],80:['Regenschauer','🌦️'],81:['Schauer','🌧️'],82:['Starke Schauer','🌧️'],
  85:['Schneeschauer','🌨️'],86:['Starke Schneeschauer','❄️'],95:['Gewitter','⛈️'],96:['Gewitter + Hagel','⛈️'],99:['Schweres Gewitter','⛈️'],
};
const wmoText = c => (WMO[c] ? WMO[c][0] : '–');
const wmoIcon = c => (WMO[c] ? WMO[c][1] : '');
const COMPASS = ['N','NO','O','SO','S','SW','W','NW'];
const compass = d => (d == null ? '' : COMPASS[Math.round(d / 45) % 8]);

/* ---------- Lawinen-Dienste ---------- */
const AVY_DANGER = { low:1, moderate:2, considerable:3, high:4, very_high:5 };
const AVY_LABEL = { 1:'Gering', 2:'Mäßig', 3:'Erheblich', 4:'Groß', 5:'Sehr groß' };
const dangerNum = v => {
  if (v == null) return null;
  if (typeof v === 'number') return v >= 1 && v <= 5 ? v : null;
  const s = String(v).toLowerCase().trim();
  if (AVY_DANGER[s]) return AVY_DANGER[s];
  const n = parseInt(s, 10);
  return n >= 1 && n <= 5 ? n : null;
};

/* ---------- Tile-Layer (verifiziert, ohne Key) ---------- */
const TILES = {
  topo: { name: 'Topo (OpenTopoMap)', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    opts: { maxZoom: 17, subdomains: 'abc', attribution: 'Karte: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende, SRTM | © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)' } },
  sat: { name: 'Satellit (Esri)', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    opts: { maxZoom: 19, attribution: 'Luftbild © <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics, GIS-Community' } },
  osm: { name: 'Standard (OSM)', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    opts: { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende' } },
  swisstopo: { name: 'swisstopo (Alpen/CH)', url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg',
    opts: { maxZoom: 18, maxNativeZoom: 17, attribution: '© <a href="https://www.swisstopo.admin.ch/">swisstopo</a>' },
    bounds: [[45.82, 5.96], [47.81, 10.49]] },
};

/* ============================================================
   IndexedDB
   ============================================================ */
const DB_NAME = 'gefahren-feldbuch';
const STORE = 'entries';
let _db = null;
function db() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const rq = indexedDB.open(DB_NAME, 1);
    rq.onupgradeneeded = () => {
      const d = rq.result;
      if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: 'id' });
    };
    rq.onsuccess = () => { _db = rq.result; resolve(_db); };
    rq.onerror = () => reject(rq.error);
  });
}
function tx(mode) { return db().then(d => d.transaction(STORE, mode).objectStore(STORE)); }
const idbReq = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
async function dbGetAll() { return idbReq((await tx('readonly')).getAll()); }
async function dbGet(id) { return idbReq((await tx('readonly')).get(id)); }
async function dbPut(e) { return idbReq((await tx('readwrite')).put(e)); }
async function dbDel(id) { return idbReq((await tx('readwrite')).delete(id)); }

/* ============================================================
   Helpers
   ============================================================ */
const $ = id => document.getElementById(id);
const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); }));
const nowISO = () => new Date().toISOString();
const fmtDateTime = iso => { const d = new Date(iso); return d.toLocaleString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }); };
const fmtTime = iso => new Date(iso).toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit' });
const num = (v, d = 1) => (v == null || v === '' || isNaN(v) ? null : (Math.round(v * 10**d) / 10**d));
function toast(msg, err) { const t = $('toast'); t.textContent = msg; t.className = 'toast show' + (err ? ' err' : ''); clearTimeout(toast._t); toast._t = setTimeout(() => t.className = 'toast', 2600); }
const isOnline = () => navigator.onLine;

/* ============================================================
   App-State
   ============================================================ */
let map, baseLayers = {}, layersControl, posMarker, gpsCircle, gpsDot;
let activeLayerKey = 'topo';
let watchId = null, locationManual = false;
let draft = null;          // aktueller Entwurf
let editingId = null;      // bei Bearbeitung gesetzt
let autoEdit = false;      // Auto-Felder im Bearbeiten-Modus?

function blankAuto() {
  return { lat:null, lon:null, accuracy:null, locSource:null, locTs:null,
    ele:null, eleStatus:'idle', temp:null, wind:null, gust:null, windDir:null, precip:null, cloud:null, wcode:null, wxStatus:'idle', wxTs:null,
    freezing:null, river:null, rivStatus:'idle', rivTs:null,
    avyLevel:null, avyRegion:null, avySrc:null, avyUrl:null, avyPrecise:false, avyStatus:'idle', avyLink:null };
}
function newDraft() {
  draft = { id: uuid(), createdAt: nowISO(), updatedAt: nowISO(), hazard: HAZARDS[0].id, region: 'Alpen',
    area:'', measures:{}, note:'', ampel:'', tags:[], photos:[], auto: blankAuto() };
  editingId = null; autoEdit = false;
}

/* ============================================================
   Karte
   ============================================================ */
function makeLayer(key) {
  const t = TILES[key];
  return L.tileLayer(t.url, Object.assign({ crossOrigin: true }, t.opts, t.bounds ? { bounds: L.latLngBounds(t.bounds) } : {}));
}
function initMap() {
  L.Icon.Default.imagePath = 'vendor/leaflet/images/';
  map = L.map('map', { zoomControl: true, attributionControl: true }).setView([46.8, 9.8], 7);
  baseLayers[TILES.topo.name] = makeLayer('topo').addTo(map);
  baseLayers[TILES.sat.name] = makeLayer('sat');
  baseLayers[TILES.osm.name] = makeLayer('osm');
  baseLayers[TILES.swisstopo.name] = makeLayer('swisstopo');
  layersControl = L.control.layers(baseLayers, null, { collapsed: true }).addTo(map);
  map.on('baselayerchange', e => {
    activeLayerKey = Object.keys(TILES).find(k => TILES[k].name === e.name) || 'topo';
  });
  map.on('click', e => setLocation(e.latlng.lat, e.latlng.lng, null, 'Karte', true));
  setTimeout(() => map.invalidateSize(), 200);
}
const tealIcon = L.divIcon({ className: '', iconSize: [30, 42], iconAnchor: [15, 40], popupAnchor: [0, -36],
  html: '<svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg"><path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.7 23.3 0 15 0z" fill="#006064"/><circle cx="15" cy="15" r="6.5" fill="#fff"/></svg>' });

function setLocation(lat, lon, accuracy, source, manual) {
  if (!draft) return;
  draft.auto.lat = lat; draft.auto.lon = lon;
  draft.auto.accuracy = accuracy != null ? accuracy : draft.auto.accuracy;
  draft.auto.locSource = source; draft.auto.locTs = nowISO();
  locationManual = !!manual;
  if (!posMarker) { posMarker = L.marker([lat, lon], { icon: tealIcon, draggable: true }).addTo(map);
    posMarker.on('dragend', ev => { const p = ev.target.getLatLng(); setLocation(p.lat, p.lng, null, 'Karte', true); });
  } else posMarker.setLatLng([lat, lon]);
  // Region grob aus Breitengrad vorschlagen (nur wenn unverändert)
  if (!draft._regionTouched) {
    draft.region = lat >= 60 ? 'Arktis' : (lat <= -60 ? 'Antarktis' : 'Alpen');
    if ($('region')) $('region').value = draft.region;
  }
  renderAuto();
  enrichDraft();
}
function startGps() {
  if (!navigator.geolocation) { toast('Keine Geolocation verfügbar', true); return; }
  toast('GPS …');
  navigator.geolocation.getCurrentPosition(onGps, onGpsErr, { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 });
  if (watchId == null) watchId = navigator.geolocation.watchPosition(onGpsWatch, () => {}, { enableHighAccuracy: true, maximumAge: 5000 });
}
function onGps(p) { drawGps(p); setLocation(p.coords.latitude, p.coords.longitude, p.coords.accuracy, 'GPS', false); map.setView([p.coords.latitude, p.coords.longitude], Math.max(map.getZoom(), 14)); }
function onGpsWatch(p) { drawGps(p); if (!locationManual) setLocation(p.coords.latitude, p.coords.longitude, p.coords.accuracy, 'GPS', false); }
function onGpsErr(e) { toast('GPS fehlgeschlagen: ' + e.message, true); }
function drawGps(p) {
  const ll = [p.coords.latitude, p.coords.longitude], acc = p.coords.accuracy || 0;
  if (!gpsCircle) { gpsCircle = L.circle(ll, { radius: acc, color: '#1565C0', fillColor: '#1E88E5', fillOpacity: .12, weight: 1 }).addTo(map);
    gpsDot = L.circleMarker(ll, { radius: 5, color: '#fff', weight: 2, fillColor: '#1565C0', fillOpacity: 1 }).addTo(map);
  } else { gpsCircle.setLatLng(ll).setRadius(acc); gpsDot.setLatLng(ll); }
}

/* ---------- Tile-Caching: aktuellen Ausschnitt offline sichern ---------- */
function lon2tile(lon, z) { return Math.floor((lon + 180) / 360 * 2**z); }
function lat2tile(lat, z) { const r = lat * Math.PI / 180; return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * 2**z); }
async function saveTiles() {
  const t = TILES[activeLayerKey]; const b = map.getBounds(); const z0 = map.getZoom();
  const maxZ = t.opts.maxNativeZoom || t.opts.maxZoom || 17;
  const zooms = [z0, z0 + 1, z0 + 2].filter(z => z <= maxZ && z >= 1);
  const subs = (t.opts.subdomains || 'a').split('');
  const urls = [];
  for (const z of zooms) {
    const x0 = lon2tile(b.getWest(), z), x1 = lon2tile(b.getEast(), z);
    const y0 = lat2tile(b.getNorth(), z), y1 = lat2tile(b.getSouth(), z);
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      let u = t.url.replace('{z}', z).replace('{x}', x).replace('{y}', y).replace('{s}', subs[(x + y) % subs.length]);
      urls.push(u);
    }
    if (urls.length > 600) break;
  }
  const capped = urls.slice(0, 600);
  toast(`Sichere ${capped.length} Kacheln …`);
  let ok = 0;
  for (let i = 0; i < capped.length; i += 8) {
    await Promise.all(capped.slice(i, i + 8).map(u => fetch(u).then(() => ok++).catch(() => {})));
  }
  toast(`${ok} Kacheln offline gesichert${urls.length > 600 ? ' (Ausschnitt gekürzt)' : ''}`);
}

/* ============================================================
   Auto-Erfassung (Online-Abrufe)
   ============================================================ */
async function fetchForecast(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation,cloud_cover,weather_code,freezing_level_height&timezone=auto`;
  const r = await fetch(url); if (!r.ok) throw new Error('Wetter ' + r.status);
  const j = await r.json(), c = j.current || {};
  return { ele: j.elevation, temp: c.temperature_2m, wind: c.wind_speed_10m, gust: c.wind_gusts_10m,
    windDir: c.wind_direction_10m, precip: c.precipitation, cloud: c.cloud_cover, wcode: c.weather_code,
    freezing: c.freezing_level_height, ts: c.time || nowISO() };
}
async function fetchRiver(lat, lon) {
  const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lon}&daily=river_discharge&timezone=auto`;
  const r = await fetch(url); if (!r.ok) throw new Error('Abfluss ' + r.status);
  const j = await r.json(), t = (j.daily && j.daily.time) || [], v = (j.daily && j.daily.river_discharge) || [];
  const today = new Date().toLocaleDateString('sv'); let i = t.indexOf(today); if (i < 0) i = 0;
  return { value: v[i] != null ? v[i] : null, ts: t[i] || today };
}

/* -- Lawinen: Dienst aus Position grob bestimmen -- */
const inBox = (lat, lon, s, w, n, e) => lat >= s && lat <= n && lon >= w && lon <= e;
function pickAvy(lat, lon) {
  if (inBox(lat, lon, 74, 10, 81, 35)) return { type:'nve', name:'NVE Varsom (Svalbard)', link:{ name:'Varsom Svalbard', url:'https://www.varsom.no/en/' } };
  if (inBox(lat, lon, 58, 4.5, 71.5, 31.5)) return { type:'nve', name:'NVE Varsom', link:{ name:'Varsom', url:'https://www.varsom.no/en/avalanches/avalanche-warnings/' } };
  if (inBox(lat, lon, 45.8, 5.9, 47.81, 10.5)) return { type:'slf', name:'SLF (CH)', link:{ name:'SLF / WhiteRisk', url:'https://whiterisk.ch/en/conditions' } };
  if (inBox(lat, lon, 45.7, 10.0, 47.7, 13.0)) return { type:'albina', name:'ALBINA (Euregio)', link:{ name:'avalanche.report', url:'https://avalanche.report/' } };
  if (inBox(lat, lon, 43.5, 5.0, 46.5, 7.7)) return { type:'static', region:'FR', name:'EAWS Frankreich', link:{ name:'avalanche.report', url:'https://avalanche.report/' } };
  if (inBox(lat, lon, 47.3, 10.0, 47.75, 13.5)) return { type:'static', region:'DE-BY', name:'EAWS Bayern', link:{ name:'lawinenwarndienst-bayern.de', url:'https://www.lawinenwarndienst-bayern.de/' } };
  if (inBox(lat, lon, 45.4, 13.4, 46.9, 16.6)) return { type:'static', region:'SI', name:'EAWS Slowenien', link:{ name:'avalanche.report', url:'https://avalanche.report/' } };
  if (inBox(lat, lon, 44.0, 6.6, 46.7, 14.0)) return { type:'static', region:'IT-25', name:'EAWS Italien (grob)', link:{ name:'avalanche.report', url:'https://avalanche.report/' } };
  if (inBox(lat, lon, -90, -180, -60, 180)) return { type:'none', name:'Antarktis – kein Lawinendienst', link:null };
  return { type:'none', name:'Kein Lawinendienst für diese Region', link:{ name:'avalanche.report (EAWS)', url:'https://avalanche.report/' } };
}
function caamlMax(json) {
  let max = 0, regions = [];
  for (const b of (json.bulletins || [])) {
    for (const d of (b.dangerRatings || [])) { const n = dangerNum(d.mainValue); if (n > max) max = n; }
    for (const r of (b.regions || [])) if (r.name) regions.push(r.name);
  }
  return max ? { level: max, region: regions.slice(0, 2).join(', ') || null, precise: false } : null;
}
function pointInRing(lat, lon, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function inGeom(lat, lon, g) {
  if (!g) return false;
  if (g.type === 'Polygon') return pointInRing(lat, lon, g.coordinates[0]);
  if (g.type === 'MultiPolygon') return g.coordinates.some(p => pointInRing(lat, lon, p[0]));
  return false;
}
function slfFromGeojson(geo, lat, lon) {
  for (const f of (geo.features || [])) {
    if (!inGeom(lat, lon, f.geometry)) continue;
    const p = f.properties || {};
    let raw = p.max_danger_rating ?? p.danger_rating ?? p.dangerRating ?? p.danger ?? p.mainValue ?? p.dangerLevel ??
      (p.dangerRatings && p.dangerRatings[0] && p.dangerRatings[0].mainValue);
    const lvl = dangerNum(raw);
    if (lvl) return { level: lvl, region: p.region_name || p.name || p.label || p.region || null, precise: true };
  }
  return null;
}
async function fetchAvalanche(lat, lon) {
  const svc = pickAvy(lat, lon);
  const out = { level:null, region:null, source:svc.name, url:null, precise:false, link:svc.link, na:false };
  if (svc.type === 'none') { out.na = true; return out; }
  try {
    if (svc.type === 'nve') {
      const d = new Date().toLocaleDateString('sv');
      const u = `https://api01.nve.no/hydrology/forecast/avalanche/v6.3.0/api/AvalancheWarningByCoordinates/Simple/${lat}/${lon}/2/${d}/${d}`;
      const r = await fetch(u); if (!r.ok) throw 0;
      const a = await r.json(); let mx = 0, reg = null;
      for (const x of (a || [])) { const n = parseInt(x.DangerLevel, 10); if (n > mx) { mx = n; reg = x.RegionName; } }
      out.url = u; if (mx >= 1) { out.level = mx; out.region = reg; out.precise = true; }
    } else if (svc.type === 'slf') {
      const u = 'https://aws.slf.ch/api/bulletin/caaml/de/geojson';
      const r = await fetch(u); if (r.ok) { const g = await r.json(); const hit = slfFromGeojson(g, lat, lon); if (hit) { Object.assign(out, hit, { url:u }); } }
      if (out.level == null) { const r2 = await fetch('https://aws.slf.ch/api/bulletin/caaml/de/json'); if (r2.ok) { const m = caamlMax(await r2.json()); if (m) Object.assign(out, m, { url:'https://aws.slf.ch/api/bulletin/caaml/de/json' }); } }
    } else if (svc.type === 'albina') {
      const u = 'https://api.avalanche.report/albina/api/bulletins/latest?lang=de';
      const r = await fetch(u); if (r.ok) { const j = await r.json(); const arr = j.bulletins ? j : { bulletins: (Array.isArray(j) ? j : []) }; const m = caamlMax(arr); if (m) Object.assign(out, m, { url:u }); }
    } else if (svc.type === 'static') {
      for (const off of [0, 1]) {
        const dt = new Date(Date.now() - off * 86400000).toLocaleDateString('sv');
        const u = `https://static.avalanche.report/eaws_bulletins/${dt}/${dt}-${svc.region}.json`;
        const r = await fetch(u); if (r.ok) { const m = caamlMax(await r.json()); if (m) { Object.assign(out, m, { url:u }); break; } }
      }
    }
  } catch (_) { /* fällt unten auf Fallback */ }
  return out;
}

/* -- Entwurf/Eintrag mit Online-Werten anreichern -- */
async function enrichObj(a, force) {
  if (a.lat == null || a.lon == null) return false;
  if (!isOnline()) {
    ['ele','wx','riv','avy'].forEach(k => { const key = k + 'Status'; if (a[key] !== 'manual' && a[key] !== 'live') a[key] = 'pending'; });
    return false;
  }
  let changed = false;
  // Wetter + Höhe + Nullgradgrenze
  if (force || (a.wxStatus !== 'manual' && a.eleStatus !== 'manual')) {
    try {
      const w = await fetchForecast(a.lat, a.lon);
      if (a.eleStatus !== 'manual') { a.ele = num(w.ele, 0); a.eleStatus = 'live'; }
      if (a.wxStatus !== 'manual') { a.temp = num(w.temp); a.wind = num(w.wind); a.gust = num(w.gust); a.windDir = w.windDir; a.precip = num(w.precip); a.cloud = num(w.cloud, 0); a.wcode = w.wcode; a.freezing = num(w.freezing, 0); a.wxStatus = 'live'; a.wxTs = w.ts; }
      changed = true;
    } catch (e) { if (a.wxStatus !== 'manual') a.wxStatus = 'failed'; if (a.eleStatus !== 'manual') a.eleStatus = 'failed'; }
  }
  // Abfluss (nur als 'live' werten, wenn wirklich ein Wert vorliegt)
  if (force || a.rivStatus !== 'manual') {
    try { const rv = await fetchRiver(a.lat, a.lon); if (rv.value != null) { a.river = num(rv.value, 1); a.rivStatus = 'live'; a.rivTs = rv.ts; } else a.rivStatus = 'failed'; changed = true; }
    catch (e) { if (a.rivStatus !== 'manual') a.rivStatus = 'failed'; }
  }
  // Lawine
  if (force || a.avyStatus !== 'manual') {
    try {
      const av = await fetchAvalanche(a.lat, a.lon);
      a.avySrc = av.source; a.avyUrl = av.url; a.avyPrecise = av.precise; a.avyLink = av.link;
      if (av.na) { a.avyStatus = 'na'; a.avyLevel = null; a.avyRegion = null; }
      else if (av.level != null) { a.avyLevel = av.level; a.avyRegion = av.region; a.avyStatus = 'live'; }
      else { a.avyStatus = 'failed'; } // Quelle erreichbar aber keine Stufe (Saison) → Fallback/Link
      changed = true;
    } catch (e) { if (a.avyStatus !== 'manual') a.avyStatus = 'failed'; }
  }
  return changed;
}
// Serialisiert: nie zwei Anreicherungen desselben Entwurfs gleichzeitig (verhindert Race)
let enriching = false, enrichQueued = false;
async function enrichDraft() {
  if (!draft) return;
  if (enriching) { enrichQueued = true; return; }
  enriching = true;
  try { await enrichObj(draft.auto, false); }
  finally { enriching = false; renderAuto(); if (enrichQueued) { enrichQueued = false; enrichDraft(); } }
}

/* ============================================================
   Auto-Panel UI
   ============================================================ */
function pill(status) {
  const map = { live:['live','live'], pending:['nachladen','pending'], failed:['nachladen','pending'], manual:['manuell','manual'], na:['—','manual'], idle:['–','manual'] };
  const [txt, cls] = map[status] || ['–','manual'];
  return `<span class="pill ${cls}">${txt}</span>`;
}
function setTile(id, stateId, valId, srcId, status, valHtml, src) {
  $(stateId).outerHTML = pill(status).replace('<span', `<span id="${stateId}"`);
  $(valId).innerHTML = valHtml; $(srcId).textContent = src || '';
  const tile = $(id); tile.classList.toggle('pending', status === 'pending' || status === 'failed');
}
function renderAuto() {
  if (!draft) return;
  const a = draft.auto;
  // Standort
  const loc = a.lat != null ? `${a.lat.toFixed(5)}, ${a.lon.toFixed(5)}` : '–';
  setTile('auto-loc','loc-state','loc-val','loc-src', a.lat != null ? 'live' : 'idle', loc,
    a.lat != null ? `${a.locSource || ''}${a.accuracy ? ' · ±' + Math.round(a.accuracy) + ' m' : ''} · ${a.locTs ? fmtTime(a.locTs) : ''}` : 'Karte tippen oder GPS');
  // Höhe
  setTile('auto-ele','ele-state','ele-val','ele-src', a.eleStatus, a.ele != null ? `${a.ele} <small>m</small>` : '–', a.eleStatus === 'live' ? 'Open-Meteo (DEM)' : (a.eleStatus === 'manual' ? 'manuell' : ''));
  // Wetter
  const wx = a.temp != null ? `${wmoIcon(a.wcode)} ${a.temp}<small>°C</small> · ${a.wind != null ? a.wind + '<small> km/h ' + compass(a.windDir) + '</small>' : ''}` : '–';
  const wx2 = a.temp != null ? `${wmoText(a.wcode)} · Böen ${a.gust ?? '–'} km/h · ${a.cloud ?? '–'} % · ${a.precip ?? 0} mm` : '';
  setTile('auto-wx','wx-state','wx-val','wx-src', a.wxStatus, wx, (a.wxStatus === 'live' ? 'Open-Meteo · ' : '') + wx2);
  // Nullgradgrenze
  setTile('auto-frz','frz-state','frz-val','frz-src', a.wxStatus, a.freezing != null ? `${a.freezing} <small>m</small>` : '–', a.wxStatus === 'live' ? 'Open-Meteo' : '');
  // Lawine
  let avHtml, avState;
  if ((a.avyStatus === 'live' || a.avyStatus === 'manual') && a.avyLevel) { avHtml = `${a.avyLevel} <small>· ${AVY_LABEL[a.avyLevel]}</small>`; avState = a.avyStatus; }
  else if (a.avyStatus === 'na') { avHtml = '<small>kein Dienst</small>'; avState = 'na'; }
  else if (a.lat == null) { avHtml = '–'; avState = 'idle'; }
  else if (!isOnline()) { avHtml = '<small>nachzuladen</small>'; avState = 'pending'; }
  else { avHtml = '<small>manuell wählen</small>'; avState = 'manual'; }
  let avSrc = avState === 'live' ? `${a.avySrc || ''}${a.avyRegion ? ' · ' + a.avyRegion : ''}${a.avyPrecise ? '' : ' · grob'}`
    : (avState === 'manual' && a.avyLevel ? 'manuell' : (a.avySrc || ''));
  setTile('auto-ava','ava-state','ava-val','ava-src', avState, avHtml, avSrc);
  if (a.avyLink && avState !== 'live' && avState !== 'idle')
    $('ava-src').innerHTML = `${a.avySrc ? escHtml(a.avySrc) + ' · ' : ''}<a href="${a.avyLink.url}" target="_blank" rel="noopener">Bulletin ↗</a>`;
  // Abfluss
  setTile('auto-riv','riv-state','riv-val','riv-src', a.rivStatus, a.river != null ? `${a.river} <small>m³/s</small>` : '–', a.rivStatus === 'live' ? 'Open-Meteo Flood (GloFAS)' : '');
  if (autoEdit) renderAutoEditor();
}

/* ---------- Auto-Werte manuell bearbeiten (alle editierbar) ---------- */
const EDIT_FIELDS = [
  { k:'lat', label:'Breite (°)', loc:true }, { k:'lon', label:'Länge (°)', loc:true },
  { k:'ele', label:'Höhe (m)', st:'eleStatus' }, { k:'temp', label:'Temperatur (°C)', st:'wxStatus' },
  { k:'wind', label:'Wind (km/h)', st:'wxStatus' }, { k:'gust', label:'Böen (km/h)', st:'wxStatus' },
  { k:'windDir', label:'Windrichtung (°)', st:'wxStatus' }, { k:'precip', label:'Niederschlag (mm)', st:'wxStatus' },
  { k:'cloud', label:'Bewölkung (%)', st:'wxStatus' }, { k:'freezing', label:'Nullgradgrenze (m)', st:'wxStatus' },
  { k:'river', label:'Abfluss (m³/s)', st:'rivStatus' },
];
function ensureMarker(lat, lon) {
  if (posMarker) { posMarker.setLatLng([lat, lon]); return; }
  posMarker = L.marker([lat, lon], { icon: tealIcon, draggable: true }).addTo(map);
  posMarker.on('dragend', e => { const p = e.target.getLatLng(); setLocation(p.lat, p.lng, null, 'Karte', true); });
}
function renderAutoEditor() {
  const box = $('autoEditor'); if (!box) return;
  const a = draft.auto;
  let html = EDIT_FIELDS.map(f => `<label><span>${f.label}</span><input type="number" inputmode="decimal" step="any" data-k="${f.k}" value="${a[f.k] != null ? a[f.k] : ''}"></label>`).join('');
  html += `<label><span>Lawinenstufe</span><select data-avy><option value="">– (keine)</option>${[1,2,3,4,5].map(n => `<option value="${n}"${a.avyLevel === n ? ' selected' : ''}>${n} – ${AVY_LABEL[n]}</option>`).join('')}</select></label>`;
  html += `<p class="note">Manuell geänderte Werte werden mit Quelle „manuell" gespeichert und beim Nachladen nicht überschrieben.</p>`;
  box.innerHTML = html;
  box.querySelectorAll('input[data-k]').forEach(inp => inp.onchange = () => {
    const f = EDIT_FIELDS.find(x => x.k === inp.dataset.k);
    a[f.k] = inp.value === '' ? null : parseFloat(inp.value);
    if (f.loc) { a.locSource = 'manuell'; a.locTs = nowISO(); locationManual = true; if (a.lat != null && a.lon != null) { ensureMarker(a.lat, a.lon); map.panTo([a.lat, a.lon]); } }
    else if (f.st) a[f.st] = 'manual';
    renderAuto();
  });
  box.querySelector('select[data-avy]').onchange = e => {
    const v = e.target.value;
    a.avyLevel = v ? parseInt(v, 10) : null;
    a.avyStatus = v ? 'manual' : (a.lat != null ? 'failed' : 'idle');
    a.avyRegion = v ? 'manuell' : a.avyRegion;
    renderAuto();
  };
}

/* ============================================================
   Formular: Maße, Gefahr, Region
   ============================================================ */
function fillSelects() {
  $('hazard').innerHTML = HAZARDS.map(h => `<option value="${h.id}">${h.icon}  ${h.name}</option>`).join('');
  $('region').innerHTML = REGIONS.map(r => `<option>${r}</option>`).join('');
  $('filterHazard').innerHTML = '<option value="">Alle Gefahren</option>' + HAZARDS.map(h => `<option value="${h.id}">${h.icon} ${h.name}</option>`).join('');
}
function renderMeasures() {
  const h = HZ[draft.hazard]; const box = $('measures');
  box.innerHTML = h.measures.map(m => {
    const def = M[m[0]]; const label = m[1] || def.label; const unit = m[2] || def.unit;
    const val = draft.measures[m[0]] != null ? draft.measures[m[0]] : '';
    const ph = def.text ? (m[2] || '') : '';
    const full = def.text ? ' full' : '';
    const input = def.text
      ? `<input type="text" id="m-${m[0]}" value="${escAttr(val)}" placeholder="${escAttr(ph)}">`
      : `<input type="number" inputmode="decimal" step="any" id="m-${m[0]}" value="${escAttr(val)}">`;
    return `<label class="field${full}" style="margin:0"><span class="lab">${label}${unit ? ' <span class="muted">(' + unit + ')</span>' : ''}</span>${input}</label>`;
  }).join('');
}
const escAttr = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const escHtml = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

/* ============================================================
   Fotos (Canvas-Resize ~1600 px)
   ============================================================ */
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const max = 1600; let { width: w, height: h } = img;
      if (w > max || h > max) { const s = max / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      cv.toBlob(b => b ? resolve({ id: uuid(), blob: b, w, h, type: 'image/jpeg' }) : reject(new Error('Canvas')), 'image/jpeg', 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Bild')); };
    img.src = url;
  });
}
async function addPhotos(files) {
  for (const f of files) { if (!f.type.startsWith('image/')) continue;
    try { draft.photos.push(await resizeImage(f)); } catch (e) { toast('Foto konnte nicht verarbeitet werden', true); } }
  renderPhotos();
}
let _photoUrls = [];
function renderPhotos() {
  _photoUrls.forEach(u => URL.revokeObjectURL(u)); _photoUrls = [];
  const row = $('photoRow');
  [...row.querySelectorAll('.thumb')].forEach(t => t.remove());
  draft.photos.forEach((p, i) => {
    const url = URL.createObjectURL(p.blob); _photoUrls.push(url);
    const d = document.createElement('div'); d.className = 'thumb';
    d.innerHTML = `<img src="${url}" alt="Foto ${i + 1}"><button type="button" class="rm" aria-label="Foto entfernen">×</button>`;
    d.querySelector('.rm').onclick = () => { draft.photos.splice(i, 1); renderPhotos(); };
    row.insertBefore(d, $('btnAddPhoto'));
  });
}

/* ============================================================
   Speichern / Formular ↔ Entwurf
   ============================================================ */
function gatherForm() {
  draft.hazard = $('hazard').value;
  draft.region = $('region').value;
  draft.area = $('area').value.trim();
  draft.note = $('note').value.trim();
  draft.tags = $('tags').value.split(',').map(s => s.trim()).filter(Boolean);
  const amp = document.querySelector('input[name="ampel"]:checked'); draft.ampel = amp ? amp.value : '';
  draft.measures = {};
  HZ[draft.hazard].measures.forEach(m => { const v = $('m-' + m[0]); if (v && v.value !== '') draft.measures[m[0]] = M[m[0]].text ? v.value.trim() : parseFloat(v.value); });
  draft.updatedAt = nowISO();
}
async function saveEntry(ev) {
  ev.preventDefault();
  gatherForm();
  if (!draft.auto.lat) { if (!confirm('Kein Standort gesetzt. Trotzdem speichern?')) return; }
  await dbPut(draft);
  toast(editingId ? 'Eintrag aktualisiert' : 'Eintrag gespeichert');
  newDraft(); loadFormFromDraft(); refreshList(); refreshStats();
  switchView('verlauf');
}
function loadFormFromDraft() {
  $('entryId').value = draft.id;
  $('nowTs').textContent = fmtDateTime(draft.createdAt);
  $('hazard').value = draft.hazard;
  $('region').value = draft.region;
  $('area').value = draft.area || '';
  $('note').value = draft.note || '';
  $('tags').value = (draft.tags || []).join(', ');
  document.querySelectorAll('input[name="ampel"]').forEach(r => r.checked = (r.value === draft.ampel));
  renderMeasures(); renderPhotos(); renderAuto();
  autoEdit = false; $('autoEditor').hidden = true; $('btnAutoEdit').textContent = '✎ Bearbeiten'; $('btnAutoEdit').setAttribute('aria-expanded', 'false');
  $('btnReset').hidden = !editingId;
  $('btnSave').textContent = editingId ? 'Änderungen speichern' : 'Eintrag speichern';
  if (posMarker) { map.removeLayer(posMarker); posMarker = null; }
  if (draft.auto.lat != null) { posMarker = L.marker([draft.auto.lat, draft.auto.lon], { icon: tealIcon, draggable: true }).addTo(map);
    posMarker.on('dragend', e => { const p = e.target.getLatLng(); setLocation(p.lat, p.lng, null, 'Karte', true); });
    map.setView([draft.auto.lat, draft.auto.lon], Math.max(map.getZoom(), 13)); }
}

/* ============================================================
   Verlauf / Liste / Detail
   ============================================================ */
let _entries = [];
async function refreshList() {
  _entries = (await dbGetAll()).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  renderList();
}
function renderList() {
  const q = ($('search').value || '').toLowerCase().trim();
  const fh = $('filterHazard').value;
  const list = _entries.filter(e => {
    if (fh && e.hazard !== fh) return false;
    if (!q) return true;
    const hay = [HZ[e.hazard] && HZ[e.hazard].name, e.area, e.region, e.note, (e.tags || []).join(' ')].join(' ').toLowerCase();
    return hay.includes(q);
  });
  const box = $('entryList');
  if (!list.length) { box.innerHTML = `<div class="empty-state"><div class="big">≣</div>${_entries.length ? 'Keine Treffer.' : 'Noch keine Einträge.<br>Erfasse deine erste Beobachtung.'}</div>`; return; }
  box.innerHTML = list.map(e => {
    const h = HZ[e.hazard] || { icon:'•', name:e.hazard };
    const loc = e.auto && e.auto.lat != null ? `${e.region} · ${e.area || e.auto.lat.toFixed(3) + ',' + e.auto.lon.toFixed(3)}` : (e.area || e.region || '');
    const ph = e.photos && e.photos[0];
    const thumb = ph ? `<img data-blob="${e.id}" alt="">` : h.icon;
    return `<button class="entry" data-id="${e.id}">
      <span class="ph" data-ph="${e.id}">${thumb}</span>
      <span class="body"><span class="top"><span class="hz">${escHtml(h.name)}</span>${e.ampel ? `<span class="chip ${e.ampel}">${AMPEL[e.ampel]}</span>` : ''}</span>
        <span class="meta">${escHtml(loc)}<span class="sep">·</span>${fmtDateTime(e.createdAt)}</span></span>
    </button>`;
  }).join('');
  box.querySelectorAll('.entry').forEach(b => b.onclick = () => openDetail(b.dataset.id));
  // Mini-Fotos laden
  list.forEach(e => { if (e.photos && e.photos[0]) { const img = box.querySelector(`img[data-blob="${e.id}"]`); if (img) { const u = URL.createObjectURL(e.photos[0].blob); img.src = u; img.onload = () => URL.revokeObjectURL(u); } } });
}
function detailRows(e) {
  const a = e.auto || {}; const rows = [];
  const add = (k, v) => { if (v != null && v !== '') rows.push([k, v]); };
  add('Region', e.region); add('Gebiet / Name', e.area);
  if (a.lat != null) add('Standort', `${a.lat.toFixed(5)}, ${a.lon.toFixed(5)}${a.accuracy ? ' (±' + Math.round(a.accuracy) + ' m)' : ''} · ${a.locSource || ''}`);
  add('Höhe', a.ele != null ? a.ele + ' m' + (a.eleStatus === 'manual' ? ' · manuell' : '') : null);
  if (a.temp != null) add('Wetter', `${wmoText(a.wcode)} · ${a.temp} °C · Wind ${a.wind ?? '–'} km/h ${compass(a.windDir)} (Böen ${a.gust ?? '–'}) · ${a.cloud ?? '–'} % · ${a.precip ?? 0} mm${a.wxStatus === 'manual' ? ' · manuell' : (a.wxTs ? ' · Open-Meteo ' + fmtTime(a.wxTs) : '')}`);
  add('Nullgradgrenze', a.freezing != null ? a.freezing + ' m' : null);
  add('Lawinenstufe', a.avyLevel ? `${a.avyLevel} – ${AVY_LABEL[a.avyLevel]}${a.avyRegion ? ' (' + a.avyRegion + ')' : ''}${a.avyPrecise ? '' : ' · grob'}${a.avySrc && a.avyStatus !== 'manual' ? ' · ' + a.avySrc : ''}` : (a.avyStatus === 'na' ? 'kein Dienst' + (a.avySrc ? ' (' + a.avySrc + ')' : '') : null));
  add('Abfluss-Proxy', a.river != null ? a.river + ' m³/s' + (a.rivStatus === 'manual' ? ' · manuell' : ' · GloFAS') : null);
  const h = HZ[e.hazard];
  if (h) h.measures.forEach(m => { if (e.measures && e.measures[m[0]] != null && e.measures[m[0]] !== '') { const def = M[m[0]]; add(m[1] || def.label, e.measures[m[0]] + (def.unit ? ' ' + (m[2] || def.unit) : '')); } });
  add('Tags', (e.tags || []).join(', '));
  return rows;
}
function openDetail(id) {
  const e = _entries.find(x => x.id === id); if (!e) return;
  const h = HZ[e.hazard] || { icon:'•', name:e.hazard };
  const sheet = $('detailSheet');
  const pending = e.auto && ['pending','failed'].includes([e.auto.wxStatus, e.auto.rivStatus, e.auto.avyStatus, e.auto.eleStatus].find(s => s === 'pending' || s === 'failed'));
  const linkHtml = (e.auto && e.auto.avyLink && (!e.auto.avyLevel)) ? `<p class="hint">Lawinenbulletin: <a href="${e.auto.avyLink.url}" target="_blank" rel="noopener">${escHtml(e.auto.avyLink.name)}</a></p>` : '';
  sheet.innerHTML = `<div class="grip"></div>
    <div class="detail-head"><span class="hz-ico">${h.icon}</span><div><h2>${escHtml(h.name)}</h2><div class="hint">${fmtDateTime(e.createdAt)}${e.ampel ? ' · ' : ''}${e.ampel ? `<span class="chip ${e.ampel}">${AMPEL[e.ampel]}</span>` : ''}</div></div></div>
    ${e.photos && e.photos.length ? `<div class="detail-photos" id="detailPhotos"></div>` : ''}
    ${e.note ? `<p style="white-space:pre-wrap;margin:.4em 0 .6em">${escHtml(e.note)}</p>` : ''}
    <dl class="kv">${detailRows(e).map(r => `<dt>${escHtml(r[0])}</dt><dd>${escHtml(r[1])}</dd>`).join('')}</dl>
    ${pending ? '<p class="hint">⏳ Einige Online-Werte sind als „nachzuladen" markiert – werden bei Verbindung ergänzt.</p>' : ''}
    ${linkHtml}
    <div class="btn-row" style="margin-top:14px">
      <button class="btn danger" id="btnDel">Löschen</button>
      <button class="btn secondary" id="btnEdit">Bearbeiten</button>
    </div>
    <button class="btn ghost" id="btnCloseDetail" style="margin-top:10px">Schließen</button>`;
  if (e.photos && e.photos.length) { const dp = sheet.querySelector('#detailPhotos'); e.photos.forEach(p => { const img = document.createElement('img'); const u = URL.createObjectURL(p.blob); img.src = u; img.onload = () => URL.revokeObjectURL(u); dp.appendChild(img); }); }
  sheet.querySelector('#btnDel').onclick = async () => { if (confirm('Diesen Eintrag löschen?')) { await dbDel(id); closeDetail(); refreshList(); refreshStats(); toast('Gelöscht'); } };
  sheet.querySelector('#btnEdit').onclick = () => { editEntry(e); closeDetail(); };
  sheet.querySelector('#btnCloseDetail').onclick = closeDetail;
  $('overlay').classList.add('open');
}
function closeDetail() { $('overlay').classList.remove('open'); }
function editEntry(e) {
  draft = JSON.parse(JSON.stringify({ ...e, photos: [] })); draft.photos = e.photos ? e.photos.map(p => ({ ...p })) : [];
  editingId = e.id; draft._regionTouched = true;
  loadFormFromDraft(); switchView('erfassen'); window.scrollTo(0, 0);
}

/* ============================================================
   Export / Import
   ============================================================ */
const CSV_COLS = ['id','createdAt','hazard','region','area','lat','lon','accuracy_m','elevation_m','temp_C','wind_kmh','gust_kmh','windDir_deg','precip_mm','cloud_pct','weather','freezing_m','avalanche_level','avalanche_region','river_m3s','volume_m3','distance_m','length_m','width_m','height_m','slope_deg','snowDepth_cm','free','ampel','tags','note','photos'];
function entryToRow(e) {
  const a = e.auto || {}, m = e.measures || {};
  return { id:e.id, createdAt:e.createdAt, hazard:(HZ[e.hazard] ? HZ[e.hazard].name : e.hazard), region:e.region, area:e.area,
    lat:a.lat, lon:a.lon, accuracy_m:a.accuracy, elevation_m:a.ele, temp_C:a.temp, wind_kmh:a.wind, gust_kmh:a.gust, windDir_deg:a.windDir,
    precip_mm:a.precip, cloud_pct:a.cloud, weather:wmoText(a.wcode), freezing_m:a.freezing, avalanche_level:a.avyLevel, avalanche_region:a.avyRegion, river_m3s:a.river,
    volume_m3:m.volume, distance_m:m.distance, length_m:m.length, width_m:m.width, height_m:m.height, slope_deg:m.slope, snowDepth_cm:m.snowDepth, free:m.free,
    ampel:(AMPEL[e.ampel] || ''), tags:(e.tags || []).join('|'), note:e.note, photos:(e.photos ? e.photos.length : 0) };
}
const csvCell = v => { if (v == null) return ''; const s = String(v); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
async function exportCsv() {
  const rows = _entries.map(entryToRow);
  const csv = '﻿' + CSV_COLS.join(';') + '\n' + rows.map(r => CSV_COLS.map(c => csvCell(r[c])).join(';')).join('\n');
  download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `feldbuch_${stamp()}.csv`);
  toast(`${rows.length} Einträge als CSV exportiert`);
}
function blobToDataURL(b) { return new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }); }
// Lokal dekodieren (kein fetch auf data:-URLs → funktioniert auch offline)
function dataURLToBlob(u) {
  const [head, data] = u.split(',');
  const mime = (head.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
  const bin = atob(data), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
async function exportJson() {
  const all = await dbGetAll();
  const out = { app: 'gefahren-feldbuch', version: 1, exportedAt: nowISO(), count: all.length, entries: [] };
  for (const e of all) { const c = { ...e, photos: [], auto: e.auto ? { ...e.auto, avyUrl: null } : e.auto }; for (const p of (e.photos || [])) c.photos.push({ id:p.id, w:p.w, h:p.h, type:p.type, dataUrl: await blobToDataURL(p.blob) }); out.entries.push(c); }
  download(new Blob([JSON.stringify(out)], { type: 'application/json' }), `feldbuch_backup_${stamp()}.json`);
  toast(`Backup mit ${all.length} Einträgen erstellt`);
}
async function importJson(file) {
  let data; try { data = JSON.parse(await file.text()); } catch (e) { toast('Ungültige JSON-Datei', true); return; }
  const arr = Array.isArray(data) ? data : data.entries; if (!Array.isArray(arr)) { toast('Keine Einträge gefunden', true); return; }
  const existing = new Set((await dbGetAll()).map(e => e.id));
  let added = 0, skipped = 0;
  for (const e of arr) {
    if (!e.id) e.id = uuid();
    if (existing.has(e.id)) { skipped++; continue; }
    const photos = []; for (const p of (e.photos || [])) { if (!p.dataUrl) continue; try { photos.push({ id:p.id || uuid(), w:p.w, h:p.h, type:p.type || 'image/jpeg', blob: dataURLToBlob(p.dataUrl) }); } catch (err) { console.warn('Foto-Import übersprungen', err); } }
    e.photos = photos; if (!e.auto) e.auto = blankAuto();
    await dbPut(e); existing.add(e.id); added++;
  }
  refreshList(); refreshStats();
  toast(`Import: ${added} neu, ${skipped} übersprungen (Duplikate)`);
}
const stamp = () => new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
function download(blob, name) { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); }

/* ============================================================
   Stats / Navigation / Netz
   ============================================================ */
async function refreshStats() {
  const all = await dbGetAll();
  $('statEntries').textContent = all.length;
  let photos = 0, bytes = 0;
  all.forEach(e => (e.photos || []).forEach(p => { photos++; bytes += (p.blob && p.blob.size) || 0; }));
  $('statPhotos').textContent = photos;
  $('statSize').textContent = bytes ? (bytes / 1048576).toFixed(1) + ' MB' : '–';
}
function switchView(v) {
  document.querySelectorAll('.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + v));
  document.querySelectorAll('.tabbar button').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  if (v === 'verlauf') refreshList();
  if (v === 'daten') refreshStats();
  if (v === 'erfassen') setTimeout(() => map && map.invalidateSize(), 120);
  window.scrollTo(0, 0);
}
function updateNet() {
  const b = $('netBadge');
  if (isOnline()) { b.textContent = '● Online'; b.className = 'net-badge online'; }
  else { b.textContent = '○ Offline'; b.className = 'net-badge offline'; }
}
let _syncing = false;
async function syncPending() {
  if (!isOnline() || _syncing) return;
  _syncing = true;
  try {
    const all = await dbGetAll(); let n = 0;
    const keys = ['wxStatus', 'rivStatus', 'avyStatus', 'eleStatus'];
    for (const e of all) {
      const a = e.auto; if (!a || a.lat == null) continue;
      const need = keys.filter(k => a[k] === 'pending' || a[k] === 'failed');
      if (!need.length) continue;
      await enrichObj(a, false);
      if (need.some(k => a[k] === 'live')) { e.updatedAt = nowISO(); await dbPut(e); n++; }
    }
    if (n) { refreshList(); toast(`${n} Eintrag(e) mit Online-Werten ergänzt`); }
  } finally { _syncing = false; }
}

/* ============================================================
   Init
   ============================================================ */
function bindUI() {
  document.querySelectorAll('.tabbar button').forEach(b => b.onclick = () => switchView(b.dataset.view));
  $('btnGps').onclick = startGps;
  $('btnLocate').onclick = startGps;
  $('btnSaveTiles').onclick = saveTiles;
  $('btnRefetch').onclick = async () => { if (!isOnline()) { toast('Offline – Werte werden später nachgeladen', true); return; } toast('Lade Online-Werte …'); await enrichObj(draft.auto, true); renderAuto(); toast('Online-Werte aktualisiert'); };
  $('btnAutoEdit').onclick = () => { autoEdit = !autoEdit; $('autoEditor').hidden = !autoEdit; $('btnAutoEdit').setAttribute('aria-expanded', String(autoEdit)); $('btnAutoEdit').textContent = autoEdit ? '▾ Schließen' : '✎ Bearbeiten'; if (autoEdit) renderAutoEditor(); };
  $('hazard').onchange = () => { draft.hazard = $('hazard').value; renderMeasures(); };
  $('region').onchange = () => { draft.region = $('region').value; draft._regionTouched = true; };
  $('btnAddPhoto').onclick = () => $('photoInput').click();
  $('photoInput').onchange = e => { addPhotos([...e.target.files]); e.target.value = ''; };
  $('entryForm').onsubmit = saveEntry;
  $('btnReset').onclick = () => { newDraft(); loadFormFromDraft(); toast('Verworfen'); };
  $('search').oninput = renderList;
  $('filterHazard').onchange = renderList;
  $('btnExportCsv').onclick = exportCsv;
  $('btnExportJson').onclick = exportJson;
  $('btnImport').onclick = () => $('importInput').click();
  $('importInput').onchange = e => { if (e.target.files[0]) importJson(e.target.files[0]); e.target.value = ''; };
  $('infoBtn').onclick = () => { $('privacy').hidden = !$('privacy').hidden; };
  $('privacyClose').onclick = () => { $('privacy').hidden = true; try { localStorage.setItem('gf-privacy-seen', '1'); } catch (e) {} };
  $('overlay').onclick = e => { if (e.target === $('overlay')) closeDetail(); };
  window.addEventListener('online', () => { updateNet(); enrichDraft(); syncPending(); });
  window.addEventListener('offline', updateNet);
}
async function init() {
  fillSelects();
  newDraft();
  initMap();
  bindUI();
  loadFormFromDraft();
  updateNet();
  try { if (!localStorage.getItem('gf-privacy-seen')) $('privacy').hidden = false; } catch (e) {}
  await refreshList(); await refreshStats();
  $('appMeta').textContent = `Gefahren-Feldbuch · ${HAZARDS.length} Gefahrentypen · lokal in IndexedDB · ${navigator.onLine ? 'online' : 'offline'}`;
  // Standort beim Start versuchen (nur wenn erlaubt)
  setTimeout(startGps, 600);
  syncPending();
  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('sw.js'); } catch (e) { console.warn('SW', e); }
  }
}
document.addEventListener('DOMContentLoaded', init);
