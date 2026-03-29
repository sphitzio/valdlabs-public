import React from 'react';
import { Instagram } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-zinc-950 pt-24 pb-12 px-6 border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-2">
            <a href="#" className="inline-block text-2xl text-white font-semibold mb-6 font-jakarta tracking-tighter">
              våld labs
            </a>
            <p className="text-lg text-zinc-500 font-light max-w-sm font-space-mono">
              Independent boutique studio based in Lisbon. Crafting niche technology for sound design, finance, and workspace optimization.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-white mb-6 font-space-mono">Sitemap</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-base text-zinc-500 hover:text-[#ffff00] transition-colors font-space-mono">Consequencer</a></li>
              <li><a href="#" className="text-base text-zinc-500 hover:text-[#ffff00] transition-colors font-space-mono">Crypto Terminal</a></li>
              <li><a href="#" className="text-base text-zinc-500 hover:text-[#ffff00] transition-colors font-space-mono">Modular Synth Stands</a></li>
              <li><a href="#" className="text-base text-zinc-500 hover:text-[#ffff00] transition-colors font-space-mono">Firmware</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-white mb-6 font-space-mono">Social</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="https://instagram.com/valdlabs"
                  target="_blank"
                  rel="noreferrer"
                  className="text-base text-zinc-500 hover:text-[#ffff00] transition-colors flex items-center gap-2 font-space-mono"
                >
                  <Instagram className="w-4 h-4" /> Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 gap-4">
            <span className="text-xs text-zinc-600 font-space-mono">© {new Date().getFullYear()} Våld Labs. All rights reserved.</span>
            <span className="text-xs text-zinc-600 font-space-mono">The art of shaping chaos.</span>
        </div>
      </div>
    </footer>
  );
};
