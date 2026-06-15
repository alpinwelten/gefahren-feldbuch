# Gefahren-Feldbuch

Digitales Feldbuch (PWA) zur Felderfassung **objektiver Gebirgs- und Polargefahren** –
für IFMGA-Bergführer im Gelände, **online und offline**. Smartphone-first, auch am Desktop nutzbar.
Statische App, kein Backend. **Alle Daten bleiben lokal auf dem Gerät** (IndexedDB) – nichts wird hochgeladen.

Companion zum Report *„Objektive Gefahren im Hochgebirge und in den Polarregionen"* –
übernimmt dessen 12 Gefahrentypen, drei Regionen (Alpen/Arktis/Antarktis) und das „Klar"-Layout (Teal `#006064`).

## Funktionen

- **Karte** (Leaflet, lokal eingebunden) mit umschaltbaren Ebenen: OpenTopoMap (Topo), Esri (Satellit),
  OpenStreetMap (Standard) und **swisstopo** für die Alpen – alles **ohne API-Key**.
  GPS-Marker mit Genauigkeitskreis, Tippen setzt/korrigiert den Ort, Knopf „**Ausschnitt offline sichern**".
- **Automatisch erfasst** (auto-gefüllt, editierbar, mit Quelle + Zeitstempel):
  - Standort + Höhe (GPS + Open-Meteo-DEM), Datum/Zeit
  - Wetter + Nullgradgrenze (Open-Meteo: Temperatur, Wind/Böen, Niederschlag, Bewölkung, `freezing_level_height`)
  - Lawinengefahrenstufe der Region (SLF / avalanche.report / NVE Varsom – Region grob aus Position;
    bei fehlender Quelle/Saison/Antarktis sauberer Fallback auf manuelle Eingabe + Bulletin-Link)
  - Flussabfluss-Proxy (Open-Meteo Flood / GloFAS) als Zusatzkontext für Muren/GLOF
  - **Offline** werden Standort + manuelle Felder erfasst; Online-Werte werden als „nachzuladen"
    markiert und automatisch ergänzt, sobald wieder Verbindung besteht.
- **Pro Eintrag**: Gefahrentyp (12), Region, Gebiet; gefahren­abhängige Maße (Volumen, Auslauf,
  L×B×H, Neigung, Schneehöhe, freies Maß); ein/mehrere **Fotos** (Kamera oder Galerie,
  auf max. 1600 px verkleinert); Freitext-Erkenntnis; eigene **Ampel** (grün/gelb/rot); Tags.
- **Ansichten**: Erfassen · Verlauf (Liste → Detail bearbeiten/löschen) · Daten.
- **Export/Import**: CSV (Excel, ohne Fotos), JSON-Backup (vollständig inkl. Fotos),
  JSON-Import führt Einträge **anhand ihrer ID ohne Duplikate** zusammen.
- **PWA**: installierbar (Add to Home Screen), Service-Worker cached App-Shell + Leaflet + zuletzt genutzte Kacheln.

## Datenschutz

- Alle Einträge und Fotos liegen **ausschließlich lokal** im Browser (IndexedDB). Es wird nichts an einen Server gesendet.
- Bei jedem Online-Abruf wird die **Position** an Karten- (OSM/OpenTopoMap/Esri/swisstopo),
  Wetter- (Open-Meteo) und Lawinendienste (SLF/avalanche.report/NVE) übermittelt.
- Sparsam mit personenbezogenen Daten umgehen (erkennbare Personen auf Fotos, Namen).
- Keine Tracker, keine Pflicht-API-Keys, keine kostenpflichtigen Dienste.

## Lokal testen

Service-Worker, Module und `fetch` brauchen http(s) – **nicht** über `file://` öffnen:

```bash
cd gefahren-feldbuch
python3 -m http.server 8000
# dann http://localhost:8000/ im Browser öffnen (localhost gilt als sicherer Kontext → GPS/Kamera/SW funktionieren)
```

## Auf GitHub Pages veröffentlichen

### A) Automatisiert mit der GitHub-CLI (`gh`)

```bash
cd gefahren-feldbuch
git init && git add -A && git commit -m "Gefahren-Feldbuch PWA"
gh repo create <REPO-NAME> --public --source=. --remote=origin --push
gh api -X POST repos/<USER>/<REPO-NAME>/pages -f build_type=legacy \
  -f 'source[branch]=main' -f 'source[path]=/'
```

Die Seite ist nach ein paar Minuten erreichbar unter:
`https://<USER>.github.io/<REPO-NAME>/`

### B) Manuell über die Weboberfläche

1. Neues **öffentliches** Repository anlegen, den Inhalt dieses Ordners hochladen (committen/pushen).
2. **Settings → Pages** → *Build and deployment* → Source **Deploy from a branch** → Branch `main`, Ordner `/ (root)` → **Save**.
3. Nach kurzer Wartezeit erscheint die URL `https://<USER>.github.io/<REPO-NAME>/`.

> GitHub Pages liefert über **HTTPS** aus – damit funktionieren Geolocation, Kamera und Installation.
> Alle Pfade in der App sind **relativ**, die App läuft daher auch unter dem Pages-Unterpfad `…/<REPO-NAME>/`.

## Dateien

```
index.html              App-Shell
styles.css              Klar-Layout
app.js                  Logik (Karte, Auto-Erfassung, IndexedDB, Export/Import)
sw.js                   Service-Worker (Offline-Cache)
manifest.webmanifest    PWA-Manifest
icons/                  App-Icons (SVG + PNG, inkl. maskable)
vendor/leaflet/         Leaflet 1.9.4 (lokal eingebunden, kein CDN)
```

Es werden **keine Beobachtungsdaten** im Repo gespeichert – das Repo enthält nur den App-Code.

## Quellen / Lizenz

Karten: © OpenStreetMap-Mitwirkende, © OpenTopoMap (CC-BY-SA), © Esri (World Imagery), © swisstopo.
Daten: Open-Meteo (CC BY 4.0), SLF/WhiteRisk, avalanche.report (EAWS/ALBINA), NVE Varsom. Leaflet (BSD-2).
App-Code: zur freien Nutzung durch den Autor.
