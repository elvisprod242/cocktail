import React, { useState } from 'react';
import { CategoryDef } from '../types';
import { addCategory, deleteCategory } from '../services/db';
import { Plus, Trash2, X, Shapes, AlertTriangle } from 'lucide-react';
import { ICON_MAP, getIconComponent } from '../components/IconRegistry';

interface CategoriesPageProps {
  categories: CategoryDef[];
  refreshData: () => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ categories, refreshData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Martini');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    addCategory({ id: `cat_${Date.now()}`, name: newName, icon: selectedIcon });
    refreshData();
    setIsModalOpen(false);
    setNewName('');
    setSelectedIcon('Martini');
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteCategory(deleteConfirmId);
      refreshData();
      setDeleteConfirmId(null);
    }
  };

  const IconComponent = ({ name, size = 24, className = "" }: { name: string, size?: number, className?: string }) => {
    const Icon = getIconComponent(name);
    return <Icon size={size} className={className} />;
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-950">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Shapes className="text-bar-accent" />Gestion des Catégories</h1>
          <p className="text-slate-400 mt-1">Organisez votre carte avec des catégories personnalisées</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-bar-accent hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-bar-accent/25">
          <Plus size={20} />Nouvelle Catégorie
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-24 md:pb-0">
        {categories.map(cat => (
          <div key={cat.id} className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col items-center justify-center gap-4 relative group hover:border-bar-accent/50 transition-colors">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-bar-accent shadow-inner"><IconComponent name={cat.icon} size={32} /></div>
            <h3 className="font-bold text-white text-lg">{cat.name}</h3>
            <button onClick={() => setDeleteConfirmId(cat.id)} className="absolute top-2 right-2 p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={24} /></button>
            <h2 className="text-2xl font-bold text-white mb-6">Nouvelle Catégorie</h2>
            <form onSubmit={handleAddCategory} className="space-y-6">
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Nom de la catégorie</label>
                <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-bar-accent outline-none" placeholder="Ex: Pâtisseries" />
              </div>
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-3">Choisir une icône</label>
                <div className="grid grid-cols-5 gap-3 max-h-48 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800 custom-scrollbar">
                  {Object.keys(ICON_MAP).map(iconName => (
                    <div key={iconName} onClick={() => setSelectedIcon(iconName)} className={`aspect-square rounded-lg flex items-center justify-center cursor-pointer transition-all ${selectedIcon === iconName ? 'bg-bar-accent text-white shadow-lg shadow-bar-accent/50 scale-110' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}><IconComponent name={iconName} size={20} /></div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-medium hover:bg-slate-800">Annuler</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-bar-accent text-white font-bold hover:bg-pink-600 shadow-lg shadow-bar-accent/20">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="bg-slate-900 border border-red-500/30 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in duration-300">
              <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20"><AlertTriangle size={32} className="text-red-500" /></div>
              <h2 className="text-xl font-bold text-white mb-2">Supprimer la catégorie ?</h2>
              <p className="text-slate-400 mb-6 text-sm">Les produits associés resteront mais n'auront plus de catégorie valide.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors">Annuler</button>
                <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition-colors">Supprimer</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};