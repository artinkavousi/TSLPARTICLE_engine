 🚧 Three.js TSL Particle Engine – Development Roadmap

> **Repository:** `three.js-tsl-particles-system`
> **Engine Target:** Three.js **r177+** with full WebGPU & TSL node-graph workflow
> **Document version:** v0.1 ( autogenerated roadmap – Jun 2025 )

---

## 0 · Purpose & Scope
This document translates the high-level vision laid out in:

* `living_motion_particle_engine_tech_stack_module_blueprint_document_2.md`
* `particle_engine_vision.md`
* `tsl_particle_engine_guide.md`

into an actionable plan for **this** codebase.  It is meant to be the single source of truth for:

1. Current state audit
2. Gap analysis vs. target capabilities
3. Phased milestones & deliverables
4. Detailed task/todo tracker
5. Engineering guidelines & conventions
6. Progress reporting template

---

## 1 · Current State Audit (Jun 2025)

| Area | Implementation | Notes |
|------|----------------|-------|
| **Core renderer** | WebGPURenderer initialised in `src/script.js` | Good baseline on r177 |
| **Particle update** | `ParticlesSystem.js` — single compute pass (turbulence + gravity + floor bounce) | Uses TSL & curlNoise4d |
| **Rendering** | `SpriteNodeMaterial` instanced sprites | Basic additive blending |
| **Controls/UI** | lil-GUI presets, Orbit / Transform controls | Helpful for tuning |
| **Utilities** | `Grid.js` decorative floor | ‑ |
| **Noise library** | curl/ simplex noise helpers under `src/tsl/` | Reusable |
| **Modularity** | Flat file structure; no separate `core/ physics/ fields/…` directories | Needs refactor |
| **Testing** | None | Must add unit + visual regression |
| **Docs** | High-level spec files only | Need per-module docs |

> **Summary:** Proof-of-concept **single** particle system; no multi-pass physics, field systems, or modular architecture yet.

---

## 2 · Target Capability Summary (vision-derived)

1. **Modular Node-centric architecture** (`core/`, `physics/`, `fields/`, `materials/`, `interaction/`, `morphing/`, `utils/`).
2. **Multiple physics solvers**:  
   • Position-Based Dynamics (cloth, soft-body)  
   • Smoothed Particle Hydrodynamics (fluids)  
   • Material Point Method (granular, deformable)  
   • Boids / emergent behaviour.
3. **Field systems**: vector, vortex, biological (Physarum), noise, vortex etc.
4. **Advanced materials**: volumetric sprites, energy glow, life-based fade, billboard, ribbon trails.
5. **Interaction layers**: audio-reactive, user input, XR, network sync.
6. **Tooling**: hot-reload, profiler, visual node editor.
7. **Scalability**: 1 M+ particles @60 FPS on tier-B GPUs.
8. **Testing & QA**: unit tests, shader hash golden files, perf regression gate.

---

## 3 · Gap Analysis

| Capability | Current | Needed |
|------------|---------|--------|
| Directory architecture | Flat | Modular folders (core/ physics/ …) |
| Physics solvers | Verlet-like | PBS, SPH, MPM, Boids |
| Field forces | curl noise only | Full vector/biological/vortex field lib |
| Material variety | Basic sprite | ParticleMaterial, ribbons, volumetrics |
| Interaction | Emitter transform | Audio, user input, network |
| Post-FX | None | Bloom, DOF, motion-blur |
| Testing | None | Unit + visual regression + perf bench |
| Docs automation | Manual | Auto-generated API docs |

---

## 4 · Phased Milestones

> Milestones are cumulative; each phase should leave the engine **usable & documented**.

### Phase 1 – Repo Re-organisation & Infrastructure (ETA 1 week)
1. Migrate source to `src/` sub-folders (`core`, `physics`, `fields`, …).
2. Integrate **Vite** + hot-module-reload for faster dev.
3. Add **ESLint + Prettier** config; enforce via pre-commit hook.
4. Set up **Vitest** (unit) & **Playwright** (visual) test harness.

