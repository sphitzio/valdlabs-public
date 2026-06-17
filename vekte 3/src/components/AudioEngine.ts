// Web Audio API demo synth for the VEKTE marketing site.
// Browser-based approximations that evoke the named engine flavors
// (EastCoast, Chiptune, SuprSaw, Karplus, Wavetabl, Formant, HiHat, WavFold).
// NOT the real VEKTE DSP — purely illustrative for the interactive playground.

export class VekteAudioEngine {
  private ctx: AudioContext | null = null;
  private primaryGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  
  // Audio node tracking
  private activeVoices: Map<number, any> = new Map(); // note -> voice state
  private schedulerTimer: any = null;
  private isSequencing = false;
  private sequenceStep = 0;
  
  // Live control state (0 to 100 values)
  private controls: Record<string, number> = {
    TIM: 50, MOR: 50, HAR: 50, FM: 0,
    A: 5, D: 40, S: 60, R: 30,
    TYPE: 0, CUT: 80, RES: 20, ENV: 30,
    fA: 10, fD: 40, fS: 50, fR: 40,
    DET: 15, SPRD: 50, PORT: 10, FOLD: 0,
    SHP: 0, DEPT: 0, SPD: 50, DEST: 0
  };
  
  private currentEngineId = 0;

  // Static melody sequence for automatic playground play (ambient chord sequence)
  private sequenceNotes = [
    { note: 48, duration: 1.0, isChord: true }, // C3
    { note: 52, duration: 1.0, isChord: true }, // E3
    { note: 55, duration: 1.0, isChord: true }, // G3
    { note: 59, duration: 1.0, isChord: true }, // B3
    { note: 50, duration: 1.0, isChord: true }, // D3
    { note: 54, duration: 1.0, isChord: true }, // F#3
    { note: 57, duration: 1.0, isChord: true }, // A3
    { note: 62, duration: 1.0, isChord: true }  // D4
  ];
  private arpeggioNotes = [48, 52, 55, 59, 60, 64, 67, 71, 50, 54, 57, 61, 62, 66, 69, 73];

