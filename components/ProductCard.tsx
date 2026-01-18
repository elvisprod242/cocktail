import React from 'react';
import { Product } from '../types';
import { Plus } from 'lucide-react';
import { getIconComponent } from './IconRegistry';

interface ProductCardProps {
  product: Product;
  iconName: string;
  onAdd: (product: Product) => void;
  currency: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, iconName, onAdd, currency }) => {
  const Icon = getIconComponent(iconName);

  return (
    <div 
      className="bg-slate-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-700 cursor-pointer group flex flex-col h-full"
      onClick={() => onAdd(product)}
    >
      <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center group-hover:from-slate-700 group-hover:to-slate-600 transition-colors">
        <Icon className="text-bar-accent w-12 h-12 drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300" />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Plus className="text-white w-8 h-8" />
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col items-center justify-between text-center gap-3">
        <h3 className="font-bold text-slate-100 text-base leading-tight line-clamp-2">{product.name}</h3>
        <span className="font-bold text-bar-accent text-xl bg-slate-900/50 px-4 py-1 rounded-full border border-slate-700/50">
            {product.price}{currency}
        </span>
      </div>
    </div>
  );
};