# Native rendering and alignment

The overview is now a native Blender/Cycles render at 4096 × 2560. The camera
has no horizontal yaw: the land, building and gate threshold are parallel to
the screen axes. The architectural image receives uniform scaling and translation
only. The former whole-image affine correction has been removed.

The house comes from the existing Matterpak-derived editable reconstruction.
The rectangular land, lawn and planting follow the owner's presentation choices,
not surveyed property boundaries. Furniture is reconstructed and approximate.
This is an architectural visualization, not an as-built survey or a live 3D scan.
The actual Matterpak source and editable Blender files remain in the local
`SuPranu` folder; private source meshes are not published with the site.

The concrete rear passage is actual mesh geometry. The exterior flight follows
the verified landing axis (x = 4.95 m in house coordinates). The gate piers are
rendered, while its two animated leaves share the exported camera anchors.
Plants use individual leaves, the lawn individual blades, and the entrance
limestone gravel. Materials include bump, roughness and physical water shading.

The upper floor is rerendered at 4096 × 4096, 320 samples, with the v24 camera
and every mesh unchanged. The geometry checksum is recorded in
`upper_quality_v25.json`. Its TV visibility mask is rendered from the same
scene, preventing the screen effect from covering objects in front of it.
The accepted close-up ground-floor image is retained: the optional native
ground-floor preview has less furnishing detail and is not substituted for it.

Authored demonstration paths, lighting masks and hit targets retain their old
coordinate space. `studio-overview-projection.mjs` maps only these overlays into
the exported camera. Avatars are positioned in the new space and rendered upright.
The background image itself is never sheared. TV, gate, door, speakers and indoor
fixture anchors come from the native camera rather than a visual CSS adjustment.
Pool and spa animation clips are exported from the visible water meshes, so
animated caustics and jets remain inside the physical coping.

## Reproduce

Set `SUPRANU_SOURCE_DIR` to the existing local `SuPranu` source directory, then run
Blender 5.2 in background mode with `tools/blender/render_property_v25.py` and
`tools/blender/render_upper_quality_v25.py`. The property render also saves
`SuPranu_Property_Native_v25.blend`. The scripts use Cycles/OptiX and keep source
scans and validated v24 geometry unchanged. The web images use WebP quality 96
at the full rendered resolution; the original lossless PNGs remain local.

## Verification

Automated coverage checks identity image transforms, native rectangular boundaries,
rear passage, overlay projection/inverse, rigid gate hinges, TV power on each
visible floor, independent pool/spa circuits, shutter timing and 60-second
scenario clocks. Browser checks also cover screen alignment, equipment controls,
room focus, public scenarios and responsive panel placement.

Checked on 10 November 2026: 87 automated tests pass; the production build
resolves all static references. Browser checks cover both TVs (overview/RDC
and children upstairs), the room focus/return transition, independent water
pumps, aligned gate leaves, arrival and departure end states, the family pool
alert, and the security scenario's closed upper shutters at 32 seconds.
Responsive viewport checks: 390 × 844 has the 390 px control panel below the
terrain with no horizontal overflow; 1024 × 768 has a 714 px scene and a 310 px
right panel, with no horizontal overflow. Desktop was checked at 1280 × 720.
