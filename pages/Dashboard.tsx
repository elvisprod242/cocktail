import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, DollarSign, Users, Beer } from 'lucide-react';
import { Order } from '../types';

interface DashboardProps {
  orders: Order[];
  currency: string;
}

type Period = 'week' | 'month' | 'year';

export const Dashboard: React.FC<DashboardProps> = ({ orders, currency }) => {
  const [period, setPeriod] = useState<Period>('week');
  
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calcul dynamique des données du graphique basé sur les commandes réelles
  const chartData = useMemo(() => {
    const now = new Date();
    let data: { name: string; value: number; sortKey: number }[] = [];

    if (period === 'week') {
      // 7 derniers jours
      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      // Initialiser map
      const stats = new Map();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayName = days[d.getDay()];
        stats.set(dayName, 0);
        // Ajoutons une clé de tri simple pour l'ordre d'affichage si nécessaire, 
        // ici on se base sur l'ordre d'insertion dans le tableau final
        data.push({ name: dayName, value: 0, sortKey: d.getTime() });
      }

      orders.forEach(order => {
        const d = new Date(order.timestamp);
        // Filtre simple: est-ce dans les 7 derniers jours ?
        const diffTime = Math.abs(now.getTime() - d.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays <= 7) {
            const dayName = days[d.getDay()];
            const idx = data.findIndex(i => i.name === dayName);
            if (idx !== -1) data[idx].value += order.total;
        }
      });
    } else if (period === 'month') {
        // 4 dernières semaines (simplifié)
        for (let i = 1; i <= 4; i++) {
           data.push({ name: `Sem ${i}`, value: 0, sortKey: i });
        }
        // Logic de répartition simplifiée
        orders.forEach(order => {
             // Simuler une répartition pour la démo si les dates sont toutes aujourd'hui
             // En prod, utiliser num semaine réelle
             data[3].value += order.total; 
        });
    } else {
        // Année (Mois)
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        months.forEach((m, i) => data.push({ name: m, value: 0, sortKey: i }));
        
        orders.forEach(order => {
            const d = new Date(order.timestamp);
            if (d.getFullYear() === now.getFullYear()) {
                data[d.getMonth()].value += order.total;
            }
        });
    }

    return data;
  }, [orders, period]);

  const getPeriodLabel = () => {
    switch (period) {
      case 'month': return 'Revenus Mensuels';
      case 'year': return 'Revenus Annuels';
      default: return 'Revenus Hebdomadaires';
    }
  };

  const StatCard = ({ icon, title, value, subtext }: any) => (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-white">{value}</h3>
          {subtext && <p className="text-green-400 text-xs mt-2 flex items-center gap-1"><TrendingUp size={12} /> {subtext}</p>}
        </div>
        <div className="p-3 bg-slate-800 rounded-xl text-bar-accent">
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-950">
      <h1 className="text-3xl font-bold text-white mb-8">Tableau de Bord</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon={<DollarSign size={24} />} 
          title="Chiffre d'affaires" 
          value={`${totalRevenue.toFixed(2)}${currency}`}
          subtext="Total historique"
        />
        <StatCard 
          icon={<Beer size={24} />} 
          title="Commandes" 
          value={totalOrders} 
          subtext="Enregistrées en DB"
        />
        <StatCard 
          icon={<Users size={24} />} 
          title="Panier Moyen" 
          value={`${averageTicket.toFixed(2)}${currency}`}
        />
        <StatCard 
          icon={<TrendingUp size={24} />} 
          title="Performance" 
          value={totalOrders > 0 ? "Active" : "En attente"} 
          subtext={period === 'week' ? 'Vue 7j' : 'Vue globale'}
        />
      </div>

      {/* Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg h-96 mb-24 md:mb-0">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h3 className="text-xl font-bold text-white">{getPeriodLabel()}</h3>
          <div className="flex bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${period === 'week' ? 'bg-bar-accent text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Semaine
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${period === 'month' ? 'bg-bar-accent text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Mois
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${period === 'year' ? 'bg-bar-accent text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Année
            </button>
          </div>
        </div>
        
        {totalOrders === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500">
            <p>Aucune donnée disponible. Passez une commande !</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
              <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} prefix={currency} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={'#e94560'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};