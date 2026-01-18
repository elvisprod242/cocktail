import React, { useState, useMemo } from 'react';
import { Product, CategoryDef, StockEntry } from '../types';
import { addProduct, deleteProduct, updateProduct, replenishStock, getStockHistory } from '../services/db';
import { Plus, Trash2, Search, Package, X, Edit2, LayoutGrid, List, AlertTriangle, ArrowUp, History, ClipboardList, Info, Filter, CheckCircle2 } from 'lucide-react';
import { getIconComponent } from '../components/IconRegistry';

interface ProductsPageProps {
  products: Product[];
  categories: CategoryDef[];
  refreshData: () => void;
  currency: string;
}

const StockProgressBar: React.FC<{ stock: number; threshold: number }> = ({ stock, threshold }) => {
  const maxDisplay = Math.max(threshold * 3, stock, 15);
  const percentage = Math.min((stock / maxDisplay) * 100, 100);
  
  let barColor = "bg-green-500";
  if (stock <= 0) barColor = "bg-red-500 animate-pulse";
  else if (stock <= threshold) barColor = "bg-orange-500";

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
        <span className="text-slate-500">Niveau de stock</span>
        <span className={stock <= threshold ? 'text-orange-500' : 'text-slate-400'}>
          {stock} / {threshold}
        </span>
      </div>
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 relative">
        <div 
          className={`h-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white/40 z-10" 
          style={{ left: `${(threshold / maxDisplay) * 100}%` }}
          title="Seuil d'alerte"
        />
      </div>
    </div>
  );
};

export const Products: React.FC<ProductsPageProps> = ({ products, categories, refreshData, currency }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [isRestockConfirmOpen, setIsRestockConfirmOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [stockHistory, setStockHistory] = useState<StockEntry[]>([]);
  const [isHistoryViewOpen, setIsHistoryViewOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  const [restockQty, setRestockQty] = useState('');
  const [restockNote, setRestockNote] = useState('');

  const handleOpenModal = (product?: Product) => {
    if (product) {
        setEditingProduct(product);
        setName(product.name);
        setPrice(product.price.toString());
        setCostPrice(product.costPrice?.toString() || '0');
        setStock(product.stock?.toString() || '0');
        setAlertThreshold(product.alertThreshold?.toString() || '5');
        setCategory(product.category);
        setDescription(product.description || '');
        setImageUrl(product.image || '');
        setIsAvailable(product.isAvailable !== undefined ? product.isAvailable : true);
        setStockHistory(getStockHistory(product.id));
    } else {
        setEditingProduct(null);
        setName('');
        setPrice('');
        setCostPrice('');
        setStock('0');
        setAlertThreshold('5');
        setCategory(categories.length > 0 ? categories[0].name : '');
        setDescription('');
        setImageUrl('');
        setIsAvailable(true);
        setStockHistory([]);
    }
    setIsModalOpen(true);
  };

  const handleOpenRestock = (product: Product) => {
      setRestockProduct(product);
      setRestockQty('');
      setRestockNote('');
      setStockHistory(getStockHistory(product.id));
      setIsRestockOpen(true);
  };

  const handleViewHistory = (product: Product) => {
      setRestockProduct(product);
      setStockHistory(getStockHistory(product.id));
      setIsHistoryViewOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    const catToUse = category || (categories.length > 0 ? categories[0].name : 'Divers');
    const imageToUse = imageUrl || `https://picsum.photos/200/200?random=${Date.now()}`;
    const stockVal = parseInt(stock) || 0;
    const thresholdVal = Math.max(0, parseInt(alertThreshold) || 0);
    const costVal = parseFloat(costPrice) || 0;
    const priceVal = parseFloat(price);

    if (editingProduct) {
        updateProduct({ ...editingProduct, name, price: priceVal, costPrice: costVal, stock: stockVal, alertThreshold: thresholdVal, category: catToUse, description, image: imageToUse, isAvailable });
    } else {
        addProduct({ id: Math.random().toString(36).substr(2, 9), name, price: priceVal, costPrice: costVal, stock: stockVal, alertThreshold: thresholdVal, category: catToUse, description, image: imageToUse, isAvailable });
    }
    refreshData();
    setIsModalOpen(false);
  };

  const handleRestockInitiate = (e: React.FormEvent) => {
      e.preventDefault();
      if (!restockProduct || !restockQty) return;
      const qty = parseInt(restockQty);
      if (isNaN(qty) || qty === 0) return;
      
      setIsRestockConfirmOpen(true);
  };

  const handleRestockFinalConfirm = () => {
      if (!restockProduct || !restockQty) return;
      const qty = parseInt(restockQty);
      
      replenishStock(restockProduct.id, qty, restockNote || 'Réapprovisionnement manuel');
      refreshData();
      setIsRestockConfirmOpen(false);
      setIsRestockOpen(false);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteProduct(deleteConfirmId);
      refreshData();
      setDeleteConfirmId(null);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              p.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategoryFilter === 'All' || p.category === selectedCategoryFilter;
        const matchesLowStock = !showLowStockOnly || (p.stock <= p.alertThreshold);
        return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [products, searchQuery, selectedCategoryFilter, showLowStockOnly]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => p.stock <= p.alertThreshold).length;
  }, [products]);

  const getCategoryIcon = (catName: string) => {
    const cat = categories.find(c => c.name === catName);
    return cat ? cat.icon : 'Shapes';
  };

  const getStockStatus = (product: Product) => {
      if (product.stock <= 0) return { label: 'RUPTURE', color: 'text-red-500 bg-red-500/10 border-red-500/30', alert: true, critical: true };
      if (product.stock <= product.alertThreshold) return { label: 'STOCK FAIBLE', color: 'text-orange-500 bg-orange-500/10 border-orange-500/30', alert: true, critical: false };
      return { label: 'EN STOCK', color: 'text-green-500 bg-green-500/10 border-green-500/20', alert: false, critical: false };
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-950 flex flex-col no-scrollbar">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Package className="text-bar-accent" />
            Stock & Inventaire
          </h1>
          <p className="text-slate-400 mt-1">Gérez vos niveaux de stock et visualisez les ruptures</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-bar-accent hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-bar-accent/25 w-full md:w-auto justify-center">
          <Plus size={20} /> Nouveau Produit
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-6 flex flex-col xl:flex-row gap-3 items-center sticky top-0 z-10 shadow-md">
          <div className="relative flex-1 w-full">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input type="text" placeholder="Rechercher par nom..." className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-bar-accent outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
             <div className="flex-1 xl:flex-none xl:w-48">
                <select value={selectedCategoryFilter} onChange={(e) => setSelectedCategoryFilter(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-white outline-none focus:border-bar-accent cursor-pointer text-sm">
                    <option value="All">Toutes catégories</option>
                    {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
             </div>
             <button onClick={() => setShowLowStockOnly(!showLowStockOnly)} className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all border ${showLowStockOnly ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}>
                <AlertTriangle size={16} className={showLowStockOnly ? 'text-white' : 'text-orange-500'} />
                <span className="hidden sm:inline">Alertes Stock</span>
                {lowStockCount > 0 && <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${showLowStockOnly ? 'bg-white text-orange-600' : 'bg-orange-500 text-white'}`}>{lowStockCount}</span>}
             </button>
             <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-slate-800 text-bar-accent' : 'text-slate-400 hover:text-white'}`}><LayoutGrid size={18} /></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-slate-800 text-bar-accent' : 'text-slate-400 hover:text-white'}`}><List size={18} /></button>
             </div>
          </div>
      </div>

      <div className="flex-1 pb-24 md:pb-0">
        {filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
             <Filter size={48} className="mb-4 opacity-20" />
             <p className="text-lg">Aucun produit ne correspond à ces critères</p>
             {showLowStockOnly && <button onClick={() => setShowLowStockOnly(false)} className="mt-2 text-bar-accent hover:underline font-bold">Effacer le filtre d'alertes</button>}
          </div>
        ) : viewMode === 'grid' ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => {
                    const Icon = getIconComponent(getCategoryIcon(product.category));
                    const status = getStockStatus(product);
                    return (
                        <div key={product.id} className={`bg-slate-900 border rounded-xl overflow-hidden shadow-lg group flex flex-col h-full transition-all ${product.isAvailable === false ? 'opacity-70 grayscale-[0.3]' : ''} ${status.critical ? 'border-red-500/40 ring-1 ring-red-500/20 shadow-red-500/5' : 'border-slate-800 hover:border-slate-700'}`}>
                            <div className="relative h-32 w-full overflow-hidden bg-slate-800/50 flex items-center justify-center">
                                <Icon className="text-bar-accent w-12 h-12 drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300" />
                                <div className="absolute top-2 right-2">
                                     <span className={`text-[10px] font-bold px-2 py-1 rounded shadow-sm border flex items-center gap-1 backdrop-blur-md ${status.color} ${status.alert ? 'animate-pulse' : ''}`}>
                                         {status.alert && <AlertTriangle size={10} />}
                                         {status.label}
                                     </span>
                                </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-white text-sm leading-tight truncate">{product.name}</h3>
                                        <p className="text-[10px] text-slate-500 uppercase mt-0.5">{product.category}</p>
                                    </div>
                                    <span className="font-bold text-bar-accent bg-slate-950 px-2 py-1 rounded border border-slate-800 text-xs">{product.price.toFixed(2)}{currency}</span>
                                </div>
                                <div className="mb-6">
                                    <StockProgressBar stock={product.stock} threshold={product.alertThreshold} />
                                </div>
                                <div className="grid grid-cols-4 gap-2 mt-auto">
                                    <button onClick={() => handleOpenRestock(product)} className="py-2 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-lg transition-colors flex items-center justify-center border border-green-500/30" title="Réapprovisionner"><ArrowUp size={16} /></button>
                                    <button onClick={() => handleViewHistory(product)} className="py-2 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-lg transition-colors flex items-center justify-center border border-blue-500/30" title="Historique"><History size={16} /></button>
                                    <button onClick={() => handleOpenModal(product)} className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center justify-center border border-slate-700" title="Modifier"><Edit2 size={16} /></button>
                                    <button onClick={() => setDeleteConfirmId(product.id)} className="py-2 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-lg transition-colors flex items-center justify-center border border-slate-700" title="Supprimer"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        </div>
                    );
                })}
             </div>
        ) : (
             <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-medium">
                        <tr>
                            <th className="p-4">Produit</th>
                            <th className="p-4">Catégorie</th>
                            <th className="p-4 w-48">Niveau de Stock</th>
                            <th className="p-4 text-right">Prix</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {filteredProducts.map(product => (
                            <tr key={product.id} className="hover:bg-slate-800/30 transition-colors group">
                                <td className="p-4 font-bold text-white text-sm">{product.name}</td>
                                <td className="p-4 text-[10px] text-slate-500 uppercase font-bold">{product.category}</td>
                                <td className="p-4"><StockProgressBar stock={product.stock} threshold={product.alertThreshold} /></td>
                                <td className="p-4 text-right font-bold text-white text-sm">{product.price.toFixed(2)}{currency}</td>
                                <td className="p-4">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => handleOpenRestock(product)} className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors" title="Réappro"><ArrowUp size={16} /></button>
                                        <button onClick={() => handleViewHistory(product)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="Historique"><History size={16} /></button>
                                        <button onClick={() => handleOpenModal(product)} className="p-2 text-slate-400 hover:text-white" title="Éditer"><Edit2 size={16} /></button>
                                        <button onClick={() => setDeleteConfirmId(product.id)} className="p-2 text-slate-400 hover:text-red-500" title="Supprimer"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        )}
      </div>

      {/* RE-STOCK MODAL */}
      {isRestockOpen && restockProduct && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><ArrowUp size={20} className="text-green-500" /> Approvisionnement</h2>
                    <button onClick={() => setIsRestockOpen(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
                  </div>
                  <div className="p-6 overflow-y-auto">
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6">
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Produit sélectionné</p>
                          <p className="text-lg font-bold text-white mb-3">{restockProduct.name}</p>
                          <StockProgressBar stock={restockProduct.stock} threshold={restockProduct.alertThreshold} />
                      </div>
                      <form onSubmit={handleRestockInitiate} className="space-y-4">
                          <div>
                              <label className="block text-slate-400 text-sm font-medium mb-1">Quantité à ajouter</label>
                              <input type="number" required value={restockQty} onChange={e => setRestockQty(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white font-bold text-xl focus:border-green-500 outline-none" placeholder="0" autoFocus />
                          </div>
                          <div>
                              <label className="block text-slate-400 text-sm font-medium mb-1">Motif / Note</label>
                              <input type="text" value={restockNote} onChange={e => setRestockNote(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:border-bar-accent outline-none" placeholder="Ex: Livraison fournisseur..." />
                          </div>
                          <button type="submit" className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">Valider l'entrée</button>
                      </form>
                  </div>
              </div>
          </div>
      )}

      {/* RESTOCK CONFIRMATION MODAL */}
      {isRestockConfirmOpen && restockProduct && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="bg-slate-900 border border-green-500/30 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in duration-300">
              <div className="bg-green-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Confirmer l'ajout</h2>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6 text-left">
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-500 text-xs">Produit:</span>
                      <span className="text-white font-bold text-sm">{restockProduct.name}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-500 text-xs">Quantité:</span>
                      <span className="text-green-500 font-black text-lg">+{restockQty}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                      <span className="text-slate-500 text-xs">Nouveau Stock:</span>
                      <span className="text-white font-bold">{(restockProduct.stock + parseInt(restockQty))}</span>
                  </div>
                  {restockNote && (
                      <div className="mt-3 pt-2 border-t border-slate-800">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Note:</span>
                          <p className="text-slate-300 text-xs italic">"{restockNote}"</p>
                      </div>
                  )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsRestockConfirmOpen(false)} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors">Corriger</button>
                <button onClick={handleRestockFinalConfirm} className="flex-1 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-500 transition-colors shadow-lg shadow-green-500/20">Confirmer</button>
              </div>
           </div>
        </div>
      )}

      {/* PRODUCT EDIT/ADD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto no-scrollbar">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl p-6 relative my-8">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={24} /></button>
            <h2 className="text-2xl font-bold text-white mb-6">{editingProduct ? 'Détails du Produit' : 'Nouveau Produit'}</h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider">Nom</label>
                            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-bar-accent outline-none" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider">Catégorie</label>
                            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-bar-accent outline-none">
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-5">
                        <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2 text-bar-accent"><Package size={16} /><span className="text-xs font-bold uppercase tracking-widest">Configuration du Stock</span></div>
                             <div className="flex items-center gap-1.5 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20"><AlertTriangle size={12} className="text-orange-500" /><span className="text-[10px] font-bold text-orange-400 uppercase">Alerte auto</span></div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-slate-400 text-[10px] font-bold mb-1.5 uppercase tracking-wide">Stock Actuel</label>
                                <input type="number" value={stock} onChange={e => setStock(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white text-lg focus:border-bar-accent outline-none font-bold shadow-inner" />
                            </div>
                            <div>
                                <label className="block text-orange-400 text-[10px] font-bold mb-1.5 uppercase tracking-wide flex items-center gap-1">Seuil d'Alerte <Info size={10} /></label>
                                <input type="number" value={alertThreshold} onChange={e => setAlertThreshold(e.target.value)} className="w-full bg-slate-900 border border-orange-900/40 rounded-lg p-3 text-orange-400 text-lg focus:border-orange-500 outline-none font-bold shadow-inner" />
                            </div>
                        </div>
                        <div className="pt-2"><StockProgressBar stock={parseInt(stock) || 0} threshold={parseInt(alertThreshold) || 1} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-400 text-[10px] font-bold mb-1 uppercase">Coût Achat</label>
                            <input 
                                type="number" 
                                step="0.01" 
                                value={costPrice} 
                                onChange={e => {
                                    const val = e.target.value;
                                    setCostPrice(val);
                                    // Pré-remplir le stock si vide ou à zéro pour un nouveau produit
                                    if (!editingProduct && (stock === '' || stock === '0')) {
                                        setStock(val);
                                    }
                                }} 
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:border-bar-accent outline-none" 
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-[10px] font-bold mb-1 uppercase">Prix de Vente</label>
                            <input type="number" step="0.1" required value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white font-bold focus:border-bar-accent outline-none" />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col h-full space-y-4">
                    <div className="flex items-center justify-between"><label className="text-slate-200 text-sm font-bold flex items-center gap-2"><History size={18} className="text-blue-500" /> Historique d'approvisionnement</label></div>
                    <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl overflow-y-auto max-h-[450px] p-4 custom-scrollbar">
                        {stockHistory.length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs italic gap-4 py-12"><ClipboardList size={32} className="opacity-10" /><p>Aucun approvisionnement pour le moment</p></div>) : (
                            <div className="space-y-4">
                                {stockHistory.map(entry => (
                                    <div key={entry.id} className="relative pl-6 border-l border-slate-800 pb-4 last:pb-0">
                                        <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                                        <div className="flex justify-between items-start mb-1"><span className="font-bold text-green-500 text-sm">+{entry.quantity}</span><span className="text-[10px] text-slate-500 font-mono">{new Date(entry.timestamp).toLocaleDateString()}</span></div>
                                        <p className="text-[11px] text-slate-400 leading-snug">{entry.note || "Entrée de stock standard"}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors">Annuler</button>
                <button type="submit" className="flex-1 py-3.5 rounded-xl bg-bar-accent text-white font-bold hover:bg-pink-600 shadow-lg shadow-bar-accent/20 transition-all">{editingProduct ? 'Enregistrer les modifications' : 'Créer le produit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="bg-slate-900 border border-red-500/30 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in duration-300">
              <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Confirmer la suppression</h2>
              <p className="text-slate-400 mb-6 text-sm">Cette action est irréversible. Toutes les données associées à ce produit seront perdues.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors">Annuler</button>
                <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition-colors shadow-lg shadow-red-500/20">Supprimer</button>
              </div>
           </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {isHistoryViewOpen && restockProduct && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><History size={20} className="text-blue-500" /> Journal de Stock</h2>
                    <button onClick={() => setIsHistoryViewOpen(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
                  </div>
                  <div className="p-6 overflow-y-auto">
                      <div className="mb-6 flex justify-between items-end">
                          <div>
                              <h3 className="text-white font-bold text-lg">{restockProduct.name}</h3>
                              <p className="text-xs text-slate-500">Historique complet des entrées</p>
                          </div>
                          <div className="text-right">
                              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Stock Actuel</span>
                              <span className={`text-xl font-bold ${restockProduct.stock <= restockProduct.alertThreshold ? 'text-orange-500' : 'text-green-500'}`}>{restockProduct.stock}</span>
                          </div>
                      </div>
                      <div className="space-y-3">
                          {stockHistory.length === 0 ? (<div className="text-center py-12 text-slate-600 italic border border-dashed border-slate-800 rounded-xl">Aucune entrée enregistrée.</div>) : (
                              stockHistory.map(entry => (
                                  <div key={entry.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-start gap-4 hover:border-blue-500/30 transition-colors">
                                      <div className="bg-green-500/10 text-green-500 p-2 rounded-lg shrink-0"><ArrowUp size={16} /></div>
                                      <div className="flex-1 min-w-0">
                                          <div className="flex justify-between items-center mb-1"><span className="font-bold text-white">+{entry.quantity} unités</span><span className="text-[10px] text-slate-500 font-mono">{new Date(entry.timestamp).toLocaleDateString()}</span></div>
                                          <p className="text-xs text-slate-400 leading-relaxed italic">{entry.note || 'Aucune note'}</p>
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};