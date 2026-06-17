export interface Engine {
  id: number;
  name: string;
  type: string;
  description: string;
  isFree: boolean;
  category: 'rhythm-driven' | 'chaotic-cellular' | 'algorithmic-fractal' | 'melodic-markov' | 'physical-physics';
}

export interface Preset {
  name: string;
  engineId: number;
  controls: Record<string, number>;
}

export const SYNTH_ENGINES: Engine[] = [
  // 31 Generative Algorithms of VEKTE
  {
    id: 0,
    name: 'Euclidean',
    type: 'rhythm + pitch (fixed ramp)',
    description: 'Bjorklund even distribution. Spreads hits as evenly as possible over step counts. Creates world rhythms and foundational loops.',
    isFree: true,
    category: 'rhythm-driven'
  },
  {
    id: 1,
    name: 'Random Walk',
    type: 'pitch only',
    description: 'Pitch walker drifting through note space. A point wanders up and down through a pitch range, moving by random amounts with gravity pull.',
    isFree: true,
    category: 'melodic-markov'
  },
  {
    id: 2,
    name: 'Kaprekar',
    type: 'pitch + structure',
    description: "Takes a 4-digit seed number, sorts digits ascending and descending, subtracts, and repeats. The visited orbits converge to Kaprekar's constant.",
    isFree: false,
    category: 'algorithmic-fractal'
  },
  {
    id: 3,
    name: 'Fibonacci',
    type: 'rhythm + pitch',
    description: 'Generates Fibonacci sequence terms modulo a range onto pitch. Triggers fire on regular intervals with a probabilistic wrap fill.',
    isFree: false,
    category: 'algorithmic-fractal'
  },
  {
    id: 4,
    name: 'Primes',
    type: 'rhythm + pitch',
    description: 'Walks the mathematical prime number sequence, mapping values into a designated pitch range. Gated by prime stride divisibility tests.',
    isFree: false,
    category: 'algorithmic-fractal'
  },
  {
    id: 5,
    name: 'Thue-Morse',
    type: 'rhythm + pitch',
    description: 'Parity bit sequence indexed by binary indicators. Self-similar, never-repeating fractal that drives trigger hits and 8-note pitch maps.',
    isFree: false,
    category: 'algorithmic-fractal'
  },
  {
    id: 6,
    name: 'Kolakoski',
    type: 'rhythm + pitch',
    description: 'A run-length self-describing sequence containing {1,2} or {1,2,3} alphabets to index structural pitch maps with gated note-on triggers.',
    isFree: false,
    category: 'algorithmic-fractal'
  },
  {
    id: 7,
    name: 'Cell. Automata',
    type: 'rhythm + pitch',
    description: '1D Wolfram cellular automaton executing rule sets (e.g. 110, 90). Pitch represents cell lifespans across historical generations.',
    isFree: true,
    category: 'chaotic-cellular'
  },
  {
    id: 8,
    name: 'Markov',
    type: 'rhythm + pitch',
    description: 'Dynamic Markov chain walking pitch states. Weights next notes based on softmax distance to running averages and remembered echoes.',
    isFree: false,
    category: 'melodic-markov'
  },
  {
    id: 9,
    name: 'L-Systems',
    type: 'rhythm + pitch',
    description: 'Lindenmayer string rewriting processor starting from axiom rules. Symbols map to custom pitches and note-trigger patterns.',
    isFree: false,
    category: 'algorithmic-fractal'
  },
  {
    id: 10,
    name: 'Logistic Map',
    type: 'rhythm + pitch',
    description: 'Textbook route to chaos (x = r·x·(1-x)). Settles in neat cycles below 3.57 and enters absolute chaotic orbits up to 3.99.',
    isFree: false,
    category: 'chaotic-cellular'
  },
  {
    id: 11,
    name: 'Polyrhythm',
    type: 'rhythm + pitch',
    description: 'Three independent, coprime metronome clocks running parallel ratios. Active layer combinations map to three pitch tiers.',
    isFree: false,
    category: 'physical-physics'
  },
  {
    id: 12,
    name: 'Bresenham',
    type: 'rhythm + pitch',
    description: 'Integrates the classic screen integer line drawing routine as a rhythmic divider. Height rise coordinates dictate pitch heights.',
    isFree: false,
    category: 'rhythm-driven'
  },
  {
    id: 13,
    name: 'Voice Leading',
    type: 'pitch only',
    description: 'Smooth part-writing solver. Restricts voice jumps, follows structural contour biases, and maintains register gravity anchors.',
    isFree: false,
    category: 'melodic-markov'
  },
  {
    id: 14,
    name: 'Cantor Set',
    type: 'rhythm + pitch',
    description: 'Recursive middle-thirds removal producing fractal dust rhythm grids. Empty nodes fill probabilistically over a 6-note scale map.',
    isFree: false,
    category: 'rhythm-driven'
  },
  {
    id: 15,
    name: 'Penrose',
    type: 'rhythm + pitch',
    description: 'Inflation-based quasiperiodic sequence substituting Long (L) and Short (S) tile lengths without repeating exact macro patterns.',
    isFree: false,
    category: 'algorithmic-fractal'
  },
  {
    id: 16,
    name: 'Harmonic Series',
    type: 'rhythm + pitch',
    description: 'Forms integer overtone series partials above adjustable scale fundamentals, scanning window arrays of complex acoustic fractions.',
    isFree: false,
    category: 'physical-physics'
  },
  {
    id: 17,
    name: 'Lissajous',
    type: 'rhythm + pitch',
    description: 'Dual coprime sine wave generators mapping 2D planar intersections into trigger nodes and dynamic pitch ranges.',
    isFree: false,
    category: 'physical-physics'
  },
  {
    id: 18,
    name: 'Drunk w/ Memory',
    type: 'pitch only',
    description: 'A customized drunkard walk that tracks visit histories to attract or repel from occupied spaces to cycle loops or seek ranges.',
    isFree: false,
    category: 'melodic-markov'
  },
  {
    id: 19,
    name: 'Sieve (Xenakis)',
    type: 'rhythm-dominant',
    description: "Xenakis's modular residue sieves combined with Boolean operators (AND, OR, XOR) to generate complex non-octave rhythms.",
    isFree: true,
    category: 'rhythm-driven'
  },
  {
    id: 20,
    name: 'Bouncing Ball',
    type: 'rhythm + pitch',
    description: 'Decaying physical bouncing ball simulator under gravity constraints. Induces accelerates ratios on restitution damping spikes.',
    isFree: false,
    category: 'rhythm-driven'
  },
  {
    id: 21,
    name: 'Call & Response',
    type: 'rhythm + pitch',
    description: 'Alternates call segments with responses processed by retrograde, inversion, transposition, or augmentation transforms.',
    isFree: false,
    category: 'melodic-markov'
  },
  {
    id: 22,
    name: 'Tension Curve',
    type: 'rhythm + pitch',
    description: 'Aligns notes on tension arcs, picking consonant pitches in low valleys and introducing high chromatic dissonance on peak crests.',
    isFree: false,
    category: 'melodic-markov'
  },
  {
    id: 23,
    name: 'Game of Life',
    type: 'rhythm + pitch',
    description: "Conway's 2D game of life simulation. Maps grid slice columns to pitch values and active rows to note triggers.",
    isFree: false,
    category: 'chaotic-cellular'
  },
  {
    id: 24,
    name: 'Gravity Wells',
    type: 'pitch only',
    description: 'Two physical orbital gravity wells swinging a mass back and forth in continuous pitch trajectories with variable dampings.',
    isFree: false,
    category: 'physical-physics'
  },
  {
    id: 25,
    name: 'Entropy Gradient',
    type: 'rhythm + pitch',
    description: 'Takes an ordered motif and progressively injects custom entropy increments to seamlessly dissolve order into complete noise.',
    isFree: false,
    category: 'chaotic-cellular'
  },
  {
    id: 26,
    name: 'Wave Interference',
    type: 'rhythm + pitch',
    description: 'Combines multiple base frequency sine loops. Triggers and pitch scales register selectively along the tallest combined peaks.',
    isFree: false,
    category: 'physical-physics'
  },
  {
    id: 27,
    name: 'String Resonance',
    type: 'rhythm + pitch',
    description: 'Simulates sympathetic string resonance, raising the probability of adjacent consonant string notes with selectable decay timers.',
    isFree: false,
    category: 'physical-physics'
  },
  {
    id: 28,
    name: 'Run-Length',
    type: 'rhythm-dominant',
    description: 'Analyzes 8-bit seed patterns via Run-Length Encoding and stretches or compresses them over configurable dilation multipliers.',
    isFree: false,
    category: 'rhythm-driven'
  },
  {
    id: 29,
    name: 'Turing Pattern',
    type: 'rhythm + pitch',
    description: 'Gray-Scott reaction-diffusion particle sim. Evolved stripe or spot patterns resolve to triggers and microtonal value sweeps.',
    isFree: true,
    category: 'chaotic-cellular'
  },
  {
    id: 30,
    name: 'Flocking',
    type: 'pitch-dominant',
    description: 'Three-rule boids flocking simulation (cohesion, separation, alignment). Pitch arrays map directly to individual flock positions.',
    isFree: true,
    category: 'physical-physics'
  }
];

