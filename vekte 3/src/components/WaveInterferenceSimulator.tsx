import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Info, Sliders } from 'lucide-react';

interface StepData {
  trigger: boolean;
  row: number; // 0 to 7 mapping to note lanes
}

export function WaveInterferenceSimulator() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSound, setSelectedSound] = useState<'chord' | 'bass' | 'pluck' | 'percussion' | 'lead'>('pluck');
  const [bpm, setBpm] = useState(120);

  // Knobs: SEED (Freq A), ENT (Freq B), DIR (Mix percentage), DENS (Threshold density)
  const [knobValues, setKnobValues] = useState({
    SEED: 4,      // Frequency A mapping (1 to 32)
    ENT: 12,      // Frequency B mapping (1 to 32)
    DIR: 0,      // Sine Mix (0 to 100)
    DENS: 61      // Trigger density (0 to 100)
  });

  const [activeDragKnob, setActiveDragKnob] = useState<string | null>(null);
  const dragStartProgress = useRef<number>(0);
  const dragStartY = useRef<number>(0);

  // Web Audio Context refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const stepTimerRef = useRef<any>(null);
  const iosUnlockedRef = useRef<boolean>(false);

  // Re-generate steps matrix on any knob changes
  const [steps, setSteps] = useState<StepData[]>([]);

  useEffect(() => {
    // Demo pattern: simple dual-sine interference (illustrative, not the real VEKTE algorithm engine)
    const generated: StepData[] = [];
    const freqA = knobValues.SEED;
    const freqB = knobValues.ENT;
    const mix = knobValues.DIR / 100;
    const densityThreshold = (100 - knobValues.DENS) / 100; // 0 to 1

    for (let s = 0; s < 32; s++) {
      const angleA = (2 * Math.PI * freqA * s) / 32;
      const angleB = (2 * Math.PI * freqB * s) / 32;

      const valA = Math.sin(angleA);
      const valB = Math.sin(angleB);

      // Weighted average combination
      const combined = (1 - mix) * valA + mix * valB;
      const absVal = Math.abs(combined);

      // Trigger condition
      const trigger = absVal >= densityThreshold;

      // Pitch row selector (0 to 7) mapped from dual sines
      let row = Math.floor(((combined + 1) / 2) * 8);
      row = Math.max(0, Math.min(7, row));

      generated.push({ trigger, row });
    }
    setSteps(generated);
  }, [knobValues]);

  // Create + resume the AudioContext. Safe to call on every note (no
  // side effects beyond resume).
  const ensureAudio = (): AudioContext | null => {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) return null;

    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new AudioCtxClass();
        masterGainRef.current = audioCtxRef.current.createGain();
        masterGainRef.current.gain.value = 0.5; // master level (iOS output runs quiet)
        masterGainRef.current.connect(audioCtxRef.current.destination);
      } catch (err) {
        console.error('Failed to create AudioContext:', err);
        return null;
      }
    }

    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  };

  // iOS unlock: play a single one-frame silent buffer ONCE, from within a
  // real user gesture, so the hardware output turns on. Guarded so it never
  // runs from the sequencer interval (which is not a gesture).
  const unlockAudio = (): AudioContext | null => {
    const ctx = ensureAudio();
    if (!ctx) return null;
    if (!iosUnlockedRef.current) {
      try {
        const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
        iosUnlockedRef.current = true;
      } catch (_) { /* ignore */ }
    }
    return ctx;
  };

  // Audio trigger module
  const playSequenceNote = (soundType: string, rowIdx: number) => {
    if (isMuted) return;

    const ctx = ensureAudio();
    if (!ctx) return;

    const t = ctx.currentTime;

    // Standard scales mapping
    const bassPitches = [36, 38, 40, 43, 45, 48, 50, 52];       // Deep warm register
    const pluckPitches = [52, 55, 57, 59, 62, 64, 67, 69];      // Snappy physical register
    const leadPitches = [60, 62, 64, 67, 69, 72, 74, 76];       // Vivid solo/melody register
    const chordRoots = [48, 50, 52, 53, 55, 57, 59, 60];        // Chord root register (C3..C4)

    if (soundType === 'chord') {
      // CHORD - Warm minor triad pad (root + minor 3rd + perfect 5th: +0, +3, +7 semitones)
      const root = chordRoots[rowIdx];
      const intervals = [0, 3, 7]; // minor triad
      const lowpass = ctx.createBiquadFilter();
      const voiceGain = ctx.createGain();

      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(1800, t);
      lowpass.frequency.exponentialRampToValueAtTime(600, t + 0.6);
      lowpass.Q.setValueAtTime(1.0, t);

      voiceGain.gain.setValueAtTime(0.001, t);
      voiceGain.gain.linearRampToValueAtTime(0.16, t + 0.04); // soft pad swell
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);

      lowpass.connect(voiceGain);
      voiceGain.connect(masterGainRef.current!);

      intervals.forEach((semis) => {
        const freq = 440 * Math.pow(2, (root + semis - 69) / 12);
        // Two slightly detuned saws per voice for width
        [-6, 6].forEach((cents) => {
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, t);
          osc.detune.setValueAtTime(cents, t);
          osc.connect(lowpass);
          osc.start(t);
          osc.stop(t + 0.95);
        });
      });

    } else if (soundType === 'bass') {
      // BASS - Rich sweeping sub + saw
      const mainOsc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const voiceGain = ctx.createGain();
      const lowpass = ctx.createBiquadFilter();

      const midi = bassPitches[rowIdx];
      const freq = 440 * Math.pow(2, (midi - 69) / 12);

      mainOsc.type = 'sawtooth';
      mainOsc.frequency.setValueAtTime(freq, t);

      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq / 2, t);

      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(750, t);
      lowpass.frequency.exponentialRampToValueAtTime(75, t + 0.28);
      lowpass.Q.setValueAtTime(5.5, t);

      voiceGain.gain.setValueAtTime(0.001, t);
      voiceGain.gain.linearRampToValueAtTime(0.25, t + 0.008);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

      mainOsc.connect(lowpass);
      subOsc.connect(lowpass);
      lowpass.connect(voiceGain);
      voiceGain.connect(masterGainRef.current!);

      mainOsc.start(t);
      subOsc.start(t);
      mainOsc.stop(t + 0.55);
      subOsc.stop(t + 0.55);

    } else if (soundType === 'pluck') {
      // PLUCK - Karplus plucked string model mimic
      const osc = ctx.createOscillator();
      const noise = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const voiceGain = ctx.createGain();

      const midi = pluckPitches[rowIdx];
      const freq = 440 * Math.pow(2, (midi - 69) / 12);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      // Noise burst for pluck transient simulation
      const bufferSize = ctx.sampleRate * 0.03; // 30ms snap
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.45;
      }
      noise.buffer = buffer;

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2800, t);
      filter.frequency.exponentialRampToValueAtTime(320, t + 0.16);
      filter.Q.setValueAtTime(3.0, t);

      voiceGain.gain.setValueAtTime(0.001, t);
      voiceGain.gain.linearRampToValueAtTime(0.35, t + 0.003);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);

      osc.connect(filter);
      noise.connect(filter);
      filter.connect(voiceGain);
      voiceGain.connect(masterGainRef.current!);

      osc.start(t);
      noise.start(t);
      osc.stop(t + 0.42);
      noise.stop(t + 0.42);

    } else if (soundType === 'percussion') {
      // PERCUSSION -Snappy modular rhythm rack
      if (rowIdx <= 2) {
        // Bass Drum sweep
        const osc = ctx.createOscillator();
        const voiceGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(42, t + 0.11);

        voiceGain.gain.setValueAtTime(0.001, t);
        voiceGain.gain.linearRampToValueAtTime(0.4, t + 0.004);
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

        osc.connect(voiceGain);
        voiceGain.connect(masterGainRef.current!);

        osc.start(t);
        osc.stop(t + 0.2);

      } else if (rowIdx === 3 || rowIdx === 4) {
        // Retro snare click friction
        const noise = ctx.createBufferSource();
        const bpf = ctx.createBiquadFilter();
        const voiceGain = ctx.createGain();

        const bufferSize = ctx.sampleRate * 0.12; 
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        noise.buffer = buffer;

        bpf.type = 'bandpass';
        bpf.frequency.setValueAtTime(1100, t);
        bpf.Q.setValueAtTime(2.2, t);

        voiceGain.gain.setValueAtTime(0.001, t);
        voiceGain.gain.linearRampToValueAtTime(0.24, t + 0.004);
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

        noise.connect(bpf);
        bpf.connect(voiceGain);
        voiceGain.connect(masterGainRef.current!);

        noise.start(t);
        noise.stop(t + 0.18);

      } else {
        // High Metal Hi-hat burst
        const noise = ctx.createBufferSource();
        const hpf = ctx.createBiquadFilter();
        const voiceGain = ctx.createGain();

        const bufferSize = ctx.sampleRate * 0.045; // ultra fast dec
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        noise.buffer = buffer;

        hpf.type = 'highpass';
        hpf.frequency.setValueAtTime(8500, t);

        voiceGain.gain.setValueAtTime(0.001, t);
        voiceGain.gain.linearRampToValueAtTime(rowIdx === 7 ? 0.28 : 0.16, t + 0.002);
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, t + (rowIdx === 7 ? 0.11 : 0.04));

        noise.connect(hpf);
        hpf.connect(voiceGain);
        voiceGain.connect(masterGainRef.current!);

        noise.start(t);
        noise.stop(t + 0.13);
      }

    } else if (soundType === 'lead') {
      // LEAD - High-fidelity detuned supersaw lead
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const voiceGain = ctx.createGain();
      const bpf = ctx.createBiquadFilter();

      const midi = leadPitches[rowIdx];
      const freq = 440 * Math.pow(2, (midi - 69) / 12);

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, t);
      osc1.detune.setValueAtTime(-14, t);

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq, t);
      osc2.detune.setValueAtTime(14, t);

      bpf.type = 'lowpass';
      bpf.frequency.setValueAtTime(2200, t);
      bpf.frequency.exponentialRampToValueAtTime(1400, t + 0.35);
      bpf.Q.setValueAtTime(1.8, t);

      voiceGain.gain.setValueAtTime(0.001, t);
      voiceGain.gain.linearRampToValueAtTime(0.2, t + 0.025);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);

      osc1.connect(bpf);
      osc2.connect(bpf);
      bpf.connect(voiceGain);
      voiceGain.connect(masterGainRef.current!);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.72);
      osc2.stop(t + 0.72);
    }
  };

  // Clock runner
  useEffect(() => {
    if (isPlaying) {
      const stepIntervalMs = Math.round((60000 / bpm) / 4); // 16th notes speed split

      const triggerStep = () => {
        setCurrentStep((prevStep) => {
          const nextStep = (prevStep + 1) % 32;
          const currentStepData = steps[nextStep];
          if (currentStepData && currentStepData.trigger) {
            playSequenceNote(selectedSound, currentStepData.row);
          }
          return nextStep;
        });
      };

      stepTimerRef.current = setInterval(triggerStep, stepIntervalMs);
    } else {
      if (stepTimerRef.current) {
        clearInterval(stepTimerRef.current);
        stepTimerRef.current = null;
      }
    }

    return () => {
      if (stepTimerRef.current) {
        clearInterval(stepTimerRef.current);
      }
    };
  }, [isPlaying, bpm, steps, selectedSound, isMuted]);

  const togglePlayback = () => {
    // Warm up + iOS-unlock the audio context from within this user gesture
    unlockAudio();

    if (isPlaying) {
      setIsPlaying(false);
    } else {
      // play a short click/note initially to feedback activation
      setCurrentStep(0);
      const initialStep = steps[0];
      if (initialStep && initialStep.trigger) {
        playSequenceNote(selectedSound, initialStep.row);
      }
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Draggable knob handle loops
  const handleKnobMouseDown = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveDragKnob(key);
    dragStartProgress.current = knobValues[key as keyof typeof knobValues];
    dragStartY.current = e.clientY;
    document.body.style.cursor = 'ns-resize';
  };

  const handleKnobTouchStart = (key: string, e: React.TouchEvent) => {
    setActiveDragKnob(key);
    dragStartProgress.current = knobValues[key as keyof typeof knobValues];
    dragStartY.current = e.touches[0].clientY;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!activeDragKnob) return;
      const deltaY = dragStartY.current - e.clientY;
      const sensitivity = 0.8;
      const minVal = activeDragKnob === 'SEED' || activeDragKnob === 'ENT' ? 1 : 0;
      const maxVal = activeDragKnob === 'SEED' || activeDragKnob === 'ENT' ? 32 : 100;

      let computedValue = dragStartProgress.current + (deltaY * (maxVal - minVal)) / (180 * sensitivity);
      computedValue = Math.max(minVal, Math.min(maxVal, computedValue));

      setKnobValues((prev) => ({
        ...prev,
        [activeDragKnob]: Math.round(computedValue)
      }));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!activeDragKnob) return;
      const deltaY = dragStartY.current - e.touches[0].clientY;
      const sensitivity = 0.8;
      const minVal = activeDragKnob === 'SEED' || activeDragKnob === 'ENT' ? 1 : 0;
      const maxVal = activeDragKnob === 'SEED' || activeDragKnob === 'ENT' ? 32 : 100;

      let computedValue = dragStartProgress.current + (deltaY * (maxVal - minVal)) / (180 * sensitivity);
      computedValue = Math.max(minVal, Math.min(maxVal, computedValue));

      setKnobValues((prev) => ({
        ...prev,
        [activeDragKnob]: Math.round(computedValue)
      }));
    };

    const handleMouseUp = () => {
      if (activeDragKnob) {
        setActiveDragKnob(null);
        document.body.style.cursor = 'default';
      }
    };

    if (activeDragKnob) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [activeDragKnob]);

  // Knobs specs descriptions
  const knobMeta = {
    SEED: { name: 'Frequency A', desc: 'Sets integer frequency divisor multiplier of the primary sine generator.', min: 1, max: 32 },
    ENT: { name: 'Frequency B', desc: 'Sets integer frequency divisor multiplier of the secondary nested sine generator.', min: 1, max: 32 },
    DIR: { name: 'Sine Mix Ratio', desc: 'Sweeps blend mix level between Sine A and Sine B channels.', min: 0, max: 100 },
    DENS: { name: 'Trigger Density', desc: 'Adjusts peak threshold boundary where sine ripples trigger note pulses.', min: 0, max: 100 }
  };

  // Color config mappings for the 4 individual knobs (FFB500, 7369FF, 26D1D1, FF0044)
  const knobColors: Record<string, { main: string; bg: string; text: string; selectLine: string }> = {
    SEED: { main: '#FFB500', bg: '#2b1c00', text: 'text-[#FFB500]', selectLine: 'border-[#FFB500]/20' },
    ENT: { main: '#7369FF', bg: '#100b3b', text: 'text-[#7369FF]', selectLine: 'border-[#7369FF]/20' },
    DIR: { main: '#26D1D1', bg: '#032323', text: 'text-[#26D1D1]', selectLine: 'border-[#26D1D1]/20' },
    DENS: { main: '#FF0044', bg: '#2c000a', text: 'text-[#FF0044]', selectLine: 'border-[#FF0044]/20' }
  };

  // Dynamic sound color matrix
  const soundColorMap: Record<'chord' | 'bass' | 'pluck' | 'percussion' | 'lead', { main: string; text: string; bg: string; shadow: string }> = {
    chord: { main: '#4ADE80', text: 'text-[#4ADE80]', bg: 'bg-[#4ADE80]', shadow: 'shadow-[0_0_12px_rgba(74,222,128,0.7)] border-[#4ADE80]/30' },
    bass: { main: '#FF0044', text: 'text-[#FF0044]', bg: 'bg-[#FF0044]', shadow: 'shadow-[0_0_12px_rgba(255,0,68,0.7)] border-[#FF0044]/30' },
    pluck: { main: '#26D1D1', text: 'text-[#26D1D1]', bg: 'bg-[#26D1D1]', shadow: 'shadow-[0_0_12px_rgba(38,209,209,0.7)] border-[#26D1D1]/30' },
    percussion: { main: '#FFB500', text: 'text-[#FFB500]', bg: 'bg-[#FFB500]', shadow: 'shadow-[0_0_12px_rgba(255,181,0,0.7)] border-[#FFB500]/30' },
    lead: { main: '#7369FF', text: 'text-[#7369FF]', bg: 'bg-[#7369FF]', shadow: 'shadow-[0_0_12px_rgba(115,105,255,0.7)] border-[#7369FF]/30' }
  };

  return (
    <div className="bg-zinc-950/85 border border-white/[0.08] p-4 sm:p-6 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-md">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#d4ff00] to-transparent opacity-50" />
      
      {/* Top Title Strip Bar Frame */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/[0.06] pb-4 mb-5 gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#d4ff00] animate-pulse" />
          <span className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase font-bold">WAVE INTERFERENCE ALGORITHM EXPERIMENTAL LAB</span>
        </div>
        <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 border border-white/5 px-2 py-0.5 rounded font-bold uppercase shrink-0">
          ALGORITHM #27 COCKPIT
        </span>
      </div>

      {/* Main Grid + Knobs Horizontal Cockpit Wrap Layout */}
      <div className="flex flex-col lg:flex-row items-stretch gap-6 select-none">
        
        {/* 1. Left controls knobs panels (2x2 grid) */}
        <div className="flex flex-col items-center justify-center p-4 bg-black/40 border border-white/[0.03] rounded-xl shrink-0 lg:w-48">
          <span className="text-[8px] font-mono text-zinc-500 tracking-widest uppercase font-bold text-center block mb-4">DRAG PARAMETERS</span>
          
          <div className="grid grid-cols-4 sm:grid-cols-2 gap-x-4 gap-y-5">
            {Object.keys(knobValues).map((key) => {
              const val = knobValues[key as keyof typeof knobValues];
              const meta = knobMeta[key as keyof typeof knobMeta];
              const kc = knobColors[key] || { main: '#d4ff00', bg: '#161801', text: 'text-[#d4ff00]', selectLine: '' };
              
              // Standard circular gauge parameters drawing math
              const radius = 35;
              const circumference = 2 * Math.PI * radius;
              const arcLength = circumference * 0.75; // 270 degree arc space
              
              const range = meta.max - meta.min;
              const normalizedPos = (val - meta.min) / range;
              const strokeDashoffset = arcLength - normalizedPos * arcLength;

              return (
                <div key={key} className="flex flex-col items-center select-none group relative">
                  {/* Hover Details Popover Box */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 pointer-events-none hidden group-hover:block z-50 bg-zinc-950 text-[9px] font-mono border border-zinc-900 rounded p-1.5 text-center shadow-2xl font-light">
                    <span className={`font-bold block mb-0.5 ${kc.text}`}>{meta.name}</span>
                    <span className="text-zinc-400 leading-tight block">{meta.desc}</span>
                  </div>

                  <div 
                    onMouseDown={(e) => handleKnobMouseDown(key, e)}
                    onTouchStart={(e) => handleKnobTouchStart(key, e)}
                    className="cursor-ns-resize touch-none flex items-center justify-center relative w-16 h-16"
                    title={`${meta.name}: ${val}`}
                  >
                    <svg className="w-full h-full rotate-135" viewBox="0 0 100 100">
                      {/* Custom background tracking arch */}
                      <circle 
                        cx="50" 
                        cy="50" 
                        r={radius} 
                        fill="transparent" 
                        stroke={kc.bg} 
                        strokeWidth="9" 
                        strokeDasharray={`${arcLength} ${circumference}`} 
                        strokeLinecap="round" 
                      />
                      {/* Active custom color dial progress arch */}
                      <circle 
                        cx="50" 
                        cy="50" 
                        r={radius} 
                        fill="transparent" 
                        stroke={kc.main} 
                        strokeWidth="9" 
                        strokeDasharray={`${arcLength} ${circumference}`} 
                        strokeDashoffset={strokeDashoffset} 
                        strokeLinecap="round" 
                        className="transition-all duration-75" 
                      />
                    </svg>

                    {/* Numeric counter display in the center with knob text color */}
                    <div className={`absolute inset-0 flex items-center justify-center font-mono text-lg font-extrabold tracking-tighter select-none pointer-events-none ${kc.text}`}>
                      {val}
                    </div>
                  </div>

                  {/* Knob label indicator below */}
                  <span className="mt-1 text-[9px] font-mono text-zinc-400 uppercase tracking-[0.2em] block font-black leading-none text-center">
                    {key}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Right sequencer grid visualization */}
        <div className="flex-1 flex flex-col justify-between p-3 bg-black/50 border border-white/[0.04] rounded-xl overflow-hidden min-w-[280px]">
          
          {/* Scrollable step-grid board frame */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 pointer-events-none">
            <div className="min-w-[640px] flex flex-col relative py-2 gap-[2px]">
              
              {/* 8 note pitch rows grids */}
              {Array.from({ length: 8 }).map((_, rIdx) => {
                // Render pitch lines backwards: Row 7 target highest frequency, Row 0 target lowest bass
                const rowNum = 7 - rIdx;
                const soundColor = soundColorMap[selectedSound];
                
                return (
                  <div key={rowNum} className="flex h-6 items-center gap-1">
                    
                    {/* Left side static selection note key-blocks */}
                    <div className="w-7 h-full bg-zinc-900/60 border border-white/[0.02] flex items-center justify-center text-[8px] font-mono font-bold text-zinc-500 rounded-sm">
                      {rowNum}
                    </div>

                    {/* 32 columns slots loop */}
                    {Array.from({ length: 32 }).map((_, sIdx) => {
                      const stepData = steps[sIdx];
                      const isTriggered = stepData?.trigger && stepData?.row === rowNum;
                      
                      // Highlight vertical playhead step sweep columns
                      const isPlayhead = isPlaying && currentStep === sIdx;
                      
                      // Distinct beats visual dividers indicators
                      const isDivider = (sIdx + 1) % 4 === 0 && sIdx < 31;

                      return (
                        <div 
                          key={sIdx} 
                          className={`flex-1 h-full rounded-sm transition-all relative border border-white/[0.01] ${isPlayhead ? 'bg-zinc-900/40' : 'bg-zinc-950/20'} ${isDivider ? 'mr-1 border-r border-white/[0.04]' : ''}`}
                        >
                          {/* Render beautiful floating sound-color-specific active node element block */}
                          {isTriggered && (
                            <div className={`absolute inset-0 rounded-[2px] border ${soundColor.bg} ${soundColor.shadow} animate-pulse duration-1000`} />
                          )}
                          
                          {/* Inner playhead vertical glowing tick marker */}
                          {isPlayhead && (
                            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-[#d4ff00]/60" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Bottom horizontal separator margin split divider line */}
              <div className="h-[1px] bg-white/[0.06] my-1" />

              {/* Trigger lane strip matching bottom screen visual of mockup */}
              <div className="flex h-4 items-center gap-1">
                
                {/* Visual anchor key icon block */}
                <div className="w-7 h-full bg-zinc-950 flex items-center justify-center text-[7px] font-mono text-zinc-500 rounded-sm">
                  TRG
                </div>

                {Array.from({ length: 32 }).map((_, sIdx) => {
                  const stepData = steps[sIdx];
                  const hasTrigger = stepData?.trigger;
                  const isPlayhead = isPlaying && currentStep === sIdx;
                  const isDivider = (sIdx + 1) % 4 === 0 && sIdx < 31;
                  const soundColor = soundColorMap[selectedSound];

                  return (
                    <div 
                      key={sIdx} 
                      className={`flex-1 h-full rounded-sm transition-all border border-white/[0.01] flex items-center justify-center relative ${isPlayhead ? 'bg-zinc-900/50' : 'bg-zinc-950/40'} ${isDivider ? 'mr-1' : ''}`}
                    >
                      {hasTrigger && (
                        <div 
                          className="w-full h-full rounded-[1px]" 
                          style={{ 
                            backgroundColor: `${soundColor.main}3d`,
                            border: `1px solid ${soundColor.main}25`
                          }} 
                        />
                      )}

                      {isPlayhead && (
                        <div className="absolute inset-0 border border-[#d4ff00]/50 rounded-sm pointer-events-none" />
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Action trigger cockpit dashboard */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-white/[0.04] font-mono select-none">
            
            {/* Play, Stop and Volume Mute selectors */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={togglePlayback}
                className={`flex items-center space-x-2 px-4 h-9 rounded-lg text-[10px] font-bold tracking-widest transition-all ${isPlaying ? 'bg-[#d4ff00] text-black shadow-lg shadow-[#d4ff00]/20' : 'bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white'}`}
              >
                {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                <span>{isPlaying ? 'STOP PREVIEW' : 'RUN PREVIEW'}</span>
              </button>

              <button 
                onClick={toggleMute}
                className="w-9 h-9 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
                title={isMuted ? "Unmute Sound" : "Mute Sound"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-zinc-500" /> : <Volume2 className="w-3.5 h-3.5 text-[#d4ff00]" />}
              </button>
            </div>

            {/* 4 Sounds preset model switcher row */}
            <div className="flex items-center bg-zinc-950/80 p-1 rounded-lg border border-white/[0.03] gap-1 shrink-0">
              {(['chord', 'bass', 'pluck', 'percussion', 'lead'] as const).map((sound) => {
                const isSelected = selectedSound === sound;
                const sc = soundColorMap[sound];
                return (
                  <button
                    key={sound}
                    onClick={() => {
                      unlockAudio(); // unlock iOS audio on this gesture
                      setSelectedSound(sound);
                      // Instantly fire a demo note if clicked while sequencer is idle
                      if (!isPlaying) {
                        playSequenceNote(sound, 3);
                      }
                    }}
                    className={`px-3 py-1 rounded-[4px] text-[8px] tracking-wider uppercase font-black transition-all ${isSelected ? `${sc.bg} text-black font-extrabold font-mono shadow-sm` : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {sound}
                  </button>
                );
              })}
            </div>

            {/* BPM slider control */}
            <div className="flex items-center gap-2 bg-zinc-90 w-full sm:w-auto mt-2 sm:mt-0 px-2 py-1 rounded-lg border border-white/[0.02]">
              <span className="text-[8px] text-zinc-500">TEMPO</span>
              <input 
                type="range"
                min="60"
                max="200"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value))}
                className="w-20 md:w-24 accent-[#d4ff00] h-1 bg-zinc-800 rounded cursor-pointer"
              />
              <span className="text-[10px] text-zinc-200 font-bold shrink-0">{bpm} BPM</span>
            </div>

          </div>

        </div>

      </div>

      {/* Information text summary disclaimer regarding wave parameters mapping */}
      <div className="mt-4 p-3 bg-zinc-950/40 border border-white/[0.04] rounded-lg flex flex-col gap-2.5">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#d4ff00] shrink-0 mt-0.5" />
          <span className="text-[10px] text-zinc-400 font-sans leading-normal font-light">
            <strong className="text-zinc-300 font-bold font-mono">LAB NOTE:</strong> This demo voices algorithm #27, Wave Interference, through a simple dual-sine source. Modulate the seed divisors to set up coprime ratios, blend the interference with <strong className="text-white font-medium">DIR</strong>, and shape density with <strong className="text-white font-medium">DENS</strong>. In VEKTE the same algorithm drives MIDI, so it can play anything from sparse plucks to evolving sub-bass on the instrument you route it to.
          </span>
        </div>
        
        {/* Colors Legend Banner */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-white/[0.04] pt-2 mt-1 text-[9px] font-mono justify-center sm:justify-start">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#4ADE80] shadow-[0_0_6px_rgba(74,222,128,0.5)]" /> CHORD (Green)</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FF0044] shadow-[0_0_6px_rgba(255,0,68,0.5)]" /> BASS (Crimson)</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#26D1D1] shadow-[0_0_6px_rgba(38,209,209,0.5)]" /> PLUCK (Teal)</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FFB500] shadow-[0_0_6px_rgba(255,181,0,0.5)]" /> PERCUSSION (Amber)</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#7369FF] shadow-[0_0_6px_rgba(115,105,255,0.5)]" /> LEAD (Indigo)</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#d4ff00] shadow-[0_0_6px_rgba(212,255,0,0.5)]" /> LIME (Main)</span>
        </div>
      </div>
    </div>
  );
}
