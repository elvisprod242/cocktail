import React, { useState, useMemo } from 'react';
import { Product, Category, CartItem } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Search, ShoppingCart, Trash2, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';

interface POSProps {
  products: Product[]; // Changed from static import to prop
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  placeOrder: (table: number) => void;
}

export const POS: React.FC<POSProps> = ({ products, cart, addToCart, removeFromCart, clearCart, placeOrder }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false); // For mobile
  const [tableNumber, setTableNumber] = useState<number>(1);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, products]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const categories = ['All', ...Object.values(Category)];

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    placeOrder(tableNumber);
    setIsCartOpen(false); // Close mobile cart
  };

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-slate-950">
      
      {/* Main Content (Menu) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <div className="p-4 md:p-6 bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-white">Prise de commande</h1>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="w-full bg-slate-800 border-none rounded-full py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-bar-accent placeholder-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto mt-4 pb-2 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as Category | 'All')}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-bar-accent text-white' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} onAdd={addToCart} />
            ))}
          </div>
        </div>
      </div>

      {/* Cart Sidebar (Desktop: Fixed Right, Mobile: Drawer) */}
      <div className={`
        fixed inset-0 z-40 md:static md:z-0 md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col transition-transform duration-300 transform
        ${isCartOpen ? 'translate-y-0' : 'translate-y-[100%] md:translate-y-0'}
      `}>
         {/* Mobile Handle to Close */}
         <div className="md:hidden flex justify-center pt-2 pb-1" onClick={() => setIsCartOpen(false)}>
            <div className="w-12 h-1.5 bg-slate-700 rounded-full"></div>
         </div>

         <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
           <div className="flex items-center gap-3">
             <h2 className="text-xl font-bold text-white">Commande</h2>
             <span className="bg-bar-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">{totalItems}</span>
           </div>
           {/* Table Selector */}
           <div className="flex items-center gap-2">
             <span className="text-slate-400 text-sm">Table:</span>
             <input 
              type="number" 
              min="1" 
              max="50"
              value={tableNumber}
              onChange={(e) => setTableNumber(parseInt(e.target.value) || 1)}
              className="w-12 bg-slate-800 text-white text-center rounded border border-slate-700 focus:border-bar-accent outline-none"
             />
           </div>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-3">
           {cart.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
               <ShoppingCart size={48} className="mb-2" />
               <p>Le panier est vide</p>
             </div>
           ) : (
             cart.map(item => (
               <div key={item.id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                 <div className="flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center bg-bar-accent/20 text-bar-accent text-xs font-bold rounded">
                      {item.quantity}x
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{item.name}</p>
                      <p className="text-slate-400 text-xs">{(item.price * item.quantity).toFixed(2)}€</p>
                    </div>
                 </div>
                 <button 
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                 >
                   <Trash2 size={16} />
                 </button>
               </div>
             ))
           )}
         </div>

         <div className="p-4 bg-slate-800/50 border-t border-slate-800">
           <div className="flex justify-between items-center mb-4">
             <span className="text-slate-400">Total</span>
             <span className="text-2xl font-bold text-white">{cartTotal.toFixed(2)}€</span>
           </div>
           <div className="grid grid-cols-2 gap-3">
             <button 
              onClick={clearCart}
              disabled={cart.length === 0}
              className="py-3 px-4 rounded-xl font-bold text-slate-300 border border-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
             >
               Annuler
             </button>
             <button 
              onClick={handlePlaceOrder}
              disabled={cart.length === 0}
              className="py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-bar-accent to-pink-600 shadow-lg shadow-bar-accent/25 hover:shadow-bar-accent/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
             >
               <CreditCard size={18} />
               Commander
             </button>
           </div>
         </div>
      </div>

      {/* Mobile Cart Trigger Button */}
      {!isCartOpen && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="md:hidden fixed bottom-20 left-4 right-4 bg-bar-accent text-white p-4 rounded-xl shadow-2xl flex justify-between items-center z-30 animate-in fade-in slide-in-from-bottom-4"
        >
          <div className="flex items-center gap-2">
            <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
              {totalItems}
            </div>
            <span className="font-bold">Voir commande</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{cartTotal.toFixed(2)}€</span>
            <ChevronUp size={20} />
          </div>
        </button>
      )}
    </div>
  );
};