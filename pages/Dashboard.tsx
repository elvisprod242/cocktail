import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Award, Clock, CalendarRange, ArrowUpRight } from 'lucide-react';
import { Order, Product } from '../types';

interface DashboardProps {
  orders: Order[];
  products: Product[];
  currency: string;
}

type Period = 'week' | 'month' | 'year';

const COLORS = ['#e94560', '#533483', '#0f3460', '#16213e', '#22a6b3', '#f0932b'];

export const Dashboard: React.FC<DashboardProps> = ({ orders, products, currency }) => {
  const [period, setPeriod] = useState<Period>('week');
  
  // --- HELPERS DATA ---
  
  // 1. Filter Orders by Period
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(order => {
        const d = new Date(order.timestamp);
        if (period === 'week') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            return d >= sevenDaysAgo;
        } else if (period === 'month') {
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        } else {
            return d.getFullYear() === now.getFullYear();
        }
    });
  }, [orders, period]);

  // 2. Global KPIs
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = filteredOrders.length;
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Find Best Selling Day
  const bestDay = useMemo(() => {
      const days: Record<string, number> = {};
      filteredOrders.forEach(o => {
          const day = new Date(o.timestamp).toLocaleDateString('fr-FR', { weekday: 'long' });
          days[day] = (days[day] || 0) + o.total;
      });
      const entries = Object.entries(days);
      if (entries.length === 0) return 'N/A';
      return entries.sort((a,b) => b[1] - a[1])[0][0]; // [dayName, value]
  }, [filteredOrders]);


  // 3. Chart Data: Revenue over Time (Area Chart)
  const revenueData = useMemo(() => {
    const dataMap = new Map<string, number>();
    const now = new Date();
    const result: any[] = [];

    if (period === 'week') {
      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const label = d.toLocaleDateString('fr-FR', { weekday: 'short' });
        dataMap.set(label, 0);
        result.push({ name: label, value: 0, fullDate: d.toDateString() });
      }
      
      filteredOrders.forEach(o => {
         const d = new Date(o.timestamp);
         const label = d.toLocaleDateString('fr-FR', { weekday: 'short' });
         const existingIndex = result.findIndex(r => r.name === label);
         if (existingIndex !== -1) result[existingIndex].value += o.total;
      });

    } else if (period === 'month') {
        // Group by day of month
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
             result.push({ name: `${i}`, value: 0 });
        }
        filteredOrders.forEach(o => {
            const d = new Date(o.timestamp);
            const day = d.getDate();
            if (result[day - 1]) result[day - 1].value += o.total;
        });
    } else {
        // Year
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        months.forEach(m => result.push({ name: m, value: 0 }));
        filteredOrders.forEach(o => {
            const m = new Date(o.timestamp).getMonth();
            result[m].value += o.total;
        });
    }
    return result;
  }, [filteredOrders, period]);

  // 4. Chart Data: Sales by Category (Pie Chart)
  const categoryData = useMemo(() => {
    const stats: Record<string, number> = {};
    
    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            // Find product to get true category (as item might not have it saved in old DB versions)
            const product = products.find(p => p.name === item.name);
            const cat = product ? product.category : 'Autre';
            stats[cat] = (stats[cat] || 0) + (item.price * item.quantity);
        });
    });

    return Object.entries(stats)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
  }, [filteredOrders, products]);

  // 5. Chart Data: Busy Hours (Bar Chart)
  const hourlyData = useMemo(() => {
      const hours = new Array(24).fill(0).map((_, i) => ({ name: `${i}h`, value: 0 }));
      filteredOrders.forEach(o => {
          const h = new Date(o.timestamp).getHours();
          hours[h].value += 1; // Count orders, could be revenue
      });
      // Filter only active hours (e.g. 10am to 2am) to avoid empty chart space if desired, 
      // but showing 24h gives perspective. Let's just strip leading zeros if needed.
      return hours; 
  }, [filteredOrders]);

  // 6. Top Products List
  const topProducts = useMemo(() => {
      const counts: Record<string, { qty: number, revenue: number }> = {};
      filteredOrders.forEach(o => {
          o.items.forEach(item => {
              if (!counts[item.name]) counts[item.name] = { qty: 0, revenue: 0 };
              counts[item.name].qty += item.quantity;
              counts[item.name].revenue += (item.price * item.quantity);
          });
      });
      
      return Object.entries(counts)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);
  }, [filteredOrders]);


  // --- UI COMPONENTS ---

  const StatCard = ({ title, value, icon: Icon, sub, subColor = "text-green-400" }: any) => (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
      <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
         <Icon size={80} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-800 rounded-lg text-bar-accent">
                <Icon size={20} />
            </div>
            <p className="text-slate-400 text-sm font-medium">{title}</p>
        </div>
        <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
        {sub && <p className={`text-xs ${subColor} flex items-center gap-1`}>{sub}</p>}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-950 scrollbar-thin scrollbar-thumb-slate-800">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white">Tableau de bord</h1>
            <p className="text-slate-400 mt-1">Vision globale de la performance de votre établissement</p>
        </div>
        
        <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800 flex items-center">
            {(['week', 'month', 'year'] as Period[]).map((p) => (
                <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`
                        px-4 py-2 rounded-lg text-sm font-bold transition-all
                        ${period === p 
                            ? 'bg-bar-accent text-white shadow-lg shadow-bar-accent/20' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }
                    `}
                >
                    {p === 'week' ? '7 Jours' : p === 'month' ? 'Mois' : 'Année'}
                </button>
            ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Chiffre d'Affaires" 
          value={`${totalRevenue.toFixed(2)}${currency}`} 
          icon={DollarSign}
          sub={totalRevenue > 0 ? "+ Croissance active" : "Aucune donnée"}
          subColor="text-green-400"
        />
        <StatCard 
          title="Commandes Totales" 
          value={totalOrders} 
          icon={ShoppingBag}
          sub={`${(totalOrders / (period === 'week' ? 7 : 30)).toFixed(1)} / jour moy.`}
          subColor="text-blue-400"
        />
        <StatCard 
          title="Panier Moyen" 
          value={`${averageTicket.toFixed(2)}${currency}`} 
          icon={TrendingUp}
          sub="Par commande"
          subColor="text-purple-400"
        />
        <StatCard 
          title="Meilleur Jour" 
          value={bestDay.charAt(0).toUpperCase() + bestDay.slice(1)} 
          icon={CalendarRange}
          sub="Pic d'activité"
          subColor="text-orange-400"
        />
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Revenue Area Chart (Takes 2/3 width) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col h-[400px]">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp size={20} className="text-bar-accent" />
                    Évolution du Chiffre d'Affaires
                </h3>
             </div>
             
             <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#e94560" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#e94560" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            stroke="#94a3b8" 
                            tick={{fill: '#94a3b8', fontSize: 12}} 
                            axisLine={false} 
                            tickLine={false} 
                            dy={10}
                        />
                        <YAxis 
                            stroke="#94a3b8" 
                            tick={{fill: '#94a3b8', fontSize: 12}} 
                            axisLine={false} 
                            tickLine={false} 
                            tickFormatter={(value) => `${value}${currency}`}
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '8px' }}
                            itemStyle={{ color: '#e94560' }}
                            formatter={(value: number) => [`${value.toFixed(2)}${currency}`, "Revenu"]}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#e94560" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorRevenue)" 
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
        </div>

        {/* Top Products List (Takes 1/3 width) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col h-[400px]">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                <Award size={20} className="text-yellow-500" />
                Top 5 Produits
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {topProducts.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-500 italic">Aucune donnée</div>
                ) : (
                    topProducts.map((prod, index) => (
                        <div key={prod.name} className="flex items-center p-3 bg-slate-800/50 rounded-xl border border-slate-800">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3 ${index === 0 ? 'bg-yellow-500 text-black' : index === 1 ? 'bg-slate-400 text-black' : index === 2 ? 'bg-orange-700 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">{prod.name}</p>
                                <p className="text-xs text-slate-400">{prod.qty} vendus</p>
                            </div>
                            <div className="font-bold text-bar-accent text-sm">
                                {prod.revenue.toFixed(0)}{currency}
                            </div>
                        </div>
                    ))
                )}
            </div>
            <button className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                Voir tout le classement <ArrowUpRight size={14} />
            </button>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-24 md:pb-6">
          
          {/* Category Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg h-[350px] flex flex-col">
               <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                    <ShoppingBag size={20} className="text-blue-500" />
                    Répartition par Catégorie
               </h3>
               <div className="flex-1 w-full min-h-0 flex items-center justify-center">
                    {categoryData.length === 0 ? (
                        <p className="text-slate-500">Pas assez de données</p>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value: number) => `${value.toFixed(2)}${currency}`}
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }} 
                                />
                                <Legend 
                                    verticalAlign="middle" 
                                    align="right" 
                                    layout="vertical" 
                                    iconType="circle"
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
               </div>
          </div>

          {/* Hourly Traffic */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg h-[350px] flex flex-col">
               <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                    <Clock size={20} className="text-purple-500" />
                    Affluence Horaire
               </h3>
               <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={hourlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis 
                                dataKey="name" 
                                stroke="#94a3b8" 
                                tick={{fill: '#94a3b8', fontSize: 10}} 
                                axisLine={false} 
                                tickLine={false} 
                            />
                            <YAxis 
                                stroke="#94a3b8" 
                                tick={{fill: '#94a3b8', fontSize: 10}} 
                                axisLine={false} 
                                tickLine={false} 
                            />
                            <Tooltip 
                                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                            />
                            <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                                {hourlyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#e94560' : '#1e293b'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
               </div>
          </div>

      </div>
    </div>
  );
};