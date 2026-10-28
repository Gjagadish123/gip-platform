// Fallback renderer: the same site scene on its own canvas with orbit controls.
// Used when Google Maps is unavailable (no key / blocked / offline) and for the 3D view
// on devices where Google only serves a raster map.

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildSite } from './siteScene.js';
import { tourStops } from './tour.js';
import { easeInOutCubic, lerp } from '../lib/geo.js';

const TOUR_CAM = { close: { dist: 120, polar: 68, dur: 3.0 }, road: { dist: 190, polar: 64, dur: 3.2 }, zone: { dist: 150, polar: 62, dur: 3.2 } };

export class StandaloneRenderer {
  constructor({ container, project, onPick, onHover, onReady, onCamera, startMode = '2d' }) {
    Object.assign(this, { container, onPick, onHover, onReady, onCamera });
    this.supports3D = true;
    this.mode = startMode;
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.clock = new THREE.Clock();
    this.orbit = false;
    this.tourId = 0;
    this.project = null;
    this._init();
    this.setProject(project);
  }

  get data() {
    return this.project?.data;
  }

  _init() {
    const el = this.container;
    const renderer = (this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor('#d7e6ef');
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;touch-action:none';

    const scene = (this.scene = new THREE.Scene());
    scene.fog = new THREE.Fog('#d7e6ef', 1100, 3200);
    const camera = (this.camera = new THREE.PerspectiveCamera(38, 1, 2, 6000));
    camera.up.set(0, 0, 1);

    // stylised surroundings: a calm field with a faint survey grid
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshLambertMaterial({ color: '#e4ebdc' }));
    ground.position.z = -0.05;
    scene.add(ground);
    const grid = new THREE.GridHelper(3000, 150, '#b9c8b4', '#cbd8c4');
    grid.rotation.x = Math.PI / 2;
    grid.material.transparent = true;
    grid.material.opacity = 0.55;
    scene.add(grid);
    this._extras = [ground, grid];
    this._fill = new THREE.HemisphereLight('#ffffff', '#8a9a7a', 1.0); // the site brings its own lights; this one stands in without a site
    scene.add(this._fill);

    const controls = (this.controls = new OrbitControls(camera, renderer.domElement));
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = THREE.MathUtils.degToRad(80);
    controls.minDistance = 60;
    controls.maxDistance = 1800;
    controls.screenSpacePanning = false;
    controls.zoomToCursor = true;
    // the user's gesture wins over any flight, tour or orbit (lift and reveal are eased in the scene, so nothing is stranded)
    controls.addEventListener('start', () => {
      this.stopOrbit();
      this.anim = null;
      this._endTour();
    });

    this.centre = new THREE.Vector3();
    this.span = 500;

    this._ray = new THREE.Raycaster();
    this._plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    this._down = null;
    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', (e) => (this._down = [e.clientX, e.clientY]));
    dom.addEventListener('pointerup', (e) => {
      if (this._down && Math.hypot(e.clientX - this._down[0], e.clientY - this._down[1]) < 6) this._pick(e, true);
      this._down = null;
    });
    dom.addEventListener('pointermove', (e) => e.pointerType === 'mouse' && this._pick(e, false));
    dom.addEventListener('pointerleave', () => this.onHover(null));

    // The container may still be hidden (zero size) when we are constructed: frame the site on the first real size.
    this._framed = false;
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(el);
    this._resize();

    this._raf = requestAnimationFrame(this._loop);
    this.onReady?.({ engine: 'standalone', supports3D: true });
  }

  /** swap the site; the new layout drops in from above while its plots unfurl */
  setProject(project) {
    if (project === this.project) return;
    this.cancelTour();
    this.anim = null;
    if (this.site) {
      this.scene.remove(this.site.group);
      this.site.dispose();
      this.site = null;
    }
    this.project = project;
    this._fill.visible = !project;
    if (!project) return;
    const ext = this.data.extent;
    this.centre = new THREE.Vector3((ext.minX + ext.maxX) / 2, (ext.minY + ext.maxY) / 2, 0);
    this.span = Math.max(ext.maxX - ext.minX, ext.maxY - ext.minY);
    this.site = buildSite(this.data, { brand: project.brand });
    this.site.setPad(true);
    this.site.setLift(this.mode === '3d' ? 1 : 0, true);
    this.site.setVillas(this.villasOn ?? true);
    if (this.statusByPlot) this.site.paint(this.statusByPlot, this._isActive, 0.97, 0.4);
    this.site.reveal(this.reduced);
    this.scene.add(this.site.group);
    if (this._framed) {
      const v = this._viewFor(this.mode);
      this._setView({ ...v, dist: v.dist * (this.reduced ? 1 : 1.8) });
      if (!this.reduced) this.flyTo(v, { dur: 2.4 });
    }
  }

