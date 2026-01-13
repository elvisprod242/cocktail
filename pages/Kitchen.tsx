import React from 'react';
import { Order, OrderStatus } from '../types';
import { CheckCircle, Clock, Bell } from 'lucide-react';

interface KitchenProps {
  orders: Order[];
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

export const Kitchen: React.FC<KitchenProps> = ({ orders, updateOrderStatus }) => {
  const activeOrders = orders.filter(o => o.status !== OrderStatus.PAID).sort((a, b) => b.timestamp - a.timestamp);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-amber-500/20 text-amber-500 border-amber-500/50';
      case OrderStatus.READY: return 'bg-green-500/20 text-green-500 border-green-500/50';
      case OrderStatus.SERVED: return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
      default: return 'bg-slate-700 text-slate-400';
    }
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-950">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Bell className="text-bar-accent" />
          Commandes en Cuisine
        </h1>
        <div className="bg-slate-800 px-4 py-2 rounded-lg text-slate-300">
          En cours: <span className="font-bold text-white ml-2">{activeOrders.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24 md:pb-0">
        {activeOrders.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl">
            <CheckCircle size={64} className="mb-4 opacity-50" />
            <p className="text-xl font-medium">Tout est calme en cuisine !</p>
          </div>
        ) : (
          activeOrders.map(order => (
            <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-lg animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm text-slate-400">Table</span>
                  <span className="text-xl font-bold text-white">#{order.tableNumber || '?'}</span>
                </div>
                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
                     <Clock size={12} />
                     {new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </div>
                   <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(order.status)}`}>
                     {order.status}
                   </span>
                </div>
              </div>

              <div className="p-4 flex-1">
                <ul className="space-y-3">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <span className="bg-slate-700 text-white w-6 h-6 flex items-center justify-center rounded text-sm font-bold flex-shrink-0">
                          {item.quantity}
                        </span>
                        <span className="text-slate-200 font-medium">{item.name}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-slate-800/30 border-t border-slate-800">
                 {order.status === OrderStatus.PENDING && (
                   <button 
                    onClick={() => updateOrderStatus(order.id, OrderStatus.READY)}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors"
                   >
                     Marquer Prêt
                   </button>
                 )}
                 {order.status === OrderStatus.READY && (
                   <button 
                    onClick={() => updateOrderStatus(order.id, OrderStatus.SERVED)}
                    className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors"
                   >
                     Marquer Servi
                   </button>
                 )}
                 {order.status === OrderStatus.SERVED && (
                   <button 
                    onClick={() => updateOrderStatus(order.id, OrderStatus.PAID)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
                   >
                     Encaisser
                   </button>
                 )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};