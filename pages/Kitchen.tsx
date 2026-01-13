import React, { useState } from 'react';
import { Order, OrderStatus, PaymentMethod } from '../types';
import { CheckCircle, Clock, Bell, Wallet, CreditCard, Banknote, Smartphone, Calculator, X, User, Printer, ArrowRight } from 'lucide-react';
import { processOrderPayment, updateOrderStatusInDB, getSetting } from '../services/db';
import { Receipt } from '../components/Receipt';

interface KitchenProps {
  orders: Order[];
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

export const Kitchen: React.FC<KitchenProps> = ({ orders, updateOrderStatus }) => {
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
    
    // Si on est en mode succès, on utilise successPaymentOrder, sinon payingOrder
    const currentOrder = step === 'success' ? successPaymentOrder : payingOrder;
    
    if (!currentOrder && !payingOrder) return null; // Safety check

    // Calcul du rendu monnaie (uniquement pertinent à l'étape paiement)
    const changeDue = payingOrder && cashGiven ? parseFloat(cashGiven) - payingOrder.total : 0;

    const handlePayment = () => {
        if (!payingOrder) return;
        
        // Update DB
        processOrderPayment(payingOrder.id, method, payingOrder.total, payingOrder.clientId);
        
        // Update UI locally
        updateOrderStatus(payingOrder.id, OrderStatus.PAID);
        
        // Update local object for receipt
        const updatedOrder = { ...payingOrder, paymentMethod: method, status: OrderStatus.PAID };
        setSuccessPaymentOrder(updatedOrder);
        setPayingOrder(null); // On efface la commande en cours de paiement
        setStep('success'); // On passe à l'écran de succès
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
            <div className={`bg-slate-900 border border-slate-800 w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all ${step === 'success' ? 'max-w-4xl max-h-[90vh]' : 'max-w-lg'}`}>
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {step === 'payment' ? <Wallet className="text-bar-accent" /> : <CheckCircle className="text-green-500" />}
                        {step === 'payment' ? `Encaissement Table ${payingOrder?.tableNumber}` : 'Paiement Réussi'}
                    </h2>
                    <button onClick={handleClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
                </div>

                <div className="p-6 overflow-y-auto">
                    
                    {step === 'payment' && payingOrder ? (
                        <>
                            <div className="flex justify-between items-center mb-6 bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                                <span className="text-slate-400 text-lg">Total à payer</span>
                                <span className="text-4xl font-bold text-white">{payingOrder.total.toFixed(2)}{currency}</span>
                            </div>

                            {/* Method Selection */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
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
                            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 mb-6 min-h-[120px]">
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
                                        <div className="bg-purple-500/10 p-3 rounded-full inline-block mb-2">
                                            <User size={32} className="text-purple-500" />
                                        </div>
                                        <h3 className="text-white font-bold">{payingOrder.clientName}</h3>
                                        <p className="text-slate-400 text-sm mt-1">
                                            Ce montant sera ajouté à l'ardoise du client (dette).
                                        </p>
                                    </div>
                                )}
                                
                                {method === PaymentMethod.CARD && (
                                    <div className="text-center py-4">
                                        <CreditCard size={48} className="mx-auto text-blue-500 mb-3" />
                                        <p className="text-white font-medium">Utilisez le TPE pour encaisser.</p>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handlePayment}
                                disabled={method === PaymentMethod.CASH && changeDue < 0}
                                className="w-full py-4 bg-bar-accent hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-bar-accent/20 transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={20} />
                                Valider l'encaissement
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col md:flex-row gap-8 h-full">
                            {/* Left: Receipt Preview */}
                            <div className="flex-1 bg-slate-800/50 rounded-xl p-6 border border-slate-700 flex flex-col items-center justify-center relative min-h-[400px]">
                                <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4 absolute top-4 left-4">Aperçu du reçu</h3>
                                <div className="scale-90 origin-top shadow-2xl">
                                    {successPaymentOrder && <Receipt order={successPaymentOrder} currency={currency} />}
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="md:w-72 flex flex-col justify-center space-y-6">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
                                        <CheckCircle size={32} className="text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-1">C'est tout bon !</h3>
                                    <p className="text-slate-400 text-sm">Paiement enregistré avec succès.</p>
                                </div>
                                
                                <div className="space-y-3">
                                    <button 
                                        onClick={handlePrint}
                                        className="w-full py-4 bg-white hover:bg-slate-200 text-slate-900 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Printer size={20} />
                                        Imprimer le Ticket
                                    </button>
                                    <button 
                                        onClick={handleClose}
                                        className="w-full py-4 bg-bar-accent hover:bg-pink-600 text-white font-bold rounded-xl shadow-lg shadow-bar-accent/20 flex items-center justify-center gap-2 transition-colors"
                                    >
                                        Nouvelle Commande
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
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