import React, { useState, useMemo } from 'react';
import { Product, CartItem, CategoryDef, TableDef, Order, Client } from '../types';
import { ProductCard } from '../components/ProductCard';
import { getIconComponent } from '../components/IconRegistry';
import { Search, ShoppingCart, Trash2, CreditCard, ChevronUp, Armchair, X, User, UserPlus } from 'lucide-react';

interface POSProps {
  products: Product[];
  categories: CategoryDef[];
  tables: TableDef[];
  activeOrders: Order[]; // Pour savoir si les tables sont occupées
  clients: Client[];
  cart: CartItem[];
  addToCart: (product: Product) => void;
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
  removeFromCart, 
  placeOrder,
  currency
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, products]);

  const filteredClients = useMemo(() => {
    return clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));
  }, [clients, clientSearch]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

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

  const getCategoryIcon = (catName: string) => {
    const cat = categories.find(c => c.name === catName);
    return cat ? cat.icon : 'Shapes';
  };

  // Group tables by zone
  const tablesByZone = useMemo(() => {
    return tables.reduce((acc, table) => {
        if (!acc[table.zone]) acc[table.zone] = [];
        acc[table.zone].push(table);
        return acc;
    }, {} as Record<string, TableDef[]>);
  }, [tables]);

  const isTableOccupied = (tableName: string) => {
      return activeOrders.some(o => o.tableName === tableName && o.status !== 'Payé');
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
            <button
                onClick={() => setSelectedCategory('All')}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                  selectedCategory === 'All' 
                    ? 'bg-bar-accent text-white' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
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
                  className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectedCategory === cat.name
                      ? 'bg-bar-accent text-white' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                iconName={getCategoryIcon(product.category)}
                onAdd={addToCart}
                currency={currency}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className={`
        fixed inset-0 z-40 md:static md:z-0 md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col transition-transform duration-300 transform
        ${isCartOpen ? 'translate-y-0' : 'translate-y-[100%] md:translate-y-0'}
      `}>
         {/* Mobile Handle */}
         <div className="md:hidden flex justify-center pt-2 pb-1" onClick={() => setIsCartOpen(false)}>
            <div className="w-12 h-1.5 bg-slate-700 rounded-full"></div>
         </div>

         <div className="p-4 border-b border-slate-800 bg-slate-900">
           <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-3">
               <h2 className="text-xl font-bold text-white">Commande</h2>
               <span className="bg-bar-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">{totalItems}</span>
             </div>
             
             <button 
              onClick={() => setShowTableSelector(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedTable ? 'bg-bar-accent text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
             >
               <Armchair size={16} />
               {selectedTable ? `Table ${selectedTable}` : 'Table'}
             </button>
           </div>
           
           <button 
             onClick={() => setShowClientSelector(true)}
             className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
               selectedClient ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
             }`}
           >
             <div className="flex items-center gap-2">
                <User size={16} />
                {selectedClient ? selectedClient.name : 'Client invité'}
             </div>
             {selectedClient && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">{selectedClient.loyaltyPoints} pts</span>}
           </button>
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
                   <div className="bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 text-xs font-bold">
                     x{item.quantity}
                   </div>
                   <div>
                     <p className="text-white font-medium text-sm">{item.name}</p>
                     <p className="text-bar-accent text-xs font-bold">{item.price}{currency}</p>
                   </div>
                 </div>
                 <button 
                   onClick={() => removeFromCart(item.id)}
                   className="text-slate-500 hover:text-red-500 transition-colors p-2"
                 >
                   <Trash2 size={16} />
                 </button>
               </div>
             ))
           )}
         </div>

         <div className="p-4 bg-slate-900 border-t border-slate-800">
           <div className="flex justify-between items-center mb-4">
             <span className="text-slate-400">Total</span>
             <span className="text-2xl font-bold text-white">{cartTotal.toFixed(2)}{currency}</span>
           </div>
           <button 
             onClick={handlePlaceOrder}
             disabled={cart.length === 0}
             className="w-full bg-bar-accent hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-bar-accent/25 transition-all flex items-center justify-center gap-2"
           >
             <CreditCard size={20} />
             {selectedTable ? `Envoyer (Table ${selectedTable})` : 'Choisir une Table'}
           </button>
         </div>
      </div>

      {/* Mobile Cart Toggle */}
      {!isCartOpen && cart.length > 0 && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="md:hidden fixed bottom-20 left-4 right-4 bg-bar-accent text-white py-3 rounded-xl shadow-xl flex items-center justify-between px-6 z-30 animate-in slide-in-from-bottom-4"
        >
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">{totalItems}</span>
            <span className="font-bold">Voir le panier</span>
          </div>
          <span className="font-bold">{cartTotal.toFixed(2)}{currency}</span>
          <ChevronUp size={20} />
        </button>
      )}

      {/* Table Selector Modal */}
      {showTableSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Armchair className="text-bar-accent" />
                Sélectionner une table
              </h2>
              <button 
                onClick={() => setShowTableSelector(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {Object.keys(tablesByZone).length === 0 ? (
                 <div className="text-center text-slate-500 py-10">
                   Aucune table configurée. Allez dans l'onglet "Tables" pour en créer.
                 </div>
              ) : (
                <div className="space-y-8">
                  {(Object.entries(tablesByZone) as [string, TableDef[]][]).map(([zone, zoneTables]) => (
                    <div key={zone}>
                      <h3 className="text-lg font-bold text-slate-400 mb-3 ml-1">{zone}</h3>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {zoneTables.map(table => {
                          const occupied = isTableOccupied(table.name);
                          const isSelected = selectedTable === table.name;
                          
                          return (
                            <button
                              key={table.id}
                              onClick={() => {
                                setSelectedTable(table.name);
                                setShowTableSelector(false);
                              }}
                              className={`
                                relative p-4 rounded-xl border flex flex-col items-center gap-2 transition-all
                                ${isSelected 
                                  ? 'bg-bar-accent border-bar-accent text-white shadow-lg scale-105' 
                                  : occupied
                                    ? 'bg-slate-800 border-red-900/50 text-slate-300 opacity-75' 
                                    : 'bg-slate-800 border-slate-700 text-white hover:border-bar-accent hover:bg-slate-700'
                                }
                              `}
                            >
                              <Armchair size={24} className={occupied && !isSelected ? 'text-red-500' : ''} />
                              <span className="font-bold">{table.name}</span>
                              {occupied && !isSelected && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Client Selector Modal */}
      {showClientSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-md max-h-[70vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <UserPlus className="text-bar-accent" />
                    Associer un Client
                  </h2>
                  <button onClick={() => setShowClientSelector(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
              </div>
              <div className="p-4 border-b border-slate-800">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Rechercher un client..." 
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-white focus:border-bar-accent outline-none"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        autoFocus
                      />
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                 <button 
                    onClick={() => { setSelectedClient(null); setShowClientSelector(false); }}
                    className={`w-full text-left p-3 rounded-lg mb-1 flex items-center justify-between ${!selectedClient ? 'bg-bar-accent/20 text-bar-accent border border-bar-accent/50' : 'text-slate-400 hover:bg-slate-800'}`}
                 >
                    <span>Client invité (Anonyme)</span>
                    {!selectedClient && <div className="w-2 h-2 bg-bar-accent rounded-full"></div>}
                 </button>
                 {filteredClients.map(client => (
                     <button 
                        key={client.id}
                        onClick={() => { setSelectedClient(client); setShowClientSelector(false); }}
                        className={`w-full text-left p-3 rounded-lg mb-1 flex items-center justify-between ${selectedClient?.id === client.id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                     >
                        <div>
                            <div className="font-medium">{client.name}</div>
                            {client.phone && <div className="text-xs opacity-70">{client.phone}</div>}
                        </div>
                        <div className="text-xs font-bold bg-black/20 px-2 py-1 rounded">
                            {client.loyaltyPoints} pts
                        </div>
                     </button>
                 ))}
                 {filteredClients.length === 0 && (
                     <div className="text-center text-slate-500 py-4 text-sm">Aucun client trouvé.</div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};