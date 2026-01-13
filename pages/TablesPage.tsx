import React, { useState, useMemo } from 'react';
import { TableDef } from '../types';
import { addTable, deleteTable } from '../services/db';
import { Armchair, Plus, Trash2, X, MapPin, Layout } from 'lucide-react';

interface TablesPageProps {
  tables: TableDef[];
  refreshData: () => void;
}

export const TablesPage: React.FC<TablesPageProps> = ({ tables, refreshData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  
  // Default zones to always show even if empty, ensuring basic structure
  const defaultZones = ['Salle', 'Terrasse', 'Bar', 'Comptoir'];
  
  const allZones = useMemo(() => {
    const zones = new Set<string>(defaultZones);
    tables.forEach(t => zones.add(t.zone));
    return Array.from(zones);
  }, [tables]);

  // Initial state logic: first zone available
  const [activeZone, setActiveZone] = useState<string>(allZones[0] || 'Salle');
  const [newZone, setNewZone] = useState('Salle'); // State for modal input

  const openModal = () => {
    setNewZone(activeZone); // Pre-select current zone in modal
    setNewName('');
    setIsModalOpen(true);
  };

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const newTable: TableDef = {
      id: `tab_${Date.now()}`,
      name: newName,
      zone: newZone || 'Salle'
    };

    addTable(newTable);
    refreshData();
    setIsModalOpen(false);
    setNewName('');
    setActiveZone(newZone); // Switch to the zone where we just added a table
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer cette table ?')) {
      deleteTable(id);
      refreshData();
    }
  };

  const currentZoneTables = tables.filter(t => t.zone === activeZone);

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-950 flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Armchair className="text-bar-accent" />
            Gestion des Tables
          </h1>
          <p className="text-slate-400 mt-1">Configurez votre plan de salle par zone</p>
        </div>
        
        <button 
          onClick={openModal}
          className="bg-bar-accent hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-bar-accent/25"
        >
          <Plus size={20} />
          Nouvelle Table
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-slate-800 mb-0 shrink-0">
         {allZones.map(zone => (
            <button
              key={zone}
              onClick={() => setActiveZone(zone)}
              className={`
                px-6 py-4 font-bold text-sm whitespace-nowrap transition-all relative
                ${activeZone === zone 
                  ? 'text-bar-accent bg-slate-900 rounded-t-xl border-t border-x border-slate-800' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-t-xl border border-transparent'
                }
                ${activeZone === zone ? 'z-10 bottom-[-1px]' : ''}
              `}
            >
              {zone}
            </button>
         ))}
      </div>

      {/* Tab Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-b-xl rounded-tr-xl p-6 shadow-lg flex-1 min-h-[300px]">
         <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/50">
            <div className="bg-slate-800 p-2 rounded-lg">
                <MapPin size={20} className="text-bar-accent" />
            </div>
            <h2 className="text-xl font-bold text-white flex-1">{activeZone}</h2>
            <span className="text-slate-400 text-sm bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                {currentZoneTables.length} table{currentZoneTables.length > 1 ? 's' : ''}
            </span>
         </div>

         {currentZoneTables.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                <Layout size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Zone vide</p>
                <p className="text-sm">Aucune table n'est configurée dans "{activeZone}".</p>
                <button 
                  onClick={openModal}
                  className="mt-4 text-bar-accent hover:underline font-bold"
                >
                  Ajouter une table ici
                </button>
            </div>
         ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {currentZoneTables.map(table => (
                <div key={table.id} className="bg-slate-800 p-4 rounded-xl flex flex-col items-center justify-between group relative hover:ring-2 hover:ring-bar-accent transition-all h-32 shadow-md">
                  <div className="text-slate-500 mb-2 mt-2">
                     <Armchair size={32} />
                  </div>
                  <span className="font-bold text-white text-lg">{table.name}</span>
                  
                  <button 
                    onClick={() => handleDelete(table.id)}
                    className="absolute top-2 right-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/50 p-1.5 rounded-full backdrop-blur-sm"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              
              {/* Add Button Shortcut in Grid */}
              <button 
                 onClick={openModal}
                 className="border-2 border-dashed border-slate-700 hover:border-bar-accent hover:bg-slate-800/50 rounded-xl flex flex-col items-center justify-center h-32 transition-all group"
              >
                  <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-bar-accent flex items-center justify-center mb-2 transition-colors">
                      <Plus size={20} className="text-slate-400 group-hover:text-white" />
                  </div>
                  <span className="text-slate-500 group-hover:text-white font-medium text-sm">Ajouter</span>
              </button>
            </div>
         )}
      </div>

      {/* Modal Ajout */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-bold text-white mb-6">Ajouter une Table</h2>
            
            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Numéro / Nom</label>
                <input 
                  type="text" 
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-bar-accent outline-none"
                  placeholder="Ex: 12 ou VIP"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Zone</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {defaultZones.map(z => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setNewZone(z)}
                      className={`py-2 px-1 rounded-lg text-sm font-medium transition-colors ${
                        newZone === z 
                          ? 'bg-bar-accent text-white' 
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {z}
                    </button>
                  ))}
                </div>
                {/* Custom Zone Input */}
                <input 
                  type="text" 
                  value={newZone}
                  onChange={e => setNewZone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-bar-accent outline-none text-sm"
                  placeholder="Ou entrez une nouvelle zone..."
                />
              </div>

              <div className="flex gap-3 pt-4">
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
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};