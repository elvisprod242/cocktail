
import React, { useState, useMemo } from 'react';
import { TableDef, TableStatus, Order, OrderStatus } from '../types';
import { updateTableStatus, deleteTable, addTable } from '../services/db';
import { Armchair, Plus, Trash2, X, MapPin, Calculator, CalendarCheck, Clock, User, Info, LogIn, Crown, Beer, Coffee, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TablesPageProps {
  tables: TableDef[];
  refreshData: () => void;
  orders: Order[];
  currency: string;
}

const ZONE_ICONS: Record<string, any> = {
  'Salle': <Coffee size={18} />,
  'Terrasse': <Sun size={18} />,
  'Bar': <Beer size={18} />,
  'VIP': <Crown size={18} />
};

export const TablesPage: React.FC<TablesPageProps> = ({ tables, refreshData, orders, currency }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newZone, setNewZone] = useState('Salle');
  const [activeZone, setActiveZone] = useState<string>('Salle');
  
  const [reservationModalTable, setReservationModalTable] = useState<TableDef | null>(null);
  const [resNote, setResNote] = useState('');

  const zones = useMemo(() => {
    const defaultZones = ['Salle', 'Terrasse', 'Bar', 'VIP'];
    const currentZones = Array.from(new Set(tables.map(t => t.zone)));
    // Union des zones par défaut et des zones créées manuellement
    return Array.from(new Set([...defaultZones, ...currentZones]));
  }, [tables]);

  const getTableCurrentOrder = (tableName: string) => {
    return orders.find(o => o.tableName === tableName && o.status !== OrderStatus.PAID);
  };

  const handleToggleReservation = (table: TableDef) => {
    if (table.status === TableStatus.RESERVED) {
        updateTableStatus(table.name, TableStatus.FREE, '');
        refreshData();
    } else {
        setReservationModalTable(table);
        setResNote('');
    }
  };

  const submitReservation = () => {
    if (reservationModalTable) {
        updateTableStatus(reservationModalTable.name, TableStatus.RESERVED, resNote);
        refreshData();
        setReservationModalTable(null);
    }
  };

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    addTable({ 
        id: `tab_${Date.now()}`, 
        name: newName, 
        zone: newZone, 
        status: TableStatus.FREE 
    });
    refreshData();
    setIsModalOpen(false);
    setNewName('');
  };

  const currentTables = tables.filter(t => t.zone === activeZone);

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-950 flex flex-col no-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter flex items-center gap-3">
             <div className="p-2 bg-bar-accent/20 rounded-lg text-bar-accent">
                <Armchair size={28} />
             </div>
             PLAN DE SALLE
          </h1>
          <p className="text-slate-400 mt-1 font-medium">Gérez vos espaces : Salle, Terrasse, Bar et VIP</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <button 
                onClick={() => setIsModalOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-700"
            >
                <Plus size={20} /> Nouvelle Table
            </button>
        </div>
      </div>

      {/* Zone Tabs - Explicit and clear */}
      <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
         {zones.map(zone => (
           <button
             key={zone}
             onClick={() => setActiveZone(zone)}
             className={`px-5 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all border flex items-center gap-2 ${
               activeZone === zone 
                ? 'bg-bar-accent border-bar-accent text-white shadow-lg shadow-bar-accent/20' 
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'
             }`}
           >
             {ZONE_ICONS[zone] || <MapPin size={18} />}
             {zone}
             <span className="bg-slate-950/50 px-2 py-0.5 rounded-full text-[8px] opacity-70">
                {tables.filter(t => t.zone === zone).length}
             </span>
           </button>
         ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {currentTables.length > 0 ? currentTables.map(table => {
          const activeOrder = getTableCurrentOrder(table.name);
          const isOccupied = table.status === TableStatus.OCCUPIED;
          const isReserved = table.status === TableStatus.RESERVED;

          return (
            <div 
              key={table.id} 
              className={`relative rounded-3xl p-5 border-2 transition-all group flex flex-col h-48 shadow-2xl ${
                isOccupied 
                  ? 'bg-red-500/10 border-red-500/50 shadow-red-500/10' 
                  : isReserved
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-amber-500/10'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              } ${table.zone === 'VIP' && !isOccupied && !isReserved ? 'border-purple-500/20' : ''}`}
            >
              <div className="flex justify-between items-start mb-4">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {table.zone === 'VIP' ? 'Zone Prestige' : 'Table'}
                    </span>
                    <h3 className="text-2xl font-black text-white">{table.name}</h3>
                 </div>
                 <div className={`p-2.5 rounded-2xl ${
                    isOccupied ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 
                    isReserved ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 
                    table.zone === 'VIP' ? 'bg-purple-900/50 text-purple-400' : 'bg-slate-800 text-slate-500'
                 }`}>
                    {table.zone === 'VIP' ? <Crown size={20} /> : <Armchair size={20} />}
                 </div>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                 {isOccupied && activeOrder ? (
                    <div className="animate-in fade-in duration-500">
                       <p className="text-2xl font-black text-red-500">{activeOrder.total.toFixed(2)}{currency}</p>
                       <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mt-1 uppercase">
                          <Clock size={10} /> 
                          Occupée {Math.floor((Date.now() - activeOrder.timestamp) / 60000)}m
                       </p>
                    </div>
                 ) : isReserved ? (
                    <div className="text-amber-500 text-xs font-bold flex flex-col gap-1">
                       <div className="flex items-center gap-1">
                            <CalendarCheck size={14} /> 
                            <span>Réservée</span>
                       </div>
                       <span className="truncate text-[10px] text-slate-400 font-medium">
                          {table.reservationNote || 'Client attendu'}
                       </span>
                    </div>
                 ) : (
                    <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        Disponible
                    </span>
                 )}
              </div>

              <div className="flex gap-2 mt-4">
                 {isOccupied ? (
                    <button 
                       onClick={() => navigate('/kitchen')}
                       className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1 shadow-lg shadow-red-500/20"
                    >
                       <Calculator size={12} /> Addition
                    </button>
                 ) : (
                    <button 
                       onClick={() => handleToggleReservation(table)}
                       className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1 ${
                         isReserved 
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                          : 'bg-slate-800 text-slate-400 hover:bg-amber-500/20 hover:text-amber-500'
                       }`}
                    >
                       <CalendarCheck size={12} /> {isReserved ? 'Libérer' : 'Réserver'}
                    </button>
                 )}
                 <button 
                    onClick={() => navigate('/pos', { state: { tableName: table.name } })}
                    className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center border ${
                        isOccupied ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-800 hover:bg-bar-accent border-slate-700 text-slate-400 hover:text-white'
                    }`}
                    title="Ouvrir la caisse"
                 >
                    <LogIn size={18} />
                 </button>
              </div>

              <button 
                 onClick={() => { if(confirm('Supprimer cette table ?')) { deleteTable(table.id); refreshData(); }}}
                 className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                 <Trash2 size={14} />
              </button>
            </div>
          );
        }) : (
            <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 text-slate-600">
                <Armchair size={48} className="opacity-20" />
                <p className="font-black text-xs uppercase tracking-widest">Aucune table dans cette zone</p>
                <button onClick={() => setIsModalOpen(true)} className="text-bar-accent text-[10px] font-black uppercase hover:underline">Ajouter la première table</button>
            </div>
        )}

        {/* Add Table Placeholder */}
        <button 
           onClick={() => setIsModalOpen(true)}
           className="h-48 rounded-3xl border-2 border-dashed border-slate-800 hover:border-bar-accent hover:bg-bar-accent/5 transition-all flex flex-col items-center justify-center gap-3 text-slate-600 hover:text-bar-accent"
        >
           <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800">
              <Plus size={24} />
           </div>
           <span className="font-black text-[10px] uppercase tracking-widest">Ajouter Table</span>
        </button>
      </div>

      {/* Reservation Modal */}
      {reservationModalTable && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in duration-300">
              <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 italic">
                 <CalendarCheck className="text-amber-500" /> RÉSERVATION
              </h2>
              <div className="mb-6 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                 <p className="text-[10px] font-black text-slate-600 uppercase mb-1">Table sélectionnée</p>
                 <p className="text-xl font-black text-white">{reservationModalTable.name} ({reservationModalTable.zone})</p>
              </div>
              <div className="space-y-4 mb-8">
                 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Note (Nom, Heure, Couverts)</label>
                 <input 
                   type="text" 
                   value={resNote} 
                   onChange={(e) => setResNote(e.target.value)}
                   className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                   placeholder="Ex: Dupont - 20h30 - 4 pers."
                   autoFocus
                 />
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setReservationModalTable(null)} className="flex-1 py-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Annuler</button>
                 <button onClick={submitReservation} className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-amber-900/20 transition-all">Confirmer</button>
              </div>
           </div>
        </div>
      )}

      {/* New Table Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in duration-300">
              <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 italic">
                 <Plus className="text-bar-accent" /> NOUVELLE TABLE
              </h2>
              <form onSubmit={handleAddTable} className="space-y-5">
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Nom / Numéro</label>
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-bar-accent outline-none font-bold" autoFocus placeholder="Ex: T5, VIP-2..." />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Zone de salle</label>
                    <select 
                        value={newZone} 
                        onChange={e => setNewZone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-bar-accent outline-none font-bold appearance-none"
                    >
                        {zones.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Annuler</button>
                    <button type="submit" className="flex-1 py-4 bg-bar-accent hover:bg-pink-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-bar-accent/20">Créer</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
