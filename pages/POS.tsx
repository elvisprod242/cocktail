
import React, { useState, useMemo, useEffect } from 'react';
import { Product, CartItem, CategoryDef, TableDef, Order, Client, TableStatus, OrderStatus } from '../types';
import { ProductCard } from '../components/ProductCard';
import { getIconComponent } from '../components/IconRegistry';
import { Search, ShoppingCart, Trash2, CreditCard, ChevronUp, Armchair, X, User, UserPlus, Plus, Minus, Info } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface POSProps {
  products: Product[];
  categories: CategoryDef[];
  tables: TableDef[];
  activeOrders: Order[];
  clients: Client[];
  cart: CartItem[];
  addToCart: (product: Product) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  placeOrder: (tableName: string, client?: Client | null) => void;
  currency: string;
}

export const POS: React.FC<POSProps> = ({ 
  products, 
  categories, 
  tables, 
  activeOrders,
  clients,
  cart, 
  addToCart, 
  updateCartItemQuantity,
  removeFromCart, 
  clearCart,
  placeOrder,
  currency
}) => {
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  // Gestion du chargement d'une table via navigation state
  useEffect(() => {
    if (location.state?.tableName) {
        setSelectedTable(location.state.tableName);
        // Si la table est occupée, on pourrait charger l'addition, 
        // mais ici on laisse l'utilisateur AJOUTER à la table.
    }
  }, [location.state]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, products]);

  // Fix: Explicitly type filteredClients to resolve line 300 'unknown' error and ensure map() is available
  const filteredClients: Client[] = useMemo(() => {
    return clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));
  }, [clients, clientSearch]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getTableOrder = (tableName: string) => {
    return activeOrders.find(o => o.tableName === tableName && o.status !== OrderStatus.PAID);
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    if (!selectedTable) {
        setShowTableSelector(true);
        return;
    }
    placeOrder(selectedTable, selectedClient);
    setIsCartOpen(false);
    setSelectedTable('');
    setSelectedClient(null);
  };

  // Fix: Explicitly type tablesByZone Record to avoid 'unknown' mapping errors during rendering
  const tablesByZone: Record<string, TableDef[]> = useMemo(() => {
    return tables.reduce((acc, table) => {
        if (!acc[table.zone]) acc[table.zone] = [];
        acc[table.zone].push(table);
        return acc;
    }, {} as Record<string, TableDef[]>);
  }, [tables]);

  const activeTableOrder = selectedTable ? getTableOrder(selectedTable) : null;

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-slate-950">
      
      {/* Main Content (Menu) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <div className="p-4 md:p-6 bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-2xl font-black text-white italic tracking-tighter">CAISSE</h1>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-full py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-bar-accent outline-none placeholder-slate-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto mt-4 pb-2 no-scrollbar">
            <button
                onClick={() => setSelectedCategory('All')}
                className={`px-5 py-2.5 rounded-xl whitespace-nowrap text-xs font-black uppercase tracking-widest transition-all ${
                  selectedCategory === 'All' 
                    ? 'bg-bar-accent text-white shadow-lg' 
                    : 'bg-slate-950 text-slate-500 hover:text-white border border-slate-800'
                }`}
              >
                Tout
              </button>
            {categories.map((cat) => {
              const Icon = getIconComponent(cat.icon);
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-5 py-2.5 rounded-xl whitespace-nowrap text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
                    selectedCategory === cat.name
                      ? 'bg-bar-accent border-bar-accent text-white shadow-lg' 
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 no-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                iconName={categories.find(c => c.name === product.category)?.icon || 'Shapes'}
                onAdd={addToCart}
                currency={currency}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className={`
        fixed inset-0 z-[60] md:static md:z-0 md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col transition-transform duration-300 transform
        ${isCartOpen ? 'translate-y-0' : 'translate-y-[100%] md:translate-y-0'}
      `}>
         {/* Mobile Handle */}
         <div className="md:hidden flex justify-center pt-2 pb-1" onClick={() => setIsCartOpen(false)}>
            <div className="w-12 h-1.5 bg-slate-700 rounded-full"></div>
         </div>

         <div className="p-6 border-b border-slate-800 bg-slate-950/50">
           <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-3">
               <h2 className="text-xl font-black text-white italic">TICKET</h2>
               <span className="bg-bar-accent text-white text-[10px] font-black px-2 py-0.5 rounded-full">{totalItems}</span>
             </div>
             
             <button 
              onClick={() => setShowTableSelector(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                selectedTable ? 'bg-bar-accent border-bar-accent text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'
              }`}
             >
               <Armchair size={16} />
               {selectedTable ? `TABLE ${selectedTable}` : 'CHOISIR TABLE'}
             </button>
           </div>

           {/* Table Status Alert */}
           {activeTableOrder && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                 <div className="p-2 bg-red-500 rounded-lg text-white">
                    <Info size={16} />
                 </div>
                 <div className="flex-1">
                    <p className="text-[10px] font-black text-red-500 uppercase">Table Occupée</p>
                    <p className="text-xs text-slate-300">Articles ajoutés à l'addition ({activeTableOrder.total.toFixed(2)}{currency})</p>
                 </div>
              </div>
           )}
           
           <button 
             onClick={() => setShowClientSelector(true)}
             className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
               selectedClient ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'
             }`}
           >
             <div className="flex items-center gap-2">
                <User size={16} />
                {selectedClient ? selectedClient.name : 'Client invité'}
             </div>
             {selectedClient && <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full">{selectedClient.loyaltyPoints} PTS</span>}
           </button>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
           {cart.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-700">
               <div className="p-6 bg-slate-950 rounded-full mb-4 border border-slate-800">
                  <ShoppingCart size={48} className="opacity-20" />
               </div>
               <p className="font-black text-[10px] uppercase tracking-widest">Le panier est vide</p>
             </div>
           ) : (
             cart.map(item => (
               <div key={item.id} className="flex justify-between items-center bg-slate-950/30 p-4 rounded-2xl border border-slate-800/50 group hover:border-bar-accent/50 transition-all">
                 <div className="flex items-center gap-4 flex-1">
                   <div className="flex items-center gap-2 bg-slate-900 rounded-xl p-1.5 border border-slate-800 shadow-inner">
                       <button 
                         onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                         className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors"
                       >
                         <Minus size={14} />
                       </button>
                       <span className="w-8 text-center text-white text-sm font-black">{item.quantity}</span>
                        <button 
                         onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                         className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors"
                       >
                         <Plus size={14} />
                       </button>
                   </div>
                   <div className="min-w-0">
                     <p className="text-white font-bold text-sm truncate">{item.name}</p>
                     <p className="text-bar-accent text-xs font-black">{item.price.toFixed(2)}{currency}</p>
                   </div>
                 </div>
                 <button 
                   onClick={() => removeFromCart(item.id)}
                   className="text-slate-700 hover:text-red-500 transition-colors p-2 ml-2"
                 >
                   <Trash2 size={18} />
                 </button>
               </div>
             ))
           )}
         </div>

         <div className="p-6 bg-slate-950 border-t border-slate-800">
           <div className="flex justify-between items-center mb-6">
             <span className="text-slate-500 font-black text-xs uppercase tracking-widest">Total Ticket</span>
             <span className="text-3xl font-black text-white">{cartTotal.toFixed(2)}{currency}</span>
           </div>
           <button 
             onClick={handlePlaceOrder}
             disabled={cart.length === 0}
             className="w-full bg-bar-accent hover:bg-pink-600 disabled:opacity-20 disabled:grayscale text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-bar-accent/25 transition-all flex items-center justify-center gap-3"
           >
             <CreditCard size={20} />
             {selectedTable ? (activeTableOrder ? 'Ajouter à la table' : 'Ouvrir Addition') : 'Choisir une Table'}
           </button>
         </div>
      </div>

      {/* Table Selector Modal - Enhanced */}
      {showTableSelector && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-2xl font-black text-white italic flex items-center gap-3">
                <Armchair className="text-bar-accent" /> SÉLECTION TABLE
              </h2>
              <button onClick={() => setShowTableSelector(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
              <div className="space-y-10">
                {Object.entries(tablesByZone).map(([zone, zoneTables]) => (
                  <div key={zone}>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-4 ml-1">{zone}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-4">
                      {zoneTables.map(table => {
                        const order = getTableOrder(table.name);
                        const isOccupied = table.status === TableStatus.OCCUPIED;
                        const isReserved = table.status === TableStatus.RESERVED;
                        const isSelected = selectedTable === table.name;
                        
                        return (
                          <button
                            key={table.id}
                            onClick={() => {
                              setSelectedTable(table.name);
                              setShowTableSelector(false);
                            }}
                            className={`
                              relative p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all h-32 justify-center
                              ${isSelected 
                                ? 'bg-bar-accent border-bar-accent text-white shadow-xl scale-105 z-10' 
                                : isOccupied
                                  ? 'bg-red-500/10 border-red-500/30 text-red-500' 
                                  : isReserved
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 opacity-60'
                                    : 'bg-slate-950 border-slate-800 text-white hover:border-slate-600'
                              }
                            `}
                          >
                            <Armchair size={24} />
                            <span className="font-black text-lg">{table.name}</span>
                            {isOccupied && (
                                <span className="text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full shadow-lg">
                                    {order?.total.toFixed(0)}{currency}
                                </span>
                            )}
                            {isReserved && (
                                <span className="text-[9px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                    RÉSERVÉ
                                </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Selector Modal remains same... */}
      {showClientSelector && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-md max-h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                  <h2 className="text-xl font-black text-white italic flex items-center gap-2">
                    <UserPlus className="text-bar-accent" /> ASSOCIER CLIENT
                  </h2>
                  <button onClick={() => setShowClientSelector(false)} className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full"><X size={24} /></button>
              </div>
              <div className="p-4 bg-slate-950/50">
                  <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Rechercher un client..." 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white focus:border-bar-accent outline-none text-sm"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                      />
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                 <button 
                    onClick={() => { setSelectedClient(null); setShowClientSelector(false); }}
                    className={`w-full text-left p-4 rounded-2xl mb-2 flex items-center justify-between transition-all border ${!selectedClient ? 'bg-bar-accent/10 text-bar-accent border-bar-accent/30' : 'text-slate-500 border-transparent hover:bg-slate-800'}`}
                 >
                    <span className="font-black text-xs uppercase tracking-widest">Client de passage</span>
                    {!selectedClient && <div className="w-2 h-2 bg-bar-accent rounded-full"></div>}
                 </button>
                 {filteredClients.map(client => (
                     <button 
                        key={client.id}
                        onClick={() => { setSelectedClient(client); setShowClientSelector(false); }}
                        className={`w-full text-left p-4 rounded-2xl mb-2 flex items-center justify-between transition-all border ${selectedClient?.id === client.id ? 'bg-blue-600 border-blue-500 text-white' : 'text-slate-300 border-transparent hover:bg-slate-800'}`}
                     >
                        <div className="flex flex-col">
                            <span className="font-bold text-sm">{client.name}</span>
                            <span className="text-[10px] opacity-70 font-mono">{client.phone || 'Pas de numéro'}</span>
                        </div>
                        <span className="text-[10px] font-black bg-black/20 px-2 py-1 rounded-lg uppercase">
                            {client.loyaltyPoints} PTS
                        </span>
                     </button>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
