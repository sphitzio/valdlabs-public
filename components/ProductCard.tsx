import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // A product with a page is entirely clickable — the image included. Without a
  // page it stays a plain div, so nothing looks clickable that isn't.
  const Wrapper = (product.link ? 'a' : 'div') as React.ElementType;
  const wrapperProps = product.link ? { href: product.link } : {};
  return (
    <Wrapper
      {...wrapperProps}
      className={`group relative bg-zinc-950 border border-white/5 rounded-xl overflow-hidden hover:border-[#ffff00]/30 transition-colors duration-300 flex flex-col h-full${product.link ? ' cursor-pointer' : ''}`}
    >
      <div className="aspect-square bg-zinc-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-transparent z-10 transition-colors duration-500"></div>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      
      <div className="p-8 flex flex-col flex-grow border-t border-white/5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-medium text-white tracking-tight font-space-mono">{product.name}</h3>
          <span className={`font-mono text-xs px-2 py-0.5 rounded font-space-mono border whitespace-nowrap ${
            product.tag === 'OUT NOW'
              ? 'text-[#ffff00] border-[#ffff00]/40'
              : ['RELEASE CANDIDATE', 'LIVE BETA', 'CLOSED BETA'].includes(product.tag)
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
            <span className="text-sm text-white group-hover:text-[#ffff00] transition-colors font-space-mono">Explore →</span>
          ) : (
            <span className="text-sm text-zinc-600 font-space-mono">Details →</span>
          )}
        </div>
      </div>
    </Wrapper>
  );
};
