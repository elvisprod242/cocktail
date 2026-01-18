
import React, { useState, useMemo } from 'react';
import { Client, Order, PaymentMethod, CartItem } from '../types';
import { addClient, updateClient, deleteClient, updateClientBalance } from '../services/db';
import { Users, Plus, Search, Phone, Mail, Award, Edit2, Trash2, X, History, ShoppingBag, Wallet, AlertCircle, Calculator, AlertTriangle, TrendingUp, Star, Calendar, ArrowRight, Beer } from 'lucide-react';

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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [balanceModalClient, setBalanceModalClient] = useState<Client | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');

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

  const openBalanceModal = (client: Client) => {
    setBalanceModalClient(client);
    setBalanceAmount('');
  };

  const handleBalanceUpdate = () => {
      if (!balanceModalClient || !balanceAmount) return;
      const amount = parseFloat(balanceAmount);
      if (isNaN(amount) || amount === 0) return;
      updateClientBalance(balanceModalClient.id, amount);
      refreshData();
      setBalanceModalClient(null);
  };

  const handleSettleDebt = () => {
      if (!balanceModalClient) return;
      updateClientBalance(balanceModalClient.id, Math.abs(balanceModalClient.balance));
      refreshData();
      setBalanceModalClient(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    if (editingClient) {
      updateClient({ ...editingClient, name, phone, email, notes });
    } else {
      addClient({ id: `cli_${Date.now()}`, name, phone, email, notes, loyaltyPoints: 0, totalSpent: 0, balance: 0, lastVisit: Date.now() });
    }
    refreshData();
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteClient(deleteConfirmId);
      refreshData();
      setDeleteConfirmId(null);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone?.includes(searchQuery)
  );

  // Fix: Added currentDebt calculation to the stats object to resolve build error in balance modal
  const getClientStats = (client: Client) => {
    const clientOrders = orders.filter(o => o.clientId === client.id).sort((a,b) => b.timestamp - a.timestamp);
    const tabOrders = clientOrders.filter(o => o.paymentMethod === PaymentMethod.TAB);
    
    // Favorite products analysis
    const productCounts: Record<string, number> = {};
    clientOrders.forEach(o => {
        o.items.forEach(item => {
            productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
        });
    });
    const favorites = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    const avgBasket = clientOrders.length > 0 ? client.totalSpent / clientOrders.length : 0;
    
    let status = { label: 'Nouveau', color: 'bg-slate-700 text-slate-300' };
    if (client.loyaltyPoints > 500 || client.totalSpent > 1000) status = { label: 'V.I.P', color: 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' };
    else if (clientOrders.length > 5) status = { label: 'Habitué', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' };

    return { clientOrders, tabOrders, favorites, avgBasket, status, currentDebt: -client.balance };
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-950 no-scrollbar">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Users className="text-bar-accent" />Gestion Clients</h1>
          <p className="text-slate-400 mt-1">Fidélisation, ardoises et statistiques de consommation</p>
        </div>
        <button onClick={() => openModal()} className="bg-bar-accent hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-bar-accent/25 w-full md:w-auto justify-center">
          <Plus size={20} />Nouveau Client
        </button>
      </div>

      <div className="relative max-w-md mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input type="text" placeholder="Rechercher par nom ou téléphone..." className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-bar-accent outline-none shadow-inner" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24 md:pb-0">
        {filteredClients.map(client => {
          const { status } = getClientStats(client);
          return (
            <div key={client.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg group hover:border-slate-700 transition-all flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-bar-accent font-black text-2xl border border-slate-700 shadow-xl group-hover:scale-110 transition-transform">
                    {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${status.color}`}>
                        {status.label}
                    </span>
                    <div className="flex gap-1">
                        <button onClick={() => setViewingHistory(client)} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"><History size={16} /></button>
                        <button onClick={() => openModal(client)} className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => setDeleteConfirmId(client.id)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                </div>
              </div>
              
              <div className="mb-6 relative z-10">
                  <h3 className="text-xl font-bold text-white mb-1 truncate">{client.name}</h3>
                  <div className="space-y-1">
                      {client.phone && <p className="text-xs text-slate-500 flex items-center gap-2 truncate font-medium"><Phone size={12} className="text-slate-600" /> {client.phone}</p>}
                      {client.email && <p className="text-xs text-slate-500 flex items-center gap-2 truncate font-medium"><Mail size={12} className="text-slate-600" /> {client.email}</p>}
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5 relative z-10">
                <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-tight">Fidélité</p>
                    <p className="text-yellow-500 font-black flex items-center gap-1.5 text-sm"><Star size={14} fill="currentColor" /> {client.loyaltyPoints} <span className="text-[10px] text-slate-600 font-medium lowercase">pts</span></p>
                 </div>
                 <div className={`rounded-xl p-3 border ${client.balance < 0 ? 'bg-red-500/10 border-red-500/30 animate-pulse' : 'bg-slate-950/50 border-slate-800/50'}`}>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-tight">Ardoise</p>
                    <p className={`font-black text-sm ${client.balance < 0 ? 'text-red-500' : 'text-green-500'}`}>{(-client.balance).toFixed(2)}{currency}</p>
                 </div>
              </div>

              <div className={`mt-auto rounded-2xl p-4 border transition-all ${client.balance < 0 ? 'bg-red-950/20 border-red-500/30' : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/60'}`}>
                 <div className="flex justify-between items-center mb-4">
                     <div className="flex items-center gap-2 text-slate-400"><ShoppingBag size={14} /><span className="text-[10px] font-bold uppercase tracking-widest">Total Dépensé</span></div>
                     <span className="font-bold text-white">{client.totalSpent.toFixed(2)}{currency}</span>
                 </div>
                 <button onClick={() => openBalanceModal(client)} className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${client.balance < 0 ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}>
                   {client.balance < 0 ? 'Régler l\'ardoise' : 'Gérer l\'ardoise'}
                 </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: PROFILE & HISTORY (OPTIMIZED) */}
      {viewingHistory && (() => {
          const { clientOrders, favorites, avgBasket, status } = getClientStats(viewingHistory);
          return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
                <div className="p-6 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-bar-accent text-white rounded-2xl flex items-center justify-center font-black text-3xl shadow-lg">
                            {viewingHistory.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                {viewingHistory.name}
                                <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${status.color}`}>
                                    {status.label}
                                </span>
                            </h2>
                            <p className="text-slate-400 text-sm flex items-center gap-3 mt-1">
                                <span><Phone size={12} className="inline mr-1" /> {viewingHistory.phone || 'Non renseigné'}</span>
                                <span><Calendar size={12} className="inline mr-1" /> Client depuis le {new Date(viewingHistory.lastVisit || Date.now()).toLocaleDateString()}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setViewingHistory(null)} className="p-3 bg-slate-900 text-slate-400 hover:text-white rounded-full transition-colors"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* LEFT PANEL: STATS & INFO */}
                    <div className="w-full lg:w-80 bg-slate-900/50 border-r border-slate-800 p-6 overflow-y-auto custom-scrollbar">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Tableau de Bord</h4>
                        
                        <div className="space-y-6">
                            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                                <p className="text-xs text-slate-500 mb-1">Panier Moyen</p>
                                <p className="text-xl font-black text-white">{avgBasket.toFixed(2)}{currency}</p>
                                <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-bar-accent" style={{ width: '65%' }}></div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                                <p className="text-xs text-slate-500 mb-3">Produits Favoris</p>
                                <div className="space-y-3">
                                    {favorites.map(([name, qty]) => (
                                        <div key={name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center"><Beer size={12} className="text-bar-accent" /></div>
                                                <span className="text-xs text-slate-300 font-medium truncate max-w-[120px]">{name}</span>
                                            </div>
                                            <span className="text-[10px] font-black bg-slate-800 px-2 py-0.5 rounded text-slate-400">x{qty}</span>
                                        </div>
                                    ))}
                                    {favorites.length === 0 && <p className="text-xs text-slate-600 italic">Aucune donnée</p>}
                                </div>
                            </div>

                            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                                <p className="text-xs text-slate-500 mb-1">Fidélité & Points</p>
                                <p className="text-xl font-black text-yellow-500">{viewingHistory.loyaltyPoints} <span className="text-[10px] font-medium text-slate-500">pts</span></p>
                                <p className="text-[10px] text-slate-600 mt-2 font-medium">Équivalent à {(viewingHistory.loyaltyPoints / 10).toFixed(2)}{currency} de réduction</p>
                            </div>

                            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                                <p className="text-xs text-slate-500 mb-1">Dette Totale</p>
                                <p className={`text-xl font-black ${viewingHistory.balance < 0 ? 'text-red-500' : 'text-green-500'}`}>{(-viewingHistory.balance).toFixed(2)}{currency}</p>
                            </div>
                        </div>

                        {viewingHistory.notes && (
                            <div className="mt-8">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Notes Internes</h4>
                                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-xs text-amber-200/70 italic leading-relaxed">
                                    "{viewingHistory.notes}"
                                </div>
                            </div>
                        )}
                    </div>

                    {/* MAIN CONTENT: ORDERS LIST */}
                    <div className="flex-1 flex flex-col p-6 bg-slate-950/20">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2"><History size={20} className="text-bar-accent" /> Historique des commandes</h3>
                            <span className="text-xs text-slate-500 font-bold">{clientOrders.length} commande(s)</span>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-4">
                                {clientOrders.map(order => (
                                    <div key={order.id} className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4 hover:border-slate-700 transition-all group">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border ${order.paymentMethod === PaymentMethod.TAB ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
                                                    <span className="text-[10px] font-black">{new Date(order.timestamp).getDate()}</span>
                                                    <span className="text-[8px] font-bold uppercase">{new Date(order.timestamp).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-white text-sm">Table {order.tableName}</span>
                                                        <span className="text-[10px] font-mono text-slate-600 bg-black/30 px-1.5 py-0.5 rounded">#{order.id.slice(0, 8).toUpperCase()}</span>
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                        {order.items.map((item, i) => (
                                                            <span key={i} className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                                                <span className="text-bar-accent font-black mr-1">{item.quantity}</span> {item.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                                                <span className="font-black text-white text-xl">{order.total.toFixed(2)}{currency}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider ${order.paymentMethod === PaymentMethod.TAB ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                                    {order.paymentMethod === PaymentMethod.TAB ? 'Ardoise' : (order.paymentMethod || 'Payé')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {clientOrders.length === 0 && (
                                    <div className="h-64 flex flex-col items-center justify-center text-slate-600 italic border-2 border-dashed border-slate-800 rounded-3xl">
                                        <History size={48} className="mb-4 opacity-10" />
                                        <p>Aucune commande enregistrée pour ce client.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          );
      })()}

      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-1 rounded-full"><X size={20} /></button>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                {editingClient ? <Edit2 size={24} className="text-bar-accent" /> : <Plus size={24} className="text-bar-accent" />}
                {editingClient ? 'Modifier Client' : 'Nouveau Client'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Nom Complet</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:ring-2 focus:ring-bar-accent outline-none" placeholder="Ex: Jean Dupont" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Téléphone</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:ring-2 focus:ring-bar-accent outline-none" placeholder="+33..." />
                </div>
                <div>
                    <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:ring-2 focus:ring-bar-accent outline-none" placeholder="jean@mail.com" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Notes Internes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:ring-2 focus:ring-bar-accent outline-none h-24 no-scrollbar" placeholder="Allergies, boissons préférées, habitudes..." />
              </div>
              <div className="flex gap-3 pt-2">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-xl border border-slate-800 text-slate-400 font-bold hover:bg-slate-800 transition-colors">Annuler</button>
                 <button type="submit" className="flex-1 py-4 rounded-xl bg-bar-accent text-white font-bold hover:bg-pink-600 shadow-lg shadow-bar-accent/20 transition-all">
                    {editingClient ? 'Enregistrer' : 'Créer le profil'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {balanceModalClient && (() => {
          const { currentDebt } = getClientStats(balanceModalClient);
          return (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center"><h2 className="text-xl font-black text-white">Gestion Ardoise</h2><button onClick={() => setBalanceModalClient(null)} className="text-slate-400 hover:text-white bg-slate-900 p-1 rounded-full"><X size={24} /></button></div>
                <div className="p-8">
                    <div className="flex justify-between items-center mb-8 bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-inner">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center"><Wallet size={20} className="text-red-500" /></div>
                            <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">Dette Actuelle</span>
                        </div>
                        <span className={`text-3xl font-black ${balanceModalClient.balance < 0 ? 'text-red-500' : 'text-green-500'}`}>{currentDebt.toFixed(2)}{currency}</span>
                    </div>
                    
                    {balanceModalClient.balance < 0 && (
                        <button onClick={handleSettleDebt} className="w-full mb-8 py-4 px-6 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black uppercase tracking-wider flex items-center justify-between shadow-lg shadow-green-900/20 transition-all active:scale-95">
                            <span>Tout régler</span>
                            <span className="bg-black/20 px-3 py-1.5 rounded-xl text-sm">{Math.abs(balanceModalClient.balance).toFixed(2)}{currency}</span>
                        </button>
                    )}
                    
                    <div className="space-y-4 mb-8">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{balanceModalClient.balance < 0 ? 'Remboursement partiel' : 'Ajouter du crédit'}</label>
                        <div className="relative">
                            <input type="number" step="0.01" value={balanceAmount} onChange={(e) => setBalanceAmount(e.target.value)} placeholder="0.00" className="w-full bg-slate-950 border border-slate-700 rounded-2xl py-5 px-6 text-white font-black text-3xl focus:ring-2 focus:ring-bar-accent outline-none shadow-inner" autoFocus />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 font-black text-xl">{currency}</span>
                        </div>
                    </div>
                    <button onClick={handleBalanceUpdate} disabled={!balanceAmount} className="w-full py-5 bg-bar-accent hover:bg-pink-600 disabled:opacity-50 text-white font-black uppercase tracking-[0.1em] rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-bar-accent/20">
                        <Calculator size={24} />
                        Valider la transaction
                    </button>
                </div>
              </div>
            </div>
          );
      })()}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="bg-slate-900 border border-red-500/30 w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in duration-300">
              <div className="bg-red-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20"><AlertTriangle size={40} className="text-red-500" /></div>
              <h2 className="text-2xl font-black text-white mb-3">Supprimer ce client ?</h2>
              <p className="text-slate-400 mb-8 text-sm leading-relaxed">Cette action effacera définitivement ses points de fidélité et tout son historique de consommation.</p>
              <div className="flex gap-4">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-4 rounded-2xl border border-slate-700 text-slate-300 font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors">Annuler</button>
                <button onClick={confirmDelete} className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black uppercase text-xs tracking-widest hover:bg-red-500 transition-all shadow-lg shadow-red-600/20">Supprimer</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
