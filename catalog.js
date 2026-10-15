/* Vinit Simulation Hub — Activity Catalog */
const CATALOG = [
  // KINEMATICS (14)
  { id: "projectile", title: "Projectile Motion Lab", desc: "Trajectories, range, max height, flight time, target angles & minimum launch speed.", category: "kinematics", tags: "projectile trajectory launch angle gravity range", status: "live", url: "projects/projectile.html", icon: "🚀" },
  { id: "min-speed-target", title: "Minimum Speed to Hit Target", desc: "Find the smallest launch speed from (0,0) so the trajectory passes through a given point (x,y). Includes optimal angle and detailed analysis.", category: "kinematics", tags: "minimum speed target projectile trajectory", status: "live", url: "projects/min-speed-target.html", icon: "🎯" },
  { id: "kinematics-1d", title: "1D Motion Graphs", desc: "Position, velocity and acceleration graphs with interactive controls and real-time animation.", category: "kinematics", tags: "1d motion graphs velocity acceleration", status: "live", url: "projects/kinematics-1d.html", icon: "📈" },
  { id: "free-fall", title: "Free Fall & Gravity", desc: "Objects falling under gravity with air resistance options.", category: "kinematics", tags: "free fall gravity acceleration", status: "coming-soon", icon: "⬇️" },
  { id: "relative-motion", title: "Relative Velocity", desc: "Boat crossing river, rain on moving frame and relative velocity diagrams.", category: "kinematics", tags: "relative velocity boat river", status: "coming-soon", icon: "🛶" },
  { id: "vectors-2d", title: "2D Vector Lab", desc: "Add, resolve and visualize vectors in plane with components.", category: "kinematics", tags: "vectors components magnitude direction", status: "coming-soon", icon: "↗" },
  { id: "uniform-accel", title: "Uniform Acceleration", desc: "Equations of motion with real-time graphs and adjustable values.", category: "kinematics", tags: "suvat equations acceleration", status: "coming-soon", icon: "🏎️" },
  { id: "projectile-3d", title: "3D Projectile View", desc: "Simple 3D visualization of projectile path (lightweight).", category: "kinematics", tags: "3d projectile trajectory", status: "coming-soon", icon: "🌐" },
  { id: "motion-on-incline", title: "Motion on Incline", desc: "Acceleration, time and velocity on inclined plane.", category: "kinematics", tags: "incline plane acceleration friction", status: "coming-soon", icon: "📐" },
  { id: "circular-motion-intro", title: "Uniform Circular Motion", desc: "Centripetal acceleration, period and frequency visualizer.", category: "kinematics", tags: "circular motion centripetal", status: "coming-soon", icon: "🔄" },
  { id: "position-time", title: "Position-Time Graph Builder", desc: "Draw motion from graphs and interpret slopes.", category: "kinematics", tags: "position time graph slope", status: "coming-soon", icon: "📊" },
  { id: "velocity-time", title: "Velocity-Time Graph Lab", desc: "Area under curve = displacement, interactive analysis.", category: "kinematics", tags: "velocity time area displacement", status: "coming-soon", icon: "📉" },
  { id: "river-boat", title: "River-Boat Problems", desc: "Minimum time, minimum distance and resultant velocity.", category: "kinematics", tags: "river boat relative velocity", status: "coming-soon", icon: "⛵" },
  { id: "projectile-air", title: "Projectile with Air Drag", desc: "Compare ideal vs realistic trajectory with drag force.", category: "kinematics", tags: "air resistance drag projectile", status: "coming-soon", icon: "🌬️" },
  { id: "multi-stage", title: "Multi-stage Motion", desc: "Piecewise motion with different accelerations.", category: "kinematics", tags: "multi stage kinematics", status: "coming-soon", icon: "🧩" },

  // FORCES (8)
  { id: "newtons-laws", title: "Newton's Laws Explorer", desc: "Interactive demonstration of all three laws of motion.", category: "forces", tags: "newton laws force mass acceleration", status: "coming-soon", icon: "⚖️" },
  { id: "friction-lab", title: "Friction Lab", desc: "Static vs kinetic friction, coefficients and limiting friction.", category: "forces", tags: "friction static kinetic coefficient", status: "coming-soon", icon: "🧱" },
  { id: "inclined-plane-force", title: "Forces on Incline", desc: "Resolve weight, normal and friction on inclined plane.", category: "forces", tags: "incline forces normal friction", status: "coming-soon", icon: "⛰️" },
  { id: "atwood", title: "Atwood Machine", desc: "Two masses connected by string over pulley — acceleration & tension.", category: "forces", tags: "atwood machine pulley tension", status: "coming-soon", icon: "🔗" },
  { id: "spring-force", title: "Hooke's Law & Springs", desc: "Force vs extension, spring constant and energy.", category: "forces", tags: "hooke spring force extension", status: "coming-soon", icon: "🌀" },
  { id: "tension-systems", title: "Tension in Strings", desc: "Multiple masses and strings — tension calculation visualizer.", category: "forces", tags: "tension string systems", status: "coming-soon", icon: "🪢" },
  { id: "pseudo-force", title: "Pseudo Force (Non-inertial)", desc: "Accelerating frames and fictitious forces.", category: "forces", tags: "pseudo force non inertial frame", status: "coming-soon", icon: "🚌" },
  { id: "force-equilibrium", title: "Force Equilibrium", desc: "Coplanar forces in equilibrium — Lami's theorem visual.", category: "forces", tags: "equilibrium concurrent forces", status: "coming-soon", icon: "⚖️" },

  // CONSERVATION (8)
  { id: "work-energy", title: "Work-Energy Theorem", desc: "Work done by forces equals change in kinetic energy.", category: "conservation", tags: "work energy theorem kinetic", status: "coming-soon", icon: "⚡" },
  { id: "potential-energy", title: "Gravitational PE & Springs", desc: "Potential energy curves and conservation checks.", category: "conservation", tags: "potential energy gravity spring", status: "coming-soon", icon: "🏔️" },
  { id: "momentum-1d", title: "1D Collisions", desc: "Elastic and inelastic collisions with momentum conservation.", category: "conservation", tags: "collision momentum elastic inelastic", status: "coming-soon", icon: "💥" },
  { id: "momentum-2d", title: "2D Collisions", desc: "Two-dimensional collision analysis with vectors.", category: "conservation", tags: "2d collision momentum vectors", status: "coming-soon", icon: "🎯" },
  { id: "impulse", title: "Impulse & Momentum", desc: "Force-time graphs and change in momentum.", category: "conservation", tags: "impulse momentum force time", status: "coming-soon", icon: "👊" },
  { id: "power", title: "Power & Efficiency", desc: "Instantaneous and average power calculations.", category: "conservation", tags: "power efficiency work rate", status: "coming-soon", icon: "🔋" },
  { id: "energy-conservation", title: "Mechanical Energy Conservation", desc: "KE + PE constant in conservative systems.", category: "conservation", tags: "mechanical energy conservation", status: "coming-soon", icon: "♻️" },
  { id: "rocket-momentum", title: "Variable Mass Systems", desc: "Rocket equation basics and thrust visualization.", category: "conservation", tags: "rocket variable mass thrust", status: "coming-soon", icon: "🚀" },

  // WAVES (selected core 20 for now)
  { id: "shm-basic", title: "Simple Harmonic Motion", desc: "Mass-spring and pendulum SHM with phase and energy.", category: "waves", tags: "shm simple harmonic motion spring", status: "coming-soon", icon: "〰️" },
  { id: "pendulum", title: "Simple Pendulum", desc: "Period, length and g measurement simulator.", category: "waves", tags: "pendulum period length gravity", status: "coming-soon", icon: "🕰️" },
  { id: "wave-on-string", title: "Wave on a String", desc: "Transverse wave speed, frequency and wavelength.", category: "waves", tags: "wave string transverse speed", status: "coming-soon", icon: "🎸" },
  { id: "superposition", title: "Wave Superposition", desc: "Constructive and destructive interference of waves.", category: "waves", tags: "superposition interference phase", status: "coming-soon", icon: "🌊" },
  { id: "standing-waves", title: "Standing Waves", desc: "Nodes, antinodes and harmonics on string & pipe.", category: "waves", tags: "standing wave nodes harmonics", status: "coming-soon", icon: "🎻" },
  { id: "beats", title: "Beats Phenomenon", desc: "Two close frequencies producing audible beats.", category: "waves", tags: "beats frequency difference", status: "coming-soon", icon: "🎵" },
  { id: "doppler", title: "Doppler Effect", desc: "Frequency shift for moving source and observer.", category: "waves", tags: "doppler effect frequency shift", status: "coming-soon", icon: "🚨" },
  { id: "sound-waves", title: "Sound Wave Properties", desc: "Speed of sound, intensity and loudness basics.", category: "waves", tags: "sound speed intensity", status: "coming-soon", icon: "🔊" },
  { id: "resonance", title: "Resonance & Forced Oscillations", desc: "Resonance curve and damping effects.", category: "waves", tags: "resonance forced oscillation damping", status: "coming-soon", icon: "📡" },
  { id: "organ-pipe", title: "Organ Pipes & Air Columns", desc: "Open and closed pipes — harmonics and end correction.", category: "waves", tags: "organ pipe harmonics closed open", status: "coming-soon", icon: "🎹" },
  { id: "string-harmonics", title: "String Harmonics", desc: "Fundamental and overtones on vibrating string.", category: "waves", tags: "string harmonics overtones", status: "coming-soon", icon: "🪕" },
  { id: "wave-equation", title: "Wave Equation Explorer", desc: "y = A sin(ωt − kx) interactive plot.", category: "waves", tags: "wave equation sine progressive", status: "coming-soon", icon: "📐" },
  { id: "shm-energy", title: "Energy in SHM", desc: "KE and PE exchange in simple harmonic motion.", category: "waves", tags: "shm energy kinetic potential", status: "coming-soon", icon: "⚡" },
  { id: "damped-shm", title: "Damped Oscillations", desc: "Under, critical and over damping comparison.", category: "waves", tags: "damped oscillation under critical", status: "coming-soon", icon: "📉" },
  { id: "forced-osc", title: "Forced Oscillations", desc: "Driving frequency vs amplitude resonance curve.", category: "waves", tags: "forced oscillation resonance curve", status: "coming-soon", icon: "📊" },
  { id: "interference-path", title: "Path Difference Lab", desc: "Constructive/destructive conditions with path difference.", category: "waves", tags: "path difference constructive destructive", status: "coming-soon", icon: "📏" },
  { id: "sound-resonance", title: "Resonance Tube", desc: "End correction and speed of sound measurement.", category: "waves", tags: "resonance tube end correction", status: "coming-soon", icon: "🧪" },
  { id: "progressive-wave", title: "Progressive Wave Properties", desc: "Amplitude, wavelength, frequency and phase.", category: "waves", tags: "progressive wave properties", status: "coming-soon", icon: "🌊" },
  { id: "echo", title: "Echo & Reverberation", desc: "Time delay and distance calculation with sound.", category: "waves", tags: "echo reverberation distance", status: "coming-soon", icon: "📢" },
  { id: "wave-quiz", title: "Waves Concept Quiz", desc: "Quick MCQs on wave properties and formulas.", category: "waves", tags: "quiz waves mcq practice", status: "coming-soon", icon: "❓" },

  // OPTICS (15)
  { id: "plane-mirror", title: "Plane Mirror", desc: "Image formation, ray diagrams and properties.", category: "optics", tags: "plane mirror image ray", status: "coming-soon", icon: "🪞" },
  { id: "spherical-mirrors", title: "Spherical Mirrors", desc: "Concave & convex mirrors — ray diagrams and formula.", category: "optics", tags: "concave convex mirror formula", status: "coming-soon", icon: "🔮" },
  { id: "mirror-formula", title: "Mirror Formula Calculator", desc: "1/v + 1/u = 1/f with sign convention helper.", category: "optics", tags: "mirror formula sign convention", status: "coming-soon", icon: "🧮" },
  { id: "refraction-plane", title: "Refraction at Plane Surface", desc: "Snell's law and apparent depth.", category: "optics", tags: "refraction snell apparent depth", status: "coming-soon", icon: "💧" },
  { id: "lenses", title: "Thin Lenses", desc: "Convex and concave lens ray diagrams.", category: "optics", tags: "lens convex concave ray", status: "coming-soon", icon: "🔍" },
  { id: "lens-formula", title: "Lens Formula Lab", desc: "1/v − 1/u = 1/f interactive with magnification.", category: "optics", tags: "lens formula magnification", status: "coming-soon", icon: "📐" },
  { id: "prism", title: "Prism & Deviation", desc: "Minimum deviation, refractive index and spectrum.", category: "optics", tags: "prism deviation refractive index", status: "coming-soon", icon: "🔺" },
  { id: "total-internal", title: "Total Internal Reflection", desc: "Critical angle and applications (optical fibre).", category: "optics", tags: "tir critical angle optical fibre", status: "coming-soon", icon: "💎" },
  { id: "dispersion", title: "Dispersion of Light", desc: "Prism spectrum and dispersive power.", category: "optics", tags: "dispersion spectrum prism", status: "coming-soon", icon: "🌈" },
  { id: "optical-instruments", title: "Microscope & Telescope", desc: "Simple ray diagrams and magnifying power.", category: "optics", tags: "microscope telescope magnification", status: "coming-soon", icon: "🔭" },
  { id: "interference-young", title: "Young's Double Silt", desc: "Fringe width, path difference and intensity.", category: "optics", tags: "ydse fringe interference", status: "coming-soon", icon: "🔬" },
  { id: "diffraction", title: "Single Slit Diffraction", desc: "Central maxima and secondary minima pattern.", category: "optics", tags: "diffraction single slit", status: "coming-soon", icon: "✨" },
  { id: "polarization-optics", title: "Polarization of Light", desc: "Malus law and polarizer-analyzer setup.", category: "optics", tags: "polarization malus law", status: "coming-soon", icon: "🕶️" },
  { id: "lens-maker", title: "Lens Maker's Formula", desc: "Relation between R1, R2, μ and f.", category: "optics", tags: "lens maker formula radii", status: "coming-soon", icon: "🛠️" },
  { id: "optics-quiz", title: "Optics Concept Quiz", desc: "MCQs on mirrors, lenses and interference.", category: "optics", tags: "quiz optics mcq", status: "coming-soon", icon: "❓" },

  // E&M (10)
  { id: "coulomb", title: "Coulomb's Law", desc: "Force between point charges with vector direction.", category: "em", tags: "coulomb force charge", status: "coming-soon", icon: "⚡" },
  { id: "electric-field", title: "Electric Field Lines", desc: "Field due to point charge, dipole and continuous distribution.", category: "em", tags: "electric field lines dipole", status: "coming-soon", icon: "🌐" },
  { id: "potential", title: "Electric Potential", desc: "Potential due to point charge and equipotential surfaces.", category: "em", tags: "electric potential equipotential", status: "coming-soon", icon: "🔋" },
  { id: "capacitors", title: "Capacitors & Combination", desc: "Series, parallel and energy stored in capacitor.", category: "em", tags: "capacitor series parallel energy", status: "coming-soon", icon: "💿" },
  { id: "current-electricity", title: "Ohm's Law & Resistance", desc: "V-I characteristics and resistivity.", category: "em", tags: "ohm law resistance resistivity", status: "coming-soon", icon: "🔌" },
  { id: "kirchhoff", title: "Kirchhoff's Laws", desc: "Loop and junction rules for complex circuits.", category: "em", tags: "kirchhoff loop junction", status: "coming-soon", icon: "🔄" },
  { id: "magnetic-field", title: "Magnetic Field due to Current", desc: "Straight wire, loop and solenoid field patterns.", category: "em", tags: "magnetic field biot savart", status: "coming-soon", icon: "🧲" },
  { id: "lorentz", title: "Lorentz Force", desc: "Force on moving charge in magnetic field.", category: "em", tags: "lorentz force magnetic", status: "coming-soon", icon: "➡️" },
  { id: "emi", title: "Electromagnetic Induction", desc: "Faraday's law, Lenz's law and induced emf.", category: "em", tags: "faraday lenz induction emf", status: "coming-soon", icon: "🌀" },
  { id: "em-quiz", title: "E&M Concept Quiz", desc: "Practice questions on electrostatics and magnetism.", category: "em", tags: "quiz electricity magnetism", status: "coming-soon", icon: "❓" },

  // ROTATION (8)
  { id: "torque", title: "Torque & Moment of Force", desc: "τ = r × F visualizer with direction.", category: "rotation", tags: "torque moment force", status: "coming-soon", icon: "🔧" },
  { id: "moment-of-inertia", title: "Moment of Inertia", desc: "MI of common shapes and parallel axis theorem.", category: "rotation", tags: "moment of inertia parallel axis", status: "coming-soon", icon: "⚙️" },
  { id: "angular-momentum", title: "Angular Momentum", desc: "L = Iω and conservation examples.", category: "rotation", tags: "angular momentum conservation", status: "coming-soon", icon: "🌀" },
  { id: "rolling", title: "Rolling Motion", desc: "Pure rolling, v = ωr and energy distribution.", category: "rotation", tags: "rolling pure rolling energy", status: "coming-soon", icon: "🛞" },
  { id: "rotational-ke", title: "Rotational Kinetic Energy", desc: "½Iω² and comparison with translational KE.", category: "rotation", tags: "rotational kinetic energy", status: "coming-soon", icon: "💨" },
  { id: "centre-of-mass", title: "Centre of Mass", desc: "COM of system of particles and continuous bodies.", category: "rotation", tags: "centre of mass rigid", status: "coming-soon", icon: "📍" },
  { id: "angular-accel", title: "Angular Acceleration", desc: "τ = Iα relation interactive.", category: "rotation", tags: "angular acceleration torque", status: "coming-soon", icon: "🔄" },
  { id: "rotation-quiz", title: "Rotation Concept Quiz", desc: "MCQs on torque, MI and rolling.", category: "rotation", tags: "quiz rotation mcq", status: "coming-soon", icon: "❓" },

  // FLUIDS (6)
  { id: "pressure", title: "Fluid Pressure", desc: "P = ρgh and variation with depth.", category: "fluids", tags: "pressure depth fluid", status: "coming-soon", icon: "🌊" },
  { id: "buoyancy", title: "Buoyancy & Archimedes", desc: "Upthrust, apparent weight and floating condition.", category: "fluids", tags: "buoyancy archimedes floating", status: "coming-soon", icon: "🚢" },
  {
    id: "floating-ice-buoyancy",
    title: "Floating Ice & Rope Length Lab",
    desc: "Explore floating ice, submerged depth, exposed thickness, rope length and Archimedes' principle with interactive controls.",
    category: "fluids",
    tags: "floating ice buoyancy rope length submerged depth density archimedes jee",
    status: "live",
    url: "projects/floating-ice-buoyancy.html",
    icon: "🧊"
  },
  { id: "continuity", title: "Equation of Continuity", desc: "A₁v₁ = A₂v₂ for incompressible fluid.", category: "fluids", tags: "continuity equation flow", status: "coming-soon", icon: "🚰" },
  { id: "bernoulli", title: "Bernoulli's Principle", desc: "Pressure, speed and height relation with examples.", category: "fluids", tags: "bernoulli pressure speed", status: "coming-soon", icon: "✈️" },
  { id: "viscosity", title: "Viscosity & Stokes' Law", desc: "Terminal velocity and viscous force.", category: "fluids", tags: "viscosity stokes terminal velocity", status: "coming-soon", icon: "🍯" },

  // MODERN (2)
  { id: "photoelectric", title: "Photoelectric Effect", desc: "Einstein's equation, work function and stopping potential.", category: "modern", tags: "photoelectric einstein work function", status: "coming-soon", icon: "☀️" },
  { id: "atomic-models", title: "Atomic Models", desc: "Bohr model energy levels and spectral lines (basic).", category: "modern", tags: "bohr model energy levels", status: "coming-soon", icon: "⚛️" },

  // TOOLS (4)
  { id: "graphing-tool", title: "Graphing Calculator", desc: "Plot functions and experimental data points.", category: "tools", tags: "graph plot function data", status: "coming-soon", icon: "📊" },
  { id: "vector-draw", title: "Vector Diagram Tool", desc: "Draw and resolve vectors interactively.", category: "tools", tags: "vector diagram draw resolve", status: "coming-soon", icon: "✏️" },
  { id: "ray-draw", title: "Optical Ray Drawer", desc: "Sketch ray diagrams for mirrors and lenses.", category: "tools", tags: "ray diagram drawer optics", status: "coming-soon", icon: "🖊️" },
  { id: "unit-converter", title: "Physics Unit Converter", desc: "Common physics units conversion helper.", category: "tools", tags: "unit converter physics", status: "coming-soon", icon: "🔄" },

  // FUN (8)
  { id: "solar-system", title: "Simple Solar System", desc: "Orbital motion visualization (lightweight).", category: "fun", tags: "solar system orbit planets", status: "coming-soon", icon: "🪐" },
  { id: "pendulum-wave", title: "Pendulum Wave", desc: "Multiple pendulums creating wave pattern.", category: "fun", tags: "pendulum wave pattern", status: "coming-soon", icon: "🌊" },
  { id: "double-pendulum", title: "Double Pendulum Chaos", desc: "Sensitive dependence on initial conditions.", category: "fun", tags: "double pendulum chaos", status: "coming-soon", icon: "🦋" },
  { id: "bouncing-ball", title: "Bouncing Ball Energy Loss", desc: "Coefficient of restitution visualization.", category: "fun", tags: "bouncing ball restitution", status: "coming-soon", icon: "⚽" },
  { id: "gravity-sandbox", title: "Gravity Sandbox", desc: "Place masses and watch gravitational attraction.", category: "fun", tags: "gravity sandbox nbody", status: "coming-soon", icon: "🌌" },
  { id: "collision-gallery", title: "Collision Gallery", desc: "Fun elastic/inelastic collision demos.", category: "fun", tags: "collision gallery fun", status: "coming-soon", icon: "🎱" },
  { id: "light-spectrum", title: "Visible Spectrum", desc: "Wavelength to colour interactive map.", category: "fun", tags: "spectrum wavelength colour", status: "coming-soon", icon: "🌈" },
  { id: "physics-puzzles", title: "Physics Puzzles", desc: "Small interactive physics challenges.", category: "fun", tags: "puzzles challenges physics", status: "coming-soon", icon: "🧩" }
];

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "kinematics", label: "Kinematics" },
  { id: "forces", label: "Forces" },
  { id: "conservation", label: "Energy & Momentum" },
  { id: "waves", label: "Waves" },
  { id: "optics", label: "Optics" },
  { id: "em", label: "E & M" },
  { id: "rotation", label: "Rotation" },
  { id: "fluids", label: "Fluids" },
  { id: "modern", label: "Modern" },
  { id: "tools", label: "Tools" },
  { id: "fun", label: "Fun" },
  { id: "coming-soon", label: "Coming Soon" }
];