  constructor() {
    // Initialized on first user interaction to bypass browser autoplay policies
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.primaryGain = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      
      this.primaryGain.gain.setValueAtTime(0.18, this.ctx.currentTime); // Master volume safety
      this.primaryGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    } catch (e) {
      console.error('Web Audio API not supported in this environment:', e);
    }
  }

  getAnalyser() {
    this.init();
    return this.analyser;
  }

  isInitialized() {
    return this.ctx !== null;
  }

  setEngine(id: number) {
    this.currentEngineId = id;
    this.allNotesOff();
  }

  updateControl(id: string, value: number) {
    this.controls[id] = value;
    
    // Dynamically update active voices
    const now = this.ctx ? this.ctx.currentTime : 0;
    this.activeVoices.forEach((voice) => {
      this.applyVoiceParams(voice, now);
    });
  }

  setAllControls(newControls: Record<string, number>) {
    Object.keys(newControls).forEach(key => {
      this.controls[key] = newControls[key];
    });
    
    const now = this.ctx ? this.ctx.currentTime : 0;
    this.activeVoices.forEach((voice) => {
      this.applyVoiceParams(voice, now);
    });
  }

  // Convert MIDI note to Frequency
  private noteToFreq(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  noteOn(note: number, velocity = 0.8) {
    this.init();
    if (!this.ctx || !this.primaryGain) return;
    
    // Stop note if already playing to retrigger
    this.noteOff(note);

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    const freq = this.noteToFreq(note);
    const voiceState = this.createVoice(note, freq, velocity, t);
    
    if (voiceState) {
      this.activeVoices.set(note, voiceState);
    }
  }

  noteOff(note: number) {
    const voice = this.activeVoices.get(note);
    if (!voice || !this.ctx) return;

    const t = this.ctx.currentTime;
    const releaseTime = (this.controls.R / 100) * 1.5 + 0.05; // Max 1.5s release
    const ampGain = voice.ampGain;
    const filterGain = voice.filterNode ? voice.filterNode.frequency : null;
    const voicesList = voice.nodes as AudioNode[];

    // Trigger Amp Release Envelope
    ampGain.gain.setValueAtTime(ampGain.gain.value, t);
    ampGain.gain.exponentialRampToValueAtTime(0.0001, t + releaseTime);

    // Trigger Filter Release Envelope if applicable
    if (voice.filterNode && this.controls.ENV > 5) {
      const fReleaseTime = (this.controls.fR / 100) * 1.5 + 0.05;
      const currentCutoff = voice.filterNode.frequency.value;
      voice.filterNode.frequency.setValueAtTime(currentCutoff, t);
      voice.filterNode.frequency.exponentialRampToValueAtTime(Math.max(20, currentCutoff * 0.1), t + fReleaseTime);
    }

    this.activeVoices.delete(note);

    // Stop and disconnect nodes after release tail finishes
    setTimeout(() => {
      try {
        voicesList.forEach((node: any) => {
          if (typeof node.stop === 'function') {
            node.stop();
          }
          node.disconnect();
        });
        ampGain.disconnect();
        if (voice.filterNode) voice.filterNode.disconnect();
        if (voice.wavefolderNode) voice.wavefolderNode.disconnect();
      } catch (err) {
        // Safe catch for potential disconnect errors
      }
    }, (releaseTime + 0.5) * 1000);
  }

  allNotesOff() {
    this.activeVoices.forEach((voice, note) => {
      this.noteOff(note);
    });
    this.activeVoices.clear();
  }

  // Build a demo synth voice that evokes the selected engine flavor (approximation, not real VEKTE DSP)
  private createVoice(note: number, freq: number, velocity: number, t: number) {
    if (!this.ctx || !this.primaryGain) return null;

    const ampGain = this.ctx.createGain();
    ampGain.gain.setValueAtTime(0, t);
    
    const attack = (this.controls.A / 100) * 1.2 + 0.002; // max 1.2s attack
    const decay = (this.controls.D / 100) * 1.5 + 0.05;
    const sustain = this.controls.S / 100;
    const peakVolume = velocity * 0.25;

    // Apply Amp ADSR
    ampGain.gain.linearRampToValueAtTime(peakVolume, t + attack);
    ampGain.gain.setValueAtTime(peakVolume, t + attack);
    ampGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peakVolume * sustain), t + attack + decay);

    // Filter routing
    const filter = this.ctx.createBiquadFilter();
    
    // Map continuous morph morphing FILTER TYPE
    // LP -> BP -> HP -> Notch
    const filterMorph = this.controls.TYPE / 100;
    let filterType: BiquadFilterType = 'lowpass';
    if (filterMorph < 0.33) {
      filterType = 'lowpass';
    } else if (filterMorph < 0.66) {
      filterType = 'bandpass';
    } else if (filterMorph < 0.85) {
      filterType = 'highpass';
    } else {
      filterType = 'notch';
    }
    filter.type = filterType;

    // Cutoff based on CUT knob (exponential conversion 20Hz to 20kHz)
    const baseCutoff = Math.pow(this.controls.CUT / 100, 2.5) * 19980 + 20;
    filter.frequency.setValueAtTime(baseCutoff, t);

    // Filter ADSR Envelope Trigger
    const envDepth = (this.controls.ENV / 100) * 12000; // Sweep up to 12kHz
    if (envDepth > 10) {
      const fAttack = (this.controls.fA / 100) * 1.2 + 0.002;
      const fDecay = (this.controls.fD / 100) * 1.5 + 0.05;
      const fSustain = this.controls.fS / 100;
      
      const peakCutoff = Math.min(20000, baseCutoff + envDepth);
      const sustainCutoff = Math.min(20000, baseCutoff + (envDepth * fSustain));
      
      filter.frequency.linearRampToValueAtTime(peakCutoff, t + fAttack);
      filter.frequency.exponentialRampToValueAtTime(Math.max(20, sustainCutoff), t + fAttack + fDecay);
    }

    // Resonance mapping with self-stabilizing limits
    const resonanceBoost = (this.controls.RES / 100) * 15;
    filter.Q.setValueAtTime(Math.max(0.01, resonanceBoost), t);

    // LFO modulation connections
    const lfoNode = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    
    // Choose LFO shape
    // Sin → Tri → Saw → Sqr → Sample-and-hold (using square/noise combo)
    const lfoShapeIndex = Math.floor((this.controls.SHP / 100) * 5.9);
    const shapes: OscillatorType[] = ['sine', 'triangle', 'sawtooth', 'square'];
    lfoNode.type = shapes[Math.min(3, lfoShapeIndex)];
    
    // LFO Speed 0.1Hz to 30Hz
    const lfoSpeed = (this.controls.SPD / 100) * 29.9 + 0.1;
    lfoNode.frequency.setValueAtTime(lfoSpeed, t);
    
    // LFO Depth multiplier
    const lfoDepth = (this.controls.DEPT / 100);
    lfoGain.gain.setValueAtTime(lfoDepth, t);

    lfoNode.connect(lfoGain);
    try {
      lfoNode.start(t);
    } catch (_) {}

    // Track standard nodes to clean up
    const nodes: any[] = [];
    nodes.push(lfoNode, lfoGain);

    // Engine Specific Sound Sources
    const engineId = this.currentEngineId;
    let sourceNode: AudioNode;

    // Apply pitch offsets based on DET (detuning cents)
    const detuneCents = (this.controls.DET / 100) * 40; // Max 40 cents
    
    // Connect LFO depending on DEST destination routing
    // Destinations: {Off, Pitch, Timbr, Morph, Harm, Filt, Amp}
    const lfoDestIdx = Math.floor((this.controls.DEST / 100) * 6.9);

    if (engineId === 0 || engineId === 8) {
      // EastCoast Subtractive or Dual Detuned VCO
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const mixNode = this.ctx.createGain();
      
      const timbreMorph = this.controls.TIM / 100; // Saws / square morph multiplier
      
      osc1.frequency.setValueAtTime(freq, t);
      osc2.frequency.setValueAtTime(freq, t);
      osc1.detune.setValueAtTime(-detuneCents, t);
      osc2.detune.setValueAtTime(detuneCents + (engineId === 8 ? 10 : 0), t);

      // Saws / Square morphing
      osc1.type = timbreMorph < 0.5 ? 'sawtooth' : 'square';
      osc2.type = timbreMorph < 0.5 ? 'triangle' : 'sawtooth';

      osc1.connect(mixNode);
      osc2.connect(mixNode);
      osc1.start(t);
      osc2.start(t);

      nodes.push(osc1, osc2, mixNode);
      sourceNode = mixNode;

      // Bind LFO to routing target
      if (lfoDestIdx === 1) { // Pitch
        const modScaler = this.ctx.createGain();
        modScaler.gain.setValueAtTime(100, t); // 100 cents swing
        lfoGain.connect(modScaler);
        modScaler.connect(osc1.detune);
        modScaler.connect(osc2.detune);
        nodes.push(modScaler);
      }

    } else if (engineId === 27) { // SuprSaw (7-Saw Supersaw)
      const numSaws = 5;
      const mixNode = this.ctx.createGain();
      
      for (let i = 0; i < numSaws; i++) {
        const saw = this.ctx.createOscillator();
        const panning = this.ctx.createStereoPanner();
        const sawGain = this.ctx.createGain();

        saw.type = 'sawtooth';
        saw.frequency.setValueAtTime(freq, t);
        
        // Spread detuning mathematically
        const offset = (i - (numSaws - 1) / 2) * (detuneCents + 1.5);
        saw.detune.setValueAtTime(offset, t);
        
        // Spread stereo panning based on SPRD
        const panValue = ((i - (numSaws - 1) / 2) / ((numSaws - 1) / 2)) * (this.controls.SPRD / 100);
        panning.pan.setValueAtTime(panValue, t);
        
        sawGain.gain.setValueAtTime(0.2, t);

        saw.connect(sawGain);
        sawGain.connect(panning);
        panning.connect(mixNode);
        
        saw.start(t);
        nodes.push(saw, panning, sawGain);
      }
      
      mixNode.gain.setValueAtTime(0.8, t);
      nodes.push(mixNode);
      sourceNode = mixNode;

    } else if (engineId === 7) { // Chiptune (Arp-Glitch generator)
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);
      
      // Plink/Arp speed based on TIM
      const speedCoeff = Math.floor((this.controls.TIM / 100) * 4) + 1; // 1 to 5 notes arp sweep
      
      if (speedCoeff > 1) {
        // Trigger stepping frequency sweeps
        const arpInterval = 0.08; // 80ms clicks
        for (let j = 1; j < 8; j++) {
          const stepNoteOffset = (j % speedCoeff) * 4;
          const stepFreq = this.noteToFreq(note + stepNoteOffset);
          osc.frequency.setValueAtTime(stepFreq, t + j * arpInterval);
        }
      }
      
      osc.start(t);
      nodes.push(osc);
      sourceNode = osc;

    } else if (engineId === 24) { // Karplus Plucked String
      // Models a plucked string via noise bursting into feedback comb filter delay line!
      const noiseGain = this.ctx.createGain();
      const filterComb = this.ctx.createBiquadFilter();
      const delay = this.ctx.createDelay(1.0);
      
      // Delay time corresponds to pitch period (1 / frequency)
      const period = 1.0 / freq;
      delay.delayTime.setValueAtTime(period, t);
      
      // Feedback loop duration controlled by HAR knob (harmonics feedback)
      const sustainFeedback = Math.min(0.99, (this.controls.HAR / 100) * 0.45 + 0.5);
      const feedbackGain = this.ctx.createGain();
      feedbackGain.gain.setValueAtTime(sustainFeedback, t);

      // Noise source (Pluck trigger)
      const bufferSize = this.ctx.sampleRate * 0.04; // 40ms impulse burst
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2.0 - 1.0;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      // Pluck damping based on TIM knob (timbre high = bright)
      filterComb.type = 'lowpass';
      const dampCutoff = (this.controls.TIM / 100) * 8000 + 400;
      filterComb.frequency.setValueAtTime(dampCutoff, t);

      // Connect pluck loop structure
      noise.connect(noiseGain);
      noiseGain.connect(delay);
      
      delay.connect(filterComb);
      filterComb.connect(feedbackGain);
      feedbackGain.connect(delay); // Feedback recursive connection

      noise.start(t);
      
      nodes.push(noise, noiseGain, delay, filterComb, feedbackGain);
      sourceNode = delay;

    } else if (engineId === 23) { // Hi-Hat Percussion (White noise trigger)
      const bufferSize = this.ctx.sampleRate * 0.3; // 300ms tail
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2.0 - 1.0;
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const hatFilter = this.ctx.createBiquadFilter();
      hatFilter.type = 'highpass';
      hatFilter.frequency.setValueAtTime(8000, t); // clean metallic sparkle
      
      noise.connect(hatFilter);
      noise.start(t);
      
      nodes.push(noise, hatFilter);
      sourceNode = hatFilter;

    } else if (engineId === 28) { // Formant Vocal Resonator
      const pulseOsc = this.ctx.createOscillator();
      pulseOsc.type = 'sawtooth';
      pulseOsc.frequency.setValueAtTime(freq, t);
      
      // Core vowel formants mapped using bandpass EQ cluster
      // Vowel selects "AH" -> "EE" -> "OO" smoothly using the MOR knob
      const morphValue = this.controls.MOR / 100;
      const bpFilter1 = this.ctx.createBiquadFilter();
      const bpFilter2 = this.ctx.createBiquadFilter();
      const bpMix = this.ctx.createGain();

      bpFilter1.type = 'bandpass';
      bpFilter1.Q.setValueAtTime(6.0, t);
      bpFilter2.type = 'bandpass';
      bpFilter2.Q.setValueAtTime(6.0, t);

      // F1 and F2 vowel coordinates
      let f1 = 800; // AH
      let f2 = 1200;
      if (morphValue < 0.5) {
        // AH to EE transition
        const progress = morphValue * 2;
        f1 = 800 - progress * 500; // 800Hz to 300Hz
        f2 = 1200 + progress * 1000; // 1200Hz to 2200Hz
      } else {
        // EE to OO transition
        const progress = (morphValue - 0.5) * 2;
        f1 = 300 + progress * 100; // 300Hz to 400Hz
        f2 = 2200 - progress * 1400; // 2200Hz to 800Hz
      }

      bpFilter1.frequency.setValueAtTime(f1, t);
      bpFilter2.frequency.setValueAtTime(f2, t);

      pulseOsc.connect(bpFilter1);
      pulseOsc.connect(bpFilter2);
      
      bpFilter1.connect(bpMix);
      bpFilter2.connect(bpMix);
      
      pulseOsc.start(t);
      nodes.push(pulseOsc, bpFilter1, bpFilter2, bpMix);
      sourceNode = bpMix;

    } else if (engineId === 30 || engineId === 13 || engineId === 9) { // Waveshaper, Wavetabl or WavFold
      // Custom Sine shaper to fold waveforms
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const folderNode = this.ctx.createWaveShaper();
      
      // Calculate fold curve
      const drive = (this.controls.TIM / 100) * 15 + 1.0;
      const curve = new Float32Array(44100);
      for (let i = 0; i < 44100; ++i) {
        const x = (i / 44100) * 2 - 1;
        // Fold math equation: sin(x * drive * PI)
        curve[i] = Math.sin(x * drive * Math.PI) * 0.8;
      }
      folderNode.curve = curve;
      
      osc.connect(folderNode);
      osc.start(t);
      
      nodes.push(osc, folderNode);
      sourceNode = folderNode;

    } else {
      // Default Synthesizer voice for loaded premium engine models (Triangle + Sine mix)
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.start(t);
      nodes.push(osc);
      sourceNode = osc;
    }

    // Apply post-filter Wavefolder (WAVF / FOLD) saturation
    const foldDepth = this.controls.FOLD / 100;
    let finalSource: AudioNode = sourceNode;
    
    if (foldDepth > 0.05) {
      const folder = this.ctx.createWaveShaper();
      const n_samples = 44100;
      const shpCurve = new Float32Array(n_samples);
      const intensity = foldDepth * 10 + 1.0;
      for (let i = 0; i < n_samples; ++i) {
        const x = (i / n_samples) * 2 - 1;
        // Asymptotic clipping + multiple-folding curve simulation
        shpCurve[i] = Math.tanh(Math.sin(x * Math.PI * intensity)) * 0.9;
      }
      folder.curve = shpCurve;
      
      sourceNode.connect(folder);
      finalSource = folder;
      nodes.push(folder);
    }

    // Connect LFO modulator targeting Filter Cutoff
    if (lfoDestIdx === 5) { // Filter Cutoff
      const scopeScaler = this.ctx.createGain();
      scopeScaler.gain.setValueAtTime(300, t); // 300Hz modulation bounds
      lfoGain.connect(scopeScaler);
      scopeScaler.connect(filter.frequency);
      nodes.push(scopeScaler);
    }

    // Setup active routing: Source -> Filter -> AmpGain -> Master Box
    finalSource.connect(filter);
    filter.connect(ampGain);
    ampGain.connect(this.primaryGain);

    return {
      nodes,
      ampGain,
      filterNode: filter,
      wavefolderNode: finalSource !== sourceNode ? finalSource : null
    };
  }

  // Update dynamic values in real time without voice retrigger
  private applyVoiceParams(voice: any, t: number) {
    if (!this.ctx) return;
    
    // Smooth Cutoff and resonance updates
    if (voice.filterNode) {
      const baseCutoff = Math.pow(this.controls.CUT / 100, 2.5) * 19980 + 20;
      voice.filterNode.frequency.setTargetAtTime(baseCutoff, t, 0.015);
      
      const resonanceBoost = (this.controls.RES / 100) * 15;
      voice.filterNode.Q.setTargetAtTime(Math.max(0.01, resonanceBoost), t, 0.015);
    }
  }

  // Auto Playground Arpeggiator / Sequencer
  startSequencing(onStepCallback: (step: number, note: number) => void) {
    this.init();
    if (this.isSequencing) return;
    this.isSequencing = true;
    this.sequenceStep = 0;
    
    const playNextStep = () => {
      if (!this.isSequencing) return;
      
      const speed = this.controls.SPD / 100; // Map speed rate (BPM 60 to 180)
      const bpm = speed * 120 + 60;
      const stepDuration = 60 / bpm / 2; // 1/8 notes
      
      const noteCount = this.arpeggioNotes.length;
      const noteIndex = this.sequenceStep % noteCount;
      const currentNote = this.arpeggioNotes[noteIndex];
      
      // Dynamic velocity accentuation
      const velocity = this.sequenceStep % 4 === 0 ? 0.9 : 0.6;
      
      this.noteOn(currentNote, velocity);
      
      // Trigger user visual callback
      onStepCallback(this.sequenceStep, currentNote);
      
      // Release notes periodically
      setTimeout(() => {
        this.noteOff(currentNote);
      }, stepDuration * 0.8 * 1000);
      
      this.sequenceStep++;
      this.schedulerTimer = setTimeout(playNextStep, stepDuration * 1000);
    };
    
    playNextStep();
  }

  stopSequencing() {
    this.isSequencing = false;
    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this.allNotesOff();
  }

  isPlaying() {
    return this.isSequencing;
  }

  destroy() {
    this.stopSequencing();
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (err) {}
      this.ctx = null;
    }
  }
}
