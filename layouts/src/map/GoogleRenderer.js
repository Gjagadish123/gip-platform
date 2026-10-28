// Primary renderer: a Google vector map (real satellite ground, tilt + heading) with the
// three.js site mounted through WebGLOverlayView. If Google grants only a raster map
// (software GPU, old device) the same class degrades to flat google.maps.Polygon overlays
// and reports `supports3D = false` so the caller can hand 3D to the standalone renderer.
//
// One map lives for the whole visit. setProject() swaps the site: the old one is disposed, the new one is built,
// the camera flies out and into the new layout while its plots unfurl.
//
// Camera flights only move the camera. Plot reveal and the 2D/3D lift are eased inside the
// site scene, so interrupting a flight (drag, search, Escape) can never leave them half-done.

import * as THREE from 'three';
import { buildSite, STATUS_COLOR } from './siteScene.js';
import { tourStops } from './tour.js';
import { MAP_ID } from '../lib/googleMaps.js';
import { easeInOutCubic, haversineKm, lerp, lerpAngle } from '../lib/geo.js';

const VIEWS = {
  plan: { tilt: 0, heading: 0, zoom: 17.35 },
  aerial: { tilt: 60, heading: -28, zoom: 17.9 },
  far: { tilt: 0, heading: 0, zoom: 12.4 },
};
const TOUR_CAM = { close: { zoom: 19.4, tilt: 68, dur: 3.2 }, road: { zoom: 18.9, tilt: 64, dur: 3.4 }, zone: { zoom: 19.2, tilt: 62, dur: 3.4 } };
const HYDERABAD_WEST = { lat: 17.5, lng: 78.2 };

const signedArea = (ring) => ring.reduce((t, v, i) => t + v[0] * ring[(i + 1) % ring.length][1] - ring[(i + 1) % ring.length][0] * v[1], 0) / 2;

export class GoogleRenderer {
  constructor({ container, gm, center, onPick, onHover, onReady, onCamera }) {
    Object.assign(this, { container, gm, onPick, onHover, onReady, onCamera });
    this.supports3D = null; // unknown until Google tells us which map it granted
    this.mode = '2d';
    this.anim = null;
    this.orbit = false;
    this.tourId = 0;
    this.project = null;
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.clock = new THREE.Clock();
    this.listeners = [];
    this._init(center || HYDERABAD_WEST);
  }

  _init(center) {
    const { gm } = this;
    const { Map, RenderingType } = gm;
    this.map = new Map(this.container, {
      center,
      zoom: VIEWS.far.zoom,
      tilt: 0,
      heading: 0,
      mapId: MAP_ID,
      mapTypeId: 'satellite',
      renderingType: RenderingType ? RenderingType.VECTOR : undefined,
      tiltInteractionEnabled: true,
      headingInteractionEnabled: true,
      disableDefaultUI: true,
      clickableIcons: false,
      gestureHandling: 'greedy',
      keyboardShortcuts: true,
      backgroundColor: '#0b2239',
      minZoom: 9,
      maxZoom: 21,
    });

    const google = gm.google;
    const on = (ev, fn) => this.listeners.push(this.map.addListener(ev, fn));
    this.listeners.push(
      google.maps.event.addListenerOnce(this.map, 'tilesloaded', () => {
        if (this.disposed) return;
        const vector = this.map.getRenderingType && this.map.getRenderingType() === 'VECTOR';
        if (vector && google.maps.WebGLOverlayView) this._mountOverlay();
        else this._mountPolygons();
      })
    );
    on('click', (e) => this._pick(e.latLng, true));
    on('mousemove', (e) => this._pick(e.latLng, false));
    on('mouseout', () => this.onHover(null));
    on('dragstart', () => this._userMoved());
    on('idle', () => this._emitCamera());
    on('heading_changed', () => this._emitCamera());
    on('zoom_changed', () => this._emitCamera());
  }

  get data() {
    return this.project?.data;
  }

