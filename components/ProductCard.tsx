import React from 'react';
import { Product } from '../types';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd }) => {
  return (
    <div 
      className="bg-slate-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-700 cursor-pointer group"
      onClick={() => onAdd(product)}
    >
      <div className="relative h-32 w-full overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Plus className="text-white w-8 h-8" />
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-slate-100 text-lg leading-tight">{product.name}</h3>
          <span className="font-bold text-bar-accent text-lg">{product.price}€</span>
        </div>
        <p className="text-slate-400 text-xs line-clamp-2 min-h-[2.5em]">{product.description}</p>
      </div>
    </div>
  );
};