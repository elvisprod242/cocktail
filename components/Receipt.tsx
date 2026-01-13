import React from 'react';
import { Order, CartItem } from '../types';

interface ReceiptProps {
  order: Order;
  currency: string;
}

export const Receipt: React.FC<ReceiptProps> = ({ order, currency }) => {
  if (!order) return null;

  return (
    <div 
      id="printable-receipt" 
      className="bg-white text-black p-5 font-mono text-xs leading-tight w-[80mm] mx-auto shadow-2xl print:shadow-none print:w-full print:m-0"
    >
      {/* Header */}
      <div className="text-center mb-6 border-b border-black/10 pb-4">
        <h1 className="text-xl font-bold uppercase mb-2 tracking-wider">BarFlow</h1>
        <p className="text-[10px] text-gray-600">123 Avenue du Code</p>
        <p className="text-[10px] text-gray-600">75000 Paris</p>
        <p className="text-[10px] text-gray-600">Tel: 01 23 45 67 89</p>
      </div>

      {/* Info Commande */}
      <div className="mb-4 text-[10px] space-y-1">
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{new Date(order.timestamp).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Heure:</span>
          <span>{new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
        <div className="flex justify-between font-bold mt-2">
          <span>Ticket #:</span>
          <span>{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span>Table:</span>
          <span>{order.tableName}</span>
        </div>
        {order.clientName && (
           <div className="flex justify-between border-t border-dashed border-gray-300 pt-1 mt-1">
             <span>Client:</span>
             <span className="font-bold">{order.clientName}</span>
           </div>
        )}
      </div>

      {/* Articles */}
      <div className="border-t border-b border-black border-dashed py-3 mb-4">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] text-gray-500 border-b border-gray-200">
              <th className="w-8 pb-1">Qté</th>
              <th className="pb-1">Article</th>
              <th className="text-right pb-1">Prix</th>
            </tr>
          </thead>
          <tbody className="text-[11px]">
            {order.items.map((item: CartItem, index: number) => (
              <tr key={index}>
                <td className="align-top py-1 font-bold">{item.quantity}</td>
                <td className="align-top py-1">{item.name}</td>
                <td className="text-right align-top py-1">{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totaux */}
      <div className="flex justify-between items-center text-xl font-bold mb-4 border-b-2 border-black pb-4">
        <span>TOTAL</span>
        <span>{order.total.toFixed(2)}{currency}</span>
      </div>

      <div className="text-[10px] space-y-2 mb-8">
         <div className="flex justify-between text-gray-600">
            <span>Dont TVA (20%):</span>
            <span>{(order.total * 0.20).toFixed(2)}{currency}</span>
         </div>
         <div className="flex justify-between font-bold text-sm bg-gray-100 p-2 rounded">
            <span>Payé par {order.paymentMethod || 'Espèces'}:</span>
            <span>{order.total.toFixed(2)}{currency}</span>
         </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] space-y-1">
        <p className="font-bold">Merci de votre visite !</p>
        <p className="text-gray-500">Conservez ce ticket pour justificatif.</p>
        <div className="mt-4 pt-4 border-t border-gray-200">
           <p className="text-[8px] text-gray-400">Propulsé par BarFlow AI</p>
        </div>
        {/* Code barre simulé */}
        <div className="h-8 bg-black/10 mt-2 mx-auto w-3/4 flex items-center justify-center text-[8px] tracking-[4px] opacity-50 font-sans">
            ||| | ||| || |||
        </div>
      </div>
    </div>
  );
};