  /** plan and aerial views sized to the container, so the whole layout fits on a phone as well as on a desktop */
  _view(name) {
    const v = VIEWS[name];
    if (name === 'far' || !this.data) return v;
    const ext = this.data.extent;
    const w = Math.max(this.container.clientWidth - 40, 200);
    const h = Math.max(this.container.clientHeight - 260, 240);
    const mpp = Math.max((ext.maxX - ext.minX) / w, (ext.maxY - ext.minY) / h);
    const fit = Math.log2((156543.03392 * Math.cos((this.data.origin.lat * Math.PI) / 180)) / mpp);
    const plan = Math.min(VIEWS.plan.zoom, fit);
    if (name === 'plan') return { ...v, zoom: plan };
    // A tall layout on a portrait screen keeps north up so it still fits; elsewhere turn it for a three-quarter look.
    const portrait = this.container.clientWidth / this.container.clientHeight < 0.8;
    return portrait ? { tilt: 58, heading: -8, zoom: plan + 0.12 } : { ...v, zoom: v.zoom - (VIEWS.plan.zoom - plan) };
  }
  _home() {
    return { center: this.data.origin, ...this._view(this.mode === '3d' ? 'aerial' : 'plan') };
  }

  /** the user grabbed the map: their gesture wins over any flight, tour or orbit */
  _userMoved() {
    this.stopOrbit();
    if (this.anim) this.anim = null;
    this._endTour();
  }

  _emitCamera() {
    this.onCamera?.({ heading: this.map.getHeading() || 0, tilt: this.map.getTilt() || 0, zoom: this.map.getZoom() });
  }

  _pick(latLng, isClick) {
    if (!latLng || !this.project) return;
    const p = this.project.hit(this.project.projector.toXY({ lat: latLng.lat(), lng: latLng.lng() }));
    if (isClick) this.onPick(p ? p.n : null);
    else this.onHover(p ? p.n : null);
    this.container.style.cursor = p ? 'pointer' : '';
  }

  // ------------------------------------------------------------ project
  /** project: {data, projector, hit, brand} or null (no layout to show). */
  setProject(project) {
    if (project === this.project) return;
    this.cancelTour();
    this.anim = null;
    this.clearPlace();
    this.selected = null;
    this.project = project;
    if (this.supports3D === null) return; // not mounted yet: the mount builds it
    this._buildSite();
    if (project) this._travel();
  }

  _buildSite() {
    if (this.overlay) {
      if (this.site) {
        this.scene.remove(this.site.group);
        this.site.dispose();
        this.site = null;
      }
      if (this.data) {
        this.site = buildSite(this.data, { brand: this.project.brand });
        this.site.setPad(false);
        this.site.setLift(this.mode === '3d' ? 1 : 0, true);
        this.site.setVillas(this.villasOn ?? true);
        this.scene.add(this.site.group);
        if (this.statusByPlot) this.site.paint(this.statusByPlot, this._isActive, this.mode === '3d' ? 0.95 : 0.82);
      }
      this.overlay.requestRedraw();
    }
    if (this.supports3D === false) {
      this.overlays?.forEach((o) => o.setMap(null));
      this.overlays = [];
      this.polys = null;
      if (this.data) this._addPolygons();
    }
  }

  /** Into the new layout: straight down on first load, out and back in when coming from another project. */
  _travel() {
    const to = this._home();
    const reveal = () => this.site?.reveal(this.reduced);
    const from = this._camNow();
    const km = haversineKm(from.center, to.center);
    if (this.reduced || !this.supports3D || km < 1.5 || from.zoom <= 13.5) {
      reveal();
      this.flyTo(to, { dur: from.zoom <= 13.5 ? 3.4 : 2 });
      return;
    }
    // high enough that both sites fit on screen, then down while the plots unfurl
    const mid = { lat: (from.center.lat + to.center.lat) / 2, lng: (from.center.lng + to.center.lng) / 2 };
    const mpp = (km * 1000 * 1.6) / Math.max(this.container.clientWidth, 320);
    const zoom = Math.min(13.5, Math.max(9.5, Math.log2((156543.03392 * Math.cos((mid.lat * Math.PI) / 180)) / mpp)));
    this.flyTo({ center: mid, zoom, tilt: 0, heading: 0 }, { dur: 1.4, done: () => {
      reveal();
      this.flyTo(to, { dur: 2.8 });
    } });
  }

