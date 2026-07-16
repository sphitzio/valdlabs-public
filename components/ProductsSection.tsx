import React from 'react';
import { ProductCard } from './ProductCard';
import { Product } from '../types';

const products: Product[] = [
  {
    id: '1',
    name: 'Vekte',
    tag: 'LIVE BETA',
    description: 'A generative MIDI sequencer plugin that turns algorithms into playable pattern flow.',
    price: 'TBA',
    image: '/assets/vekte.png',
    link: '/vekte'
  },
  {
    id: '2',
    name: 'Tresse',
    tag: 'LIVE BETA',
    description: 'A polyphonic multi-engine synthesizer, from raw analog character to spectral texture.',
    price: 'TBA',
    image: '/assets/tresse.png',
    link: '/tresse'
  },
  {
    id: '3',
    name: 'Rekke',
    tag: 'DEVELOPMENT',
    description: 'A portable, desktop-first sequencer with modular DNA — built for the art of shaping chaos.',
    price: 'TBA',
    image: '/assets/rekke.jpg',
    isFlagship: true
  },
  {
    id: '4',
    name: 'Sunua',
    tag: 'ALPHA SOON',
    description: 'A physical-modeling voice that grows living, breathing tone from struck and bowed bodies.',
    price: 'TBA',
    image: '/assets/sunua.png'
  },
  {
    id: '5',
    name: 'Kurare',
    tag: 'ALPHA SOON',
    description: 'A coupled-oscillator synth where many voices sync, drift and phase into emergent motion.',
    price: 'TBA',
    image: '/assets/kurare.png'
  },
  {
    id: '6',
    name: 'Modular Synth Stands',
    tag: 'UNDER REQUEST',
    description: 'Modular, industrial-strength stands that turn desk chaos into ergonomic order.',
    price: 'TBA',
    image: 'https://i.postimg.cc/t4dWfX0L/Gemini-Generated-Image-68yj9168yj9168yj.png'
  }
];

export const ProductsSection: React.FC = () => {
  return (
    <section className="border-y border-white/5 py-24 px-6 bg-zinc-950" id="products">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6 mb-16 items-end justify-between">
          <div>
            <h2 className="text-3xl text-white mb-4 font-jakarta tracking-tight font-semibold">Products</h2>
            <p className="text-lg text-zinc-400 font-light max-w-xl font-space-mono">
              Machine-scale depth, human-scale control. Instruments built for flow and focus.
            </p>
          </div>
          <a href="#" className="text-[#ffff00] hover:text-[#ffff00]/80 font-mono text-sm border-b border-[#ffff00]/30 pb-1 hover:border-[#ffff00] transition-colors font-space-mono">
            View all specifications
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};
