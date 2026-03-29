import React from 'react';
import { ShoppingBag } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <nav className="fixed z-50 bg-zinc-950/80 w-full border-white/5 border-b top-0 backdrop-blur-md">
      <div className="flex h-16 max-w-7xl mx-auto px-6 items-center justify-between">
        {/* Logo */}
        <a href="#" className="group flex items-center gap-3">
          <img 
            src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/df76b444-7f90-4e1e-9c20-de09704ac295_320w.png" 
            alt="Våld Labs" 
            className="group-hover:opacity-100 transition-opacity opacity-90 w-auto h-6 object-cover" 
          />
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#products" className="text-sm text-zinc-400 hover:text-white transition-colors font-space-mono">Products</a>
          <a href="#philosophy" className="text-sm text-zinc-400 hover:text-white transition-colors font-space-mono">Studio</a>
          <a href="#support" className="text-sm text-zinc-400 hover:text-white transition-colors font-space-mono">Support</a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <a href="#" className="hidden sm:flex items-center text-sm hover:text-white transition-colors font-space-mono">
            Login
          </a>
          <button className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-full text-xs font-medium border border-white/10 transition-all flex items-center gap-2 font-space-mono">
            Cart 
            <span className="bg-[#ffff00] text-black w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold font-space-mono">0</span>
          </button>
        </div>
      </div>
    </nav>
  );
};