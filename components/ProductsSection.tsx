import React from 'react';
import { ProductCard } from './ProductCard';
import { Product } from '../types';

const products: Product[] = [
  {
    id: '1',
    name: 'Consequencer',
    tag: 'FLAGSHIP',
    description: 'A portable, desktop-first sequencer with modular DNA — built for the art of shaping chaos.',
    price: 'TBA',
    image: 'https://i.postimg.cc/rwnQVvNS/cons-1.jpg',
    isFlagship: true
  },
  {
    id: '2',
    name: 'Crypto Terminal',
    tag: 'UTILITY',
    description: 'A retrofuturistic desktop market terminal for humanized data. Signal over noise.',
    price: 'TBA',
    image: 'https://i.postimg.cc/G2vdkPMc/Untitled-1.jpg'
  },
  {
    id: '3',
    name: 'Modular Synth Stands',
    tag: 'ACCESSORY',
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
            <h2 className="text-3xl text-white mb-4 font-jakarta tracking-tight font-semibold">Våld Apparatus</h2>
            <p className="text-lg text-zinc-400 font-light max-w-xl font-space-mono">
              Machine-scale depth, human-scale control. Instruments built for flow and focus.
            </p>
          </div>
          <a href="#" className="text-[#ffff00] hover:text-[#ffff00]/80 font-mono text-sm border-b border-[#ffff00]/30 pb-1 hover:border-[#ffff00] transition-colors font-space-mono">
            View all specifications
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};
