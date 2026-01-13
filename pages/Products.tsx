import React, { useState } from 'react';
import { Product, CategoryDef } from '../types';
import { addProduct, deleteProduct } from '../services/db';
import { Plus, Trash2, Search, Package, X } from 'lucide-react';
import { getIconComponent } from '../components/IconRegistry';

interface ProductsPageProps {
  products: Product[];
  categories: CategoryDef[];
  refreshData: () => void;
  currency: string;
}

export const Products: React.FC<ProductsPageProps> = ({ products, categories, refreshData, currency }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      deleteProduct(id);
      refreshData();
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) return;

    // Use selected category or fallback to first available
    const catToUse = newCategory || (categories.length > 0 ? categories[0].name : 'Divers');

    const newProduct: Product = {
      id: Math.random().toString(36).substr(2, 9),
      name: newName,
      price: parseFloat(newPrice),
      category: catToUse,
      description: newDesc,
      image: `https://picsum.photos/200/200?random=${Date.now()}` // On garde la propriété pour la compatibilité, même si on ne l'affiche plus
    };

    addProduct(newProduct);
    refreshData();
    setIsModalOpen(false);
    
    // Reset form
    setNewName('');
    setNewPrice('');
    setNewDesc('');
    setNewCategory('');
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryIcon = (catName: string) => {
    const cat = categories.find(c => c.name === catName);
    return cat ? cat.icon : 'Shapes';
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-950">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Package className="text-bar-accent" />
            Gestion des Produits
          </h1>
          <p className="text-slate-400 mt-1">Gérez votre carte et votre inventaire</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-bar-accent hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-bar-accent/25"
        >
          <Plus size={20} />
          Nouveau Produit
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Rechercher un produit..." 
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-bar-accent placeholder-slate-500 outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24 md:pb-0">
        {filteredProducts.map(product => {
          const Icon = getIconComponent(getCategoryIcon(product.category));
          
          return (
            <div key={product.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg group flex flex-col h-full">
              <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center group-hover:from-slate-700 group-hover:to-slate-600 transition-colors">
                 <Icon className="text-bar-accent w-20 h-20 drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300" />
                 <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                   {product.category}
                 </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-white text-lg leading-tight line-clamp-2">{product.name}</h3>
                   <span className="font-bold text-bar-accent whitespace-nowrap ml-2">{product.price}{currency}</span>
                 </div>
                 
                 <div className="mt-auto">
                   <button 
                     onClick={() => handleDelete(product.id)}
                     className="w-full py-2 border border-slate-700 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-colors flex items-center justify-center gap-2"
                   >
                     <Trash2 size={16} /> Supprimer
                   </button>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-bold text-white mb-6">Ajouter un produit</h2>
            
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Nom du produit</label>
                <input 
                  type="text" 
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-bar-accent outline-none"
                  placeholder="Ex: Mojito Royal"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-1">Prix ({currency})</label>
                  <input 
                    type="number" 
                    step="0.1"
                    required
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-bar-accent outline-none"
                    placeholder="10.00"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-1">Catégorie</label>
                  <select 
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-bar-accent outline-none"
                  >
                    <option value="" disabled>Choisir...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Description</label>
                <textarea 
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-bar-accent outline-none h-24"
                  placeholder="Ingrédients, notes de dégustation..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-medium hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-bar-accent text-white font-bold hover:bg-pink-600 shadow-lg shadow-bar-accent/20"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};