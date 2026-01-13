import React, { useState } from 'react';
import { TableDef } from '../types';
import { addTable, deleteTable } from '../services/db';
import { Armchair, Plus, Trash2, X, MapPin } from 'lucide-react';

interface TablesPageProps {
  tables: TableDef[];
  refreshData: () => void;
}

export const TablesPage: React.FC<TablesPageProps> = ({ tables, refreshData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newZone, setNewZone] = useState('Salle');

  const zones = Array.from(new Set(tables.map(t => t.zone)));
  // Ajouter des zones par défaut si vide
  if (!zones.includes('Salle')) zones.push('Salle');
  if (!zones.includes('Terrasse')) zones.push('Terrasse');
  if (!zones.includes('Bar')) zones.push('Bar');

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const newTable: TableDef = {
      id: `tab_${Date.now()}`,
      name: newName,
      zone: newZone
    };

    addTable(newTable);
    refreshData();
    setIsModalOpen(false);
    setNewName('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer cette table ?')) {
      deleteTable(id);
      refreshData();
    }
  };

  const tablesByZone = tables.reduce((acc, table) => {
    if (!acc[table.zone]) acc[table.zone] = [];
    acc[table.zone].push(table);
    return acc;
  }, {} as Record<string, TableDef[]>);

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-950">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Armchair className="text-bar-accent" />
            Gestion des Tables
          </h1>
          <p className="text-slate-400 mt-1">Configurez votre plan de salle</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-bar-accent hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-bar-accent/25"
        >
          <Plus size={20} />
          Nouvelle Table
        </button>
      </div>

      <div className="grid gap-8 pb-24 md:pb-0">
        {(Object.entries(tablesByZone) as [string, TableDef[]][]).map(([zone, zoneTables]) => (
          <div key={zone} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-slate-400" />
              Zone : {zone}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {zoneTables.map(table => (
                <div key={table.id} className="bg-slate-800 p-4 rounded-xl flex flex-col items-center justify-between group relative hover:ring-2 hover:ring-bar-accent transition-all h-32">
                  <div className="text-slate-500 mb-2">
                     <Armchair size={32} />
                  </div>
                  <span className="font-bold text-white text-lg">{table.name}</span>
                  
                  <button 
                    onClick={() => handleDelete(table.id)}
                    className="absolute top-2 right-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {tables.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Aucune table configurée. Commencez par en ajouter une !
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
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Zone</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {['Salle', 'Terrasse', 'Bar'].map(z => (
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