  // ------------------------------------------------------------ vector path
  _mountOverlay() {
    const google = this.gm.google;
    this.supports3D = true;
    const overlay = (this.overlay = new google.maps.WebGLOverlayView());
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();

    // Google calls these without checking they exist ("a.onAdd is not a function" otherwise)
    overlay.onAdd = () => {};
    overlay.onRemove = () => {};
    overlay.onContextRestored = ({ gl }) => {
      this.renderer = new THREE.WebGLRenderer({ canvas: gl.canvas, context: gl, ...gl.getContextAttributes() });
      this.renderer.autoClear = false;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    };
    overlay.onContextLost = () => {
      this.renderer?.dispose();
      this.renderer = null;
    };
    overlay.onDraw = ({ transformer }) => {
      if (!this.renderer || this.disposed) return;
      const dt = Math.min(this.clock.getDelta(), 0.05);
      this._tick(dt);
      if (this.site) {
        const m = transformer.fromLatLngAltitude({ lat: this.data.origin.lat, lng: this.data.origin.lng, altitude: 0 });
        this.camera.projectionMatrix.fromArray(m);
        this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
        this.renderer.render(this.scene, this.camera);
        this.renderer.resetState();
      }
      overlay.requestRedraw();
    };
    overlay.setMap(this.map);
    this._buildSite();
    if (this.project) this._travel();
    this.onReady?.({ engine: 'google-vector', supports3D: true });
  }

  _tick(dt) {
    if (this.site) {
      const u = this.site.uniforms;
      const zoom = this.map.getZoom() || 17;
      u.uLabelFade.value = THREE.MathUtils.smoothstep(zoom, 17.1, 17.9);
      u.uAreaFade.value = THREE.MathUtils.smoothstep(zoom, 18.4, 19.1);
      this.site.update(dt, this.clock.elapsedTime);
    }

    if (this.anim) {
      const a = this.anim;
      a.t = Math.min(1, a.t + dt / a.dur);
      const k = easeInOutCubic(a.t);
      this.map.moveCamera({
        center: { lat: lerp(a.from.center.lat, a.to.center.lat, k), lng: lerp(a.from.center.lng, a.to.center.lng, k) },
        zoom: lerp(a.from.zoom, a.to.zoom, k),
        tilt: lerp(a.from.tilt, a.to.tilt, k),
        heading: lerpAngle(a.from.heading, a.to.heading, k),
      });
      if (a.t >= 1) {
        this.anim = null;
        a.done?.();
      }
    } else if (this.orbit) {
      this.map.moveCamera({ heading: (this.map.getHeading() || 0) + dt * 4.2 });
    }
  }

  _camNow() {
    const c = this.map.getCenter();
    return { center: { lat: c.lat(), lng: c.lng() }, zoom: this.map.getZoom(), tilt: this.map.getTilt() || 0, heading: this.map.getHeading() || 0 };
  }

  /** `tour` marks flights issued by the tour itself; any other flight ends a running tour cleanly. */
  flyTo(to, { dur = 1.6, done, tour = false } = {}) {
    if (!tour) this._endTour();
    this.stopOrbit();
    const from = this._camNow();
    const target = { center: to.center || from.center, zoom: to.zoom ?? from.zoom, tilt: to.tilt ?? from.tilt, heading: to.heading ?? from.heading };
    if (this.reduced || !this.supports3D) {
      this.map.moveCamera(this.supports3D ? target : { center: target.center, zoom: Math.round(target.zoom) });
      done?.();
      return;
    }
    this.anim = { from, to: target, t: 0, dur, done };
  }

  setMode(mode) {
    this.mode = mode;
    if (!this.supports3D) {
      this.map.moveCamera({ tilt: 0, heading: 0 });
      return;
    }
    if (!this.site) return;
    this.site.setLift(mode === '3d' ? 1 : 0, this.reduced);
    this.site.reveal(this.reduced);
    this.flyTo(this._home(), { dur: mode === '3d' ? 1.8 : 1.5 });
  }

