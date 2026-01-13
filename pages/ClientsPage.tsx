import React, { useState } from 'react';
import { Client, Order } from '../types';
import { addClient, updateClient, deleteClient } from '../services/db';
import { Users, Plus, Search, Phone, Mail, Award, Edit2, Trash2, X, History, ShoppingBag, Wallet } from 'lucide-react';

interface ClientsPageProps {
  clients: Client[];
  refreshData: () => void;
  currency: string;
  orders: Order[];
}

export const ClientsPage: React.FC<ClientsPageProps> = ({ clients, refreshData, currency, orders }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingHistory, setViewingHistory] = useState<Client | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setName(client.name);
      setPhone(client.phone || '');
      setEmail(client.email || '');
      setNotes(client.notes || '');
    } else {
      setEditingClient(null);
      setName('');
      setPhone('');
      setEmail('');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingClient) {
      const updated: Client = {
        ...editingClient,
        name,
        phone,
        email,
        notes
      };
      updateClient(updated);
    } else {
      const newClient: Client = {
        id: `cli_${Date.now()}`,
        name,
        phone,
        email,
        notes,
        loyaltyPoints: 0,
        totalSpent: 0,
        balance: 0,
        lastVisit: Date.now()
      };
      addClient(newClient);
    }
    refreshData();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer ce client ? Ses statistiques seront perdues.')) {
      deleteClient(id);
      refreshData();
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone?.includes(searchQuery)
  );

  const getClientOrders = (clientId: string) => {
      return orders.filter(o => o.clientId === clientId).sort((a,b) => b.timestamp - a.timestamp);
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-950">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="text-bar-accent" />
            Gestion Clients
          </h1>
          <p className="text-slate-400 mt-1">Fidélisation et gestion des ardoises</p>
        </div>
        
        <button 
          onClick={() => openModal()}
          className="bg-bar-accent hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-bar-accent/25"
        >
          <Plus size={20} />
          Nouveau Client
        </button>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Rechercher par nom ou téléphone..." 
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-bar-accent placeholder-slate-500 outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24 md:pb-0">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg group hover:border-slate-700 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 font-bold text-xl">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex gap-2">
                 <button onClick={() => setViewingHistory(client)} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Historique">
                    <History size={16} />
                 </button>
                 <button onClick={() => openModal(client)} className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Modifier">
                    <Edit2 size={16} />
                 </button>
                 <button onClick={() => handleDelete(client.id)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Supprimer">
                    <Trash2 size={16} />
                 </button>
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">{client.name}</h3>
            
            <div className="space-y-2 mb-4">
              {client.phone && <p className="text-sm text-slate-400 flex items-center gap-2"><Phone size={14} /> {client.phone}</p>}
              {client.email && <p className="text-sm text-slate-400 flex items-center gap-2"><Mail size={14} /> {client.email}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Fidélité</p>
                  <p className="text-bar-accent font-bold flex items-center gap-1 text-sm">
                    <Award size={14} /> {client.loyaltyPoints} pts
                  </p>
               </div>
               <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Total Dépensé</p>
                  <p className="text-white font-bold text-sm">{client.totalSpent.toFixed(2)}{currency}</p>
               </div>
            </div>

            {/* Ardoise Section */}
            <div className={`rounded-lg p-3 flex justify-between items-center border ${client.balance < 0 ? 'bg-red-900/10 border-red-900/30' : 'bg-slate-800/30 border-slate-800'}`}>
               <div className="flex items-center gap-2">
                  <Wallet size={16} className={client.balance < 0 ? 'text-red-500' : 'text-green-500'} />
                  <span className="text-sm text-slate-400">Ardoise / Solde</span>
               </div>
               <span className={`font-bold ${client.balance < 0 ? 'text-red-500' : 'text-green-500'}`}>
                 {client.balance < 0 ? '' : '+'}{client.balance.toFixed(2)}{currency}
               </span>
            </div>

            {client.notes && (
                <div className="mt-3 p-2 bg-yellow-500/5 rounded text-xs text-yellow-500/80 border border-yellow-500/10">
                    {client.notes}
                </div>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingClient ? 'Modifier Client' : 'Nouveau Client'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Nom Complet</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-bar-accent outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-1">Téléphone</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-bar-accent outline-none" />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-1">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-bar-accent outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Notes (Préférences, Allergies...)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-bar-accent outline-none h-24" />
              </div>
              <button type="submit" className="w-full py-3 rounded-xl bg-bar-accent text-white font-bold hover:bg-pink-600 shadow-lg shadow-bar-accent/20">
                {editingClient ? 'Enregistrer' : 'Créer Client'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {viewingHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ShoppingBag className="text-bar-accent" />
                        Historique - {viewingHistory.name}
                    </h2>
                    <button onClick={() => setViewingHistory(null)} className="text-slate-400 hover:text-white"><X size={24} /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {getClientOrders(viewingHistory.id).length === 0 ? (
                        <div className="text-center text-slate-500 py-10">Aucune commande trouvée.</div>
                    ) : (
                        <div className="space-y-4">
                            {getClientOrders(viewingHistory.id).map(order => (
                                <div key={order.id} className="bg-slate-800/50 border border-slate-800 p-4 rounded-xl">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="text-sm text-slate-400">
                                            {new Date(order.timestamp).toLocaleDateString()} à {new Date(order.timestamp).toLocaleTimeString()}
                                        </div>
                                        <div className="font-bold text-white text-lg">{order.total.toFixed(2)}{currency}</div>
                                    </div>
                                    <ul className="text-sm text-slate-300 pl-4 border-l-2 border-slate-700">
                                        {order.items.map((item, idx) => (
                                            <li key={idx} className="flex justify-between">
                                                <span>{item.quantity}x {item.name}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
          </div>
      )}
    </div>
  );
};