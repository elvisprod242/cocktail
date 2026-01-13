import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, PaymentMethod } from '../types';
import { Receipt } from '../components/Receipt';
import { History, Search, Printer, Calendar, Filter, FileText, ArrowUpRight } from 'lucide-react';

interface SalesHistoryPageProps {
  orders: Order[];
  currency: string;
}

export const SalesHistoryPage: React.FC<SalesHistoryPageProps> = ({ orders, currency }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.tableName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => b.timestamp - a.timestamp); // Most recent first
  }, [orders, searchQuery, statusFilter]);

  const handlePrint = (order: Order) => {
    setSelectedOrder(order);
    // Petit délai pour laisser le temps au composant Receipt de se rendre
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PAID: return 'text-green-400 bg-green-400/10 border-green-400/20';
      case OrderStatus.SERVED: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case OrderStatus.PENDING: return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <History className="text-bar-accent" />
            Historique des Ventes
          </h1>
          <p className="text-slate-400 mt-1">Consultez et réimprimez vos tickets</p>
        </div>
        
        <div className="flex gap-4 items-center bg-slate-900 p-2 rounded-xl border border-slate-800">
           <div className="text-right px-2">
              <p className="text-xs text-slate-400">Total Affiché</p>
              <p className="font-bold text-white text-lg">
                {filteredOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}{currency}
              </p>
           </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher (Table, Client, ID)..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-bar-accent outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Filter size={18} className="text-slate-400 min-w-[18px]" />
            <button 
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === 'ALL' ? 'bg-bar-accent text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              Tous
            </button>
            <button 
              onClick={() => setStatusFilter(OrderStatus.PAID)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === OrderStatus.PAID ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              Payés
            </button>
            <button 
              onClick={() => setStatusFilter(OrderStatus.PENDING)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === OrderStatus.PENDING ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              En cours
            </button>
         </div>
      </div>

      {/* Table List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex-1 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-800/50 text-slate-200 uppercase font-medium">
              <tr>
                <th className="p-4">ID / Date</th>
                <th className="p-4">Table & Client</th>
                <th className="p-4">Contenu</th>
                <th className="p-4 text-right">Montant</th>
                <th className="p-4">Paiement</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                   <td colSpan={7} className="p-8 text-center text-slate-500">Aucune commande trouvée pour cette recherche.</td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-mono text-xs text-slate-500 mb-1">#{order.id.slice(0,8)}</div>
                      <div className="text-white flex items-center gap-1">
                        <Calendar size={12} className="text-bar-accent" />
                        {new Date(order.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-xs ml-4">{new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white text-base">Table {order.tableName}</div>
                      {order.clientName && (
                        <div className="text-xs text-blue-400 flex items-center gap-1 mt-1">
                          <ArrowUpRight size={10} /> {order.clientName}
                        </div>
                      )}
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {order.items.slice(0, 3).map((item, i) => (
                           <span key={i} className="bg-slate-800 px-2 py-0.5 rounded text-xs text-slate-300 border border-slate-700">
                             {item.quantity}x {item.name}
                           </span>
                        ))}
                        {order.items.length > 3 && (
                           <span className="text-xs text-slate-500 self-center">+{order.items.length - 3} autres</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                       <span className="font-bold text-white text-lg">{order.total.toFixed(2)}{currency}</span>
                    </td>
                    <td className="p-4">
                       <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{order.paymentMethod || '-'}</span>
                       </div>
                    </td>
                    <td className="p-4 text-center">
                       <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(order.status)}`}>
                         {order.status}
                       </span>
                    </td>
                    <td className="p-4 text-center">
                       <button 
                         onClick={() => handlePrint(order)}
                         className="p-2 bg-slate-800 hover:bg-bar-accent hover:text-white text-slate-400 rounded-lg transition-colors border border-slate-700 hover:border-bar-accent shadow-sm"
                         title="Imprimer Reçu"
                       >
                         <Printer size={18} />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Hidden Receipt Component for Printing */}
      {selectedOrder && (
        <div className="fixed top-0 left-0 -left-[9999px] opacity-0 pointer-events-none">
           <Receipt order={selectedOrder} currency={currency} />
        </div>
      )}
    </div>
  );
};