  /** A short guided flight over the stops the layout itself offers, then a slow orbit. */
  tour(onStep) {
    if (!this.supports3D || !this.site) return;
    const P = (xy) => this.project.projector.toLatLng(xy);
    const stops = tourStops(this.data).map((s) =>
      s.kind === 'aerial'
        ? { label: s.label, cam: { center: this.data.origin, ...this._view('aerial') }, dur: 3.2 }
        : { label: s.label, cam: { center: P(s.xy), zoom: TOUR_CAM[s.kind].zoom, tilt: TOUR_CAM[s.kind].tilt, heading: s.heading }, dur: TOUR_CAM[s.kind].dur }
    );
    this._endTour();
    const id = ++this.tourId;
    this._tourStep = onStep;
    this.touring = true;
    this.mode = '3d';
    this.site.setLift(1, this.reduced);
    this.site.reveal(this.reduced);
    let i = 0;
    const next = () => {
      if (id !== this.tourId || !this.touring) return; // a newer tour or a cancel superseded this chain
      if (i >= stops.length) {
        this._endTour();
        this.startOrbit();
        return;
      }
      const s = stops[i++];
      onStep?.(s.label);
      this.flyTo(s.cam, { dur: s.dur, tour: true, done: () => (this._tourTimer = setTimeout(next, 900)) });
    };
    next();
  }
  _endTour() {
    if (!this.touring) return;
    this.touring = false;
    this.tourId++;
    clearTimeout(this._tourTimer);
    const cb = this._tourStep;
    this._tourStep = null;
    cb?.(null);
  }
  cancelTour() {
    if (this.touring) this.anim = null;
    this._endTour();
    this.stopOrbit();
  }
  startOrbit() {
    this.orbit = !this.reduced;
  }
  stopOrbit() {
    this.orbit = false;
  }

  /**
   * offset = where the target should land on screen relative to the viewport centre (px, +x right, +y down),
   * so it is not hidden behind the detail panel (desktop) or the bottom sheet (phones).
   */
  _offsetCentre(xy, zoom, offset) {
    const mpp = (156543.03392 * Math.cos((this.data.origin.lat * Math.PI) / 180)) / 2 ** zoom;
    const h = ((this.map.getHeading() || 0) * Math.PI) / 180;
    const tilt = ((this.map.getTilt() || 0) * Math.PI) / 180;
    const right = [Math.cos(h), -Math.sin(h)];
    const up = [Math.sin(h), Math.cos(h)];
    const gx = offset.x * mpp;
    const gy = (-offset.y * mpp) / Math.max(Math.cos(tilt), 0.35);
    return this.project.projector.toLatLng([xy[0] - (right[0] * gx + up[0] * gy), xy[1] - (right[1] * gx + up[1] * gy)]);
  }

  focusPlot(n, offset = { x: 0, y: 0 }) {
    const p = this.data?.plots.find((x) => x.n === n);
    if (!p) return;
    const zoom = Math.max(this.map.getZoom() || 0, this.supports3D ? 19.2 : 19);
    this.flyTo({ center: this._offsetCentre(p.c, zoom, offset), zoom }, { dur: 1.1 });
  }

  focusXY(xy, zoom = 19.3) {
    if (this.data) this.flyTo({ center: this.project.projector.toLatLng(xy), zoom }, { dur: 1.4 });
  }