### Phase 2 – Core Engine Abstraction (ETA 2 weeks)
1. Extract `ParticleEngine` class (`core/ParticleEngine.js`) handling:  
   • buffer allocation  
   • compute dispatch  
   • render list  
   • per-frame scheduler.
2. Provide plugin system (`engine.addSystem(new SmoothParticleHydrodynamics())`).
3. Implement **buffer pooling** util (`utils/BufferManager.js`).

### Phase 3 – Physics Systems v1 (ETA 3 weeks)
1. Port **Position-Based System** (cloth) from spec.  
2. Add **BoidsSystem** flocking.  
3. Expose toggles in GUI; validate with visual tests.

### Phase 4 – Field Systems v1 (ETA 2 weeks)
1. Implement `VectorField` (noise + vortex presets).
2. Create compute pass that sums forces per-particle pre-physics.

### Phase 5 – Advanced Rendering (ETA 2 weeks)
1. Introduce `ParticleMaterial.js` (billboard + glow + life fade).
2. Support **instanced ribbons** (trails) experiment.

### Phase 6 – Interaction Layer (ETA 2 weeks)
1. `SoundReactive` system: WebAudio analyser → uniform.
2. `UserInteraction` forces: mouse / touch attractors.

### Phase 7 – Optimisation & Scaling (ETA open)
1. GPU statistics overlay; integrate `PerformanceMonitor` util.
2. Batch compute passes; explore workgroup optimisation.
3. Target 1 M particles demo.

### Phase 8 – Documentation & Examples (continuous)
1. Storybook / MDX playground showcasing nodes.
2. Auto-generate API docs from JSDoc.

> **Stretch Phases:** SPH fluids, MPM, network sync, XR.

---

## 5 · Detailed Task Tracker

Use the following table in PR descriptions; update `%complete` badge each merge.

| ID | Task | Owner | Dep | Status |
|----|------|-------|-----|--------|
| 1-1 | Create `core/` folder & move `ParticlesSystem` → `core/ParticleSystem.js` | | Phase 1 | ☐ |
| 1-2 | Add ESLint config & CI lint job | |  | ☐ |
| 1-3 | Setup Vitest & write smoke test for buffer sizes | |  | ☐ |
| 2-1 | Implement `ParticleEngine` orchestrator | | Phase 2 | ☐ |
| 2-2 | BufferManager util with pooling | |  | ☐ |
| 3-1 | Port PositionBasedSystem compute node | | Phase 3 | ☐ |
| 3-2 | Integrate BoidsSystem | | | ☐ |
| 4-1 | VectorField noise force | | Phase 4 | ☐ |
| 5-1 | `ParticleMaterial` advanced shader | | Phase 5 | ☐ |
| 6-1 | Audio analyser uniform injection | | Phase 6 | ☐ |
| 7-1 | Perf overlay (GPU time queries) | | Phase 7 | ☐ |

*(keep expanding as needed)*

---

## 6 · Engineering Guidelines

1. **Iterate, don't rewrite** – extend existing nodes where possible.
2. **GPU-first** – favour compute passes over CPU loops.
3. **Determinism** – expose `seed` uniform for random streams.
4. **Code style** – Standard JS + ESLint; camelCase vars; PascalCase classes.
5. **Docs** – each public class gains a `/** @public */` JSDoc block.

---

## 7 · Progress Reporting Template

```markdown
### Weekly Report – <date>
- Completed: <list>
- In-Progress: <list>
- Blockers: <list>
- Next: <list>
```

---

## 8 · References & Resources

* Three.js r177 WebGPU docs – <https://threejs.org/docs/?q=WebGPURenderer>
* Living-Motion spec v0.4 (this repo /docs)
* WebGPU inspector & capture – Chrome Canary `Shift+Alt+C`

---

> **End of file** – PRs must update this roadmap as milestones close. 