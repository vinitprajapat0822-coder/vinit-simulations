# Vinit Simulation Hub 🚀

Mobile-friendly interactive physics simulation platform for JEE aspirants and science enthusiasts. Inspired by oPhysics breadth with a clean, modern UI.

**Live site:** https://vinitprajapat0822-coder.github.io/vinit-simulations/

## Current Status
- **3 Live Labs**
  - Projectile Motion Lab (vectors, target mode, physics-core)
  - Minimum Speed to Hit Target
  - Floating Ice & Rope Length Lab (Archimedes / buoyancy)
- **~136 Planned** activities across Kinematics, Forces, Conservation, Waves, Optics, E&M, Rotation, Fluids, Modern Physics, Tools & Fun.

## Features
- Accurate JEE-level equations and formulas
- Interactive controls + real-time canvas rendering
- Mobile-first responsive design
- Shared `physics-core.js` for reliable calculations
- Basic unit tests for projectile physics

## Structure
```
index.html          → Hub + catalog
catalog.js          → Activity list (live / coming-soon)
physics-core.js     → Shared projectile physics engine
projects/           → Individual simulation labs
tests/              → Unit tests
```

## Local Development
Just open `index.html` or any file in `projects/` in a browser. No build step required.

## Next Focus
1. Polish existing live labs (edge cases, consistency)
2. Remove any leftover nested folders
3. Add the next high-value kinematics/forces simulation