  showPlace(place) {
    // fit the site and the landmark in one flat, north-up view with place names on, and draw a guide line
    if (!this.data) return;
    const google = this.gm.google;
    this.cancelTour();
    this.anim = null;
    this.clearPlace();
    this.mode = '2d';
    this.site?.setLift(0);
    const b = new google.maps.LatLngBounds();
    b.extend(this.data.origin);
    b.extend(place.location);
    this.map.setMapTypeId('hybrid');
    this.map.moveCamera({ tilt: 0, heading: 0 });
    this.map.fitBounds(b, { top: 150, bottom: 140, left: 240, right: 100 });
    this.placeLine = new google.maps.Polyline({
      map: this.map,
      path: [this.data.origin, place.location],
      geodesic: true,
      strokeColor: '#f2c14e',
      strokeOpacity: 0,
      icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 }, offset: '0', repeat: '14px' }],
    });
    const el = document.createElement('div');
    el.className = 'gc-place-pin';
    el.textContent = place.name;
    if (this.gm.AdvancedMarkerElement) this.placeMarker = new this.gm.AdvancedMarkerElement({ map: this.map, position: place.location, content: el, title: place.name });
    else this.placeMarker = new google.maps.Marker({ map: this.map, position: place.location, title: place.name });
  }
  clearPlace() {
    this.placeLine?.setMap(null);
    if (this.placeMarker) {
      if (typeof this.placeMarker.setMap === 'function') this.placeMarker.setMap(null);
      else this.placeMarker.map = null;
    }
    this.placeLine = this.placeMarker = null;
  }
  /** back from a landmark view to the whole layout */
  home() {
    this.clearPlace();
    if (this.data) this.flyTo(this._home(), { dur: 1.4 });
  }

  zoomBy(d) {
    this._endTour();
    this.stopOrbit();
    this.anim = null;
    this.map.setZoom((this.map.getZoom() || 17) + d);
  }
  resetNorth() {
    if (this.supports3D) this.flyTo({ heading: 0 }, { dur: 0.7 });
  }
  setBasemap(id) {
    if (this.map.getMapTypeId() !== id) this.map.setMapTypeId(id);
  }

  // ------------------------------------------------------------ shared state setters
  paint(statusByPlot, isActive) {
    this.statusByPlot = statusByPlot;
    this._isActive = isActive;
    if (this.site) this.site.paint(statusByPlot, isActive, this.mode === '3d' ? 0.95 : 0.82);
    if (this.polys) this._paintPolygons();
  }
  pulse(numbers) {
    this.site?.pulse(numbers);
  }
  setSelected(n) {
    this.selected = n;
    this.site?.setSelected(n);
    if (this.polys) this._paintPolygons();
  }
  setHover(n) {
    this.site?.setHover(n);
  }
  setVillas(on) {
    this.villasOn = on;
    this.site?.setVillas(on);
  }

  // ------------------------------------------------------------ raster fallback
  _mountPolygons() {
    this.supports3D = false;
    this.overlays = [];
    if (this.data) {
      this._addPolygons();
      this.map.moveCamera({ center: this.data.origin, zoom: Math.floor(this._view('plan').zoom) });
    }
    this.onReady?.({ engine: 'google-raster', supports3D: false });
  }
  _addPolygons() {
    const google = this.gm.google;
    const P = (xy) => this.project.projector.toLatLng(xy);
    (this.data.roads || []).concat(this.data.road100 || []).forEach((r) => {
      // Google cuts a hole only when it winds the other way round from the outer ring
      const outerSign = Math.sign(signedArea(r.outer));
      const holes = (r.holes || []).map((h) => (Math.sign(signedArea(h)) === outerSign ? [...h].reverse() : h));
      this.overlays.push(new google.maps.Polygon({ map: this.map, paths: [r.outer.map(P), ...holes.map((h) => h.map(P))], clickable: false, strokeWeight: 0, fillColor: '#2f353e', fillOpacity: 0.55, zIndex: 0 }));
    });
    this.polys = this.data.plots.map((p) => {
      const poly = new google.maps.Polygon({ map: this.map, paths: p.xy.map(P), clickable: false, strokeColor: '#ffffff', strokeWeight: 1, strokeOpacity: 0.9, fillOpacity: 0.78 });
      this.overlays.push(poly);
      return { p, poly };
    });
    this._paintPolygons();
    if (this.overlays.length && this.project) this.map.moveCamera({ center: this.data.origin, zoom: Math.floor(this._view('plan').zoom) });
  }
  _paintPolygons() {
    this.polys.forEach(({ p, poly }) => {
      const st = this.statusByPlot?.[p.n];
      const on = this._isActive ? this._isActive(p, st) : true;
      const sel = this.selected === p.n;
      poly.setOptions({
        fillColor: sel ? '#f2c14e' : on ? STATUS_COLOR[st] || STATUS_COLOR.unknown : '#b9c3d1',
        fillOpacity: on ? (st ? 0.8 : 0.5) : 0.3,
        strokeColor: sel ? '#f2c14e' : '#ffffff',
        strokeWeight: sel ? 3 : 1,
        zIndex: sel ? 5 : 1,
      });
    });
  }

  dispose() {
    this.disposed = true;
    this.touring = false;
    clearTimeout(this._tourTimer);
    this.anim = null;
    this.clearPlace();
    this.listeners.forEach((l) => l.remove());
    this.overlays?.forEach((o) => o.setMap(null));
    this.overlay?.setMap(null);
    this.site?.dispose();
    this.renderer?.dispose();
    // StrictMode and hot reload remount into the same element: leave it empty for the next map
    this.container.replaceChildren();
  }
}
