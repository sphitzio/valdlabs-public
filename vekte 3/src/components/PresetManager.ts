import { Preset } from '../types';

export const DEFAULT_PRESETS: Preset[] = [
  {
    name: 'EUCLIDEAN PULSCH ORD',
    engineId: 0, // Euclidean
    controls: {
      TIM: 35, MOR: 45, HAR: 50, FM: 0,
      A: 35, D: 60, S: 80, R: 45,
      TYPE: 5, CUT: 42, RES: 15, ENV: 30,
      fA: 40, fD: 50, fS: 60, fR: 45,
      DET: 22, SPRD: 80, PORT: 20, FOLD: 10,
      SHP: 15, DEPT: 12, SPD: 25, DEST: 5
    }
  },
  {
    name: 'CELLULAR FRACTAL GRID',
    engineId: 7, // Cell. Automata
    controls: {
      TIM: 30, MOR: 40, HAR: 0, FM: 0,
      A: 0, D: 25, S: 0, R: 15,
      TYPE: 0, CUT: 65, RES: 25, ENV: 40,
      fA: 0, fD: 30, fS: 0, fR: 15,
      DET: 0, SPRD: 10, PORT: 0, FOLD: 15,
      SHP: 50, DEPT: 30, SPD: 55, DEST: 2
    }
  },
  {
    name: 'ORBITAL GRAVITY WELL',
    engineId: 24, // Gravity Wells
    controls: {
      TIM: 85, MOR: 50, HAR: 82, FM: 0,
      A: 0, D: 35, S: 20, R: 40,
      TYPE: 10, CUT: 75, RES: 5, ENV: 0,
      fA: 0, fD: 20, fS: 50, fR: 30,
      DET: 15, SPRD: 60, PORT: 0, FOLD: 5,
      SHP: 0, DEPT: 0, SPD: 30, DEST: 0
    }
  },
  {
    name: 'RESONANT STRING NODE',
    engineId: 27, // String Resonance
    controls: {
      TIM: 50, MOR: 50, HAR: 60, FM: 0,
      A: 15, D: 50, S: 70, R: 35,
      TYPE: 0, CUT: 58, RES: 20, ENV: 45,
      fA: 12, fD: 45, fS: 40, fR: 30,
      DET: 35, SPRD: 90, PORT: 15, FOLD: 15,
      SHP: 10, DEPT: 8, SPD: 40, DEST: 1
    }
  },
  {
    name: 'RUN-LENGTH GATED BEAT',
    engineId: 28, // Run-Length
    controls: {
      TIM: 40, MOR: 20, HAR: 0, FM: 10,
      A: 25, D: 60, S: 80, R: 40,
      TYPE: 35, CUT: 50, RES: 40, ENV: 20,
      fA: 30, fD: 45, fS: 50, fR: 30,
      DET: 18, SPRD: 65, PORT: 0, FOLD: 20,
      SHP: 15, DEPT: 22, SPD: 35, DEST: 3
    }
  },
  {
    name: 'STEREOPHONIC FLOCK SWARM',
    engineId: 30, // Flocking
    controls: {
      TIM: 75, MOR: 60, HAR: 30, FM: 0,
      A: 2, D: 30, S: 10, R: 25,
      TYPE: 0, CUT: 40, RES: 35, ENV: 55,
      fA: 5, fD: 35, fS: 10, fR: 20,
      DET: 25, SPRD: 50, PORT: 10, FOLD: 80,
      SHP: 45, DEPT: 15, SPD: 45, DEST: 5
    }
  }
];

export function loadSavedPresets(): Preset[] {
  try {
    const saved = localStorage.getItem('vekte_custom_presets');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to load presets from local storage', err);
  }
  return [];
}

export function saveCustomPresets(presets: Preset[]) {
  try {
    localStorage.setItem('vekte_custom_presets', JSON.stringify(presets));
  } catch (err) {
    console.error('Failed to save presets to local storage', err);
  }
}