  _viewFor(mode) {
    // distance that fits the site's longer side in the vertical field of view, with room for the chrome
    const narrow = (this.container.clientWidth || 1000) < 700;
    const fit = (this.span / 2 / Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))) * (narrow ? 1.9 : 1.22);
    return mode === '3d' ? { target: this.centre.clone(), dist: fit * 0.78, polar: 58, azimuth: -28 } : { target: this.centre.clone(), dist: fit, polar: 0.6, azimuth: 0 };
  }

  _setView(v) {
    const polar = THREE.MathUtils.degToRad(v.polar);
    const az = THREE.MathUtils.degToRad(v.azimuth);
    // azimuth 0 looks north with the camera south of the target
    const off = new THREE.Vector3(Math.sin(az) * Math.sin(polar), -Math.cos(az) * Math.sin(polar), Math.cos(polar)).multiplyScalar(v.dist);
    this.camera.position.copy(v.target).add(off);
    this.controls.target.copy(v.target);
    this.camera.lookAt(v.target);
    this.controls.update();
  }

  _currentView() {
    const t = this.controls.target.clone();
    const off = this.camera.position.clone().sub(t);
    const dist = off.length();
    const polar = THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(off.z / dist, -1, 1)));
    const azimuth = THREE.MathUtils.radToDeg(Math.atan2(off.x, -off.y));
    return { target: t, dist, polar, azimuth };
  }

  flyTo(to, { dur = 1.5, done, tour = false } = {}) {
    if (!tour) this._endTour();
    this.stopOrbit();
    const from = this._currentView();
    const target = { target: to.target || from.target, dist: to.dist ?? from.dist, polar: to.polar ?? from.polar, azimuth: to.azimuth ?? from.azimuth };
    if (this.reduced) {
      this._setView(target);
      done?.();
      return;
    }
    const dAz = ((((target.azimuth - from.azimuth) % 360) + 540) % 360) - 180;
    this.anim = { from, to: target, dAz, t: 0, dur, done };
  }

  _loop = () => {
    this._raf = requestAnimationFrame(this._loop);
    if (!this._framed) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (this.anim) {
      const a = this.anim;
      a.t = Math.min(1, a.t + dt / a.dur);
      const k = easeInOutCubic(a.t);
      this._setView({
        target: a.from.target.clone().lerp(a.to.target, k),
        dist: lerp(a.from.dist, a.to.dist, k),
        polar: lerp(a.from.polar, a.to.polar, k),
        azimuth: a.from.azimuth + a.dAz * k,
      });
      if (a.t >= 1) {
        this.anim = null;
        a.done?.();
      }
    } else if (this.orbit) {
      const v = this._currentView();
      v.azimuth += dt * 4.2;
      this._setView(v);
    } else this.controls.update();

    if (this.site) {
      const u = this.site.uniforms;
      const dist = this.camera.position.distanceTo(this.controls.target);
      u.uLabelFade.value = 1 - THREE.MathUtils.smoothstep(dist, 620, 980);
      u.uAreaFade.value = 1 - THREE.MathUtils.smoothstep(dist, 260, 420);
      this.site.update(dt, this.clock.elapsedTime);
    }
    this.renderer.render(this.scene, this.camera);

    // A compass heading is the direction the camera LOOKS, clockwise from north: the negative of our orbit azimuth.
    const heading = -this._currentView().azimuth;
    if (this._lastHeading == null || Math.abs(this._lastHeading - heading) > 0.5) {
      this._lastHeading = heading;
      this.onCamera?.({ heading });
    }
  };

  _resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (!this._framed) {
      this._framed = true;
      this._setView(this._viewFor(this.mode));
      this.clock.getDelta();
    }
  }

  _pick(e, isClick) {
    if (!this.project) return;
    const r = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this._ray.setFromCamera(ndc, this.camera);
    const pt = new THREE.Vector3();
    const ok = this._ray.ray.intersectPlane(this._plane, pt);
    const p = ok ? this.project.hit([pt.x, pt.y]) : null;
    if (isClick) this.onPick(p ? p.n : null);
    else this.onHover(p ? p.n : null);
    this.renderer.domElement.style.cursor = p ? 'pointer' : 'grab';
  }

  setMode(mode) {
    this.mode = mode;
    this.site?.setLift(mode === '3d' ? 1 : 0, this.reduced);
    this.flyTo(this._viewFor(mode), { dur: 1.6 });
  }

  tour(onStep) {
    if (!this.site) return;
    const V = (xy, k, heading) => ({ target: new THREE.Vector3(xy[0], xy[1], 0), dist: TOUR_CAM[k].dist, polar: TOUR_CAM[k].polar, azimuth: -heading });
    const stops = tourStops(this.data).map((s) => (s.kind === 'aerial' ? { label: s.label, cam: null, dur: 3.0 } : { label: s.label, cam: V(s.xy, s.kind, s.heading), dur: TOUR_CAM[s.kind].dur }));
    this._endTour();
    const id = ++this.tourId;
    this._tourStep = onStep;
    this.touring = true;
    this.mode = '3d';
    this.site.setLift(1, this.reduced);
    let i = 0;
    const next = () => {
      if (id !== this.tourId || !this.touring) return;
      if (i >= stops.length) {
        this._endTour();
        this.startOrbit();
        return;
      }
      const s = stops[i++];
      onStep?.(s.label);
      // the closing overview is framed when it is needed, so it uses the container's real size
      this.flyTo(s.cam || this._viewFor('3d'), { dur: s.dur, tour: true, done: () => (this._tourTimer = setTimeout(next, 900)) });
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

  focusPlot(n, offset = { x: 0, y: 0 }) {
    const p = this.data?.plots.find((x) => x.n === n);
    if (!p) return;
    const v = this._currentView();
    const dist = Math.min(v.dist, 190);
    const wpp = (2 * dist * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))) / (this.container.clientHeight || 1);
    const az = THREE.MathUtils.degToRad(v.azimuth);
    // screen-right and screen-up on the ground for a camera sitting at this azimuth
    const right = [Math.cos(az), Math.sin(az)];
    const up = [-Math.sin(az), Math.cos(az)];
    const gx = offset.x * wpp;
    const gy = (-offset.y * wpp) / Math.max(Math.cos(THREE.MathUtils.degToRad(v.polar)), 0.35);
    this.flyTo({ target: new THREE.Vector3(p.c[0] - (right[0] * gx + up[0] * gy), p.c[1] - (right[1] * gx + up[1] * gy), 0), dist }, { dur: 1.0 });
  }
  focusXY(xy) {
    this.flyTo({ target: new THREE.Vector3(xy[0], xy[1], 0), dist: 170 }, { dur: 1.3 });
  }
  showPlace() {}
  clearPlace() {}
  home() {
    this.flyTo(this._viewFor(this.mode), { dur: 1.3 });
  }
  zoomBy(d) {
    const v = this._currentView();
    this.flyTo({ dist: THREE.MathUtils.clamp(v.dist * (d > 0 ? 0.7 : 1.4), 60, 1800) }, { dur: 0.35 });
  }
  resetNorth() {
    this.flyTo({ azimuth: 0 }, { dur: 0.7 });
  }
  setBasemap() {}

  paint(statusByPlot, isActive) {
    this.statusByPlot = statusByPlot;
    this._isActive = isActive;
    this.site?.paint(statusByPlot, isActive, 0.97, 0.4);
  }
  pulse(numbers) {
    this.site?.pulse(numbers);
  }
  setSelected(n) {
    this.site?.setSelected(n);
  }
  setHover(n) {
    this.site?.setHover(n);
  }
  setVillas(on) {
    this.villasOn = on;
    this.site?.setVillas(on);
  }

  dispose() {
    cancelAnimationFrame(this._raf);
    this.touring = false;
    clearTimeout(this._tourTimer);
    this._ro?.disconnect();
    this.controls?.dispose();
    this.site?.dispose();
    this._extras?.forEach((m) => {
      m.geometry.dispose();
      m.material.dispose();
    });
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
  }
}
