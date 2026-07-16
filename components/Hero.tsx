import React from 'react';
import { Mail, PlayCircle } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <main className="flex-grow pt-32 pb-20 px-6 relative min-h-[90vh] flex items-center">
       {/* Background Image Layer */}
       <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-30 pointer-events-none"
        style={{
          backgroundImage: "url('/assets/rekkebg.png')",
          maskImage: "linear-gradient(180deg, transparent, black 20%, black 80%, transparent)",
          WebkitMaskImage: "linear-gradient(180deg, transparent, black 20%, black 80%, transparent)"
        }}
      />

      <div className="z-10 max-w-7xl mx-auto w-full relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:items-stretch">
          
          {/* Text Content */}
          <div className="lg:col-span-5 flex flex-col gap-8 justify-center">
            <div className="inline-flex gap-2 text-xs text-[#ffff00] font-mono bg-[#ffff00]/5 w-fit border border-[#ffff00]/20 rounded-full py-1 px-3 items-center">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffff00] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ffff00]"></span>
              </span>
              Targeting Q2 2026
            </div>

            <h1 className="text-5xl md:text-7xl leading-[0.95] font-semibold text-white tracking-tighter font-jakarta">
              The art of shaping chaos.
            </h1>

            <p className="text-lg md:text-xl leading-relaxed font-light text-slate-300 font-space-mono max-w-lg">
              Våld Labs builds instruments and objects that translate complex systems into human control. From algorithmic music sequencing to innovative synthesizers and modular studio architecture, every product is designed to turn instinct into creation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <a href="mailto:hello@valdlabs.com?subject=Pre-order%20Info" className="group hover:bg-[#ffff00]/90 transition-all flex gap-2 text-sm font-medium text-black font-space-mono bg-[#ffff00] h-12 rounded-md px-6 items-center justify-center">
                Pre-order Info
                <Mail className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              
              <button className="group bg-zinc-900/80 hover:bg-zinc-800 text-white border border-zinc-800 h-12 px-6 rounded-md font-medium text-sm transition-all flex items-center justify-center gap-2 font-space-mono backdrop-blur-sm">
                <PlayCircle className="w-4 h-4 text-[#ffff00]" />
                Watch Demo
              </button>
            </div>
            
            <p className="text-xs text-zinc-500 font-space-mono">
              Pricing TBA, positioned to be competitive.
            </p>

            <div className="flex items-center gap-8 mt-8 pt-8 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider font-space-mono mb-1">Philosophy</span>
                <span className="text-base text-zinc-200 font-space-mono">Deterministic</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider font-space-mono mb-1">Target</span>
                <span className="text-base text-zinc-200 font-space-mono">Electronic Music</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider font-space-mono mb-1">Origin</span>
                <span className="text-base text-zinc-200 font-space-mono">Made in Lisbon</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 relative h-full">
             <div className="relative rounded-xl overflow-hidden border border-white/10 bg-zinc-900/50 shadow-2xl shadow-black/50 w-full aspect-video lg:aspect-auto lg:h-full">
                <div className="absolute inset-0 bg-zinc-950/20 pointer-events-none z-10"></div>
                <video
                  src="/assets/rekke_hero.mp4"
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="w-full h-full object-cover opacity-100 hover:opacity-100 transition-opacity duration-700"
                />
             </div>
             {/* Glow effect behind the video */}
             <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#ffff00]/5 blur-[100px] rounded-full"></div>
          </div>
        </div>
      </div>
    </main>
  );
};
