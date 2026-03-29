import React from 'react';

export const Studio: React.FC = () => {
  return (
    <section id="philosophy" className="py-24 px-6 bg-zinc-950 border-b border-white/5 relative overflow-hidden">
        {/* Abstract background element */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-zinc-900/30 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">
        
        {/* Philosophy */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="h-px w-8 bg-[#ffff00]"></span>
            <span className="text-[#ffff00] font-mono text-xs uppercase tracking-widest font-space-mono">Philosophy</span>
          </div>
          <h2 className="text-3xl md:text-4xl text-white font-jakarta tracking-tight font-medium leading-tight">
            Structured chaos, <br/>made playable.
          </h2>
          <div className="space-y-6 text-zinc-400 text-lg font-light font-space-mono leading-relaxed">
            <p>
              Most creative tools either overwhelm you with complexity or starve you with emptiness. Våld Labs is built on a third path.
            </p>
            <p>
              The flagship Consequencer embodies this philosophy in music. Instead of starting with a blank grid, it generates musically coherent structures on power-up — then gives you a control-dense, performance-forward interface to shape them.
            </p>
            <p>
              Across the product line, the rule stays the same: <span className="text-white">machine-scale depth, human-scale control</span> — with minimal menu diving and interfaces that favor touch, flow, and eyes-down focus.
            </p>
          </div>
        </div>

        {/* Founder Bio */}
        <div className="flex flex-col gap-6 lg:pl-12 lg:border-l border-white/5">
          <div className="flex items-center gap-3 mb-2">
             <span className="text-zinc-500 font-mono text-xs uppercase tracking-widest font-space-mono">Studio</span>
          </div>
          <h3 className="text-2xl text-white font-jakarta tracking-tight font-medium">
            Jaime Paiva
          </h3>
          <div className="space-y-6 text-zinc-500 text-base font-space-mono leading-relaxed">
            <p>
              Founder of Våld Labs, based in Lisbon. Long before building hardware, Jaime was obsessed with data visualization, pattern recognition, and systems — the hidden structures that turn noise into meaning. That obsession now threads through every product in the lineup.
            </p>
            <p>
               Våld Labs is currently a deeply hands-on studio where he leads the full arc of each project — concept, industrial and interaction design, prototyping direction, visual identity, and narrative — with a simple goal: create tools that feel both intelligent and human.
            </p>
            <p className="italic border-l-2 border-[#ffff00] pl-4 text-zinc-400">
              "We don’t fear chaos. We domesticate it and make it perform."
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
