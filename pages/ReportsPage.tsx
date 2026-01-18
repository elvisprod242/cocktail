import React, { useState, useMemo } from 'react';
import { Order, Product, PaymentMethod } from '../types';
import { 
  FileBarChart, CalendarRange, Download, PieChart, TrendingUp, 
  Package, Wallet, Target, Percent, CircleDollarSign, 
  History, Layers, Scale, Zap
} from 'lucide-react';

interface ReportsPageProps {
  orders: Order[];
  products: Product[];
  currency: string;
}

type Period = 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'LAST_MONTH' | 'ALL';

export const ReportsPage: React.FC<ReportsPageProps> = ({ orders, products, currency }) => {
  const [period, setPeriod] = useState<Period>('TODAY');

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return orders.filter(order => {
      const d = new Date(order.timestamp);
      const orderDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

      if (period === 'TODAY') return orderDay.getTime() === today.getTime();
      
      if (period === 'YESTERDAY') {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return orderDay.getTime() === yesterday.getTime();
      }

      if (period === 'WEEK') {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return d >= weekAgo;
      }

      if (period === 'MONTH') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }

      if (period === 'LAST_MONTH') {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
      }

      return true;
    });
  }, [orders, period]);

  const reportData = useMemo(() => {
    const categories: Record<string, { total: number; qty: number; cost: number }> = {};
    const items: Record<string, { total: number; qty: number; category: string; cost: number }> = {};
    const payments: Record<string, number> = {
      [PaymentMethod.CASH]: 0,
      [PaymentMethod.CARD]: 0,
      [PaymentMethod.MOBILE_MONEY]: 0,
      [PaymentMethod.TAB]: 0,
    };

    filteredOrders.forEach(order => {
      if (order.paymentMethod) {
        payments[order.paymentMethod] = (payments[order.paymentMethod] || 0) + order.total;
      }

      order.items.forEach(item => {
        // Utilisation du prix d'achat stocké dans la commande pour l'exactitude historique
        const historicalCost = item.costPrice || 0;
        const totalCost = historicalCost * item.quantity;
        const totalRev = item.price * item.quantity;
        
        // Trouver la catégorie actuelle pour le groupage
        const product = products.find(p => p.name === item.name);
        const catName = product ? product.category : 'Divers';

        // Categories stats
        if (!categories[catName]) categories[catName] = { total: 0, qty: 0, cost: 0 };
        categories[catName].total += totalRev;
        categories[catName].qty += item.quantity;
        categories[catName].cost += totalCost;

        // Items stats
        if (!items[item.name]) items[item.name] = { total: 0, qty: 0, category: catName, cost: 0 };
        items[item.name].total += totalRev;
        items[item.name].qty += item.quantity;
        items[item.name].cost += totalCost;
      });
    });

    return { 
      categories: Object.entries(categories).sort((a,b) => b[1].total - a[1].total),
      items: Object.entries(items).sort((a,b) => (b[1].total - b[1].cost) - (a[1].total - a[1].cost)), // Sort by Profit
      payments: Object.entries(payments).filter(([_, val]) => val > 0)
    };
  }, [filteredOrders, products]);

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalCost = reportData.items.reduce((sum, [_, data]) => sum + data.cost, 0);
  const totalProfit = totalRevenue - totalCost;
  const marginRate = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const avgBasket = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
  const avgMultiplier = totalCost > 0 ? totalRevenue / totalCost : 0;

  const exportToCSV = () => {
    const headers = ["Article", "Categorie", "Quantite", "CA", "Cout Achat", "Profit", "Marge %", "Multiplier"];
    const rows = reportData.items.map(([name, data]) => {
      const profit = data.total - data.cost;
      const margin = data.total > 0 ? (profit / data.total) * 100 : 0;
      const multiplier = data.cost > 0 ? data.total / data.cost : 0;
      return [
        name,
        data.category,
        data.qty,
        data.total.toFixed(2),
        data.cost.toFixed(2),
        profit.toFixed(2),
        margin.toFixed(1),
        multiplier.toFixed(2)
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rapport_rentabilite_${period.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SummaryCard = ({ title, value, subValue, icon: Icon, color }: any) => (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
      <div className={`absolute -right-2 -top-2 p-6 opacity-10 ${color} group-hover:scale-110 transition-transform duration-500`}>
        <Icon size={64} />
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black text-white">{value}</h3>
        {subValue && <p className="text-xs text-slate-400 mt-1 font-medium">{subValue}</p>}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-950 no-scrollbar">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 italic tracking-tight uppercase">
            <div className="p-2 bg-bar-accent/20 rounded-lg text-bar-accent">
               <Scale size={28} />
            </div>
            Rapports de Rentabilité
          </h1>
          <p className="text-slate-400 mt-1 font-medium">Suivi précis des marges basées sur les coûts d'achat historiques</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner">
            {(['TODAY', 'YESTERDAY', 'WEEK', 'MONTH', 'LAST_MONTH', 'ALL'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  period === p ? 'bg-bar-accent text-white shadow-lg' : 'text-slate-500 hover:text-white'
                }`}
              >
                {p === 'TODAY' ? 'Auj.' : p === 'YESTERDAY' ? 'Hier' : p === 'WEEK' ? '7j' : p === 'MONTH' ? 'Mois' : p === 'LAST_MONTH' ? 'M-1' : 'Tout'}
              </button>
            ))}
          </div>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest border border-slate-700 transition-all shadow-lg"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <SummaryCard 
          title="Chiffre d'Affaires" 
          value={`${totalRevenue.toFixed(2)}${currency}`} 
          subValue={`${filteredOrders.length} transactions`}
          icon={TrendingUp} 
          color="text-blue-500"
        />
        <SummaryCard 
          title="Bénéfice Net" 
          value={`${totalProfit.toFixed(2)}${currency}`} 
          subValue={`ROI Global : ${marginRate.toFixed(1)}%`}
          icon={CircleDollarSign} 
          color="text-green-500"
        />
        <SummaryCard 
          title="Multiplicateur Moyen" 
          value={`x${avgMultiplier.toFixed(2)}`} 
          subValue="Coefficient prix"
          icon={Zap} 
          color="text-amber-500"
        />
        <SummaryCard 
          title="Panier Moyen" 
          value={`${avgBasket.toFixed(2)}${currency}`} 
          subValue="Dépense / client"
          icon={Target} 
          color="text-purple-500"
        />
        <SummaryCard 
          title="Taux de Marge" 
          value={`${marginRate.toFixed(1)}%`} 
          subValue="Performance nette"
          icon={Percent} 
          color="text-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Sales by Category Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
            <h3 className="font-black text-white text-sm flex items-center gap-2 uppercase tracking-widest">
              <Layers size={18} className="text-blue-400" />
              Répartition & Marges par Catégorie
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-950 text-slate-500 uppercase text-[9px] font-black tracking-widest">
                <tr>
                  <th className="p-5">Catégorie</th>
                  <th className="p-5 text-right">CA</th>
                  <th className="p-5 text-right">Cout Achat</th>
                  <th className="p-5 text-right">Bénéfice</th>
                  <th className="p-5 text-right">Marge %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {reportData.categories.map(([name, data]) => {
                  const profit = data.total - data.cost;
                  const margin = data.total > 0 ? (profit / data.total) * 100 : 0;
                  return (
                    <tr key={name} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="p-5">
                        <span className="font-bold text-white uppercase text-xs">{name}</span>
                      </td>
                      <td className="p-5 text-right text-white font-black text-xs">{data.total.toFixed(2)}{currency}</td>
                      <td className="p-5 text-right text-slate-500 font-mono text-xs">{data.cost.toFixed(2)}{currency}</td>
                      <td className="p-5 text-right text-green-500 font-bold text-xs">+{profit.toFixed(2)}{currency}</td>
                      <td className="p-5 text-right">
                         <div className="flex flex-col items-end gap-1.5">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${margin > 70 ? 'bg-green-500/10 text-green-500' : margin > 40 ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                                {margin.toFixed(1)}%
                            </span>
                         </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Efficiency Chart / Multipliers */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl h-fit">
          <div className="p-6 border-b border-slate-800 bg-slate-800/20">
            <h3 className="font-black text-white text-sm flex items-center gap-2 uppercase tracking-widest">
              <Zap size={18} className="text-amber-400" />
              Efficacité Prix (Multiplier)
            </h3>
          </div>
          <div className="p-6 space-y-5">
            {reportData.categories.map(([name, data]) => {
              const mult = data.cost > 0 ? data.total / data.cost : 0;
              return (
                <div key={name} className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{name}</span>
                    <span className={`text-sm font-black ${mult >= 3 ? 'text-green-500' : 'text-amber-500'}`}>x{mult.toFixed(2)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${mult >= 4 ? 'bg-green-500' : mult >= 2 ? 'bg-blue-500' : 'bg-red-500'}`} 
                        style={{ width: `${Math.min((mult/6)*100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Product Profitability Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl mb-24 md:mb-0">
        <div className="p-6 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
          <h3 className="font-black text-white text-sm flex items-center gap-2 uppercase tracking-widest">
            <Package size={18} className="text-bar-accent" />
            Classement par Profit Net
          </h3>
          <span className="text-[10px] text-slate-500 font-bold italic">Basé sur les coûts réels à la vente</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-500 uppercase text-[9px] font-black tracking-widest">
              <tr>
                <th className="p-5">Article</th>
                <th className="p-5 text-center">Quantité</th>
                <th className="p-5 text-right">CA</th>
                <th className="p-5 text-right">Coût Achat</th>
                <th className="p-5 text-right">Bénéfice Réel</th>
                <th className="p-5 text-right">Multiplier</th>
                <th className="p-5 text-right">Marge %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {reportData.items.map(([name, data]) => {
                const profit = data.total - data.cost;
                const itemMargin = data.total > 0 ? (profit / data.total) * 100 : 0;
                const multiplier = data.cost > 0 ? data.total / data.cost : 0;
                return (
                  <tr key={name} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-5 font-bold text-white text-xs">{name}</td>
                    <td className="p-5 text-center font-mono text-xs text-slate-500">x{data.qty}</td>
                    <td className="p-5 text-right text-white font-mono text-xs">{data.total.toFixed(2)}{currency}</td>
                    <td className="p-5 text-right text-slate-600 font-mono text-xs">{data.cost.toFixed(2)}{currency}</td>
                    <td className="p-5 text-right">
                       <span className="text-green-500 font-black text-xs">+{profit.toFixed(2)}{currency}</span>
                    </td>
                    <td className="p-5 text-right">
                       <span className={`text-[10px] font-black ${multiplier >= 3 ? 'text-blue-400' : 'text-slate-500'}`}>
                         x{multiplier.toFixed(1)}
                       </span>
                    </td>
                    <td className="p-5 text-right">
                       <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${itemMargin > 75 ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-slate-800 text-slate-500'}`}>
                         {itemMargin.toFixed(0)}%
                       </span>
                    </td>
                  </tr>
                );
              })}
              {reportData.items.length === 0 && (
                <tr>
                    <td colSpan={7} className="p-20 text-center italic text-slate-600 uppercase font-black tracking-widest opacity-20">
                        Aucune vente à analyser
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};