# Cloud Disk and Contemporary Dojo

The two selected ImageGen concepts are now real, walkable waiting-room
environments. In the waiting room, **Room decor** selects **Original room**,
**Cloud Disk**, or **Contemporary Dojo**. The local choice is remembered in
`s5.waiting-room.decor`. The match's map, settings, roster, equipment and Start
flow remain separate from this decor choice.

Size revision 2 (23 October 2026): both rooms were enlarged at the user's
request by **3 on X/Z and 2 on Y**, baked in Blender and the runtime assets.
The disk is now about **30 m in diameter**; the dojo is about **30 × 30 m**,
with an approximately **9 m ceiling**. Geometry, collision surfaces, team
slots, spawn positions and lighting positions follow the same transform.
Characters, movement speed and gameplay camera distances keep their existing
scale. UVs are projected at their existing world density to keep material
grain crisp; shadow coverage and local light reach are expanded to match.
The rebuild script always starts from the original dimensions and applies
the size transform once, so rebuilding does not compound the enlargement.

## Authoring

Created in Blender 5.2.2 through the installed Blender Lab MCP socket bridge on
127.0.0.1:9876, in a dedicated headless process. The authoring response is in
`work/waiting-room-designs-20261022/blender-authoring-result.json`. No model
generator or existing map geometry was used for the architecture.

- `art/waiting-rooms/cloud-disk.blend`: 30 m disk, 12 radial ivory ceramic panels,
  central inset, expansion joints, champagne perimeter service caps, captive
  screws, graphite undertray, ventilation slots, two illuminated curved rails
  and a continuous very clear safety-glass boundary.
- `art/waiting-rooms/contemporary-dojo.blend`: 30 × 30 m room, solid roof,
  pale oak sprung floor, acoustic wall insets, dark structural mullions,
  glazed clerestories, champagne reveals, closed sliding door with recessed
  grip and status light, integrated benches with woven cushions and piping,
  air-return grilles, ceiling cassettes and layered warm light fixtures.
- Both sources retain named editable collections for architecture, floor,
  equipment/details, light fixtures, lighting and cameras. They pack textures.
  The second file also contains the disk scene, selectable in Blender.
- Runtime GLBs merge temporary copies by material: the 126 disk objects and
  230 dojo objects do not each produce separate draw calls. Editable originals
  are kept in the `.blend` files. GLBs stay below 10 MB each.

Rebuild using `tools/blender-waiting-rooms.py` through
`python tools/blender-bridge.py tools/blender-waiting-rooms.py`.
`tools/start-waiting-room-blender-mcp.py` starts the installed official bridge
in a separate headless Blender process when needed. This script does not
change saved Blender preferences. Do not run the authoring script in an
unrelated Blender document: it opens an empty authoring file first.

## Textures and skies

Five specific base-color textures were generated using built-in ImageGen:
oak, ivory ceramic, acoustic mineral plaster, graphite anodized aluminum and
woven bench fabric. Originals are **1254 × 1254**; the requested prompt size
is not represented as the actual delivered size. Original images and prompt
set are retained under `art/waiting-rooms/`.

`tools/prepare-waiting-room-textures.py` creates 1024² game derivatives with
periodic edge treatment, plus restrained normal and roughness maps. Those
two PBR channels are artistic luminance-derived approximations, not measured
scans. Originals are unchanged. Details and hashes:
`public/assets/waiting-rooms/textures/provenance.json`.

- Disk: built-in ImageGen full spherical 2:1 cloud panorama, **1774 × 887**,
  displayed at original resolution. It is not described as native 4K.
- Dojo: directly generated **3840 × 1920** PNG from the authorized OpenAI Image
  API, `gpt-image-2`, high quality, using the bundled imagegen CLI. This is the
  same equirectangular format as Alice House. No upscaling. The existing Windows
  variable was made available to the generation process under the CLI's
  expected variable name; the key was not printed or saved in this project.
  See `art/waiting-rooms/dojo-panorama-api-provenance.json` and
  `work/waiting-room-designs-20261022/dojo-panorama-prompt.txt`.
- The unused built-in dojo sky draft is retained in
  `art/waiting-rooms/source-textures/dojo-sky-draft.png`, outside runtime assets.

The visible panorama and PBR reflection environment are separate. Each decor
owns its hemisphere fill, key/fill lights and optional warm local lights.
Emissive fixture materials are paired with actual scene lights; toon actors
receive diffuse fill indoors. Authored lighting replaces only the waiting
room's default lights. The prepared match scene is not relit by these rooms.

## Collision and lifecycle

Only intentional floor, boundary, ceiling, door and bench volumes contribute
collision triangles. Decorative screws, piping, vents and light trim don't
alter movement. There are 24 explicitly authored team slots per environment.
Authored slots use the existing floor-projection policy. These additions do
not claim native standby-room placement or physics certification; native
readiness flags remain false. The original room's observed placement and
native source loader are retained unchanged.

Changing decor stages the next world before committing it, keeps actors,
repositions the roster and resets room movement/camera. Failed or cancelled
loads dispose their resources and retain the current world. Start, Leave and
decor controls are disabled during a change. Only the active decor is kept;
GPU geometry, maps, shadow resources and environment targets are released
when replacing it.

## Verification

- 113 targeted tests pass: source room locomotion and real male/female rigs,
  eight directions, neutral, jump/landing, input/gamepad, camera clearance,
  both authored collision worlds, all team placements, GLB/material budgets,
  decor transactions, failed loads and late disposal. Logs:
  `work/waiting-room-designs-20261022/final-regressions.tap`.
- Production Vite build passes. Existing chunk/import warnings remain.
- Size revision 2: 115 targeted checks pass, including exact 3/2/3 collision
  bounds, enlarged GLB bounds, wider placement/camera checks, and walking to
  the enlarged boundaries with both sexes. Production build succeeds.
  Re-export response, before/after dimensions and current verification logs
  are in `work/waiting-room-resize-20261023/`. Initial screenshots in the older
  work directory describe the first, smaller version.
- Two additional existing main-function VM fixture suites report 36 passes and
  27 failures. The exact same 27 fail with this task's main integration hunk
  removed from the in-memory source read; the working tree is never rolled
  back. These fixtures omit existing dependencies such as
  `disposeConquestEncounter`. Baseline/current TAP logs and the comparison
  preloader are retained in the work directory. They are not counted among the
  113 passing checks.
- Main-game browser captures and observed states are kept in the same work
  directory. Blender overview renders supplement main-game checks; they do
  not replace them.
- Male and female characters were visually inspected in both rooms, with
  keyboard movement and return to neutral. Dojo observations include the
  real `00008:upper` moving clip and `00074:upper` neutral clip. Cloud movement
  changed the real actor position; some screenshots/state reads occurred
  after release and therefore show neutral. The eight clip mappings are
  verified separately by the targeted real-rig tests.
- Real Start → result screen → automatic room return was checked from the
  disk (male) and dojo (female). Victory was arranged using the existing
  explicit `?qa=modes` UI fixture. This validates the actual scene lifecycle
  and timer, not five naturally played winning rounds. The female final
  check used the production preview after development-server reloads.

The sky is a static panorama; cloud geometry does not simulate weather. There
is no screen-space bloom dependency. Local emissive trim provides the light
fixture appearance in the room's normal renderer.
