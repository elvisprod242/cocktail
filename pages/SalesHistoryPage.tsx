import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, PaymentMethod } from '../types';
import { Receipt } from '../components/Receipt';
import { History, Search, Printer, Calendar, Filter, FileText, ArrowUpRight, Eye, X, CalendarRange, ChevronDown } from 'lucide-react';

interface SalesHistoryPageProps {
  orders: Order[];
  currency: string;
}

type DateFilterType = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

export const SalesHistoryPage: React.FC<SalesHistoryPageProps> = ({ orders, currency }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Search Filter
      const matchesSearch = 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.tableName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Status Filter
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

      // 3. Date Filter
      let matchesDate = true;
      const orderDate = new Date(order.timestamp);
      const now = new Date();

      if (dateFilter === 'TODAY') {
        matchesDate = orderDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'WEEK') {
        // Start of current week (Monday)
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay(); // 0 (Sun) to 6 (Sat)
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        matchesDate = orderDate >= startOfWeek;
      } else if (dateFilter === 'MONTH') {
        matchesDate = 
          orderDate.getMonth() === now.getMonth() && 
          orderDate.getFullYear() === now.getFullYear();
      } else if (dateFilter === 'CUSTOM' && customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = orderDate >= start && orderDate <= end;
      }

      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => b.timestamp - a.timestamp); // Most recent first
  }, [orders, searchQuery, statusFilter, dateFilter, customStartDate, customEndDate]);

  const handlePrint = (order: Order) => {
    if (!showPreview) {
        setSelectedOrder(order);
    }
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePreview = (order: Order) => {
      setSelectedOrder(order);
      setShowPreview(true);
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
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <History className="text-bar-accent" />
            Historique Ventes
          </h1>
          <p className="text-slate-400 mt-1">Consultez et réimprimez vos tickets</p>
        </div>
        
        <div className="flex gap-4 items-center bg-slate-900 p-3 rounded-xl border border-slate-800 w-full md:w-auto justify-between md:justify-end">
           <span className="text-sm text-slate-400 md:hidden">Total période</span>
           <div className="text-right px-2">
              <p className="hidden md:block text-xs text-slate-400">Total Affiché</p>
              <p className="font-bold text-white text-lg">
                {filteredOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}{currency}
              </p>
           </div>
        </div>
      </div>

      {/* Control Bar (Filters & Search) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 sticky top-0 z-10 shadow-lg md:static md:shadow-none space-y-4">
         
         {/* Top Row: Search & Period */}
         <div className="flex flex-col md:flex-row gap-4">
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
            
            {/* Period Select */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
                <CalendarRange size={18} className="text-slate-400" />
                <select 
                    value={dateFilter} 
                    onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
                    className="bg-transparent text-white text-sm font-medium outline-none cursor-pointer"
                >
                    <option value="ALL">Toute période</option>
                    <option value="TODAY">Aujourd'hui</option>
                    <option value="WEEK">Cette Semaine</option>
                    <option value="MONTH">Ce Mois</option>
                    <option value="CUSTOM">Personnalisé</option>
                </select>
                <ChevronDown size={14} className="text-slate-500" />
            </div>
         </div>

         {/* Second Row: Custom Dates & Status Tabs */}
         <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
             
             {/* Custom Date Inputs */}
             {dateFilter === 'CUSTOM' && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 w-full md:w-auto">
                    <input 
                        type="date" 
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-bar-accent"
                    />
                    <span className="text-slate-500">-</span>
                    <input 
                        type="date" 
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-bar-accent"
                    />
                </div>
             )}

             {/* Status Tabs */}
             <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
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
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex-1 shadow-lg">
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
                       <div className="flex justify-center gap-2">
                            <button 
                                onClick={() => handlePreview(order)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 shadow-sm"
                                title="Aperçu Reçu"
                            >
                                <Eye size={18} />
                            </button>
                            <button 
                                onClick={() => handlePrint(order)}
                                className="p-2 bg-slate-800 hover:bg-bar-accent hover:text-white text-slate-400 rounded-lg transition-colors border border-slate-700 hover:border-bar-accent shadow-sm"
                                title="Imprimer Reçu"
                            >
                                <Printer size={18} />
                            </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-4 pb-24">
        {filteredOrders.length === 0 ? (
             <div className="p-8 text-center text-slate-500 border border-slate-800 rounded-xl bg-slate-900">
                 Aucune commande trouvée.
             </div>
          ) : (
            filteredOrders.map(order => (
                <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md active:scale-[0.99] transition-transform">
                    <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-800">
                        <div>
                             <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">#{order.id.slice(0,6)}</span>
                                <span className="text-xs text-slate-400">{new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-lg">Table {order.tableName}</span>
                                {order.clientName && (
                                    <span className="text-xs bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">{order.clientName}</span>
                                )}
                             </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                             <span className="font-bold text-white text-xl">{order.total.toFixed(2)}{currency}</span>
                             <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getStatusColor(order.status)}`}>
                                {order.status}
                             </span>
                        </div>
                    </div>
                    
                    <div className="mb-4">
                        <div className="text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">Articles</div>
                        <div className="flex flex-wrap gap-1.5">
                            {order.items.slice(0, 5).map((item, i) => (
                                <span key={i} className="bg-slate-950 px-2 py-1 rounded text-xs text-slate-300 border border-slate-800">
                                    <span className="text-bar-accent font-bold mr-1">{item.quantity}</span> 
                                    {item.name}
                                </span>
                            ))}
                            {order.items.length > 5 && (
                                <span className="text-xs text-slate-500 self-center pl-1">+{order.items.length - 5} autres...</span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                            <PaymentMethodIcon method={order.paymentMethod} />
                            {order.paymentMethod || 'Non payé'}
                        </span>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => handlePreview(order)}
                                className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium border border-slate-700"
                             >
                                <Eye size={16} /> Aperçu
                             </button>
                             <button 
                                onClick={() => handlePrint(order)}
                                className="flex items-center gap-1 px-3 py-2 bg-bar-accent/10 hover:bg-bar-accent text-bar-accent hover:text-white rounded-lg text-sm font-medium border border-bar-accent/50 transition-colors"
                             >
                                <Printer size={16} /> Imprimer
                             </button>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <Eye size={20} className="text-bar-accent" />
                          Aperçu du Ticket
                      </h2>
                      <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-white bg-slate-800 p-1 rounded-full"><X size={20} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-950 flex justify-center">
                      <div className="transform scale-100 origin-top shadow-2xl">
                          <Receipt order={selectedOrder} currency={currency} />
                      </div>
                  </div>
                  <div className="p-4 bg-slate-900 border-t border-slate-800">
                      <button 
                        onClick={() => handlePrint(selectedOrder)}
                        className="w-full py-3 bg-bar-accent hover:bg-pink-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <Printer size={20} />
                        Lancer l'impression
                      </button>
                  </div>
              </div>
          </div>
      )}
      
      {/* Hidden Receipt Component for Direct Printing */}
      {!showPreview && selectedOrder && (
        <div className="fixed top-0 left-0 -left-[9999px] opacity-0 pointer-events-none">
           <Receipt order={selectedOrder} currency={currency} />
        </div>
      )}
    </div>
  );
};

// Helper component for payment icon
const PaymentMethodIcon = ({ method }: { method?: string }) => {
    if (!method) return null;
    return (
        <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />
    );
};