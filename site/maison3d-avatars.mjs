// Bonaparks avatars: stylised, articulated people and dogs for the live house.
// Original design (no third-party model): soft proportions, a readable face, hair styles, clothes in the real colours
// the cameras see, and a small rig (hips, spine, head, two-part arms and legs) so they walk, breathe, sit and sleep.

export function avatars(T) {
  const geo = new Map();
  const g = (key, make) => { if (!geo.has(key)) geo.set(key, make()); return geo.get(key); };
  const cap = (r, l) => g(`c${r}_${l}`, () => new T.CapsuleGeometry(r, l, 6, 14));
  const sph = r => g(`s${r}`, () => new T.SphereGeometry(r, 22, 16));
  const box = (x, y, z, r = 0) => g(`b${x}_${y}_${z}`, () => { const b = new T.BoxGeometry(x, y, z, 2, 2, 2); if (r) round(b, r); return b; });
  function round(b, r) {                                // soften a box: push its vertices toward a rounded shape
    const p = b.attributes.position, v = new T.Vector3(), h = new T.Vector3();
    b.computeBoundingBox(); b.boundingBox.getSize(h).multiplyScalar(.5);
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const c = v.clone().clamp(h.clone().negate().addScalar(r), h.clone().subScalar(r)); v.sub(c).setLength(Math.min(r, v.length())).add(c); p.setXYZ(i, v.x, v.y, v.z); }
    b.computeVertexNormals();
  }
  const mat = (color, rough = .7, extra = {}) => new T.MeshStandardMaterial({color, roughness: rough, metalness: 0, transparent: true, ...extra});
  const mesh = (gm, m, parent, x = 0, y = 0, z = 0) => { const o = new T.Mesh(gm, m); o.position.set(x, y, z); o.castShadow = true; parent.add(o); return o; };
  const pivot = (parent, x, y, z) => { const p = new T.Group(); p.position.set(x, y, z); parent.add(p); return p; };
  const SKIN = [0xf1c7a5, 0xe0ac82, 0xc68b5e, 0x8d5a3b];

  // ---------- a person
  function human({kind = 'adulte', top = 0x7aa2e3, bottom = 0x2f3f5c, hair = 0x3a2a20, skin = SKIN[1], eyes = 0x5a3b26, style, accent = 0x7fd3a0} = {}) {
    const child = kind === 'enfant';
    const root = new T.Group(), body = pivot(root, 0, 0, 0); root.rotation.order = 'YXZ';   // lying: turn, then lie on the back
    const m = {skin: mat(skin, .55), top: mat(top, .8), bottom: mat(bottom, .85), hair: mat(hair, .55), shoe: mat(0xe9ecf1, .5), sole: mat(0xffffff, .6), lace: mat(0x2b3242, .5),
               iris: mat(eyes, .3), eye: mat(0x14171d, .25), white: mat(0xfbfbf8, .25), mouth: mat(0xb5605a, .6), shine: new T.MeshBasicMaterial({color: 0xffffff, transparent: true}),
               ring: new T.MeshBasicMaterial({color: accent, transparent: true, opacity: .55, depthWrite: false})};
    const hips = pivot(body, 0, .9, 0);
    mesh(box(.29, .15, .18, .07), m.bottom, hips, 0, -.01, 0);                                    // pelvis
    const spine = pivot(hips, 0, .05, 0);
    const belly = mesh(cap(.125, .1), m.top, spine, 0, .1, 0); belly.scale.set(1.08, 1, .8);         // waist
    const chest = mesh(cap(.14, .15), m.top, spine, 0, .27, 0); chest.scale.set(1.2, 1, .76);        // chest, tapered to the waist
    mesh(g('hem', () => new T.TorusGeometry(.128, .012, 8, 28)), m.bottom, spine, 0, .02, 0).rotation.x = Math.PI / 2;   // belt line
    mesh(g('collar', () => new T.TorusGeometry(.05, .012, 8, 20)), m.top, spine, 0, .44, 0).rotation.x = Math.PI / 2;
    mesh(cap(.045, .06), m.skin, spine, 0, .48, 0);                                                // neck
    const head = pivot(spine, 0, .63, 0);
    const skull = mesh(sph(.13), m.skin, head, 0, .02, 0); skull.scale.set(.93, 1.06, .98);
    mesh(sph(.06), m.skin, head, 0, -.055, .05).scale.set(1.15, .75, .85);                         // jaw and cheeks
    for (const s of [-1, 1]) {                                                                      // big friendly eyes, brows, ears
      mesh(sph(.024), m.white, head, s * .046, .03, .108).scale.set(1, 1.1, .5);
      mesh(sph(.015), m.iris, head, s * .046, .028, .118).scale.set(1, 1, .45);
      mesh(sph(.008), m.eye, head, s * .046, .028, .123).scale.set(1, 1, .4);
      mesh(sph(.004), m.shine, head, s * .046 + .005, .034, .127);
      const brow = mesh(box(.042, .01, .012, .004), m.hair, head, s * .047, .072, .113); brow.rotation.z = -s * .14;
      mesh(sph(.026), m.skin, head, s * .122, .015, 0).scale.set(.45, 1, .75);
    }
    mesh(sph(.017), m.skin, head, 0, -.004, .127).scale.set(.85, .9, 1.1);                          // nose
    const smile = mesh(g('smile', () => new T.TorusGeometry(.017, .004, 6, 16, Math.PI)), m.mouth, head, 0, -.04, .121); smile.rotation.z = Math.PI;
    hairStyle(style || (child ? 'boucles' : 'court'), head, m.hair);
    // arms: rounded shoulder joint, sleeve, elbow joint, forearm, hand ; no gaps between the parts
    const arms = [-1, 1].map(s => {
      const sh = pivot(spine, s * .19, .38, 0);
      mesh(sph(.058), m.top, sh, 0, 0, 0);
      mesh(cap(.05, .17), m.top, sh, 0, -.13, 0);
      const el = pivot(sh, 0, -.26, 0);
      mesh(sph(.044), m.skin, el, 0, 0, 0);
      mesh(cap(.04, .17), m.skin, el, 0, -.11, 0);
      const hand = mesh(sph(.048), m.skin, el, 0, -.245, .006); hand.scale.set(.8, 1, .62);
      sh.rotation.z = s * .1;
      return {sh, el};
    });
    // legs: hip joint, thigh, knee joint, shin, sneaker with a light sole
    const legs = [-1, 1].map(s => {
      const hp = pivot(hips, s * .085, -.05, 0);
      mesh(sph(.072), m.bottom, hp, 0, 0, 0);
      mesh(cap(.068, .28), m.bottom, hp, 0, -.2, 0);
      const kn = pivot(hp, 0, -.41, 0);
      mesh(sph(.06), m.bottom, kn, 0, 0, 0);
      mesh(cap(.056, .28), m.bottom, kn, 0, -.19, 0);
      mesh(box(.118, .085, .27, .04), m.shoe, kn, 0, -.38, .045);                                   // a clear sneaker, easy to see on a dark floor
      mesh(box(.124, .026, .28, .01), m.sole, kn, 0, -.425, .045);
      mesh(box(.122, .02, .09, .008), m.lace, kn, 0, -.34, .1);                                      // its dark laces band
      return {hp, kn};
    });
    const ring = new T.Mesh(g('ring', () => new T.RingGeometry(.26, .34, 40)), m.ring); ring.rotation.x = -Math.PI / 2; ring.position.y = .02; root.add(ring);
    body.scale.setScalar(child ? .56 : 1);
    if (child) head.scale.setScalar(1.28);                                                          // toddler proportions: a bigger head
    root.userData = {rig: {body, hips, spine, head, arms, legs, ring}, mats: m, tall: child ? 1.0 : 1.76, kind, phase: Math.random() * 6, child};
    return root;
  }
  function hairStyle(style, head, m) {
    if (style === 'boucles') {                                                                   // curly: a cloud of small curls
      for (let i = 0; i < 26; i++) {
        const a = i / 26 * Math.PI * 2 * 2.3, up = .3 + (i % 5) * .14, r = .132;
        const x = Math.cos(a) * r * Math.cos(up), z = Math.sin(a) * r * Math.cos(up) - .01, y = .03 + Math.sin(up) * r * 1.05;
        if (z > .07 && y < .08) continue;                                                        // keep the face clear
        mesh(sph(.036 + (i % 3) * .006), m, head, x, y, z);
      }
      mesh(sph(.118), m, head, 0, .075, -.02).scale.set(1, .8, 1);
    } else if (style === 'long') {
      mesh(sph(.138), m, head, 0, .05, -.016).scale.set(1, .9, 1.02);
      mesh(box(.22, .26, .07, .03), m, head, 0, -.08, -.08);
    } else {                                                                                     // short
      const capm = mesh(sph(.137), m, head, 0, .055, -.018); capm.scale.set(1, .8, 1.02);           // short: sits on the whole skull
      mesh(sph(.06), m, head, 0, .095, .07).scale.set(1.6, .55, .8);                               // a soft fringe
    }
  }

  // ---------- a dog
  function dog({fur = 0xb48a5a, accent = 0xf4bd6d} = {}) {
    const root = new T.Group(), body = pivot(root, 0, 0, 0);
    const m = {fur: mat(fur, .9), dark: mat(0x1b1f27, .4), nose: mat(0x2a2023, .3), tongue: mat(0xd9707a, .6),
               ring: new T.MeshBasicMaterial({color: accent, transparent: true, opacity: .55, depthWrite: false})};
    const trunk = pivot(body, 0, .36, 0);
    const torso = mesh(cap(.12, .36), m.fur, trunk, 0, 0, 0); torso.rotation.x = Math.PI / 2; torso.scale.set(1, 1, .95);
    const head = pivot(trunk, 0, .14, .3);
    mesh(sph(.1), m.fur, head, 0, 0, 0);
    mesh(cap(.05, .07), m.fur, head, 0, -.03, .1).rotation.x = Math.PI / 2;                      // snout
    mesh(sph(.024), m.nose, head, 0, -.02, .165);
    for (const s of [-1, 1]) {
      mesh(sph(.014), m.dark, head, s * .045, .03, .085);
      const ear = mesh(box(.05, .1, .02, .01), m.fur, head, s * .07, .06, -.01); ear.rotation.z = s * .5; ear.rotation.x = -.2;
    }
    const tail = pivot(trunk, 0, .06, -.27); mesh(cap(.022, .16), m.fur, tail, 0, .09, -.03).rotation.x = -.6;
    const legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => { const p = pivot(trunk, sx * .07, -.06, sz * .2); mesh(cap(.035, .2), m.fur, p, 0, -.14, 0); mesh(sph(.04), m.fur, p, 0, -.27, .015); return p; });
    const ring = new T.Mesh(g('ring', () => new T.RingGeometry(.26, .34, 40)), m.ring); ring.rotation.x = -Math.PI / 2; ring.position.y = .02; root.add(ring);
    root.userData = {rig: {body, trunk, head, tail, legs, ring}, mats: m, tall: .62, kind: 'animal', phase: Math.random() * 6};
    return root;
  }

  // ---------- animation: walk cycle from the real speed, breathing at rest, sitting, lying
  function animate(node, {speed = 0, sitting = false, lying = false, t = 0, dt = .016}) {
    const u = node.userData, r = u.rig; if (!r) return;
    const walk = Math.min(1, speed / .7);
    u.phase += dt * (3 + speed * 6.5);
    const s = Math.sin(u.phase), c = Math.cos(u.phase), ease = (cur, to, k = 8) => cur + (to - cur) * Math.min(1, dt * k);
    if (u.kind === 'animal') {
      r.legs.forEach((p, i) => { p.rotation.x = ease(p.rotation.x, lying ? 1.3 : sitting && i > 1 ? -1.2 : Math.sin(u.phase + (i % 3 ? Math.PI : 0)) * .55 * walk); });
      r.tail.rotation.y = Math.sin(t * (walk > .1 ? 14 : 7)) * .5;
      r.head.rotation.x = ease(r.head.rotation.x, lying ? .25 : sitting ? -.2 : Math.sin(t * 1.3) * .05);
      r.trunk.rotation.x = ease(r.trunk.rotation.x, sitting ? -.45 : 0, 5);
      r.trunk.position.y = ease(r.trunk.position.y, lying ? .16 : sitting ? .3 : .36 + Math.abs(s) * .02 * walk, 6);
      return;
    }
    const sit = sitting ? 1 : 0;
    r.legs.forEach(({hp, kn}, i) => {
      const side = i ? 1 : -1, sw = side * s;
      hp.rotation.x = ease(hp.rotation.x, lying ? .05 : sit ? -1.45 : sw * .55 * walk);
      kn.rotation.x = ease(kn.rotation.x, lying ? .15 : sit ? 1.5 : Math.max(0, -side * c) * .8 * walk);
    });
    r.arms.forEach(({sh, el}, i) => {
      const side = i ? 1 : -1;
      sh.rotation.x = ease(sh.rotation.x, lying ? -.15 : sit ? -.5 : -side * s * .45 * walk);
      sh.rotation.z = ease(sh.rotation.z, side * (lying ? .25 : .08));
      el.rotation.x = ease(el.rotation.x, lying ? -.2 : sit ? -.9 : -.25 - .35 * walk);
    });
    r.hips.position.y = ease(r.hips.position.y, (sit ? .48 : .9) + (walk > .05 ? Math.abs(c) * .03 * walk : 0), 10);
    r.spine.rotation.x = ease(r.spine.rotation.x, sit ? -.08 : walk * .08);
    r.spine.scale.y = 1 + Math.sin(t * 2.1) * .012 * (1 - walk);                              // breathing
    r.head.rotation.y = ease(r.head.rotation.y, lying ? 0 : Math.sin(t * .4 + u.phase * .05) * .25 * (1 - walk), 2);
    r.head.rotation.z = ease(r.head.rotation.z, lying ? .25 : 0, 3);
    r.ring.visible = !lying;
  }

  // the real colours seen by the camera (top, bottom, hair / fur) are applied without rebuilding the avatar
  function dress(node, colors) {
    const m = node.userData.mats; if (!m || !colors) return;
    const set = (mm, c) => { if (mm && c) mm.color.lerp(new T.Color(c), .15); };
    if (node.userData.kind === 'animal') set(m.fur, colors.top);
    else { set(m.top, colors.top); set(m.bottom, colors.bottom); set(m.hair, colors.hair); }
  }

  return {human, dog, animate, dress};
}
