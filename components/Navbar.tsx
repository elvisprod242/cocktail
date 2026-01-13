import React from 'react';
import { LayoutDashboard, Beer, ClipboardList, Package, Shapes, Settings, Armchair, Users, History } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Stats', icon: <LayoutDashboard size={24} /> },
    { path: '/pos', label: 'Caisse', icon: <Beer size={24} /> },
    { path: '/kitchen', label: 'Commande', icon: <ClipboardList size={24} /> },
    { path: '/history', label: 'Historique', icon: <History size={24} /> },
    { path: '/clients', label: 'Clients', icon: <Users size={24} /> },
    { path: '/tables', label: 'Tables', icon: <Armchair size={24} /> },
    { path: '/products', label: 'Produits', icon: <Package size={24} /> },
    { path: '/categories', label: 'Catégories', icon: <Shapes size={24} /> },
    { path: '/settings', label: 'Paramètres', icon: <Settings size={24} /> },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-20 lg:w-64 bg-slate-900 border-r border-slate-800 h-screen fixed left-0 top-0 z-50">
        <div className="p-6 flex items-center justify-center lg:justify-start">
          <div className="w-10 h-10 bg-gradient-to-tr from-bar-accent to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-bar-accent/30">
            <Beer className="text-white" size={24} />
          </div>
          <span className="hidden lg:block ml-3 font-bold text-xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            BarFlow
          </span>
        </div>

        <div className="flex-1 py-8 flex flex-col gap-2 px-3 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center p-3 rounded-xl transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-bar-accent text-white shadow-lg shadow-bar-accent/25'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="hidden lg:block ml-3 font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50 px-2 pb-safe">
        <div className="flex justify-around items-center h-16 overflow-x-auto no-scrollbar">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center min-w-[60px] h-full space-y-1 ${
                isActive(item.path) ? 'text-bar-accent' : 'text-slate-500'
              }`}
            >
              <span className="transform scale-75">{item.icon}</span>
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};