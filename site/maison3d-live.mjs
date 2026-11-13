// The house live: the real cameras of the home, set on the 3D house.
// Loaded only with ?live (local preview), it talks to Bonaparks Vision running on the home computer
// (default http://127.0.0.1:8790, or ?live=<address>). Nothing is sent anywhere else.
//  - Calibrate: 4 marks on the live video, then the same 4 marks on the floor of the 3D house.
//  - Live: each camera picture is laid on the floor where it looks; adults, children and animals stand where
//    they are seen, and the logbook remembers who is still in a room when no camera sees them (asleep in bed).
//  - No text over the house: who is where, the logbook and the notices sit in a bar at the bottom and at the top.

import {avatars} from './maison3d-avatars.mjs';

export function start(h) {
  const {T, house, camera, canvas, X, Z, figure, dogFigure, tag, say, car, setGate, rooms, beds = []} = h;
  const q = new URLSearchParams(location.search).get('live');
  // Only a bridge on this computer or the home network: a link to bonaparks.com/?live=<anything else> is ignored.
  const local = u => { try { const h = new URL(u).hostname; return /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|[a-z0-9-]+\.local)$/i.test(h); } catch { return false; } };
  const base = (q && /^https?:\/\//.test(q) && local(q) ? q : 'http://127.0.0.1:8790').replace(/\/$/, '');
  const U = x => x / 0.03396 + 470, V = z => z / 0.021227 + 470;      // metres back to plan units
  const UP = 2.75, live = h.live, sceneEl = document.getElementById('scene');
  live.on = true;
  const A = avatars(T);                 // stylised, articulated avatars (maison3d-avatars.mjs)
  if (car) car.visible = false;        // the demo car is not shown: only a real vehicle seen by a camera is
  document.documentElement.classList.add('live-mode');

  // ---------- look
  const css = document.createElement('style');
  css.textContent = `
  .live-mode .labels .tag,.live-mode .hint{display:none}
  .live-mode .scene.calibrating .labels .tag.calib{display:block}
  .live-mode .toast{top:calc(max(16px,env(safe-area-inset-top)) + 48px);bottom:auto}
  .livebar{position:absolute;left:12px;right:12px;bottom:12px;z-index:6;display:flex;align-items:center;gap:8px;padding:7px 8px 7px 12px;border-radius:14px;
   background:#0b1120d9;border:1px solid #7f9fd82e;backdrop-filter:blur(12px);color:#eef3ff;font:12px/1.3 'DM Sans',system-ui,sans-serif;min-width:0}
  .livebar .dot{width:7px;height:7px;flex:none;border-radius:50%;background:#ee827b;box-shadow:0 0 8px #ee827b}.livebar .dot.on{background:#7fd3a0;box-shadow:0 0 8px #7fd3a0}
  .livebar .chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;flex:1;min-width:0}.livebar .chips::-webkit-scrollbar{display:none}
  .chip{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;padding:5px 9px;border-radius:99px;background:#ffffff0a;border:1px solid #ffffff14}
  .chip i{font-style:normal}.chip small{color:#9fb0cc}.chip.dort{border-color:#8fb2ff55;background:#5289ff1a}.chip.cache{border-style:dashed}
  .chip.count b{font-variant-numeric:tabular-nums}
  .livebar button{flex:none;font:inherit;color:#dfe8ff;background:#ffffff0d;border:1px solid #8aa6d84d;border-radius:9px;padding:7px 11px;cursor:pointer}
  .livebar button[aria-pressed=true]{background:linear-gradient(115deg,#407ff4,#3157cf);border-color:#89b4ff66;color:#fff}
  .live{position:absolute;right:12px;bottom:66px;z-index:6;width:min(360px,calc(100% - 24px));max-height:calc(100% - 150px);overflow:auto;
   background:#0b1120ee;border:1px solid #7f9fd833;border-radius:16px;padding:14px;color:#eef3ff;font:13px/1.45 'DM Sans',system-ui,sans-serif;backdrop-filter:blur(12px);box-shadow:0 20px 50px #0008}
  .live[hidden]{display:none}
  .live h3{margin:0 0 2px;font:650 14px Manrope,system-ui,sans-serif;display:flex;align-items:center;gap:8px}
  .live small{color:#9fb0cc}.live .cams{margin:10px 0 0;display:grid;gap:6px}
  .live .cam{display:flex;align-items:center;gap:8px;justify-content:space-between;padding:8px 10px;border:1px solid #ffffff12;border-radius:10px;background:#ffffff06}
  .live .cam b{font-weight:600}.live .cam span{font-size:11px;color:#9fb0cc}
  .live button{font:inherit;color:#dfe8ff;background:#ffffff0d;border:1px solid #8aa6d84d;border-radius:8px;padding:6px 10px;cursor:pointer}
  .live button.go{background:linear-gradient(115deg,#407ff4,#3157cf);border-color:#89b4ff66;color:#fff}
  .live button:disabled{opacity:.45;cursor:default}
  .live .pic{position:relative;margin:10px 0 8px;border-radius:10px;overflow:hidden;cursor:crosshair;background:#000}
  .live .pic img{display:block;width:100%}.live .pic svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
  .live .steps{font-size:12px;color:#c8d5ec;margin:6px 0}.live .row{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
  .live .fine{font-size:11px;color:#7f90ad;margin-top:10px}
  .live.wide{width:min(600px,calc(100% - 24px))}
  .live ol{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:2px}
  .live li{display:grid;grid-template-columns:42px 1fr;gap:8px;padding:6px 0;border-top:1px solid #ffffff0d;font-size:12px}
  .live li time{color:#8fb2ff;font-variant-numeric:tabular-nums}.live li b{font-weight:600}.live li.calme span{color:#b9cdfa}
  .scene.calibrating canvas{cursor:crosshair!important}
  .live-mode .who{pointer-events:auto;cursor:pointer}.live-mode .who:hover{border-color:#8fb2ff88}
  button.chip{font:inherit;color:inherit;cursor:pointer;transition:background .2s,border-color .2s}
  button.chip:hover{background:#ffffff14;border-color:#8fb2ff66}button.chip.sel{border-color:#7fd3a0;background:#7fd3a01f}
  .livecard{margin:0 0 16px;padding:14px;border-radius:16px;background:linear-gradient(160deg,#16213a,#0d1424);border:1px solid #7f9fd840;
   color:#eef3ff;font:13px/1.45 'DM Sans',system-ui,sans-serif;animation:lc-in .32s cubic-bezier(.2,.8,.2,1)}
  @keyframes lc-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
  .livecard[hidden]{display:none}
  .lc-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font:650 14px Manrope,system-ui,sans-serif}
  .lc-who{display:flex;align-items:center;gap:8px}.lc-who i{font-style:normal;font-size:18px}
  .lc-x{width:28px;height:28px;border-radius:50%;border:1px solid #ffffff1f;background:#ffffff0a;color:#dfe8ff;font-size:16px;line-height:1;cursor:pointer}
  .lc-pill{display:inline-block;margin:8px 0 10px;padding:4px 10px;border-radius:99px;font-size:11px;font-weight:600;background:#ffffff10;color:#c8d5ec}
  .lc-pill.on{background:#7fd3a01f;color:#9fe3b9}.lc-pill.dort{background:#5289ff26;color:#b9cdfa}.lc-pill.cache{background:#f0b46a1f;color:#f3c98f}
  .lc-video{position:relative;border-radius:12px;overflow:hidden;background:#000;aspect-ratio:16/9}
  .lc-video img{display:block;width:100%;height:100%;object-fit:cover}.lc-video svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
  .lc-live{position:absolute;left:8px;top:8px;padding:3px 8px;border-radius:99px;background:#0b1120cc;font-size:10px;font-weight:700;letter-spacing:.06em;color:#ff9d8f}
  .lc-facts{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;margin:12px 0;font-size:12px}.lc-facts dt{color:#8fa1c0}.lc-facts dd{margin:0}
  .lc-actions{display:flex;gap:6px;flex-wrap:wrap}.lc-actions button{font:inherit;font-size:12px;color:#dfe8ff;background:#ffffff0d;border:1px solid #8aa6d84d;border-radius:9px;padding:7px 10px;cursor:pointer}
  .lc-actions button:first-child{background:linear-gradient(115deg,#407ff4,#3157cf);border-color:#89b4ff66;color:#fff}
  .lc-label{margin:14px 0 4px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8fa1c0}
  .lc-log{list-style:none;margin:0;padding:0}.lc-log li{display:grid;grid-template-columns:40px 1fr;gap:8px;padding:6px 0;border-top:1px solid #ffffff0d;font-size:12px}
  .lc-log time{color:#8fb2ff;font-variant-numeric:tabular-nums}.lc-log li.calme span{color:#b9cdfa}.lc-fine{color:#8fa1c0;font-size:12px;margin:10px 0 0}
  .lc-row{display:flex;align-items:center;gap:10px;width:100%;margin-top:8px;padding:9px 10px;border-radius:12px;border:1px solid #ffffff14;background:#ffffff08;color:inherit;font:inherit;text-align:left;cursor:pointer}
  .lc-known{margin:0 0 4px}.lc-learn{color:#9fe3b9}
  .bx-menu{position:relative;margin:8px 0 4px;padding:9px;border-radius:12px;background:#0b1120f2;border:1px solid #8fb2ff66;box-shadow:0 10px 30px #000a;font-size:12px}
  .bx-menu b{display:block;margin-bottom:6px}.bx-menu div{display:flex;flex-wrap:wrap;gap:5px;margin-top:5px}
  .bx-menu button{font:inherit;font-size:11.5px;color:#dfe8ff;background:#ffffff0d;border:1px solid #8aa6d84d;border-radius:99px;padding:5px 9px;cursor:pointer;display:inline-flex;align-items:center;gap:5px}
  .bx-menu button.on{border-color:#7fd3a0;background:#7fd3a01f}.bx-menu button i{width:9px;height:9px;border-radius:50%}
  .lc-match{margin:2px 0 12px;padding:10px 12px;border-radius:12px;border:1px solid #ffffff1a;background:#ffffff08}
  .lc-match p{display:flex;justify-content:space-between;align-items:baseline;margin:0 0 8px}.lc-match em{font-style:normal;font:700 20px Manrope,sans-serif}
  .lc-match.good em{color:#9fe3b9}.lc-match.mid em{color:#f3c98f}.lc-match.low em{color:#ff9d8f}
  .lc-why{display:grid;gap:6px;font-size:11.5px}.lc-why span{display:grid;grid-template-columns:1fr auto;gap:2px 8px;align-items:center}
  .lc-why small{grid-column:1/-1;color:#8fa1c0;font-size:10.5px}
  .lc-why i{grid-column:1/-1;height:4px;border-radius:2px;background:linear-gradient(90deg,#7fd3a0 var(--v),#ffffff14 var(--v))}
  .lc-match .lc-actions{margin-top:10px}
  .lc-photo{display:flex;align-items:center;gap:10px;margin:4px 0 10px}.lc-photo img{width:76px;height:76px;object-fit:cover;border-radius:14px;border:1px solid #ffffff26;background:#000}
  .lc-photo small{font-size:11px;color:#f3c98f}.lc-photo small.good{color:#9fe3b9}
  .lc-photo.empty span{display:grid;place-items:center;width:76px;height:76px;border-radius:14px;border:1px dashed #ffffff33;font-size:26px;opacity:.6}.lc-photo.empty small{color:#8fa1c0}
  .fam-ph{width:40px;height:40px;object-fit:cover;border-radius:10px;margin-right:4px}
  .lc-names{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
  .lc-names button,.live .cam b .sw{font:inherit}.lc-names button{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#dfe8ff;background:#ffffff0d;border:1px solid #8aa6d84d;border-radius:99px;padding:6px 11px;cursor:pointer}
  .lc-names button:hover{border-color:#7fd3a0}.lc-names i,.live .sw{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px}
  .lc-form{display:grid;gap:8px;margin-bottom:10px}.lc-form input[name=name]{font:inherit;color:#eef3ff;background:#0b1120;border:1px solid #8aa6d84d;border-radius:9px;padding:8px 10px}
  .lc-kinds,.lc-colors{display:flex;gap:10px;flex-wrap:wrap;font-size:12px}.lc-kinds label{display:flex;gap:5px;align-items:center}
  .lc-colors input{position:absolute;opacity:0}.lc-colors i{display:block;width:22px;height:22px;border-radius:50%;border:2px solid transparent;cursor:pointer}
  .lc-colors input:checked+i{border-color:#fff}
  .lc-row:hover{border-color:#8fb2ff66}.lc-row i{font-style:normal;font-size:18px}.lc-row span{flex:1;display:grid}.lc-row small{color:#9fb0cc}.lc-row em{font-style:normal;color:#8fb2ff}`;
  document.head.append(css);
  const bar = document.createElement('div'); bar.className = 'livebar';
  bar.innerHTML = `<i class="dot"></i><div class="chips" aria-live="polite"></div><button data-open="famille" aria-pressed="false">Famille</button><button data-open="journal" aria-pressed="false">Cahier de bord</button><button data-open="cams" aria-pressed="false">Caméras</button>`;
  const panel = document.createElement('section'); panel.className = 'live'; panel.hidden = true;
  sceneEl.append(bar, panel);
  document.getElementById('intro')?.classList.add('gone');
  let open = null;
  for (const b of bar.querySelectorAll('[data-open]')) b.onclick = () => { if (calib) return; open = open === b.dataset.open ? null : b.dataset.open; draw(true); };

  // ---------- 3D pieces
  const group = new T.Group(); house.add(group);
  const proj = new Map();      // camera id -> {mesh, tex, img, loading}
  const people = new Map();    // occupant id -> {node, kind, to:[x,z], y, up, status}
  let selected = null;         // occupant id shown in the side card, or 'all'
  let carTo = null, gateShown, gateMark = null;
  let profiles = [], idForm = false;
  const loadProfiles = async () => { try { profiles = await (await fetch(base + '/profiles', {cache: 'no-store'})).json(); } catch {} };
  const post = (path, body) => fetch(base + path, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body || {})}).then(r => r.ok).catch(() => false);
  loadProfiles(); setInterval(loadProfiles, 4000);
  const SWATCH = ['#7fd3a0', '#7aa2e3', '#f4bd6d', '#ee827b', '#b9a0d6', '#6fd0d6'];
  let state = {cameras: [], tracks: [], occupants: [], journal: []}, online = false;

  // each camera picture is laid only over the part of the floor it sees; the picture is decoded off the main thread
  function projection(cam) {
    let p = proj.get(cam.id);
    const box = cam.warp_box || [0, 0, 1000, 1000], key = box.join(',');
    if (!p) {
      const tex = new T.Texture(); tex.colorSpace = T.SRGBColorSpace; tex.generateMipmaps = false; tex.minFilter = T.LinearFilter;
      const m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({map: tex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false}));
      m.rotation.x = -Math.PI / 2; m.renderOrder = 2; group.add(m);
      p = {mesh: m, tex, loading: false, at: 0, key: ''};
      proj.set(cam.id, p);
    }
    if (p.key !== key) {
      p.key = key; p.masked = false; const [u0, v0, u1, v1] = box;
      p.mesh.geometry.dispose(); p.mesh.geometry = new T.PlaneGeometry(X(u1) - X(u0), Z(v1) - Z(v0));
      p.mesh.position.x = (X(u0) + X(u1)) / 2; p.mesh.position.z = (Z(v0) + Z(v1)) / 2;
      // the soft edge of what the camera sees: sent once per calibration, the live picture itself is a light JPEG
      bitmap(`${base}/mask/${cam.id}.png?k=${key}`).then(bmp => {
        const t = new T.Texture(bmp); t.flipY = false; t.needsUpdate = true;
        p.mesh.material.alphaMap?.dispose(); p.mesh.material.alphaMap = t; p.mesh.material.needsUpdate = true; p.masked = true;
      }).catch(() => {});
    }
    p.mesh.position.y = (cam.floor === 'up' ? UP : 0) + .145;
    return p;
  }
  const bitmap = async url => {
    const r = await fetch(url, {cache: 'no-store'}); if (!r.ok) throw new Error(r.status);
    return createImageBitmap(await r.blob(), {imageOrientation: 'flipY'});   // decoded off the main thread
  };
  async function refreshPicture(id, p) {
    p.loading = true; p.at = performance.now();
    try {
      const bmp = await bitmap(`${base}/warp/${id}.jpg?t=${Date.now()}`);
      p.tex.image?.close?.(); p.tex.image = bmp; p.tex.flipY = false; p.tex.needsUpdate = true; p.ready = p.masked;
    } catch {}
    p.loading = false;
  }
  const hex = c => /^#[0-9a-f]{6}$/i.test(c || '') ? parseInt(c.slice(1), 16) : null;
  const KIND_ACCENT = {adulte: 0xff8f7d, enfant: 0x7aa2e3, animal: 0xf4bd6d};
  function body(kind, color) {
    const accent = hex(color) ?? KIND_ACCENT[kind] ?? 0x7fd3a0;
    const node = kind === 'animal' ? A.dog({accent}) : A.human({kind, accent, top: kind === 'enfant' ? 0x9db7e8 : 0x8a9bb5, bottom: 0x3a4660});
    group.add(node);
    return node;
  }

  // ---------- data from Bonaparks Vision
  function connect() {
    const es = new EventSource(base + '/events');
    es.onopen = () => { online = true; draw(); };
    es.onmessage = e => { state = JSON.parse(e.data); online = true; update(); };
    es.onerror = () => { online = false; draw(); };
  }
  const NAME = {adulte: 'Adulte', enfant: 'Enfant', animal: 'Animal', vehicule: 'Véhicule'}, ICON = {adulte: '🧑', enfant: '🧒', animal: '🐾', vehicule: '🚗'};
  const room = id => state.cameras.find(c => c.id === id)?.name || id;
  // Names, colours and ids come from the bridge: never trusted as HTML.
  const esc = v => String(v ?? '').replace(/[&<>"'`]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;'}[c]));
  const who = o => esc(o.name || NAME[o.kind] || o.kind);
  function update() {
    const floorUp = h.floorUp();
    for (const c of state.cameras) {
      if (c.calibrated && c.online) {
        const p = projection(c);
        p.show = c.awake !== false && calib?.id !== c.id && (c.floor !== 'up' || floorUp);   // a camera at rest shows nothing
        if (c.awake !== false && !p.loading && performance.now() - p.at > 140) refreshPicture(c.id, p);
      } else if (proj.has(c.id)) proj.get(c.id).show = false;
    }
    // the people come from the logbook: those seen now, and those still in a room without being seen
    const ids = new Set();
    for (const o of state.occupants || []) {
      if (!o.plan || o.kind === 'vehicule') continue;
      ids.add(o.id);
      let p = people.get(o.id);
      const look = o.kind + (o.color || '');
      if (p && p.look !== look) { const at = p.node.position.clone(); group.remove(p.node); p.node = body(o.kind, o.color); p.node.position.copy(at); p.look = look; p.kind = o.kind; }
      if (!p) { p = {node: body(o.kind, o.color), kind: o.kind, look}; people.set(o.id, p); p.node.position.set(X(o.plan[0]), 0, Z(o.plan[1])); }
      p.up = o.floor === 'up'; p.status = o.status; p.pose = o.pose; p.y = p.up ? UP : 0;
      A.dress(p.node, o.colors);                    // the clothes (and fur) take the colours the camera really sees
      // seen inside a cot: the avatar is on its mattress, kept within the bars
      const bed = beds.find(b => !!b.up === p.up && o.plan[0] > Math.min(b.rect[0], b.rect[2]) - 6 && o.plan[0] < Math.max(b.rect[0], b.rect[2]) + 6 && o.plan[1] > Math.min(b.rect[1], b.rect[3]) - 6 && o.plan[1] < Math.max(b.rect[1], b.rect[3]) + 6);
      p.bed = bed || null;
      let x = X(o.plan[0]), z = Z(o.plan[1]);
      if (bed) {
        const xs = [X(bed.rect[0]), X(bed.rect[2])].sort((a, b) => a - b), zs = [Z(bed.rect[1]), Z(bed.rect[3])].sort((a, b) => a - b);
        x = Math.min(xs[1] - .18, Math.max(xs[0] + .18, x)); z = Math.min(zs[1] - .25, Math.max(zs[0] + .25, z));
        p.bedBox = {x: (xs[0] + xs[1]) / 2, z: (zs[0] + zs[1]) / 2};   // lying: centred on the mattress, head on the pillow (window side, +z)
      }
      p.to = [x, z];
    }
    for (const [id, p] of people) if (!ids.has(id)) { group.remove(p.node); people.delete(id); }
    const occ = state.occupants || [];
    live.people = occ.filter(o => o.kind === 'adulte' || o.kind === 'enfant').length;
    live.pets = occ.filter(o => o.kind === 'animal').length;
    // the real car: the 3D car is there only when a vehicle is seen or remembered, where it was seen
    const v = occ.find(o => o.kind === 'vehicule' && o.plan);
    if (car) { car.visible = !!v; if (v) carTo = [X(v.plan[0]), Z(v.plan[1])]; }
    // the real gate: the 3D gate opens and closes with it
    const g = state.gate;
    if (g?.ready && g.state && g.state !== gateShown) {
      if (gateShown !== undefined) say(`Portail · <b>${g.state === 'ouvert' ? 'Ouvert' : 'Fermé'}</b>`);
      gateShown = g.state; setGate?.(g.state === 'ouvert', true);
    }
    draw();
  }
  // movement between two updates of the detection, smooth on every frame; asleep = lying down
  let last = performance.now();
  (function step(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now; const floorUp = h.floorUp();
    if (car?.visible && carTo) {             // the car glides to where it is seen
      const dx = carTo[0] - car.position.x, dz = carTo[1] - car.position.z;
      if (Math.hypot(dx, dz) > 6) car.position.set(carTo[0], 0, carTo[1]);
      else { const k = 1 - Math.exp(-dt * 2.5); car.position.x += dx * k; car.position.z += dz * k; }
    }
    for (const [cid, p] of proj) {          // pictures fade in and out instead of popping
      const target = p.show && p.ready ? .92 : 0, m = p.mesh.material;
      m.opacity += (target - m.opacity) * Math.min(1, dt * 5); p.mesh.visible = m.opacity > .01;
    }
    for (const [oid, p] of people) {
      // critically damped follow: no jump between two detections, no jitter when standing still
      // posture of the real person: standing, sitting (crouched) or lying; asleep is lying
      const lying = p.status === 'dort' || p.pose === 'allonge', sitting = !lying && p.pose === 'assis';
      // lying in a bed: the body lies along the bed, head to the pillow; its feet are set so the whole body is centred on the mattress
      const len = (n0 => (n0.userData.tall || 1) * (p.s ?? 1))(p.node);
      const to = lying && p.bed && p.bedBox ? [p.bedBox.x, p.bedBox.z - len / 2] : p.to;
      const n = p.node, dx = to[0] - n.position.x, dz = to[1] - n.position.z, dist = Math.hypot(dx, dz);
      const k = dist < .03 ? 0 : 1 - Math.exp(-dt * 4.5);      // 10 positions/s, deja filtrees (Kalman) : suivi doux mais sans retard
      const wantY = lying && p.bed ? Math.PI : !lying && dist > .12 ? Math.atan2(dx, dz) : null;   // in a bed: head towards the pillow (+z)
      if (wantY !== null) { let d = wantY - n.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); n.rotation.y += d * Math.min(1, dt * 6); }
      n.rotation.x += ((lying && p.kind !== 'animal' ? -Math.PI / 2 : 0) - n.rotation.x) * Math.min(1, dt * 3);   // on the back, face up (a dog lies down on its legs)
      const moved = p.last ? Math.hypot(n.position.x - p.last[0], n.position.z - p.last[1]) / Math.max(dt, 1e-3) : 0; p.last = [n.position.x, n.position.z];
      p.speed = (p.speed ?? 0) + (Math.min(2.5, moved) - (p.speed ?? 0)) * Math.min(1, dt * 4);
      A.animate(n, {speed: lying ? 0 : p.speed, sitting, lying, t: now / 1000, dt});
      const bob = 0;                                    // the walk cycle itself moves the body now
      const base = p.y + (p.bed ? p.bed.mattress : 0) + (lying ? .14 : 0);
      n.position.set(n.position.x + dx * k, base + bob, n.position.z + dz * k);
      n.visible = !p.up || floorUp;
      const alpha = p.status === 'visible' ? 1 : p.status === 'dort' ? .7 : .38;
      p.alpha = (p.alpha ?? 0) + (alpha - (p.alpha ?? 0)) * Math.min(1, dt * 4);
      const s = selected === oid ? 1.12 + Math.sin(now * .005) * .04 : 1; p.s = (p.s ?? 1) + (s - (p.s ?? 1)) * Math.min(1, dt * 8); n.scale.setScalar(p.s);
      n.traverse(o => { if (o.material) o.material.opacity = p.alpha; });
    }
    requestAnimationFrame(step);
  })(last);

  // ---------- calibration
  let calib = null;      // {id, floor, image:[], plan:[], dots:[]}
  const dotMat = new T.MeshBasicMaterial({color: 0x7fd3a0});
  function startCalib(id) {
    const c = state.cameras.find(c => c.id === id); if (!c) return;
    clearDots();
    calib = {id, name: c.name, floor: c.floor && c.calibrated ? c.floor : (id === 'enfants' ? 'up' : 'down'), image: [], plan: [], dots: []};
    if ((calib.floor === 'up') !== h.floorUp()) h.setFloor(calib.floor === 'up', true);
    sceneEl.classList.add('calibrating');
    draw(true);
  }
  function clearDots() { for (const d of calib?.dots || []) { group.remove(d); d.userData.tag.el.remove(); d.userData.tag.show = false; } if (calib) calib.dots = []; }
  function stopCalib() { clearDots(); calib = null; panel.querySelector('#live-pic img')?.removeAttribute('src'); panel.dataset.calib = ''; sceneEl.classList.remove('calibrating'); draw(true); }
  const ray = new T.Raycaster(), ndc = new T.Vector2(), hit = new T.Vector3();
  live.tap = e => {                       // a touch of the 3D house: a person opens their card; while calibrating it marks the floor
    const r = canvas.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (!calib) {
      const nodes = [...people.values()].filter(p => p.node.visible).map(p => p.node);
      const hitNode = ray.intersectObjects(nodes, true)[0]?.object;
      if (!hitNode) return false;
      for (const [oid, p] of people) { let o = hitNode; while (o && o !== p.node) o = o.parent; if (o) { select(oid); return true; } }
      return false;
    }
    if (calib.image.length < 4 || calib.plan.length >= 4) return true;
    const y = calib.floor === 'up' ? UP : 0;
    if (!ray.ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), -y), hit)) return true;
    calib.plan.push([+U(hit.x).toFixed(1), +V(hit.z).toFixed(1)]);
    const dot = new T.Mesh(new T.SphereGeometry(.16, 16, 12), dotMat); dot.position.set(hit.x, y + .2, hit.z);
    const label = tag(String(calib.plan.length), U(hit.x), V(hit.z), y + .7); label.el.classList.add('calib');
    dot.userData.tag = label; calib.dots.push(dot); group.add(dot); draw(); return true;
  };
  async function save() {
    const body = {image: calib.image, plan: calib.plan, floor: calib.floor};
    const r = await fetch(`${base}/calibration/${calib.id}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)}).catch(() => null);
    say(r?.ok ? `${calib.name} · <b>calée sur la maison</b>` : 'Enregistrement impossible : Bonaparks Vision ne répond pas');
    if (r?.ok) stopCalib();
  }

  // ---------- the side card: touch a person (in the house, in the bar, or the counters) to see what is happening
  const aside = document.querySelector('.panel');
  const side = document.createElement('section'); side.className = 'livecard'; side.hidden = true;
  (aside?.querySelector('.panel-head') || aside)?.after(side);
  document.getElementById('who')?.addEventListener('click', () => select('all'));
  const clock = t => t ? new Date(t * 1000).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}) : '—';
  const PILL = {visible: ['En mouvement', 'on'], 'hors de vue': ['Hors de vue · toujours dans la pièce', 'cache'], dort: ['Dort probablement 🌙', 'dort'], 'garé': ['Garé', 'dort']};
  function select(id) {
    selected = selected === id ? null : id;
    if (selected !== null && selected !== 'all') {
      const p = people.get(selected);
      if (p) {
        if (p.up !== h.floorUp()) h.setFloor(p.up, true);
        const pos = p.node.position, P = window.parks3d;
        P?.flyTo({target: new T.Vector3(pos.x, p.y + .6, pos.z), az: P.orbit.az, pol: .72, dist: 14}, 900);
      }
    }
    side.dataset.key = ''; drawSide();
    if (selected !== null) aside?.scrollTo({top: 0, behavior: 'smooth'});
  }
  function drawSide() {
    side.hidden = selected === null;
    if (selected === null) { side.querySelector('img')?.removeAttribute('src'); return; }
    const occ = state.occupants || [];
    if (selected === 'all') {
      const html = `<div class="lc-head"><b>Dans la maison maintenant</b><button class="lc-x" aria-label="Fermer">×</button></div>
        ${occ.length ? occ.map(o => `<button class="lc-row" data-oid="${esc(o.id)}"><i>${ICON[o.kind] || '•'}</i><span><b>${who(o)}</b><small>${room(o.room)} · ${(PILL[o.status] || [o.status])[0]}</small></span><em>›</em></button>`).join('')
          : '<p class="lc-fine">Personne n’est détecté pour le moment.</p>'}`;
      if (side.dataset.key !== html) { side.dataset.key = html; side.innerHTML = html; side.querySelector('.lc-x').onclick = () => select(selected); for (const b of side.querySelectorAll('[data-oid]')) b.onclick = () => select(+b.dataset.oid); }
      return;
    }
    if (String(selected).startsWith('cam:')) { drawRoomCam(selected.slice(4)); return; }
    if (String(selected).startsWith('mir:')) { drawMirror(selected.slice(4)); return; }
    const o = occ.find(o => o.id === selected);
    if (!o) {
      side.dataset.key = 'gone';
      side.innerHTML = `<div class="lc-head"><b>Plus suivi</b><button class="lc-x" aria-label="Fermer">×</button></div><p class="lc-fine">Cette présence a quitté le champ des caméras.</p>`;
      side.querySelector('.lc-x').onclick = () => select(selected); return;
    }
    // built once per person and room: the live video keeps playing, only the words and boxes change
    const key = o.id + ':' + o.room;
    if (side.dataset.key !== key) {
      side.dataset.key = key;
      side.innerHTML = `<div class="lc-head"><span class="lc-who"><i>${ICON[o.kind] || '•'}</i><b></b></span><button class="lc-x" aria-label="Fermer">×</button></div>
        <span class="lc-pill"></span><div class="lc-id"></div>
        <div class="lc-video"><img src="${base}/video/${o.room}" alt="Vidéo en direct · ${room(o.room)}"><svg viewBox="0 0 1000 1000" preserveAspectRatio="none"></svg><span class="lc-live">● EN DIRECT · ${room(o.room)}</span></div>
        <dl class="lc-facts"></dl>
        <div class="lc-actions"><button data-act="look">Voir dans la maison</button><button data-act="all">Toutes les présences</button></div>
        <p class="lc-label">Cahier de bord</p><ol class="lc-log"></ol>`;
      side.querySelector('.lc-x').onclick = () => select(selected);
      side.querySelector('[data-act=look]').onclick = () => { const s = selected; selected = null; select(s); };
      side.querySelector('[data-act=all]').onclick = () => select('all');
      boxMenu(side.querySelector('.lc-video'), o.room);
    }
    side.querySelector('.lc-who b').textContent = `${o.name || NAME[o.kind] || o.kind} · ${room(o.room)}`;
    const [pill, cls] = PILL[o.status] || [o.status, ''];
    const pe = side.querySelector('.lc-pill'); pe.textContent = pill; pe.className = 'lc-pill ' + cls;
    const POSE = {debout: 'debout', assis: 'assis', allonge: 'allongé'};
    const facts = `<dt>Pièce</dt><dd>${room(o.room)} · ${o.floor === 'up' ? 'étage' : 'rez-de-chaussée'}</dd>${o.pose ? `<dt>Posture</dt><dd>${POSE[o.pose]}</dd>` : ''}${o.bed ? `<dt>Lit</dt><dd>dans ${o.bed.replace(/^le /, 'le ')}</dd>` : ''}<dt>Arrivé</dt><dd>${clock(o.since)}</dd><dt>Dernière vue</dt><dd>${clock(o.last_seen)}</dd>`;
    const fe = side.querySelector('.lc-facts'); if (fe.innerHTML !== facts) fe.innerHTML = facts;
    drawIdentity(o);
    const cam = state.cameras.find(c => c.id === o.room);
    side.querySelector('.lc-video svg').innerHTML = (cam?.detections || []).map(d => { const [x1, y1, x2, y2] = d.box.map(v => v * 1000), mine = d.kind === o.kind;
      return `<rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" rx="8" fill="none" stroke="${mine ? '#7fd3a0' : '#ffffff66'}" stroke-width="${mine ? 5 : 3}" vector-effect="non-scaling-stroke"/>`; }).join('');
    const log = (state.journal || []).filter(e => e.oid === o.id).slice(-8).reverse().map(e => `<li class="${e.niveau || ''}"><time>${e.heure}</time><span>${e.piece} — ${e.texte}</span></li>`).join('') || '<li><time></time><span>Rien pour le moment.</span></li>';
    const le = side.querySelector('.lc-log'); if (le.innerHTML !== log) le.innerHTML = log;
  }

  // zooming on a room opens its camera live in the side panel
  function cameraFor(roomId) {
    const r = rooms?.[roomId]; if (!r) return null;
    const up = !!r.up, [a, b, c, d] = r.rect, u0 = Math.min(a, c), u1 = Math.max(a, c), v0 = Math.min(b, d), v1 = Math.max(b, d);
    let best = null, score = 0;
    for (const cam of state.cameras) {
      if ((cam.floor === 'up') !== up) continue;
      const w = cam.warp_box, ov = w ? Math.max(0, Math.min(u1, w[2]) - Math.max(u0, w[0])) * Math.max(0, Math.min(v1, w[3]) - Math.max(v0, w[1])) : 0;
      const s = ov / ((u1 - u0) * (v1 - v0) || 1) + (cam.zone === roomId ? 1 : 0);
      if (s > score) { best = cam; score = s; }
    }
    return score > .15 ? best : null;
  }
  live.enter = id => { const cam = cameraFor(id); if (!cam) return; selected = 'cam:' + cam.id; side.dataset.key = ''; drawSide(); aside?.scrollTo({top: 0, behavior: 'smooth'}); };
  live.leave = () => { if (String(selected).startsWith('cam:')) { selected = null; drawSide(); } };
  const BOX = {adulte: '#ff8f7d', enfant: '#7aa2e3', animal: '#f4bd6d', vehicule: '#b9a0d6'};
  function drawRoomCam(cid) {
    const cam = state.cameras.find(c => c.id === cid); if (!cam) return;
    if (side.dataset.key !== 'cam:' + cid) {
      side.dataset.key = 'cam:' + cid;
      side.innerHTML = `<div class="lc-head"><span class="lc-who"><i>📹</i><b>${cam.name}</b></span><button class="lc-x" aria-label="Fermer">×</button></div>
        <span class="lc-pill"></span>
        <div class="lc-video"><img src="${base}/video/${cid}" alt="Vidéo en direct · ${cam.name}"><svg viewBox="0 0 1000 1000" preserveAspectRatio="none"></svg><span class="lc-live">● EN DIRECT</span></div>
        <p class="lc-label">Dans cette pièce</p><div class="lc-here"></div>`;
      side.querySelector('.lc-x').onclick = () => { selected = null; drawSide(); };
      boxMenu(side.querySelector('.lc-video'), cid);
    }
    const pe = side.querySelector('.lc-pill');
    pe.textContent = cam.awake === false ? 'Réveil de la caméra…' : cam.on_motion ? 'Mouvement détecté' : 'En direct'; pe.className = 'lc-pill ' + (cam.awake === false ? 'cache' : 'on');
    side.querySelector('.lc-video svg').innerHTML = (cam.detections || []).map(d => { const [x1, y1, x2, y2] = d.box.map(v => v * 1000);
      return `<rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" rx="8" fill="none" stroke="${BOX[d.kind] || '#ffffffaa'}" stroke-width="4" vector-effect="non-scaling-stroke"/>`; }).join('');
    const here = (state.occupants || []).filter(o => o.room === cid);
    const html = here.map(o => `<button class="lc-row" data-oid="${esc(o.id)}"><i>${ICON[o.kind] || '•'}</i><span><b>${who(o)}</b><small>${(PILL[o.status] || [o.status])[0]}</small></span><em>›</em></button>`).join('') || '<p class="lc-fine">Personne pour le moment.</p>';
    const box = side.querySelector('.lc-here'); if (box.dataset.html !== html) { box.dataset.html = html; box.innerHTML = html; for (const b of box.querySelectorAll('[data-oid]')) b.onclick = () => select(+b.dataset.oid); }
  }

  // touch a box on the live video: say what it really is (type, someone of the family, nothing, a reflection)
  function boxMenu(holder, camId) {
    holder.style.cursor = 'pointer';
    holder.addEventListener('click', e => {
      if (e.target.closest('.bx-menu')) return;
      holder.parentElement.querySelector('.bx-menu')?.remove();
      const r = holder.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      const det = (state.cameras.find(c => c.id === camId)?.detections || []).filter(d => x >= d.box[0] && x <= d.box[2] && y >= d.box[1] && y <= d.box[3])
        .sort((a, b) => (a.box[2] - a.box[0]) * (a.box[3] - a.box[1]) - (b.box[2] - b.box[0]) * (b.box[3] - b.box[1]))[0];
      if (!det) { say('Touche un des cadres sur la vidéo'); return; }
      const menu = document.createElement('div'); menu.className = 'bx-menu';
      // the menu sits right under the video, so nothing is cut off; the touched box is outlined meanwhile
      const fam = profiles.filter(p => (p.kind === 'animal') === (det.group === 'animal' || det.kind === 'animal'));
      menu.innerHTML = `<b>C’est…</b>
        <div>${['adulte', 'enfant', 'animal'].map(k => `<button data-k="${k}" ${det.kind === k ? 'class="on"' : ''}>${ICON[k]} ${NAME[k]}</button>`).join('')}</div>
        ${fam.length ? `<div>${fam.map(p => `<button data-p="${esc(p.id)}"><i style="background:${/^#[0-9a-f]{3,8}$/i.test(p.color)?p.color:'#888'}"></i>${esc(p.name)}</button>`).join('')}</div>` : ''}
        <div><button data-x="nothing">Ce n’est rien</button><button data-x="mirror">🪞 Un reflet</button><button data-x="close">×</button></div>`;
      holder.after(menu); holder.dataset.pick = det.box.join(',');
      const done = msg => { say(msg); menu.remove(); delete holder.dataset.pick; };
      for (const bt of menu.querySelectorAll('[data-k]')) bt.onclick = async () => done(await post('/detect/kind', {camera: camId, box: det.box, kind: bt.dataset.k}) ? `Noté · <b>${NAME[bt.dataset.k]}</b>` : 'Pas encore suivi, réessaie dans un instant');
      for (const bt of menu.querySelectorAll('[data-p]')) bt.onclick = async () => { const ok = await post('/detect/who', {camera: camId, box: det.box, pid: bt.dataset.p}); done(ok ? `C’est <b>${bt.textContent}</b> · l’IA apprend` : 'Pas encore suivi, réessaie dans un instant'); loadProfiles(); };
      menu.querySelector('[data-x=nothing]').onclick = async () => done(await post('/detect/nothing', {camera: camId, box: det.box}) ? 'Noté · <b>l’IA ignorera cet endroit</b>' : 'Impossible');
      menu.querySelector('[data-x=mirror]').onclick = async () => done(await post('/mirror', {camera: camId, box: det.box}) ? 'Miroir <b>retenu</b>' : 'Impossible');
      menu.querySelector('[data-x=close]').onclick = () => { menu.remove(); delete holder.dataset.pick; };
    });
  }

  // the same clothes twice in one picture: probably a mirror. Touch the reflection and the AI stops counting it.
  function drawMirror(cid) {
    const cam = state.cameras.find(c => c.id === cid); if (!cam) return;
    if (side.dataset.key !== 'mir:' + cid) {
      side.dataset.key = 'mir:' + cid;
      side.innerHTML = `<div class="lc-head"><span class="lc-who"><i>🪞</i><b>Un miroir · ${cam.name} ?</b></span><button class="lc-x" aria-label="Fermer">×</button></div>
        <p class="lc-fine" style="margin:4px 0 10px">L’IA voit deux silhouettes habillées pareil en même temps. Si l’une est un reflet, <b>touche-la sur la vidéo</b>.</p>
        <div class="lc-video" id="mir-pic" style="cursor:pointer"><img src="${base}/video/${cid}" alt="Vidéo en direct · ${cam.name}"><svg viewBox="0 0 1000 1000" preserveAspectRatio="none"></svg><span class="lc-live">● EN DIRECT</span></div>
        <div class="lc-actions" style="margin-top:10px"><button data-mno>Non, pas de miroir</button></div>`;
      side.querySelector('.lc-x').onclick = () => { selected = null; drawSide(); };
      side.querySelector('[data-mno]').onclick = async () => { await post('/mirror/no', {camera: cid}); say('D’accord · <b>pas de miroir</b>'); selected = null; drawSide(); };
      side.querySelector('#mir-pic').onclick = async e => {
        const r = e.currentTarget.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        const boxes = (state.cameras.find(c => c.id === cid)?.mirror_suspect?.boxes) || (state.cameras.find(c => c.id === cid)?.detections || []).map(d => d.box);
        const hit = boxes.find(b => x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]);
        if (!hit) { say('Touche une des silhouettes encadrées'); return; }
        if (await post('/mirror', {camera: cid, box: hit})) { say('Miroir <b>retenu</b> · le reflet n’est plus compté'); selected = null; drawSide(); }
      };
    }
    const boxes = cam.mirror_suspect?.boxes || [];
    side.querySelector('#mir-pic svg').innerHTML = boxes.map(b => { const [x1, y1, x2, y2] = b.map(v => v * 1000); return `<rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" rx="8" fill="#f0b46a22" stroke="#f0b46a" stroke-width="4" vector-effect="non-scaling-stroke"/>`; }).join('');
  }

  // who is it: name an unknown presence, or a known one keeps learning. Everything stays on this computer.
  const photoTick = () => Math.floor(Date.now() / 5000);
  const PHOTO_NOTE = {visage: 'Visage capturé', corps: 'Photo du corps · un visage de face serait mieux'};
  function photoBlock(o) {
    if (!o.photo) return `<div class="lc-photo empty"><span>${o.kind === 'animal' ? '🐾' : '🙂'}</span><small>${o.kind === 'animal' ? 'En attente d’une photo de l’animal…' : 'En attente d’une photo du visage…'}</small></div>`;
    const note = o.kind === 'animal' ? (o.photo === 'visage' ? 'Tête capturée' : 'Photo de l’animal · de face, c’est encore mieux') : PHOTO_NOTE[o.photo];
    return `<div class="lc-photo"><img src="${base}/photo/${encodeURIComponent(o.id)}.jpg?v=${photoTick()}" alt="Photo · ${who(o)}"><small class="${o.photo === 'visage' ? 'good' : ''}">${note}</small></div>`;
  }
  // who it probably is, in percent, and why: presence logic (only the gate lets someone in), clothes, hair, size, face
  const CUE = {visage: 'Visage', vetements: 'Vêtements', cheveux: 'Cheveux', taille: 'Taille'};
  function matchBlock(o) {
    const m = o.match; if (!m) return '';
    const pct = Math.round(m.p * 100), tone = pct >= 80 ? 'good' : pct >= 50 ? 'mid' : 'low';
    const why = [`<span>Logique de présence <b>${Math.round(m.prior * 100)} %</b><small>${m.visitors ? m.visitors + ' inconnu(s) entré(s) par le portail' : 'personne d’autre n’est entré par le portail'}</small></span>`,
      ...Object.entries(m.cues || {}).map(([k, s]) => `<span>${CUE[k] || k} <b>${Math.round(s * 100)} %</b><i style="--v:${Math.round(s * 100)}%"></i></span>`)].join('');
    return `<div class="lc-match ${tone}"><p><b>${o.who ? 'Reconnu' : 'C’est sûrement'} ${m.name}</b><em>${pct} %</em></p><div class="lc-why">${why}</div>
      ${o.who ? '' : `<div class="lc-actions"><button data-yes="${m.pid}">Oui, c’est ${m.name}</button><button data-no="${m.pid}">Non</button></div>`}</div>`;
  }
  function drawIdentity(o) {
    const box = side.querySelector('.lc-id'); if (!box) return;
    if (o.kind === 'vehicule') { box.innerHTML = ''; box.dataset.key = ''; return; }
    const learning = (state.tracks || []).some(t => t.who && t.who === o.who && t.learning);
    const same = profiles.filter(p => (p.kind === 'animal') === (o.kind === 'animal'));
    const key = [o.id, o.who, learning, idForm, o.photo, photoTick(), o.match ? o.match.pid + Math.round(o.match.p * 20) + JSON.stringify(o.match.cues) : '', same.map(p => p.id + p.name).join()].join('|');
    if (box.dataset.key === key || (idForm && box.querySelector('form'))) return; box.dataset.key = key;
    if (o.who) {
      const p = profiles.find(p => p.id === o.who);
      box.innerHTML = matchBlock(o) + `<p class="lc-known"><b>${esc(o.name)}</b> · reconnu${learning ? ' · <span class="lc-learn">apprentissage en cours…</span>' : ''}</p>
        <p class="lc-fine">${p ? `${p.faces} visage${p.faces > 1 ? 's' : ''} et ${p.looks} apparence${p.looks > 1 ? 's' : ''} appris` : ''}</p>
        <div class="lc-actions"><button data-id="relearn">Continuer l’apprentissage</button></div>`;
      box.querySelector('[data-id=relearn]').onclick = () => post(`/profiles/${o.who}/learn`, {occupant: o.id});
      return;
    }
    if (!idForm) {
      box.innerHTML = matchBlock(o) + `<p class="lc-label" style="margin-top:4px">Qui est-ce ?</p>${photoBlock(o)}<div class="lc-names">${same.map(p => `<button data-pid="${p.id}"><i style="background:${/^#[0-9a-f]{3,8}$/i.test(p.color)?p.color:'#888'}"></i>${esc(p.name)}</button>`).join('')}<button data-id="new">+ Enregistrer</button></div><div class="lc-actions"><button data-id="not">Ce n'est pas ${o.kind === 'animal' ? 'un animal' : o.kind === 'vehicule' ? 'un véhicule' : 'une personne'}</button></div>`;
      for (const b of box.querySelectorAll('[data-pid]')) b.onclick = () => post(`/profiles/${b.dataset.pid}/learn`, {occupant: o.id}).then(loadProfiles);
      box.querySelector('[data-id=new]').onclick = () => { idForm = true; box.dataset.key = ''; drawIdentity(o); };
      box.querySelector('[data-yes]')?.addEventListener('click', e => post(`/profiles/${e.currentTarget.dataset.yes}/learn`, {occupant: o.id}).then(loadProfiles));
      box.querySelector('[data-no]')?.addEventListener('click', e => post(`/occupants/${o.id}/notwho`, {pid: e.currentTarget.dataset.no}));
      box.querySelector('[data-id=not]').onclick = async () => { if (await post(`/occupants/${o.id}/not`)) { say('Merci · <b>l’IA ne refera plus cette erreur ici</b>'); selected = null; drawSide(); } };
      return;
    }
    box.innerHTML = `<form class="lc-form"><p class="lc-label" style="margin-top:4px">Enregistrer ${o.kind === 'animal' ? 'cet animal' : 'cette personne'}</p>${photoBlock(o)}
      <input name="name" placeholder="${o.kind === 'animal' ? 'Nom de l’animal' : 'Prénom'}" maxlength="40" required autocomplete="off">
      <div class="lc-kinds">${(o.kind === 'animal' ? ['animal'] : ['adulte', 'enfant']).map(k => `<label><input type="radio" name="kind" value="${k}" ${k === o.kind ? 'checked' : ''}>${NAME[k]}</label>`).join('')}</div>
      <div class="lc-colors">${SWATCH.map((c, i) => `<label><input type="radio" name="color" value="${c}" ${i === 0 ? 'checked' : ''}><i style="background:${c}"></i></label>`).join('')}</div>
      <p class="lc-fine">L’IA apprend son visage et son apparence pendant 90 secondes. Tout reste sur cet ordinateur ; « Famille » permet de tout effacer.</p>
      <div class="lc-actions"><button type="submit">Enregistrer</button><button type="button" data-id="cancel">Annuler</button></div></form>`;
    const form = box.querySelector('form'); form.querySelector('input').focus();
    form.onsubmit = async e => { e.preventDefault(); const d = new FormData(form); idForm = false;
      await post('/profiles', {name: d.get('name'), kind: d.get('kind') || o.kind, color: d.get('color'), occupant: o.id}); await loadProfiles(); box.dataset.key = ''; };
    form.querySelector('[data-id=cancel]').onclick = () => { idForm = false; box.dataset.key = ''; drawIdentity(o); };
  }

  // ---------- bar and panels
  const seenBy = c => {
    const n = k => (c.detections || []).filter(d => d.kind === k).length, a = n('adulte'), e = n('enfant'), p = n('animal');
    const parts = [a && `${a} adulte${a > 1 ? 's' : ''}`, e && `${e} enfant${e > 1 ? 's' : ''}`, p && `${p} animal${p > 1 ? 'aux' : ''}`].filter(Boolean);
    return parts.length ? ` · <b style="color:#f0b46a">${parts.join(', ')}</b>` : '';
  };
  const STATUS = {visible: '', 'hors de vue': 'hors de vue', dort: 'dort 🌙', 'garé': 'garé'};
  function drawBar() {
    bar.querySelector('.dot').classList.toggle('on', online);
    const occ = state.occupants || [], count = k => occ.filter(o => o.kind === k).length;
    const chips = occ.length
      ? [`<button class="chip count" data-oid="all">🧑 <b>${count('adulte')}</b> · 🧒 <b>${count('enfant')}</b> · 🐾 <b>${count('animal')}</b></button>`,
         ...occ.slice().sort((a, b) => (a.status === 'visible') - (b.status === 'visible')).map(o =>
           `<button class="chip ${o.status === 'dort' ? 'dort' : o.status === 'hors de vue' ? 'cache' : ''}${selected === o.id ? ' sel' : ''}" data-oid="${esc(o.id)}"><i>${ICON[o.kind] || '•'}</i>${who(o)}<small>${room(o.room)}${STATUS[o.status] ? ' · ' + STATUS[o.status] : ''}</small></button>`)]
      : [`<span class="chip"><small>${online ? 'Personne dans la maison pour le moment' : 'Bonaparks Vision ne répond pas'}</small></span>`];
    for (const c of state.cameras) if (c.mirror_suspect) chips.unshift(`<button class="chip cache" data-mirror="${c.id}">🪞 ${c.name}<small>même tenue en double · un miroir ?</small></button>`);
    if (state.gate?.ready && state.gate.state) chips.splice(occ.length ? 1 : 0, 0, `<button class="chip ${state.gate.state === 'ouvert' ? 'cache' : ''}" data-open-gate>🚪 Portail<small>${state.gate.state === 'ouvert' ? 'ouvert' : 'fermé'}</small></button>`);
    const html = chips.join('');
    const box = bar.querySelector('.chips'); if (box.dataset.html !== html) { box.dataset.html = html; box.innerHTML = html; }
    for (const b of bar.querySelectorAll('[data-open]')) b.setAttribute('aria-pressed', String(open === b.dataset.open && !calib));
  }
  bar.querySelector('.chips').addEventListener('click', e => { const mi = e.target.closest('[data-mirror]'); if (mi) { selected = 'mir:' + mi.dataset.mirror; side.dataset.key = ''; drawSide(); aside?.scrollTo({top: 0, behavior: 'smooth'}); return; } if (e.target.closest('[data-open-gate]')) { open = 'portail'; draw(true); return; } const b = e.target.closest('[data-oid]'); if (b) select(b.dataset.oid === 'all' ? 'all' : +b.dataset.oid); });
  function draw(force) {
    drawBar(); drawSide();
    panel.classList.toggle('wide', !!calib && calib.image.length < 4);   // smaller once the marks on the video are set, to leave the house free
    if (calib) { drawCalib(); return; }
    panel.hidden = !open;
    if (open === 'portail') { drawGate(); return; }
    if (panel.dataset.calib === 'gate') panel.querySelector('img')?.removeAttribute('src');
    panel.dataset.calib = '';
    if (!open) return;
    let html;
    if (open === 'famille') {
      html = `<h3>Famille</h3><small>Personnes et animaux enregistrés. Reconnus sur cet ordinateur uniquement.</small>
        <div class="cams">${profiles.map(p => `<div class="cam">${p.photo ? `<img class="fam-ph" src="${base}/profiles/${encodeURIComponent(p.id)}/photo.jpg" alt="">` : ''}<div style="flex:1"><b><i class="sw" style="background:${/^#[0-9a-f]{3,8}$/i.test(p.color)?p.color:'#888'}"></i>${esc(p.name)}</b><br><span>${NAME[p.kind]} · ${p.faces} visage${p.faces > 1 ? 's' : ''} · ${p.looks} apparence${p.looks > 1 ? 's' : ''}</span></div><button data-del="${p.id}">Effacer</button></div>`).join('') || '<p class="fine">Personne n’est enregistré. Touche une personne ou un animal dans la maison, puis « + Enregistrer ».</p>'}</div>
        <p class="fine">Effacer supprime le profil et tous ses visages et apparences appris.</p>
        <h3 style="margin-top:14px">Apprentissage</h3><small>L’IA s’améliore en continu, sur cet ordinateur.</small>
        <div class="cams">${state.cameras.map(c => { const l = state.learning?.[c.id] || {}; return `<div class="cam"><div><b>${c.name}</b><br><span>limite enfant ${String(l.limite_enfant ?? 1.45).replace('.', ',')} m · ${l.mesures_adulte || 0} mesures adulte · ${l.mesures_enfant || 0} enfant · ${l.corrections || 0} correction${(l.corrections || 0) > 1 ? 's' : ''}</span></div></div>`; }).join('')}</div>
        <div class="row" style="margin-top:8px"><button data-reset-learning>Repartir de zéro</button></div>`;
    } else if (open === 'journal') {
      const j = (state.journal || []).slice().reverse();
      html = `<h3>Cahier de bord</h3><small>Ce que l’IA a vu et retient, pièce par pièce.</small>
        <ol>${j.map(e => `<li class="${e.niveau || ''}"><time>${e.heure}</time><span><b>${ICON[e.kind] || ''} ${e.qui}</b> · ${e.piece} — ${e.texte}</span></li>`).join('') || '<li><time></time><span>Rien pour le moment.</span></li>'}</ol>
        <p class="fine">Un enfant qui n’est pas sorti de sa chambre y reste, même quand la caméra ne le voit plus dans son lit.</p>`;
    } else {
      html = `<h3>Caméras</h3><small>${online ? 'Reliées à Bonaparks Vision' : 'Bonaparks Vision ne répond pas sur ' + base}</small>
        <div class="cams">${state.cameras.map(c => `<div class="cam"><div><b>${c.name}</b><br><span>${!c.online ? 'hors ligne' : c.awake === false ? 'en veille · se réveille au mouvement' : !c.calibrated ? 'à caler sur la maison' : (c.on_motion ? 'mouvement détecté · ' : 'en direct · ') + (c.floor === 'up' ? 'étage' : 'RDC')}${seenBy(c)}</span></div><button data-cal="${c.id}" ${c.online ? '' : 'disabled'}>${c.calibrated ? 'Recaler' : 'Caler'}</button></div>`).join('')}</div>
        <div class="row" style="margin-top:10px"><button data-gate-open>Portail…</button></div>
        <p class="fine">Détection sur cet ordinateur. Aucune image ne quitte la maison.</p>`;
    }
    if (!force && panel.dataset.html === html) return;
    panel.dataset.html = html; panel.innerHTML = html;
    for (const b of panel.querySelectorAll('[data-cal]')) b.onclick = () => startCalib(b.dataset.cal);
    panel.querySelector('[data-gate-open]')?.addEventListener('click', () => { open = 'portail'; draw(true); });
    panel.querySelector('[data-reset-learning]')?.addEventListener('click', async () => { if (confirm('Oublier les tailles apprises et les corrections ?')) { await post('/learning/reset'); draw(true); } });
    for (const b of panel.querySelectorAll('[data-del]')) b.onclick = async () => {
      const p = profiles.find(p => p.id === b.dataset.del); if (!p || !confirm(`Effacer ${esc(p.name)} et tout ce que l’IA a appris ?`)) return;
      await post(`/profiles/${p.id}/delete`); await loadProfiles(); draw(true);
    };
  }
  // the gate: mark it once on the video, then show the AI what it looks like closed and open
  function drawGate() {
    const g = state.gate || {}, camId = gateMark?.cam || g.camera || 'dehors';
    panel.classList.add('wide');
    if (panel.dataset.calib !== 'gate:' + camId) {
      panel.dataset.calib = 'gate:' + camId; panel.dataset.html = '';
      panel.innerHTML = `<h3>Portail <small style="font-weight:400">· vidéo en direct</small></h3>
        <div class="row" style="margin:6px 0 0"><small>Caméra</small>${state.cameras.map(c => `<button data-gcam="${c.id}" ${c.id === camId ? 'class="go"' : ''}>${c.name}</button>`).join('')}</div>
        <div class="pic" id="gate-pic"><img src="${base}/video/${camId}" alt="Vidéo en direct"><svg viewBox="0 0 1000 1000" preserveAspectRatio="none"></svg></div>
        <p class="steps"></p>
        <div class="row"><button data-g="mark">Repérer le portail</button><button data-g="ferme" class="go">Il est fermé maintenant</button><button data-g="ouvert" class="go">Il est ouvert maintenant</button></div>
        <p class="fine gate-info"></p><div class="row" style="margin-top:8px"><button data-g="close">Fermer</button></div>`;
      for (const b of panel.querySelectorAll('[data-gcam]')) b.onclick = () => { gateMark = {cam: b.dataset.gcam, pts: []}; draw(true); };
      panel.querySelector('#gate-pic').onclick = async e => {
        if (!gateMark || gateMark.pts.length >= 4) return;
        const r = e.currentTarget.getBoundingClientRect(); gateMark.pts.push([+((e.clientX - r.left) / r.width).toFixed(4), +((e.clientY - r.top) / r.height).toFixed(4)]);
        if (gateMark.pts.length === 4) { const ok = await post('/gate/roi', {camera: gateMark.cam, roi: gateMark.pts}); say(ok ? 'Portail <b>repéré</b> · montre-le fermé puis ouvert' : 'Impossible d’enregistrer le portail'); gateMark = null; }
        drawGate();
      };
      panel.querySelector('[data-g=mark]').onclick = () => { gateMark = {cam: camId, pts: []}; drawGate(); };
      for (const k of ['ferme', 'ouvert']) panel.querySelector(`[data-g=${k}]`).onclick = async () => { const ok = await post('/gate/learn', {etat: k}); say(ok ? `Exemple <b>${k === 'ferme' ? 'fermé' : 'ouvert'}</b> appris` : 'Repère d’abord le portail'); };
      panel.querySelector('[data-g=close]').onclick = () => { open = null; gateMark = null; panel.classList.remove('wide'); draw(true); };
    }
    const pts = gateMark ? gateMark.pts : (g.camera === camId ? g.roi || [] : []);
    panel.querySelector('#gate-pic svg').innerHTML = (pts.length > 1 ? `<polygon points="${pts.map(p => p[0] * 1000 + ',' + p[1] * 1000).join(' ')}" fill="#f0b46a22" stroke="#f0b46a" stroke-width="3" vector-effect="non-scaling-stroke"/>` : '') +
      pts.map((p, i) => `<circle cx="${p[0] * 1000}" cy="${p[1] * 1000}" r="11" fill="#f0b46a" stroke="#fff" stroke-width="3"/><text x="${p[0] * 1000 + 16}" y="${p[1] * 1000 + 10}" fill="#fff" font-size="38" font-weight="700">${i + 1}</text>`).join('');
    const ex = g.examples || {ferme: 0, ouvert: 0};
    panel.querySelector('.steps').innerHTML = gateMark
      ? `Clique les <b>4 coins du portail</b> sur la vidéo : haut gauche, haut droit, bas droit, bas gauche (${gateMark.pts.length}/4).`
      : !g.roi ? 'Commence par <b>Repérer le portail</b>.'
      : !g.ready ? 'Quand le portail est <b>fermé</b>, appuie sur « Il est fermé maintenant ». Quand il est <b>ouvert</b>, sur « Il est ouvert maintenant ».'
      : `Portail suivi en direct : <b>${g.state === 'ouvert' ? 'ouvert' : 'fermé'}</b>. Ajoute des exemples de nuit ou par mauvais temps pour qu’il reste sûr.`;
    panel.querySelector('.gate-info').textContent = `Exemples appris : ${ex.ferme} fermé · ${ex.ouvert} ouvert${g.ready ? ` · certitude ${Math.round(Math.min(1, (g.score || 0) * 8) * 100)} %` : ''}`;
  }
  function drawCalib() {
    panel.hidden = false; panel.dataset.html = '';
    // built once per camera: the video keeps playing while the marks are added over it
    if (panel.dataset.calib !== calib.id) {
      panel.dataset.calib = calib.id;
      panel.innerHTML = `<h3>Caler · ${calib.name} <small style="font-weight:400">· vidéo en direct</small></h3>
        <div class="pic" id="live-pic"><img src="${base}/video/${calib.id}" alt="Vidéo en direct de la caméra ${calib.name}"><svg viewBox="0 0 1000 1000" preserveAspectRatio="none"></svg></div>
        <p class="steps"></p>
        <div class="row"><span><small>Niveau</small></span><button data-lf="down">RDC</button><button data-lf="up">Étage</button></div>
        <div class="row" style="margin-top:10px"><button id="live-redo">Recommencer</button><button id="live-cancel">Annuler</button><button class="go" id="live-save">Enregistrer</button></div>`;
      panel.querySelector('#live-pic').onclick = e => { if (calib.image.length >= 4) return; const r = e.currentTarget.getBoundingClientRect(); calib.image.push([+((e.clientX - r.left) / r.width).toFixed(4), +((e.clientY - r.top) / r.height).toFixed(4)]); draw(); };
      panel.querySelector('#live-redo').onclick = () => { clearDots(); calib.image = []; calib.plan = []; draw(); };
      panel.querySelector('#live-cancel').onclick = stopCalib;
      panel.querySelector('#live-save').onclick = save;
      for (const b of panel.querySelectorAll('[data-lf]')) b.onclick = () => { calib.floor = b.dataset.lf; h.setFloor(calib.floor === 'up', true); clearDots(); calib.plan = []; draw(); };
    }
    const s = calib.image.length < 4
      ? `<b>1.</b> Clique ${4 - calib.image.length} repère${calib.image.length < 3 ? 's' : ''} <b>au sol</b> sur la vidéo (coins de pièce, de tapis, pieds de meuble…).`
      : calib.plan.length < 4
        ? `<b>2.</b> Touche les <b>mêmes repères, dans le même ordre</b>, au sol de la maison 3D (${calib.plan.length}/4).`
        : '<b>3.</b> Les 4 repères sont posés. Enregistre.';
    panel.querySelector('#live-pic svg').innerHTML = calib.image.map((p, i) => `<circle cx="${p[0] * 1000}" cy="${p[1] * 1000}" r="12" fill="#5289ff" stroke="#fff" stroke-width="3"/><text x="${p[0] * 1000 + 18}" y="${p[1] * 1000 + 10}" fill="#fff" font-size="40" font-weight="700">${i + 1}</text>`).join('');
    panel.querySelector('.steps').innerHTML = s;
    for (const b of panel.querySelectorAll('[data-lf]')) b.classList.toggle('go', b.dataset.lf === calib.floor);
    panel.querySelector('#live-save').disabled = !(calib.image.length === 4 && calib.plan.length === 4);
  }
  draw(); connect();
}
