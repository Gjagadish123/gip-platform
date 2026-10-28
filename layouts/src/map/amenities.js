// Built features inside a layout, placed where its approved layout labels them (masterplan `features`): entrance
// arch, clubhouse with pool and parking, overhead tank, play area, courts, park gazebo. A feature the layout does not
// place is not drawn.

import * as THREE from 'three';

const FT = 3.28084;

/** shrinks the sign lettering until it fits the beam */
function fitText(ctx, text, x, y, maxW) {
  let px = 96;
  ctx.font = `700 ${px}px Archivo, Arial, sans-serif`;
  while (px > 40 && ctx.measureText(text).width > maxW) ctx.font = `700 ${(px -= 6)}px Archivo, Arial, sans-serif`;
  ctx.fillText(text, x, y);
}

export function makeAmenities(data, { lambert, liftLambert, track, uniforms, patchLift, shadows, brand = {} }) {
  const group = new THREE.Group();
  group.name = 'amenities';
  const f = data.features || {};
  const signText = (brand.name || '').toUpperCase();

  const solids = []; // remembered so their shadows can be projected once every parent group is in place
  const solid = (w, d, h, mat, x = 0, y = 0, z = 0, parent = group, cast = true) => {
    const g = track(new THREE.BoxGeometry(w, d, h));
    g.translate(x, y, z + h / 2);
    const m = new THREE.Mesh(g, mat);
    parent.add(m);
    if (cast && h > 0.6) solids.push({ m, w, d, x, y, top: z + h });
    return m;
  };
  const flat = (w, d, color, x, y, z, parent = group, rot = 0) => {
    const m = new THREE.Mesh(track(new THREE.PlaneGeometry(w, d)), lambert(color));
    m.position.set(x, y, z);
    m.rotation.z = rot;
    parent.add(m);
    return m;
  };

  const white = liftLambert('#f6f3ec');
  const warm = liftLambert('#ece5d8');
  const band = liftLambert('#2b3038');
  const glass = liftLambert('#2a3a4a');
  const glassLight = liftLambert('#86b6d4');
  const timber = liftLambert('#8a5b3a');
  const navy = liftLambert('#033967');
  const steel = liftLambert('#cfd6de');

  // ------------------------------------------------------------ entrance arch
  if (f.gate?.at) {
    const along = new THREE.Vector2(...(f.gate.along || [1, 0])).normalize();
    const gate = new THREE.Group();
    const half = (f.gate.width || 40) / FT / 2 + 1.5;
    [-1, 1].forEach((s) => {
      solid(1.7, 1.9, 8.6, white, 0, s * half, 0, gate);
      solid(2.1, 2.3, 0.45, navy, 0, s * half, 8.6, gate);
      solid(1.74, 1.94, 1.1, liftLambert('#7b7f86'), 0, s * half, 0, gate); // stone plinth
    });
    solid(1.5, half * 2 + 1.9, 2.1, navy, 0, 0, 6.3, gate);
    solid(1.7, half * 2 + 2.3, 0.22, white, 0, 0, 8.4, gate);
    // security cabin and boom barrier on the entry side
    solid(2.6, 2.6, 2.7, warm, 3.2, -(half + 2.6), 0, gate);
    solid(3.1, 3.1, 0.18, band, 3.2, -(half + 2.6), 2.7, gate);
    solid(1.0, 0.08, 1.1, glass, 3.2, -(half + 1.28), 1.1, gate, false);
    solid(0.12, half * 0.95, 0.12, liftLambert('#d8443c'), 1.6, -half * 0.5, 1.05, gate, false);

    // project logo on both faces of the beam (async image; a text sign shows until it arrives)
    const signW = half * 2 - 1.2;
    const mkSign = (side) => {
      const c = document.createElement('canvas');
      c.width = 1024;
      c.height = 192;
      const ctx = c.getContext('2d');
      const draw = (img) => {
        ctx.fillStyle = '#033967';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 96px Archivo, Arial, sans-serif';
        ctx.textBaseline = 'middle';
        if (img) {
          const h = 168;
          const w = (img.width / img.height) * h;
          ctx.drawImage(img, 40, 12, w, h);
          ctx.textAlign = 'left';
          fitText(ctx, signText, 40 + w + 36, 100, c.width - (40 + w + 36) - 30);
        } else {
          ctx.textAlign = 'center';
          fitText(ctx, signText, c.width / 2, 100, c.width - 60);
        }
      };
      draw(null);
      const tex = track(new THREE.CanvasTexture(c));
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      const mat = track(new THREE.MeshBasicMaterial({ map: tex }));
      patchLift(mat, uniforms);
      const m = new THREE.Mesh(track(new THREE.PlaneGeometry(signW, signW * (192 / 1024))), mat);
      m.rotation.set(Math.PI / 2, (side * Math.PI) / 2, 0);
      m.position.set(side * 0.76, 0, 7.35);
      gate.add(m);
      if (brand.logo) {
        const img = new Image();
        img.onload = () => {
          draw(img);
          tex.needsUpdate = true;
        };
        img.src = brand.logo;
      }
    };
    mkSign(-1);
    mkSign(1);
    gate.rotation.z = Math.atan2(along.y, along.x);
    gate.position.set(f.gate.at[0], f.gate.at[1], 0.08);
    group.add(gate);
  }

  // ------------------------------------------------------------ clubhouse strip: clubhouse, pool, parking
  const axis = new THREE.Vector2(...(f.clubhouse?.axis || [0, -1])).normalize(); // along the strip
  const yaw = Math.atan2(axis.y, axis.x);
  if (f.clubhouse?.at) {
    const club = new THREE.Group();
    // local +x runs south along the strip, local +y points east toward the plots
    solid(20, 8.4, 4.2, white, 0, 0, 0, club);
    solid(20.8, 9.4, 0.28, band, 0, 0, 4.2, club);
    solid(12, 7.2, 3.4, warm, -3, 0.2, 4.48, club);
    solid(12.8, 8.2, 0.26, band, -3, 0.2, 7.88, club);
    solid(12.2, 7.4, 0.5, white, -3, 0.2, 8.14, club);
    solid(1.4, 8.6, 8.4, timber, 7.2, 0, 0, club); // feature fin
    // glazed east front, facing the plots, with a canopy over the entrance
    solid(13, 0.1, 2.9, glass, -1.5, 4.24, 0.5, club, false);
    solid(9, 0.1, 2.3, glass, -3, 3.84, 5.1, club, false);
    for (let i = -3; i <= 3; i++) solid(0.12, 0.16, 2.9, steel, -1.5 + i * 2.1, 4.3, 0.5, club, false);
    solid(6, 2.6, 0.18, band, 3.5, 5.5, 3.0, club);
    solid(0.18, 0.18, 3.0, steel, 1.0, 6.6, 0, club);
    solid(0.18, 0.18, 3.0, steel, 6.0, 6.6, 0, club);
    solid(7.5, 0.06, 1.0, glassLight, -3, 4.0, 4.5, club, false); // terrace balustrade
    club.rotation.z = yaw;
    club.position.set(f.clubhouse.at[0], f.clubhouse.at[1], 0.1);
    group.add(club);
  }
  if (f.pool?.at) {
    const pool = new THREE.Group();
    flat(22, 7.4, '#d8c9a8', 0, 0, 0.13, pool); // deck
    flat(16.4, 4.6, '#eef6fa', 0, 0, 0.15, pool); // coping
    const water = new THREE.Mesh(track(new THREE.PlaneGeometry(15.6, 3.8)), track(new THREE.MeshBasicMaterial({ color: '#2fb3e6' })));
    water.position.z = 0.17;
    water.name = 'water';
    pool.add(water);
    flat(15.6, 0.9, '#7fd6f5', 0, 1.2, 0.18, pool); // shallow end shimmer band
    for (let i = 0; i < 5; i++) {
      solid(1.9, 0.62, 0.32, white, -7 + i * 3.4, -2.95, 0.13, pool, false);
      if (i % 2 === 0) {
        const pole = track(new THREE.CylinderGeometry(0.05, 0.05, 2.3, 6));
        pole.rotateX(Math.PI / 2);
        pole.translate(-5.4 + i * 3.4, -2.95, 1.3);
        pool.add(new THREE.Mesh(pole, steel));
        const shade = track(new THREE.ConeGeometry(1.35, 0.55, 8));
        shade.rotateX(Math.PI / 2);
        shade.translate(-5.4 + i * 3.4, -2.95, 2.6);
        const sm = new THREE.Mesh(shade, liftLambert(i % 4 === 0 ? '#f2c14e' : '#f6f3ec'));
        pool.add(sm);
      }
    }
    pool.rotation.z = yaw;
    pool.position.set(f.pool.at[0], f.pool.at[1], 0.0);
    group.add(pool);
  }
  if (f.parking?.at) {
    const park = new THREE.Group();
    flat(16, 9, '#454b55', 0, 0, 0.12, park);
    for (let i = 0; i <= 5; i++) flat(0.12, 4.6, '#e9edf2', -7 + i * 2.8, 2.0, 0.135, park);
    park.rotation.z = yaw;
    park.position.set(f.parking.at[0], f.parking.at[1], 0);
    group.add(park);
    group.userData.parking = { at: f.parking.at, yaw, bays: [-5.6, -2.8, 2.8] };
  }

  // ------------------------------------------------------------ overhead tank ("OHT")
  if (f.tank?.at) {
    const tank = new THREE.Group();
    [[-2.3, -2.3], [2.3, -2.3], [-2.3, 2.3], [2.3, 2.3]].forEach(([x, y]) => solid(0.55, 0.55, 12.5, steel, x, y, 0, tank));
    [4, 8].forEach((z) => {
      solid(5.2, 0.3, 0.3, steel, 0, -2.3, z, tank);
      solid(5.2, 0.3, 0.3, steel, 0, 2.3, z, tank);
      solid(0.3, 5.2, 0.3, steel, -2.3, 0, z, tank);
      solid(0.3, 5.2, 0.3, steel, 2.3, 0, z, tank);
    });
    const drum = track(new THREE.CylinderGeometry(3.9, 3.4, 4.6, 22));
    drum.rotateX(Math.PI / 2);
    drum.translate(0, 0, 14.8);
    const dm = new THREE.Mesh(drum, liftLambert('#f4f6f8'));
    tank.add(dm);
    const ring = track(new THREE.CylinderGeometry(3.95, 3.8, 1.0, 22));
    ring.rotateX(Math.PI / 2);
    ring.translate(0, 0, 15.0);
    tank.add(new THREE.Mesh(ring, liftLambert('#0f7ed9')));
    const cap = track(new THREE.ConeGeometry(4.0, 1.1, 22));
    cap.rotateX(Math.PI / 2);
    cap.translate(0, 0, 17.65);
    tank.add(new THREE.Mesh(cap, liftLambert('#dfe5ea')));
    tank.position.set(f.tank.at[0], f.tank.at[1], 0.1);
    group.add(tank);
  }

  // ------------------------------------------------------------ children's play area
  if (f.play?.at) {
    const play = new THREE.Group();
    const padM = new THREE.Mesh(track(new THREE.CircleGeometry(5.2, 28)), lambert('#d9b777'));
    padM.position.z = 0.13;
    play.add(padM);
    // slide, swing frame, climbing dome
    solid(0.5, 3.6, 0.12, liftLambert('#f0a020'), -1.6, 0.6, 1.25, play).rotation.x = 0.0;
    solid(1.3, 1.3, 1.9, liftLambert('#d8443c'), -1.6, -1.6, 0, play);
    [-1, 1].forEach((s) => solid(0.14, 0.14, 2.5, liftLambert('#0f7ed9'), 2.2, s * 1.5, 0, play));
    solid(0.14, 3.2, 0.14, liftLambert('#0f7ed9'), 2.2, 0, 2.5, play);
    const dome = track(new THREE.SphereGeometry(1.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2));
    dome.rotateX(Math.PI / 2);
    dome.translate(0.2, 2.6, 0.13);
    play.add(new THREE.Mesh(dome, liftLambert('#1e9e5a', { wireframe: true })));
    play.position.set(f.play.at[0], f.play.at[1], 0);
    group.add(play);
  }

  // ------------------------------------------------------------ courts on the social-infrastructure parcel
  (f.courts?.at ? [-1, 1] : []).forEach((s, i) => {
    const cx = f.courts.at[0] + s * 8.5;
    const cy = f.courts.at[1] - 6;
    flat(12.4, 25.4, '#2d5f3f', cx, cy, 0.125);
    flat(11, 23.8, i ? '#2f6fb0' : '#3f8f5a', cx, cy, 0.135);
    const lines = new THREE.LineSegments(track(new THREE.EdgesGeometry(new THREE.PlaneGeometry(9.2, 22))), track(new THREE.LineBasicMaterial({ color: '#ffffff' })));
    lines.position.set(cx, cy, 0.15);
    group.add(lines);
    const mid = new THREE.LineSegments(track(new THREE.EdgesGeometry(new THREE.PlaneGeometry(9.2, 0.02))), lines.material);
    mid.position.set(cx, cy, 0.15);
    group.add(mid);
    solid(10.2, 0.06, 1.0, liftLambert('#e8ecf0', { transparent: true, opacity: 0.75 }), cx, cy, 0.13, group, false);
  });

  // ------------------------------------------------------------ landscaped park: jogging loop + gazebo
  if (f.park?.at) {
    const at = f.park.at;
    const track1 = new THREE.Mesh(track(new THREE.RingGeometry(7.2, 8.6, 40)), lambert('#cdb892'));
    track1.scale.set(0.62, 2.4, 1);
    track1.position.set(at[0], at[1], 0.13);
    group.add(track1);
    const gz = new THREE.Group();
    for (let k = 0; k < 6; k++) solid(0.2, 0.2, 2.7, white, Math.cos((k * Math.PI) / 3) * 2.4, Math.sin((k * Math.PI) / 3) * 2.4, 0, gz);
    const roof = track(new THREE.ConeGeometry(3.4, 1.6, 6));
    roof.rotateX(Math.PI / 2);
    roof.translate(0, 0, 3.5);
    const rm = new THREE.Mesh(roof, liftLambert('#8a5b3a'));
    gz.add(rm);
    const floor = new THREE.Mesh(track(new THREE.CircleGeometry(3.0, 6)), lambert('#d9cdb4'));
    floor.position.z = 0.14;
    gz.add(floor);
    gz.position.set(at[0], at[1], 0.0);
    group.add(gz);
  }

  // project a shadow for every registered box, in site coordinates
  group.updateMatrixWorld(true);
  const v = new THREE.Vector3();
  for (const s of solids) {
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => {
      v.set(s.x + (i * s.w) / 2, s.y + (j * s.d) / 2, s.top).applyMatrix4(s.m.matrixWorld);
      return [v.x, v.y, v.z];
    });
    shadows.addSolid(corners, false);
  }
  if (f.tank?.at) shadows.addTree({ x: f.tank.at[0], y: f.tank.at[1], r: 3.9, h: 15, onPlot: false }); // tank drum
  if (f.park?.at) shadows.addTree({ x: f.park.at[0], y: f.park.at[1], r: 3.4, h: 3.4, onPlot: false }); // gazebo roof

  return group;
}
