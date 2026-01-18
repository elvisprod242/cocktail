import React, { useState } from 'react';
import { Order, OrderStatus, PaymentMethod, Client } from '../types';
import { CheckCircle, Clock, Bell, Wallet, CreditCard, Banknote, Smartphone, Calculator, X, User, Printer, ArrowRight, ArrowDown } from 'lucide-react';
import { processOrderPayment, updateOrderStatusInDB, getSetting } from '../services/db';
import { Receipt } from '../components/Receipt';

interface KitchenProps {
  orders: Order[];
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  clients: Client[];
}

export const Kitchen: React.FC<KitchenProps> = ({ orders, updateOrderStatus, clients }) => {
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [successPaymentOrder, setSuccessPaymentOrder] = useState<Order | null>(null);
  const activeOrders = orders.filter(o => o.status !== OrderStatus.PAID).sort((a, b) => b.timestamp - a.timestamp);
  const currency = getSetting('currency', '€');

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-amber-500/20 text-amber-500 border-amber-500/50';
      case OrderStatus.READY: return 'bg-green-500/20 text-green-500 border-green-500/50';
      case OrderStatus.SERVED: return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
      default: return 'bg-slate-700 text-slate-400';
    }
  };

  const PaymentModal = () => {
    const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const [cashGiven, setCashGiven] = useState<string>('');
    const [step, setStep] = useState<'payment' | 'success'>('payment');
    
    // Safety check
    if (!payingOrder && !successPaymentOrder) return null;

    const changeDue = payingOrder && cashGiven ? parseFloat(cashGiven) - payingOrder.total : 0;
    
    // Find client for Tab calculation
    const currentClient = payingOrder ? clients.find(c => c.id === payingOrder.clientId) : null;

    const handlePayment = () => {
        if (!payingOrder) return;
        
        // Update DB
        processOrderPayment(payingOrder.id, method, payingOrder.total, payingOrder.clientId);
        
        // Update UI locally
        updateOrderStatus(payingOrder.id, OrderStatus.PAID);
        
        // Update local object for receipt and persistence in success view
        const updatedOrder = { ...payingOrder, paymentMethod: method, status: OrderStatus.PAID };
        setSuccessPaymentOrder(updatedOrder);
        setPayingOrder(null); 
        setStep('success'); 
    };

    const handlePrint = () => {
        window.print();
    };

    const handleClose = () => {
        setPayingOrder(null);
        setSuccessPaymentOrder(null);
        setStep('payment');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`bg-slate-900 border border-slate-800 w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all max-w-5xl max-h-[95vh]`}>
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {step === 'payment' ? <Wallet className="text-bar-accent" /> : <CheckCircle className="text-green-500" />}
                        {step === 'payment' ? `Encaissement Table ${payingOrder?.tableNumber}` : 'Paiement Réussi'}
                    </h2>
                    <button onClick={handleClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
                </div>

                <div className="p-6 overflow-hidden flex-1 flex flex-col">
                    
                    {step === 'payment' && payingOrder ? (
                        <div className="flex flex-col md:flex-row gap-8 h-full overflow-hidden">
                            {/* LEFT: Receipt Preview (Desktop only) */}
                            <div className="hidden md:flex w-[320px] bg-slate-950 rounded-xl border border-slate-800 flex-col shrink-0 overflow-hidden shadow-inner">
                                <div className="p-3 bg-slate-800/50 border-b border-slate-800 text-center">
                                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                        <Printer size={12} /> Aperçu du Ticket
                                     </span>
                                 </div>
                                 <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-white/5 scrollbar-thin scrollbar-thumb-slate-700">
                                     <div className="scale-[0.85] origin-top text-black shadow-xl">
                                         <Receipt order={{...payingOrder, paymentMethod: method, status: OrderStatus.PAID}} currency={currency} />
                                     </div>
                                 </div>
                            </div>

                            {/* RIGHT: Payment Controls */}
                            <div className="flex-1 flex flex-col overflow-y-auto pr-1">
                                <div className="flex justify-between items-center mb-6 bg-slate-800/50 p-4 rounded-xl border border-slate-800 shrink-0">
                                    <span className="text-slate-400 text-lg">Total à payer</span>
                                    <span className="text-4xl font-bold text-white">{payingOrder.total.toFixed(2)}{currency}</span>
                                </div>

                                {/* Method Selection */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 shrink-0">
                                    <button onClick={() => setMethod(PaymentMethod.CASH)} className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${method === PaymentMethod.CASH ? 'bg-green-600 border-green-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                                        <Banknote size={24} className="mb-1" />
                                        <span className="text-xs font-bold">Espèces</span>
                                    </button>
                                    <button onClick={() => setMethod(PaymentMethod.MOBILE_MONEY)} className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${method === PaymentMethod.MOBILE_MONEY ? 'bg-orange-600 border-orange-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                                        <Smartphone size={24} className="mb-1" />
                                        <span className="text-xs font-bold">Mobile</span>
                                    </button>
                                    <button onClick={() => setMethod(PaymentMethod.CARD)} className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${method === PaymentMethod.CARD ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                                        <CreditCard size={24} className="mb-1" />
                                        <span className="text-xs font-bold">Carte</span>
                                    </button>
                                    <button onClick={() => setMethod(PaymentMethod.TAB)} disabled={!payingOrder.clientId} className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${method === PaymentMethod.TAB ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'} ${!payingOrder.clientId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        <User size={24} className="mb-1" />
                                        <span className="text-xs font-bold">Ardoise</span>
                                    </button>
                                </div>

                                {/* Dynamic Content based on Method */}
                                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 mb-6 min-h-[120px] shrink-0">
                                    {method === PaymentMethod.CASH && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-slate-400 text-sm mb-1">Montant perçu</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number" 
                                                        value={cashGiven}
                                                        onChange={(e) => setCashGiven(e.target.value)}
                                                        placeholder="Ex: 50"
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-lg font-bold focus:border-green-500 outline-none"
                                                        autoFocus
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">{currency}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                                                <span className="text-slate-400">À rendre</span>
                                                <span className={`text-2xl font-bold ${changeDue < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                    {Math.max(0, changeDue).toFixed(2)}{currency}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {method === PaymentMethod.MOBILE_MONEY && (
                                        <div className="text-center py-4">
                                            <Smartphone size={48} className="mx-auto text-orange-500 mb-3" />
                                            <p className="text-white font-medium">En attente de confirmation Mobile Money...</p>
                                            <p className="text-sm text-slate-400 mt-1">Vérifiez le terminal ou le téléphone.</p>
                                        </div>
                                    )}

                                    {method === PaymentMethod.TAB && (
                                        <div className="text-center py-2">
                                            {currentClient ? (
                                                <div className="w-full">
                                                    <div className="bg-purple-500/10 p-2 rounded-full inline-block mb-1">
                                                        <User size={24} className="text-purple-500" />
                                                    </div>
                                                    <h3 className="text-white font-bold text-lg mb-4">{payingOrder.clientName}</h3>
                                                    
                                                    <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 max-w-md mx-auto">
                                                        {/* Solde Actuel */}
                                                        <div className="flex justify-between items-center text-sm mb-2 text-slate-400">
                                                            <span>Total Ardoise Actuel:</span>
                                                            <span className={currentClient.balance < 0 ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
                                                                {(-currentClient.balance).toFixed(2)}{currency}
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Ajout Commande */}
                                                        <div className="flex justify-between items-center text-sm mb-2 text-slate-300 pb-2 border-b border-slate-800">
                                                            <span>+ Cette commande:</span>
                                                            <span className="font-bold">{payingOrder.total.toFixed(2)}{currency}</span>
                                                        </div>

                                                        {/* Nouveau Solde */}
                                                        <div className="flex justify-between items-center text-base pt-1">
                                                            <span className="text-white font-bold">Nouveau Total Ardoise:</span>
                                                            <span className="text-red-500 font-extrabold text-xl">
                                                                {(-(currentClient.balance - payingOrder.total)).toFixed(2)}{currency}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-3">Le montant sera ajouté à la dette du client.</p>
                                                </div>
                                            ) : (
                                                <p className="text-red-400">Erreur : Client introuvable</p>
                                            )}
                                        </div>
                                    )}
                                    
                                    {method === PaymentMethod.CARD && (
                                        <div className="text-center py-4">
                                            <CreditCard size={48} className="mx-auto text-blue-500 mb-3" />
                                            <p className="text-white font-medium">Utilisez le TPE pour encaisser.</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex-1"></div>

                                <button 
                                    onClick={handlePayment}
                                    disabled={method === PaymentMethod.CASH && changeDue < 0}
                                    className="w-full py-4 bg-bar-accent hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-bar-accent/20 transition-all flex items-center justify-center gap-2 shrink-0"
                                >
                                    <CheckCircle size={20} />
                                    Valider l'encaissement
                                </button>
                            </div>
                        </div>
                    ) : (
                        // SUCCESS VIEW
                        <div className="flex flex-col items-center justify-center h-full py-8 space-y-6 animate-in slide-in-from-right duration-300">
                            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 animate-in zoom-in duration-500 delay-100">
                                <CheckCircle size={48} className="text-white" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-3xl font-bold text-white mb-2">Paiement Validé !</h3>
                                <p className="text-slate-400 text-lg">Le ticket est prêt à l'impression.</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mt-4">
                                <button 
                                    onClick={handlePrint}
                                    className="flex-1 py-4 bg-white hover:bg-slate-200 text-slate-900 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Printer size={20} />
                                    Imprimer
                                </button>
                                <button 
                                    onClick={handleClose}
                                    className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl shadow-lg border border-slate-700 flex items-center justify-center gap-2 transition-colors"
                                >
                                    Fermer
                                    <ArrowRight size={20} />
                                </button>
                            </div>

                            {/* Hidden receipt for printing */}
                            <div className="fixed top-0 left-0 -left-[9999px] opacity-0 pointer-events-none">
                                {successPaymentOrder && <Receipt order={successPaymentOrder} currency={currency} />}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
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
                {order.clientName && (
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 text-sm text-blue-400">
                        <User size={14} />
                        Client: <span className="font-bold">{order.clientName}</span>
                    </div>
                )}
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
                    onClick={() => setPayingOrder(order)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                   >
                     <Calculator size={18} />
                     Encaisser
                   </button>
                 )}
              </div>
            </div>
          ))
        )}
      </div>

      {(payingOrder || successPaymentOrder) && <PaymentModal />}
    </div>
  );
};