# Vinit Simulation Hub 🚀

Mobile-friendly interactive physics simulation platform for JEE aspirants and science enthusiasts. Inspired by oPhysics breadth with a clean, modern UI.

**Live site:** https://vinit-simulation.is-a.dev/

**GitHub Pages:** https://vinitprajapat0822-coder.github.io/vinit-simulations/

## Current Status

### 8 Live Labs
**Kinematics**
- Projectile Motion Lab (vectors, target mode, physics-core)
- Minimum Speed to Hit Target
- 1D Motion Graphs
- Uniform Acceleration (SUVAT)
- Free Fall & Gravity
- 2D Vector Lab
- Motion on Incline

**Fluids**
- Floating Ice & Rope Length Lab (Archimedes / buoyancy)

### Planned
~130+ activities across Forces, Conservation, Waves, Optics, E&M, Rotation, Modern Physics, Tools & Fun.

## Features
- Accurate JEE-level equations and formulas
- Interactive controls + real-time canvas rendering
- Mobile-first responsive design
- Shared `physics-core.js` for reliable calculations
- Multiple hub themes
- Basic unit tests for projectile physics

## Structure
```
index.html              → Hub + catalog
catalog.js              → Activity list (live / coming-soon)
physics-core.js         → Shared projectile physics engine
hub-experiences.js/css  → Theme & experience system
hub-home-themes.css     → Home themes
projects/               → Individual simulation labs
tests/                  → Unit tests
```

## Local Development
Just open `index.html` or any file in `projects/` in a browser. No build step required.

## Next Focus
1. Polish existing live labs for consistency
2. Modern Physics section (Photoelectric, Bohr, de Broglie, Radioactivity)
3. Forces & Waves labs
