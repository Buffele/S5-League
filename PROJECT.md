# Project orientation

S5 League is a Three.js + Vite browser game project. This packet contains readable
sources and original resources so developers can run, study, modify, and rebuild
the current implementation.

## Start here

1. Follow installation and launch instructions in [README.md](README.md).
2. Read [AGENTS.md](AGENTS.md) for project navigation and validation rules.
3. Trace `index.html` → `src/bootstrap.js` → `src/main.js`.
4. Use [ARMES.md](ARMES.md) for weapon implementation entry points.

`src/` owns the implementation. `public/assets/` holds runtime resources.
`docs/` contains contracts and research history. The two included helpers support
the game and compilation; advanced import tools and full research-dependent tests
are outside the scope of this packet.

## Historical material

The original project record is preserved in
[docs/source-history/PROJECT-original.md](docs/source-history/PROJECT-original.md).
It is historical context, not a guarantee that every old plan or verification
describes the current state. Earlier root guides and Git attributes are archived
alongside it in `docs/source-history/`.

The public entry guides are English. Original code comments, technical notes,
resource names, and research evidence have not all been translated. References
to excluded `work/`, authoring sources, captures, or native installations remain
context only. Consult [VALIDATION.json](VALIDATION.json) for the checks actually
performed on this developer packet and their limitations.

## Resource and behavior integrity

This portable edition normalizes internal names and paths across source, assets,
and documentation. Keep resource references and distributed-file digests in sync,
and retain separate authored provenance identities where required by validators.
Physics and weapon parameters are not retuned by this packaging change.
Generated exports and a successful load are not sufficient evidence of complete
collision, animation, timing, or gameplay parity. See `VALIDATION.json` for the
actual checks performed on this edition.