export const CONTROLS_DEFINITION = [
  { id: 'MIDI', name: 'MIDI Out', category: 'routing', min: 1, max: 16, default: 1, description: 'Output MIDI channel for the current slot.' },
  { id: 'STEPS', name: 'Steps Window', category: 'shaping', min: 1, max: 32, default: 16, description: 'Playhead boundary length over the 32-step sequence.' },
  { id: 'DENSE', name: 'Density Sculptor', category: 'shaping', min: 0, max: 100, default: 50, description: 'Deterministic trigger filler/remover.' },
  { id: 'STRUM', name: 'Strum Spread', category: 'fx', min: -100, max: 100, default: 0, description: 'Spreads chord voices in time, from low to high or high to low.' },
  { id: 'BASE', name: 'Base Root', category: 'pitch', min: 0, max: 24, default: 0, description: 'Scale-snapped center fundamental transposition register.' },
  { id: 'PROB', name: 'Gate Prob', category: 'shaping', min: 0, max: 100, default: 80, description: 'Rhythm gate trigger probability percentage.' },
  { id: 'ROT', name: 'Shift Rotate', category: 'shaping', min: -16, max: 16, default: 0, description: 'Pivots the sequence window to shift accents.' },
  { id: 'TIE', name: 'Tie Decay', category: 'fx', min: 0, max: 100, default: 50, description: 'Sustain duration envelope scaling toward adjacent notes.' }
];
