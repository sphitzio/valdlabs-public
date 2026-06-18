import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Layers, 
  Sliders, 
  Cpu, 
  Download, 
  CheckCircle, 
  Lock, 
  ChevronRight, 
  Info, 
  BookOpen, 
  ExternalLink,
  SlidersHorizontal,
  FolderLock
} from 'lucide-react';
import { SYNTH_ENGINES, CONTROLS_DEFINITION, Engine } from './types';
import { VekteAudioEngine } from './components/AudioEngine';
import { VekteLogo } from './components/VekteLogo';
import { WaveInterferenceSimulator } from './components/WaveInterferenceSimulator';

export default function App() {
  const [audioEngine] = useState(() => new VekteAudioEngine());
  const [selectedEngine, setSelectedEngine] = useState<Engine>(SYNTH_ENGINES[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'interactive' | 'family'>('interactive');
  
  // Beta Download States
  const [betaSuccess, setBetaSuccess] = useState('');
  const [downloadingOS, setDownloadingOS] = useState<string | null>(null);

  // Email subscription (FormSubmit) States
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const honey = (e.currentTarget as HTMLFormElement).querySelector<HTMLInputElement>('input[name="_honey"]')?.value;
    if (honey) return; // spam trap tripped
    setSubscribeStatus('sending');
    try {
      const res = await fetch('https://formsubmit.co/ajax/vald.labs.lisbon@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email: subscribeEmail,
          _subject: 'Vekte waitlist',
          _captcha: 'false',
        }),
      });
      if (!res.ok) throw new Error('FormSubmit failed');
      setSubscribeStatus('done');
      setSubscribeEmail('');
    } catch (err) {
      console.error('Subscribe failed:', err);
      setSubscribeStatus('error');
    }
  };

  const DOWNLOAD_URLS = {
    win: 'https://github.com/sphitzio/valdlabs-public/releases/download/v1.1.4/VEKTE-Setup-1.1.4-x64.exe',
    mac: 'https://github.com/sphitzio/valdlabs-public/releases/download/v1.1.4/VEKTE-1.1.4.dmg',
  };

  const handleBetaDownload = (os: 'win' | 'mac') => {
    setBetaSuccess('');
    setDownloadingOS(os === 'win' ? 'Win64 VST3' : 'MacOS VST3');

    setTimeout(() => {
      setDownloadingOS(null);
      setBetaSuccess(`Your download of VEKTE Beta (${os === 'win' ? 'Win64 VST3' : 'MacOS VST3'}) has started. This beta build remains valid until mid-August.`);

      try {
        const a = document.createElement('a');
        a.href = DOWNLOAD_URLS[os];
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) {
        console.error("Download trigger failed:", e);
      }
    }, 1500);
  };
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [activePitch, setActivePitch] = useState<number>(-1);
  
  // Live parameters control values
  const [knobValues, setKnobValues] = useState<Record<string, number>>({
    TIM: 50, MOR: 50, HAR: 50, FM: 0,
    A: 5, D: 40, S: 70, R: 30,
    TYPE: 0, CUT: 80, RES: 20, ENV: 30,
    fA: 10, fD: 40, fS: 50, fR: 40,
    DET: 15, SPRD: 50, PORT: 10, FOLD: 0,
    SHP: 0, DEPT: 0, SPD: 50, DEST: 0
  });

  // Oscilloscope canvas tracking
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Load engine sound parameters when toggled
  const selectEngineHandler = (engine: Engine) => {
    setSelectedEngine(engine);
    audioEngine.setEngine(engine.id);
    
    // Preset mock/defaults maps to show in the knobs
    const defaultControls: Record<string, number> = {
      0: { TIM: 50, MOR: 40, HAR: 50, CUT: 75, RES: 30 }, // EastCoast
      7: { TIM: 30, MOR: 30, HAR: 0, CUT: 65, RES: 15 },  // Chiptune
      13: { TIM: 65, MOR: 55, HAR: 0, CUT: 80, RES: 5 },  // Wavetabl
      23: { TIM: 10, MOR: 80, HAR: 0, CUT: 90, RES: 25 }, // HiHat
      24: { TIM: 85, MOR: 50, HAR: 82, CUT: 75, RES: 5 }, // Karplus
      27: { TIM: 50, MOR: 50, HAR: 60, CUT: 58, RES: 20 }, // SuprSaw
      28: { TIM: 40, MOR: 20, HAR: 0, CUT: 50, RES: 40 },  // Formant
      30: { TIM: 75, MOR: 60, HAR: 30, CUT: 40, RES: 35 }  // WavFold
    }[engine.id] || { TIM: 50, MOR: 50, HAR: 50, CUT: 60, RES: 20 };

    setKnobValues(prev => {
      const updated = { ...prev, ...defaultControls };
      audioEngine.setAllControls(updated);
      return updated;
    });
  };

  // Sound play handler
  const togglePlayHandler = () => {
    audioEngine.init();
    if (isPlaying) {
      audioEngine.stopSequencing();
      setIsPlaying(false);
      setActiveStep(-1);
    } else {
      audioEngine.setEngine(selectedEngine.id);
      audioEngine.startSequencing((step, note) => {
        setActiveStep(step % 16);
        setActivePitch(note);
      });
      setIsPlaying(true);
    }
  };

  const toggleMuteHandler = () => {
    audioEngine.init();
    setIsMuted(!isMuted);
    // Directly bypass gain limits
    const analyser = audioEngine.getAnalyser();
    if (analyser && analyser.context) {
      if (analyser.context.state === 'suspended') {
        analyser.context.resume();
      }
    }
  };

  // Adjust parameter knob values
  const handleKnobChange = (id: string, val: number) => {
    setKnobValues(prev => {
      const updated = { ...prev, [id]: val };
      audioEngine.updateControl(id, val);
      return updated;
    });
  };

  // Trigger quick interactive preview pluck sound
  const playPreviewNote = (noteOffset: number = 0) => {
    audioEngine.init();
    const finalNote = 48 + noteOffset; // C3 + offset
    audioEngine.noteOn(finalNote, 0.85);
    setTimeout(() => {
      audioEngine.noteOff(finalNote);
    }, 450);
  };

  // Canvas visualizer loop
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localBuffer: Uint8Array | null = null;

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const analyser = audioEngine.getAnalyser();
      if (!analyser || isMuted) {
        // Draw static beautiful breathing ambient lines if muted or inactive
        ctx.strokeStyle = 'rgba(212, 255, 0, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const t = Date.now() * 0.003;
        for (let i = 0; i < width; i++) {
          const y = height / 2 + Math.sin(i * 0.03 + t) * Math.cos(i * 0.008) * 12;
          if (i === 0) ctx.moveTo(i, y);
          else ctx.lineTo(i, y);
        }
        ctx.stroke();
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      if (!localBuffer || localBuffer.length !== bufferLength) {
        localBuffer = new Uint8Array(bufferLength);
      }
      
      analyser.getByteTimeDomainData(localBuffer);

      // Draw high fidelity vector oscilloscope line
      ctx.strokeStyle = '#d4ff00';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(212, 255, 0, 0.5)';
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = localBuffer[i] / 128.0; // Normalized
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioEngine, isMuted]);

  // Clean-up synth on unmount
  useEffect(() => {
    return () => {
      audioEngine.destroy();
    };
  }, [audioEngine]);

  // Group sound engines into high-fidelity filter tabs
  const categories = [
    { id: 'all', title: 'ALL 31 ALGORITHMS' },
    { id: 'rhythm-driven', title: 'RHYTHM SIGNATURES' },
    { id: 'chaotic-cellular', title: 'CHAOS & CELLULAR' },
    { id: 'algorithmic-fractal', title: 'FRACTALS & SEEDERS' },
    { id: 'melodic-markov', title: 'MELODIC & MARKOV' },
    { id: 'physical-physics', title: 'PHYSICS & HARMONICS' },
  ];

  const filteredEngines = (selectedCategory === 'all'
    ? SYNTH_ENGINES
    : SYNTH_ENGINES.filter(e => e.category === selectedCategory)
  ).slice().sort((a, b) => {
    // Pin Wave Interference (#26, the playable web demo) to the top
    if (a.id === 26) return -1;
    if (b.id === 26) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#060606] text-zinc-100 font-sans selection:bg-[#d4ff00]/30 selection:text-white">
      
      {/* BACKGROUND GRAPHIC VIDEO LINEAGE */}
      <div className="absolute inset-0 w-full h-[100vh] overflow-hidden z-0 pointer-events-none border-b border-zinc-900">
        {/* Seamless Dither ASCII Vector Video Loop */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen scale-105 select-none"
        >
          <source 
            src="https://github.com/sphitzio/valdlabs-public/raw/refs/heads/main/public/vekte/assets/bgsite.mp4" 
            type="video/mp4" 
          />
        </video>
        
        {/* Cinematic Atmospheric Vignette Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060606] via-[#060606]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060606]/85 via-transparent to-[#060606]/85" />
        
        {/* Subtle glowing mesh overlays mimicking Vekte */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#d4ff00]/2 blur-[170px] pointer-events-none" />
      </div>

      {/* HEADER NAVIGATION */}
      <header className="relative z-10 border-b border-white/[0.05] bg-black/45 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          
          {/* Logo / Title brand */}
          <div className="flex items-center space-x-3 select-none">
            <VekteLogo className="w-20 md:w-24 h-auto" />
          </div>

          {/* Links menu */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-mono tracking-wider text-zinc-400">
            <a href="#about" className="hover:text-white transition-colors">OVERVIEW</a>
            <a href="#engines" className="hover:text-white transition-colors flex items-center gap-1">
              ALGORITHMS <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded-full font-sans font-normal">31</span>
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">SPECS</a>
            <a href="#playground" className="hover:text-[#d4ff00] text-[#d4ff00]/90 transition-colors flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> LIVE DEMO
            </a>
          </nav>

          {/* Call to Actions Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleBetaDownload('win')}
              disabled={downloadingOS !== null}
              className="flex items-center space-x-2 text-xs font-mono font-bold bg-[#d4ff00] text-black px-4 py-2 rounded-lg hover:bg-white tracking-widest transition-all shadow-[0_4px_20px_rgba(212,255,0,0.25)] hover:shadow-white/20 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-wait"
            >
              <Download className={`w-4 h-4 ${downloadingOS === 'Win64 VST3' ? 'animate-bounce' : ''}`} />
              <span>{downloadingOS === 'Win64 VST3' ? '...' : 'Win64'}</span>
            </button>
            <button
              onClick={() => handleBetaDownload('mac')}
              disabled={downloadingOS !== null}
              className="flex items-center space-x-2 text-xs font-mono font-bold bg-zinc-900 border border-[#d4ff00]/30 text-[#d4ff00] px-4 py-2 rounded-lg hover:border-[#d4ff00] hover:bg-[#d4ff00]/5 tracking-widest transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-wait"
            >
              <Download className={`w-4 h-4 ${downloadingOS === 'MacOS VST3' ? 'animate-bounce' : ''}`} />
              <span>{downloadingOS === 'MacOS VST3' ? '...' : 'MacOS'}</span>
            </button>
          </div>

        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-12 md:pt-24 md:pb-16 text-center flex flex-col items-center space-y-6">
        
        {/* Tag Category */}
        <div className="inline-flex items-center space-x-2.5 font-mono text-[10px] text-[#d4ff00] tracking-widest bg-[#d4ff00]/10 border border-[#d4ff00]/30 px-3 py-1 rounded-full w-max">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d4ff00] animate-pulse" />
          <span className="font-bold">1.1.4 VST NOW OPEN BETA</span>
        </div>

        {/* Epic Main Headline title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-white leading-tight max-w-3xl">
          Generative, not random.<br />
          <span className="bg-gradient-to-r from-[#d4ff00] via-[#ecff80] to-white bg-clip-text text-transparent">
            A deterministic MIDI sequencer driven by 31 mathematical algorithms.
          </span>
        </h1>

        {/* Narrative introduction paragraph */}
        <p className="text-zinc-300 text-sm sm:text-base leading-relaxed max-w-3xl font-light font-sans">
          VEKTE is a 16-channel generative MIDI sequencer plugin by Våld Labs. Each channel runs five independent lanes (one NOTE lane and four MOD lanes) driven by 31 mathematical algorithms, from logistic maps to Lindenmayer systems and Xenakis sieves. Because it's fully deterministic, any pattern compresses into a short text key, shareable by message or social post and identical when reopened. VST3 now, with AUv3 and standalone builds in development.
        </p>

        {/* Beautiful modular vector features matrix */}
        <div className="flex flex-wrap justify-center gap-4 pt-2 text-xs font-mono text-zinc-400">
          <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-white/[0.01] border border-white/[0.04]">
            <Layers className="w-4 h-4 text-[#d4ff00]" />
            <span>16 Generative Channels</span>
          </div>
          <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-white/[0.01] border border-white/[0.04]">
            <Cpu className="w-4 h-4 text-[#d4ff00]" />
            <span>31 Deterministic Algos</span>
          </div>
          <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-white/[0.01] border border-white/[0.04]">
            <Sliders className="w-4 h-4 text-[#d4ff00]" />
            <span>5 Lanes Per Channel</span>
          </div>
        </div>

        {/* Quick CTA cluster */}
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
          <a
            href="#playground"
            className="flex items-center justify-center space-x-2 bg-zinc-900 border border-white/10 hover:border-[#d4ff00]/40 text-white font-mono text-xs font-bold tracking-widest px-6 py-3.5 rounded-xl hover:bg-black transition-all"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#d4ff00]" />
            <span>PLAYGROUND</span>
          </a>

          <button
            onClick={() => handleBetaDownload('win')}
            disabled={downloadingOS !== null}
            className="flex items-center justify-center space-x-2 bg-white hover:bg-[#d4ff00] text-black font-mono text-xs font-bold tracking-widest px-6 py-3.5 rounded-xl transition-all shadow-xl disabled:opacity-60 disabled:cursor-wait"
          >
            <Download className={`w-4 h-4 ${downloadingOS === 'Win64 VST3' ? 'animate-bounce' : ''}`} />
            <span>{downloadingOS === 'Win64 VST3' ? 'PREPARING...' : 'Win64 VST3'}</span>
          </button>

          <button
            onClick={() => handleBetaDownload('mac')}
            disabled={downloadingOS !== null}
            className="flex items-center justify-center space-x-2 bg-zinc-900 border border-[#d4ff00]/30 hover:border-[#d4ff00] hover:bg-[#d4ff00]/5 text-[#d4ff00] font-mono text-xs font-bold tracking-widest px-6 py-3.5 rounded-xl transition-all shadow-xl disabled:opacity-60 disabled:cursor-wait"
          >
            <Download className={`w-4 h-4 ${downloadingOS === 'MacOS VST3' ? 'animate-bounce' : ''}`} />
            <span>{downloadingOS === 'MacOS VST3' ? 'PREPARING...' : 'MacOS VST3'}</span>
          </button>
        </div>

        <div className="flex flex-col items-center space-y-4 pt-2">
          <div className="text-[10px] font-mono text-zinc-500 flex flex-wrap gap-x-4 gap-y-1 justify-center">
            <span>• VST3 — WINDOWS & MACOS</span>
            <span>• APPLE SILICON NATIVE</span>
            <span>• AUV3 / STANDALONE IN DEVELOPMENT</span>
          </div>
          <div className="flex items-center space-x-6">
            <img
              src="https://raw.githubusercontent.com/sphitzio/valdlabs-public/9dbe4acc388aa8a1c4b80f560e5f4e9d524f886b/public/vekte/assets/platforms/vst3.svg"
              alt="VST3"
              className="h-7 w-auto opacity-50 hover:opacity-100 transition-all filter brightness-[1.2]"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

      </section>

      {/* VEKTE SOUND DESIGN COCKPIT (INTERACTIVE SIMULATOR) */}
      <section id="playground" className="relative z-10 py-16 px-6 max-w-7xl mx-auto">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-[10px] font-mono text-[#d4ff00] uppercase tracking-[0.25em] block font-bold mb-2">INTERACTIVE MONITOR</span>
          <h2 className="text-3xl font-display font-extrabold text-white tracking-tight sm:text-4xl">
            Vekte Real-Time Algorithmic Sculpting
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed mt-4 font-light animate-fade-in">
            Toggle the running arpeggio pattern, play notes, and drag the parameter dials to hear how each algorithm reshapes the sequence in real time. The sound here comes from a built-in demo instrument so you can audition the MIDI. VEKTE itself outputs MIDI.
          </p>
        </div>

        {/* Master Cockpit Layout - Stacked Vertical columns ordered by: lab, screenshot, video */}
        <div className="flex flex-col gap-12 max-w-4xl mx-auto">
          
          {/* 1. Interactive Web Simulator */}
          <WaveInterferenceSimulator />

          {/* 2. Real Instrument Screenshot */}
          <div className="bg-zinc-950/85 border border-white/[0.08] p-4 sm:p-6 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#d4ff00] to-transparent opacity-50" />
            <div className="flex justify-between items-center border-b border-white/[0.06] pb-4 mb-5">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase font-bold">THE PLUGIN INTERFACE</span>
              </div>
              <span className="text-[9px] font-mono text-[#d4ff00] bg-[#d4ff00]/10 border border-[#d4ff00]/25 px-2 py-0.5 rounded font-bold">LIVE BUILD</span>
            </div>
            
            <div className="rounded-xl border border-white/10 overflow-hidden bg-black/50 shadow-2xl relative group">
              <img 
                src="https://github.com/sphitzio/valdlabs-public/blob/main/public/vekte/assets/vekte_5lanes.png?raw=true"
                alt="VEKTE Plugin Interface"
                className="w-full h-auto object-cover transform hover:scale-[1.01] transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="mt-4 text-[10px] font-mono text-zinc-500 text-center uppercase tracking-wider">
              • High-definition interface featuring 31 mathematical generative algorithms & 5 concurrent lane matrix engines •
            </p>
          </div>

          {/* 3. Video Walkthrough */}
          <div className="bg-zinc-950/85 border border-white/[0.08] p-4 sm:p-6 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="flex justify-between items-center border-b border-white/[0.06] pb-4 mb-5">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase font-bold">VIDEO WALKTHROUGH</span>
              </div>
              <span className="text-[9px] font-mono text-[#d4ff00] bg-[#d4ff00]/10 border border-[#d4ff00]/25 px-2 py-0.5 rounded font-bold">AUV3 PREVIEW (IN DEVELOPMENT)</span>
            </div>

            <div className="relative w-full aspect-video rounded-xl border border-white/10 overflow-hidden shadow-2xl bg-black">
              <iframe 
                src="https://www.youtube.com/embed/e4iW2RNk9IU" 
                title="VEKTE App Demonstration"
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>
            <div className="mt-4 text-[11px] font-sans font-light text-zinc-400 leading-relaxed text-center">
               Watch VEKTE driving instruments over MIDI, with per-lane algorithm routing and parameter automation. This clip previews the in-development AUv3 build; the current beta is VST3 on desktop, and the video also features Tresse.
            </div>
          </div>

        </div>

      </section>

      {/* BRAND VALUES / DETAILED HERO MARKETING SLATE */}
      <section id="about" className="relative z-10 border-t border-white/[0.05] bg-black/40 py-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          
          {/* Description narrative / images details */}
          <div className="flex flex-col space-y-6">
            <span className="text-[10px] font-mono text-[#d4ff00] uppercase tracking-[0.2em] block font-bold">THE INSPIRATION</span>
            <h2 className="text-3xl font-display font-extrabold tracking-tight text-white leading-tight">
              16 Channels of Parametric Logic. Infinite Polyphonic Drift.
            </h2>
            <p className="text-zinc-300 text-sm leading-relaxed font-light">
              VEKTE takes the multi-lane modulation thinking of Eurorack modular routing and rebuilds it as a plugin that lives in your DAW. By combining up to <span className="font-semibold text-white">five independent lanes per channel</span> (one NOTE lane and four MOD lanes) with <span className="font-semibold text-white">31 mathematical algorithms</span>, it breaks the usual step-grid constraints.
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed font-light">
              With immediate support for 73 scales grouped by musical family, 40 dynamic chord sets, micro-strumming controls, and smooth Catmull-Rom curve interpolation, the scope of generation runs from classic Euclidean rhythms to polyrhythmic metronomes, generative boids flocking, and reaction-diffusion arrays.
            </p>

            {/* Key feature highlights cards list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-zinc-950/60 border border-white/[0.04]">
                <CheckCircle className="w-4 h-4 text-[#d4ff00] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-mono font-bold text-zinc-200">STATE RECALLS</h4>
                  <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">Perfect session persistent state saving directly inside DAW hosts.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-zinc-950/60 border border-white/[0.04]">
                <CheckCircle className="w-4 h-4 text-[#d4ff00] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-mono font-bold text-zinc-200">INTELLIGENT RANDOM</h4>
                  <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">Generate a usable starting pattern with one click.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Design Layout showcase mockup */}
          <div className="relative">
            <div className="absolute inset-0 bg-[#d4ff00]/5 blur-3xl pointer-events-none" />
            <div className="border border-white/[0.06] bg-zinc-950/90 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/[0.05] pb-4 mb-5">
                <span className="text-[10px] font-mono text-[#d4ff00] uppercase tracking-widest font-bold">REKKE'S DNA HARDWARE INHERITANCE</span>
                <span className="text-[10px] font-mono text-zinc-500">DNA SEQR ENGINE</span>
              </div>
              
              {/* Timeline diagram mapping hardware to iOS plugin */}
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-zinc-900/60 border border-white/[0.03] p-3 rounded-lg">
                  <div>
                    <span className="text-xs text-white block font-mono font-bold">REKKE'S DNA CORE</span>
                    <span className="text-[11px] text-zinc-400 block mt-0.5">A full hardware sequencer currently under development, establishing VEKTE's structural genes.</span>
                  </div>
                  <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">HARDWARE</span>
                </div>

                <div className="flex justify-center py-1">
                  <div className="w-0.5 h-6 border-l border-dashed border-zinc-700" />
                </div>

                <div className="flex justify-between items-center bg-zinc-850 border border-[#d4ff00]/20 p-3 rounded-lg shadow-lg">
                  <div>
                    <span className="text-xs text-[#d4ff00] block font-mono font-bold">VEKTE — VST3 now; AUv3 and iOS in development</span>
                    <span className="text-[11px] text-zinc-300 block mt-0.5">16 independent channels, 1 NOTE + 4 MOD lanes, 73 scales, 40 chords, Catmull-Rom curve interpolation.</span>
                  </div>
                  <span className="text-[10px] font-mono bg-[#d4ff00]/10 text-[#d4ff00] px-2 py-0.5 rounded border border-[#d4ff00]/30 font-bold">SPINOFF</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* CORE FEATURE SPEC LIST BENTO GRID */}
      <section id="architecture" className="relative z-10 py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[10px] font-mono text-[#d4ff00] uppercase tracking-[0.25em] block font-bold mb-2">TECHNICAL POWERHOUSE</span>
          <h2 className="text-3xl font-display font-extrabold text-white tracking-tight sm:text-4xl">
            Uncompromising specifications. Optimized engine logic.
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed mt-4 font-light">
            Every layer of VEKTE's mathematical core has been designed to run with extreme lightweight efficiency, ensuring sample-accurate note timing across heavy multi-track host configurations.
          </p>
        </div>

        {/* Bento Grid layouts */}
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Block 1: 31-Algorithm Engine Core */}
          <div className="bg-zinc-950/70 border border-white/[0.05] p-6 rounded-2xl flex flex-col justify-between hover:border-white/[0.1] transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-[#d4ff00] mb-4 shadow">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-base font-mono font-extrabold text-white uppercase tracking-wider">31 Generative Algorithm Core</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-2.5 font-light">
                Each lane runs on one of 31 mathematical algorithms—including Euclidean rhythms, Chaos Logistic Maps, Lindenmayer Systems (L-Systems), Game of Life cellular automata, and Xenakis sieves. Generation is strictly deterministic; identical settings yield the exact same patterns.
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#d4ff00] uppercase tracking-widest mt-6 font-bold">STRICTLY DETERMINISTIC PATTERNS</span>
          </div>

          {/* Block 2: 5 Lanes per Channel */}
          <div className="bg-zinc-950/70 border border-white/[0.05] p-6 rounded-2xl flex flex-col justify-between hover:border-white/[0.1] transition-all md:col-span-1">
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-[#d4ff00] mb-4 shadow">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-mono font-extrabold text-white uppercase tracking-wider">5 Lanes Per Channel</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-2.5 font-light">
                Run up to five concurrent lanes side by side (one NOTE lane and four MOD lanes) on every active slot. Modulation lanes smoothly target performance vectors (Velocity, Length, CC#), internal structures (Steps, Rotation), scale chords, or other lanes' parameters.
              </p>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-6">1 NOTE + 4 MOD LAYER CLUSTERS</span>
          </div>

          {/* Block 3: Scale-Locked Dynamics */}
          <div className="bg-zinc-950/70 border border-white/[0.05] p-6 rounded-2xl flex flex-col justify-between hover:border-white/[0.1] transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-[#d4ff00] mb-4 shadow">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-mono font-extrabold text-white uppercase tracking-wider">73 Musical Scale Snappers</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-2.5 font-light">
                Configure patterns with 73 built-in scales grouped into families (Diatonic, Major/Minor, Symmetric, Greek, Microtonal) and 40 chords. When MOD lanes target Scale/Chord, they dynamically sweep parameters inside that musical family. Choose Scale: NONE for chromatic editing.
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#d4ff00] uppercase tracking-widest mt-6 font-bold">NONE ➔ DIATONIC ➔ MICROTONAL</span>
          </div>

          {/* Block 4: Catmull-Rom Smooth Vector Curves & Chords Strum */}
          <div className="bg-zinc-950/70 border border-white/[0.05] p-6 rounded-2xl md:col-span-2 flex flex-col justify-between hover:border-white/[0.1] transition-all">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-base font-mono font-extrabold text-white uppercase tracking-wider">Catmull-Rom Mod Curves</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mt-2.5 font-light">
                  Smoothly interpolate modulation values using fractional Catmull-Rom vectors. Mod curves run as continuous glide generators, making them excellent for filter sweeps, volume swells, and automated CC parameters that stay responsive to host clocks without sharp stepping.
                </p>
              </div>
              <div className="border-t sm:border-t-0 sm:border-l border-white/[0.05] pt-6 sm:pt-0 sm:pl-6">
                <h3 className="text-base font-mono font-extrabold text-zinc-300 uppercase tracking-wider font-bold">Micro-Strumming Controls</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mt-2.5 font-light">
                  Spread chord progression keys across time using the bipolar structural STRUM control (-100 to +100). Positive strums sweep from low to high pitches, while negative values sweep high to low, adjusting dynamically to step note lengths.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-6 block border-t border-white/[0.03] pt-4">DYNAMIC NOTE-LENGTH STRUM TIME RATIOS</span>
          </div>

          {/* Block 5: Virtual CoreMIDI Port integration */}
          <div className="bg-zinc-950/70 border border-white/[0.05] p-6 rounded-2xl flex flex-col justify-between hover:border-white/[0.1] transition-all">
            <div>
              <h3 className="text-base font-mono font-extrabold text-white uppercase tracking-wider">Virtual CoreMIDI Ports</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-2.5 font-light">
                VEKTE automatically provisions a virtual CoreMIDI port labeled "VEKTE" in macOS, enabling seamless multi-track channel filtration (1-16) across hosts like Ableton Live. Integrates with loopMIDI on Windows platforms for reliable low-latency DAW routing.
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#d4ff00] mt-6 font-bold">MACOS COREMIDI + WINDOWS LOOPMIDI</span>
          </div>

        </div>
      </section>

      {/* DETERSMINISTIC MATHEMATICAL COMPLEXITY SECTION */}
      <section id="complexity" className="relative z-10 py-24 px-6 border-t border-white/[0.05] bg-[#080808]">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-4xl mx-auto mb-16">
            <span className="text-[10px] font-mono text-[#d4ff00] uppercase tracking-[0.25em] block font-bold mb-2">DETERMINISTIC CONFIGURATION SPACE</span>
            <h2 className="text-3xl font-display font-extrabold text-white tracking-tight sm:text-4xl">
              10⁹¹ Distinct Patterns. One Single Channel.
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mt-4 max-w-2xl mx-auto font-light">
              Because VEKTE is strictly deterministic, with every lane hashing its active algorithm and configuration parameters into the seed, each unique configuration locks down a specific, repeatable musical pattern. Counting patterns is a clean, exact combinatorial calculation.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left side: The Layers of Math */}
            <div className="lg:col-span-8 space-y-6">
              
              <div className="grid sm:grid-cols-2 gap-6">
                
                {/* Layer 1 */}
                <div className="bg-zinc-950/80 border border-[#FFB500]/15 p-6 rounded-2xl flex flex-col justify-between hover:border-[#FFB500]/25 transition-all">
                  <div>
                    <div className="flex justify-between items-center border-b border-white/[0.05] pb-3 mb-4">
                      <span className="text-[10px] font-mono text-[#FFB500] uppercase font-bold">LAYER 1 — RAW GENERATORS</span>
                      <span className="text-[10px] font-mono text-zinc-500">ONE LANE ENGINE</span>
                    </div>
                    <div className="text-2xl font-mono font-bold text-[#FFB500] mb-2 leading-none">
                      6.5 × 10⁷ <span className="text-xs text-zinc-500 font-normal">PATTERNS</span>
                    </div>
                    <p className="text-xs text-zinc-400 font-light leading-relaxed">
                      Summing the product of each algorithm's four parameter ranges across all 31 models yields <span className="text-zinc-200 font-medium">65,231,654</span> distinct sequences. Heavily driven by String Resonance (14.7M), Kaprekar (12.1M), Wave Interference (8.4M), and Flocking (7.2M).
                    </p>
                  </div>
                  <div className="text-[9px] font-mono text-zinc-500 pt-4 border-t border-white/[0.03] mt-4">
                    ∑[31] (P₁ · P₂ · P₃ · P₄) = 65,231,654
                  </div>
                </div>

                {/* Layer 2 */}
                <div className="bg-zinc-950/80 border border-[#7369FF]/15 p-6 rounded-2xl flex flex-col justify-between hover:border-[#7369FF]/25 transition-all">
                  <div>
                    <div className="flex justify-between items-center border-b border-white/[0.05] pb-3 mb-4">
                      <span className="text-[10px] font-mono text-[#7369FF] uppercase font-bold">LAYER 2 — NOTE SHAPING</span>
                      <span className="text-[10px] font-mono text-zinc-500">ONE FULL NOTE LANE</span>
                    </div>
                    <div className="text-2xl font-mono font-bold text-[#7369FF] mb-2 leading-none">
                      3.5 × 10²² <span className="text-xs text-zinc-500 font-normal">STATES</span>
                    </div>
                    <p className="text-xs text-zinc-400 font-light leading-relaxed">
                      The raw generator output is reshaped by lane structural controls, multiplying the total phase dimension space: 
                      <span className="text-zinc-200 font-mono block text-[11px] bg-zinc-900/60 p-1.5 rounded border border-white/[0.03] my-2 leading-tight">
                        STEPS(32) × ROT(32) × DENSE(33) × PROB(101) × BASE(12) × SCALE(73) × CHORD(40) × OCT(45) × TIE(101)
                      </span>
                    </p>
                  </div>
                  <div className="text-[9px] font-mono text-zinc-500 pt-4 border-t border-white/[0.03] mt-4">
                    6.5 × 10⁷ × 5.4 × 10¹⁴ = 3.5 × 10²²
                  </div>
                </div>

                {/* Layer 3 */}
                <div className="bg-zinc-950/80 border border-[#26D1D1]/15 p-6 rounded-2xl flex flex-col justify-between hover:border-[#26D1D1]/25 transition-all">
                  <div>
                    <div className="flex justify-between items-center border-b border-white/[0.05] pb-3 mb-4">
                      <span className="text-[10px] font-mono text-[#26D1D1] uppercase font-bold">LAYER 3 — MOD ROUTING</span>
                      <span className="text-[10px] font-mono text-zinc-500">ONE FULL MOD LANE</span>
                    </div>
                    <div className="text-2xl font-mono font-bold text-[#26D1D1] mb-2 leading-none">
                      1.7 × 10¹⁷ <span className="text-xs text-zinc-500 font-normal">STATES</span>
                    </div>
                    <p className="text-xs text-zinc-400 font-light leading-relaxed">
                      Same underlying generator core, combined with routing matrices, smooth interpolation triggers, and dynamic parameter targets:
                      <span className="text-zinc-200 font-mono block text-[11px] bg-zinc-900/60 p-1.5 rounded border border-white/[0.03] my-2 leading-tight">
                        STEPS(32) × ROT(32) × MIN/MAX(8,256 ordered pairs) × CRV(2) × TARGET(158)
                      </span>
                    </p>
                  </div>
                  <div className="text-[9px] font-mono text-zinc-500 pt-4 border-t border-white/[0.03] mt-4 font-mono">
                    6.5 × 10⁷ × 2.7 × 10⁹ = 1.7 × 10¹⁷
                  </div>
                </div>

                {/* Layer 4 */}
                <div className="bg-zinc-950/80 border border-[#FF0044]/15 p-6 rounded-2xl flex flex-col justify-between hover:border-[#FF0044]/25 transition-all">
                  <div>
                    <div className="flex justify-between items-center border-b border-white/[0.05] pb-3 mb-4">
                      <span className="text-[10px] font-mono text-[#FF0044] uppercase font-bold">LAYER 4 — FULL CHANNEL</span>
                      <span className="text-[10px] font-mono text-zinc-500">1 NOTE + 4 MOD LANES</span>
                    </div>
                    <div className="text-2xl font-mono font-bold text-[#FF0044] mb-2 leading-none">
                      3.3 × 10⁹¹ <span className="text-xs text-zinc-500 font-normal">COMBINATIONS</span>
                    </div>
                    <p className="text-xs text-zinc-400 font-light leading-relaxed">
                      One channel clusters five active lanes simultaneously. Multiplying one structured Note lane by four fully-routed Mod lanes results in an astronomical footprint. Factoring in playmode, clock divisions, and lane toggles pushes it higher still.
                    </p>
                  </div>
                  <div className="text-[9px] font-mono text-zinc-500 pt-4 border-t border-white/[0.03] mt-4">
                    N × D⁴ = 3.55×10²² × (1.74×10¹⁷)⁴ ≈ 3.3 × 10⁹¹
                  </div>
                </div>

              </div>

              {/* The Floor */}
              <div className="bg-zinc-950/90 border border-[#d4ff00]/15 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#d4ff00]/2 rounded-full blur-2xl" />
                <h4 className="text-xs font-mono font-bold text-[#d4ff00] uppercase tracking-widest mb-1.5">THE MATHEMATICAL PLATFORM FLOOR</h4>
                <p className="text-xs text-zinc-300 font-light leading-relaxed">
                  Even if we aggressively strip away every post-processing modifier, routing destination, swing factor, and shaping block, leaving only the raw mathematical output of the five core channel generators, we hit a defensible minimum of:
                </p>
                <div className="mt-4 flex items-center space-x-4 bg-black/60 border border-white/[0.03] px-4 py-3 rounded-xl">
                  <span className="text-xl font-mono font-bold text-white">1.2 × 10³⁹</span>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider border-l border-white/10 pl-4 py-1">
                    Defensible Generator-Only Minimum Floor
                  </span>
                </div>
              </div>

            </div>

            {/* Right side: Cosmic Scale comparison */}
            <div className="lg:col-span-4 bg-zinc-950/80 border border-white/[0.06] p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#d4ff00]/[0.01] rounded-full blur-3xl" />
              
              <div>
                <div className="flex justify-between items-center border-b border-white/[0.05] pb-3 mb-6">
                  <span className="text-[10px] font-mono text-[#d4ff00] uppercase tracking-wider font-bold">COSMIC COMPARISON</span>
                  <span className="text-[10px] font-mono text-zinc-500">SCALE & COMPARISON</span>
                </div>

                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 block uppercase mb-1">ATOMS IN OBSERVABLE UNIVERSE</span>
                    <span className="text-2xl font-mono font-bold text-white">~10⁸⁰</span>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-zinc-630 h-full rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 block uppercase mb-1">VEKTE GENERATOR-ONLY FLOOR</span>
                    <span className="text-2xl font-mono font-bold text-zinc-300">1.2 × 10³⁹</span>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-zinc-500 h-full rounded-full" style={{ width: '40%' }} />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-[#d4ff00] block uppercase mb-1">VEKTE FULL SINGLE CHANNEL</span>
                    <span className="text-3xl font-mono font-black text-[#d4ff00]">3.3 × 10⁹¹</span>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-[#d4ff00] h-full rounded-full" style={{ width: '100%', boxShadow: '0 0 10px rgba(212,255,0,0.5)' }} />
                    </div>
                    <span className="text-[9px] font-mono text-[#d4ff00]/70 mt-1 block">Exceeds the total atom count of the universe by 11 orders of magnitude.</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/[0.05]">
                <div className="p-4 rounded-xl bg-black/40 border border-white/[0.03] text-[11px] text-zinc-400 font-light flex items-start space-x-3">
                  <Info className="w-4 h-4 text-[#d4ff00] shrink-0 mt-0.5" />
                  <span>
                    When you also factor in that VEKTE supports <span className="text-white font-medium">16 distinct channels</span> running simultaneously, and that any Mod Lane can target any neighboring channel's algorithms—the compounding combinations surpass standard nomenclature entirely.
                  </span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 31 ALGORITHMS RENDER LIST (STATIC SHOWCASE REGISTRY) */}
      <section id="engines" className="relative z-10 py-16 px-6 border-t border-white/[0.05] bg-black/60">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12">
            <div>
              <span className="text-[10px] font-mono text-[#d4ff00] uppercase tracking-[0.2em] block font-bold mb-1">GENERATIVE ALGORITHM REGISTRY</span>
              <h2 className="text-3xl font-display font-extrabold text-white tracking-tight sm:text-4xl">
                Explore the 31 Generative Algorithms
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed mt-2 max-w-2xl font-light">
                Browse our complete mathematical pattern generation library. These 31 premium algorithms are fully functional and selectable inside VEKTE sequencer lanes.
              </p>
            </div>
            
            {/* Tab switch mechanism */}
            <div className="flex space-x-2 mt-6 md:mt-0 p-1 bg-zinc-900 border border-white/[0.05] rounded-xl self-stretch sm:self-auto font-mono text-xs">
              <button 
                onClick={() => setActiveTab('interactive')}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'interactive' ? 'bg-[#d4ff00] text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
              >
                ALGORITHMS CATALOGUE
              </button>
              <button 
                onClick={() => setActiveTab('family')}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'family' ? 'bg-[#d4ff00] text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
              >
                ALGORITHM FAMILIES
              </button>
            </div>
          </div>

          {activeTab === 'interactive' ? (
            <div className="grid md:grid-cols-12 gap-8 items-start">
              
              {/* Category side filters Left col */}
              <div className="md:col-span-4 lg:col-span-3 flex flex-col space-y-1 bg-zinc-950/80 border border-white/[0.05] p-3 rounded-2xl backdrop-blur-md">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold px-3 mb-2 pt-1 block">CATALOGUE FILTERS</span>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`text-left px-3 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-between ${selectedCategory === cat.id ? 'bg-[#d4ff00]/10 text-[#d4ff00] border-l-4 border-[#d4ff00] pl-4' : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'}`}
                  >
                    <span>{cat.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                ))}
              </div>

              {/* Sound Engine Selector Matrix Grid Middle & Right col combined for magnificent layout */}
              <div className="md:col-span-8 lg:col-span-9 bg-zinc-950/50 border border-white/[0.05] p-6 rounded-2xl">
                <div className="flex justify-between items-center text-xs font-mono text-zinc-500 border-b border-white/[0.05] pb-3 mb-6">
                  <span>SPECIFICATIONS CATALOGUE (NON-SELECTABLE ON WEB PREVIEW)</span>
                  <span>{filteredEngines.length} MODELS REGISTERED</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {filteredEngines.map((engine) => {
                    const isPlayableGimmick = engine.id === 26;
                    return (
                      <div
                        key={engine.id}
                        className="p-4 rounded-xl border bg-zinc-950/70 border-white/[0.03] text-zinc-300 flex flex-col justify-between transition-all hover:border-white/10"
                      >
                        <div>
                          <div className="flex justify-between items-start w-full">
                            <span className="font-mono text-[9px] text-[#d4ff00] bg-[#d4ff00]/5 px-2 py-0.5 rounded border border-[#d4ff00]/20 font-bold">
                              #{String(engine.id).padStart(2, '0')}
                            </span>
                            {isPlayableGimmick ? (
                              <span className="text-[8px] text-[#d4ff00] bg-[#d4ff00]/10 border border-[#d4ff00]/25 px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0">
                                PLAYABLE WEB DEMO
                              </span>
                            ) : (
                              <span className="text-[8px] text-zinc-500 bg-zinc-900 border border-white/5 px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                          
                          <h4 className="font-mono text-sm font-extrabold tracking-wide text-white mt-3.5">
                            {engine.name}
                          </h4>
                          
                          <span className="text-[9.5px] font-mono text-zinc-500 block uppercase font-bold mt-1">
                            {engine.type}
                          </span>
                          
                          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed font-light mt-3">
                            {engine.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[9px] font-mono text-zinc-500 font-bold uppercase">
                          <span>ALGORITHM CLASS:</span>
                          <span className="text-zinc-400">{engine.category.replace('-', ' & ')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            // Tab 2: Algoythmic Families mapping visual breakdown
            <div className="grid md:grid-cols-3 gap-6 font-mono">
              <div className="bg-zinc-950/70 border border-white/[0.04] p-5 rounded-xl">
                <span className="text-[#d4ff00] text-[10px] font-bold block mb-1">01. RHYTHMIC METRONOMES & SIEVES</span>
                <h3 className="text-xs text-white font-extrabold uppercase">Bjorklund & residue spacing</h3>
                <p className="text-[11px] text-zinc-400 leading-normal mt-2 font-sans font-light">
                  Spreads triggers evenly across steps, draws fractional rise-lines, or isolates rhythmic residue classes using Boolean MOD algebra.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-white/[0.03]">
                  {["Euclidean", "Bresenham", "Cantor Set", "Sieve (Xenakis)", "Bouncing Ball", "Run-Length"].map(name => (
                    <span key={name} className="text-[9px] bg-zinc-900 border border-white/[0.04] text-zinc-300 px-2 py-0.5 rounded font-bold">{name}</span>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-950/70 border border-white/[0.04] p-5 rounded-xl">
                <span className="text-[#d4ff00] text-[10px] font-bold block mb-1">02. CHAOTIC ATRACTORS & AUTOCELLS</span>
                <h3 className="text-xs text-white font-extrabold uppercase">Wolfram rules & reaction-diffusion</h3>
                <p className="text-[11px] text-zinc-400 leading-normal mt-2 font-sans font-light">
                  Evolves binary cells based on neighborhood matrix rules, orbits recursive subtraction digits, or slides into thermal structural entropy.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-white/[0.03]">
                  {["Cell. Automata", "Logistic Map", "Game of Life", "Entropy Gradient", "Turing Pattern"].map(name => (
                    <span key={name} className="text-[9px] bg-zinc-900 border border-white/[0.04] text-zinc-300 px-2 py-0.5 rounded font-bold">{name}</span>
                  ))}
                </div>
              </div>

              <div className="bg-[#d4ff00]/5 border border-[#d4ff00]/15 p-5 rounded-xl">
                <span className="text-[#d4ff00] text-[10px] font-bold block mb-1">03. BIOCENTRIC PERFORMANCES & SWARMS</span>
                <h3 className="text-xs text-white font-extrabold uppercase">Boids flocking & resonances</h3>
                <p className="text-[11px] text-zinc-400 leading-normal mt-2 font-sans font-light">
                  Vibrates adjacent consonant pitches with decay timers, drifts orbital gravitational mass, or targets retrograde question-answers.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-white/[0.04]">
                  {["Flocking", "String Resonance", "Lissajous", "Wave Interference", "Gravity Wells", "Polyrhythm"].map(name => (
                    <span key={name} className="text-[9px] bg-zinc-900 border border-white/[0.04] text-zinc-300 px-2 py-0.5 rounded font-bold">{name}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* REKKE STANDALONE DESKTOP WORKSTATION */}
      <section id="rekke" className="relative z-10 py-24 px-6 bg-black border-t border-white/[0.05] overflow-hidden">
        {/* Background Image of Rekke */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none" 
          style={{ backgroundImage: "url('https://github.com/sphitzio/valdlabs-public/blob/main/public/vekte/assets/bg_rekke_Tresse2.png?raw=true')" }}
        />
        {/* Subtle decorative glowing backdrops using the custom color palette */}
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#7369FF]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-[#26D1D1]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Descriptive Content Column */}
            <div className="lg:col-span-5 flex flex-col space-y-6">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-mono text-[#7369FF] bg-[#7369FF]/10 border border-[#7369FF]/25 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  HARDWARE DEVELOPMENT
                </span>
                <span className="text-[10px] font-mono text-[#26D1D1] bg-[#26D1D1]/10 border border-[#26D1D1]/25 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  PREVIEW SYSTEM
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight leading-tight">
                Vekte Shares the DNA of <span className="text-[#d4ff00]">REKKE</span>
              </h2>

              <p className="text-zinc-300 text-sm leading-relaxed font-light">
                Vekte was not born in a vacuum; it comes straight out of the architecture and research behind <span className="text-white font-medium">Rekke</span>, our upcoming flagship desktop sequencer.
              </p>

              <p className="text-zinc-400 text-xs leading-relaxed font-light">
                Under the surface, the same generative algorithm matrix and sequencing engines run in parity. The hardware's logic, translated to a physical instrument, optimized for endless exploring and live performance.
              </p>

              {/* Minimalist Specs Board */}
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="w-5 h-5 rounded bg-[#FF0044]/10 border border-[#FF0044]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-mono text-[#FF0044] font-black">1</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">8 Physical Channels</h4>
                    <p className="text-[11px] text-zinc-400 font-light mt-0.5">Eight independent sequencer channels, each with its own controls and MIDI/CV routing.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-5 h-5 rounded bg-[#FFB500]/10 border border-[#FFB500]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-mono text-[#FFB500] font-black">2</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">8 OLED Screens + 1 TFT</h4>
                    <p className="text-[11px] text-zinc-400 font-light mt-0.5">A dedicated OLED on every channel for live algorithm and parameter state, with a central TFT for menus, BPM, and global setup.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-5 h-5 rounded bg-[#26D1D1]/10 border border-[#26D1D1]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-mono text-[#26D1D1] font-black">3</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Maximalist Control Surface</h4>
                    <p className="text-[11px] text-zinc-400 font-light mt-0.5">32 encoders, 56 buttons, and 20 triggers for direct, hands-on control. Four encoders, five buttons, and two triggers on every channel, plus sixteen function buttons and four performance triggers.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-5 h-5 rounded bg-[#7369FF]/10 border border-[#7369FF]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-mono text-[#7369FF] font-black">4</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Expansion & Connectivity</h4>
                    <p className="text-[11px] text-zinc-400 font-light mt-0.5">One cartridge connector for hardware expansion, with CV, MIDI, BLE, WiFi, and Ableton Link on board.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Immersive Image Display Column */}
            <div className="lg:col-span-7 flex justify-center relative">
              {/* Colorful gradient backing element matching the designated custom accents */}
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#FF0044] via-[#7369FF] to-[#26D1D1] rounded-2xl blur-xl opacity-20 pointer-events-none" />
              
              {/* Outer frame styling */}
              <div className="border border-white/[0.08] bg-zinc-950/60 p-3 sm:p-4 rounded-2xl shadow-3xl relative overflow-hidden backdrop-blur-md">
                {/* Horizontal progress accent lines representing 4 active layers */}
                <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-[#FF0044] via-[#7369FF] to-[#26D1D1] opacity-50" />
                
                <img 
                  src="https://github.com/sphitzio/valdlabs-public/blob/main/public/vekte/assets/rekke-front.jpg?raw=true" 
                  alt="REKKE Standalone Hardware Desktop Workstation" 
                  className="w-full h-auto rounded-xl object-cover shadow-2xl relative z-10 border border-white/[0.04]"
                  referrerPolicy="no-referrer"
                />

                {/* Micro tech metadata overlay below the image block */}
                <div className="mt-4 pt-3 border-t border-white/[0.04] flex flex-wrap justify-between items-center text-[10px] font-mono text-zinc-500 gap-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF0044] animate-pulse" />
                    REKKE'S FRONT PANEL
                  </span>
                  <span className="text-[#FFB500] font-bold">RENDER: UNDER DEVELOPMENT</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* DOWNLOAD BETA SECTION */}
      <section id="download" className="relative z-10 py-16 px-6 bg-black border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[10px] font-mono text-[#d4ff00] uppercase tracking-[0.2em] block font-bold mb-2">OPEN BETA</span>
            <h2 id="download-beta-title" className="text-3xl font-display font-extrabold text-white tracking-tight sm:text-4xl">
              Download Beta
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mt-4 font-light">
              Beta version valid until mid-August 2026
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            <div className="bg-zinc-950/40 border border-white/[0.04] p-8 rounded-2xl shadow-xl relative overflow-hidden backdrop-blur-md">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#d4ff00] to-transparent opacity-30" />
              
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <button 
                    id="download-win-btn"
                    onClick={() => handleBetaDownload('win')}
                    disabled={downloadingOS !== null}
                    className={`flex items-center justify-center gap-2 px-6 py-4 rounded-xl border font-mono text-xs font-bold tracking-wider transition-all duration-200 ${
                      downloadingOS === 'Win64 VST3' 
                        ? 'bg-[#d4ff00]/20 text-[#d4ff00] border-[#d4ff00]/40 cursor-wait'
                        : 'bg-black text-[#d4ff00] border-[#d4ff00]/20 hover:border-[#d4ff00] hover:bg-[#d4ff00]/5 active:scale-95'
                    }`}
                  >
                    <Download className={`w-4 h-4 ${downloadingOS === 'Win64 VST3' ? 'animate-bounce' : ''}`} />
                    {downloadingOS === 'Win64 VST3' ? 'PREPARING...' : 'Win64 VST3'}
                  </button>

                  <button 
                    id="download-mac-btn"
                    onClick={() => handleBetaDownload('mac')}
                    disabled={downloadingOS !== null}
                    className={`flex items-center justify-center gap-2 px-6 py-4 rounded-xl border font-mono text-xs font-bold tracking-wider transition-all duration-200 ${
                      downloadingOS === 'MacOS VST3' 
                        ? 'bg-[#d4ff00]/20 text-[#d4ff00] border-[#d4ff00]/40 cursor-wait'
                        : 'bg-black text-[#d4ff00] border-[#d4ff00]/20 hover:border-[#d4ff00] hover:bg-[#d4ff00]/5 active:scale-95'
                    }`}
                  >
                    <Download className={`w-4 h-4 ${downloadingOS === 'MacOS VST3' ? 'animate-bounce' : ''}`} />
                    {downloadingOS === 'MacOS VST3' ? 'PREPARING...' : 'MacOS VST3'}
                  </button>
                </div>

                {betaSuccess && (
                  <p className="text-xs text-[#d4ff00] font-mono mt-2 leading-relaxed text-center">{betaSuccess}</p>
                )}

                <div className="text-[10px] text-center font-mono text-zinc-600 leading-tight">
                  VEKTE is an open beta. No registration required here. Email setup is handled inside the application.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* CORE SPEC COMPARISON FOR FREE VS PRO */}
      <section id="pricing" className="relative z-10 py-20 px-6 bg-[#090909] border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[10px] font-mono text-[#d4ff00] uppercase tracking-[0.2em] block font-bold mb-2">LICENSING SYSTEM</span>
            <h2 className="text-3xl font-display font-extrabold text-white tracking-tight sm:text-4xl">
              Pricing TBA
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mt-4 font-light">
              VEKTE's final retail pricing and licensing models are currently To Be Announced. Join our email list or beta program to get early access and pricing tier announcements first.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="bg-zinc-950/60 border border-white/[0.06] p-8 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-md text-center">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#d4ff00] to-transparent opacity-50" />
              
              <span className="text-[9px] font-mono text-[#d4ff00] uppercase tracking-widest block mb-4">SUBSCRIBE TO BE NOTIFIED ON RELEASE</span>
              {subscribeStatus === 'done' ? (
                <p className="text-xs font-mono text-[#d4ff00] py-4 leading-relaxed">
                  You're on the list. We'll send the first VEKTE release note straight to your inbox.
                </p>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                  {/* FormSubmit spam honeypot */}
                  <input type="text" name="_honey" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                  <input
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    value={subscribeEmail}
                    onChange={(e) => { setSubscribeEmail(e.target.value); if (subscribeStatus === 'error') setSubscribeStatus('idle'); }}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-xs font-mono text-white placeholder-zinc-650 focus:outline-none focus:border-[#d4ff00]/60 transition-colors text-center"
                  />
                  <button
                    type="submit"
                    disabled={subscribeStatus === 'sending'}
                    className="w-full py-3 bg-[#d4ff00] hover:bg-white text-black font-mono text-xs font-black tracking-wider rounded-xl transition-all shadow-[0_4px_20px_rgba(212,255,0,0.15)] disabled:opacity-60 disabled:cursor-wait"
                  >
                    {subscribeStatus === 'sending' ? 'SENDING...' : 'NOTIFY ME'}
                  </button>
                  {subscribeStatus === 'error' && (
                    <p className="text-[10px] font-mono text-red-400 mt-1">Something went wrong. Please try again.</p>
                  )}
                </form>
              )}
              
              <div className="mt-6 flex justify-center items-center gap-4 text-[10px] font-mono text-zinc-500">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#d4ff00]/40" /> VST3 plugin format</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#d4ff00]/40" /> Runs in any VST3 DAW</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/[0.05] bg-black py-16 px-6 font-mono text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          
          <div className="space-y-4">
            <div className="flex items-center select-none">
              <VekteLogo className="w-20 md:w-24 h-auto" />
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-600 font-light font-sans">
              VEKTE, its interface, algorithm implementations, and generative engine are intellectual property under development by Våld Labs.
            </p>
            <p className="text-[10px] text-zinc-600">
              © 2026 Våld Labs. All rights reserved. •{" "}
              <a 
                href="https://valdlabs.com/privacy" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-zinc-400 transition-colors underline decoration-zinc-800"
              >
                Privacy Policy
              </a>
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-zinc-400 font-bold block">ACKNOWLEDGEMENTS</span>
            <ul className="space-y-1.5 text-[11px] font-light text-zinc-600">
              <li>• Bjorklund Euclidean distribution algorithm.</li>
              <li>• Gray-Scott reaction-diffusion particle dynamics formulae.</li>
              <li>• Custom MIDI routing matrices built on C++ and the JUCE framework.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="text-zinc-400 font-bold block">RESOURCES</span>
            <ul className="space-y-1.5 text-[11px] text-zinc-600 font-light">
              <li>
                <a 
                  href="https://valdlabs.com/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-zinc-400 transition-colors underline decoration-zinc-800"
                >
                  • Privacy Policy
                </a>
              </li>
              <li>• User manual coming soon.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="text-zinc-400 font-bold block">VALDLABS SUITE</span>
            <ul className="space-y-1 text-zinc-600">
              <li className="text-white font-bold">• VEKTE — 31-Algorithm Generative MIDI Sequencer</li>
              <li>• TRESSE — Macro Oscillator Synth</li>
              <li>• REKKE — Hardware Sequencer (in development)</li>
            </ul>
          </div>

        </div>
      </footer>

    </div>
  );
}

// DRAGGABLE SYNTHESIZER KNOB MATRIX COMPONENT FOR PLAYGROUND ENGINE
interface InteractiveKnobProps {
  id: string;
  name: string;
  val: number;
  def: number;
  desc: string;
  customLabel?: string;
  onChange: (id: string, val: number) => void;
}

function InteractiveKnob({ id, name, val, def, desc, customLabel, onChange }: InteractiveKnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startVal, setStartVal] = useState(0);

  const percentage = val / 100;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartY(e.clientY);
    setStartVal(val);
    document.body.style.cursor = 'ns-resize';
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setStartVal(val);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = startY - e.clientY;
      const sensitivity = 0.85;
      let newVal = startVal + (deltaY * 100) / (200 * sensitivity);
      newVal = Math.max(0, Math.min(100, newVal));
      onChange(id, Math.round(newVal));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const deltaY = startY - e.touches[0].clientY;
      const sensitivity = 0.85;
      let newVal = startVal + (deltaY * 100) / (200 * sensitivity);
      newVal = Math.max(0, Math.min(100, newVal));
      onChange(id, Math.round(newVal));
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        document.body.style.cursor = 'default';
      }
    };

    if (isDragging) {
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
  }, [isDragging, startY, startVal, id, onChange]);

  const handleDoubleClick = () => {
    onChange(id, def);
  };

  // faithful arc calculations for r=35 ring in a 100x100 viewBox
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270 degree arc (runs from 135 to 405)
  const strokeDashoffset = arcLength - percentage * arcLength;

  return (
    <div className="flex flex-col items-center select-none group relative bg-black/40 py-4 px-2 rounded-xl border border-white/[0.03] hover:border-white/[0.07] transition-all">
      
      {/* Parameter tooltips */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 hidden group-hover:block z-50 bg-zinc-950 text-[9px] font-mono border border-zinc-900 rounded p-1.5 text-center shadow-2xl font-light">
        <span className="font-bold text-[#d4ff00] block mb-0.5">{name}</span>
        <span className="text-zinc-400 leading-tight block">{desc}</span>
      </div>

      <div 
        ref={knobRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
        className="cursor-ns-resize touch-none flex items-center justify-center relative w-16 h-16 sm:w-20 sm:h-20"
        title={`${name}: ${val}`}
      >
        <svg className="w-full h-full rotate-135" viewBox="0 0 100 100">
          {/* Background Track Arc */}
          <circle 
            cx="50" 
            cy="50" 
            r={radius} 
            fill="transparent" 
            stroke="#161801" 
            strokeWidth="9" 
            strokeDasharray={`${arcLength} ${circumference}`} 
            strokeLinecap="round" 
          />
          {/* Active Front Gauge Arc */}
          <circle 
            cx="50" 
            cy="50" 
            r={radius} 
            fill="transparent" 
            stroke="#d4ff00" 
            strokeWidth="9" 
            strokeDasharray={`${arcLength} ${circumference}`} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round" 
            className="transition-all duration-75" 
          />
        </svg>

        {/* Dynamic Center Numerdisplay */}
        <div className="absolute inset-0 flex items-center justify-center text-[#d4ff00] font-mono text-xl sm:text-2xl font-extrabold tracking-tighter select-none pointer-events-none">
          {customLabel || val}
        </div>
      </div>

      {/* Label under knob with letter spacing styling faithful to the image */}
      <span className="mt-2 text-[10px] sm:text-xs font-mono text-white/90 uppercase tracking-[0.25em] block font-black leading-none text-center">
        {id}
      </span>
    </div>
  );
}
