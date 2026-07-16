import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="group relative bg-zinc-950 border border-white/5 rounded-xl overflow-hidden hover:border-[#ffff00]/30 transition-colors duration-300 flex flex-col h-full">
      <div className="aspect-square bg-zinc-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-transparent z-10 transition-colors duration-500"></div>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover scale-90 group-hover:scale-105 transition-transform duration-700"
        />
      </div>
      
      <div className="p-8 flex flex-col flex-grow border-t border-white/5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-medium text-white tracking-tight font-space-mono">{product.name}</h3>
          <span className={`font-mono text-xs px-2 py-0.5 rounded font-space-mono border whitespace-nowrap ${
            product.tag === 'LIVE BETA'
              ? 'text-[#a3e635] border-[#a3e635]/30'
              : product.isFlagship
                ? 'text-[#ffff00] border-[#ffff00]/20'
                : 'text-zinc-500 border-zinc-800'
          }`}>
            {product.tag}
          </span>
        </div>
        
        <p className="text-base text-zinc-500 mb-6 flex-grow font-space-mono">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          <span className="text-lg text-white font-medium font-space-mono">{product.price}</span>
          {product.link ? (
            <a href={product.link} className="text-sm text-white hover:text-[#ffff00] transition-colors font-space-mono">Explore →</a>
          ) : (
            <button className="text-sm text-white hover:text-[#ffff00] transition-colors font-space-mono">Details →</button>
          )}
        </div>
      </div>
    </div>
  );
};
