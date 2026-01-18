
import React from 'react';
import { LayoutDashboard, Beer, ClipboardList, Package, Shapes, Settings, Armchair, Users, UserCheck, History, FileBarChart, LogOut, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { UserRole, User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, onLogout }) => {
  const location = useLocation();

  if (!currentUser) return null;

  const isActive = (path: string) => location.pathname === path;

  // Définition des permissions par rôle
  const navItems = [
    { path: '/', label: 'Tableau de bord', icon: <LayoutDashboard size={24} />, roles: [UserRole.ADMIN, UserRole.BARTENDER, UserRole.SERVER] },
    { path: '/pos', label: 'Caisse', icon: <Beer size={24} />, roles: [UserRole.ADMIN, UserRole.BARTENDER, UserRole.SERVER] },
    { path: '/kitchen', label: 'Cuisine', icon: <ClipboardList size={24} />, roles: [UserRole.ADMIN, UserRole.BARTENDER] },
    { path: '/history', label: 'Historique', icon: <History size={24} />, roles: [UserRole.ADMIN, UserRole.BARTENDER, UserRole.SERVER] },
    { path: '/reports', label: 'Rapports', icon: <FileBarChart size={24} />, roles: [UserRole.ADMIN] },
    { path: '/clients', label: 'Clients', icon: <Users size={24} />, roles: [UserRole.ADMIN, UserRole.SERVER] },
    { path: '/staff', label: 'Personnel', icon: <UserCheck size={24} />, roles: [UserRole.ADMIN] },
    { path: '/tables', label: 'Tables', icon: <Armchair size={24} />, roles: [UserRole.ADMIN, UserRole.SERVER] },
    { path: '/products', label: 'Stocks', icon: <Package size={24} />, roles: [UserRole.ADMIN, UserRole.BARTENDER] },
    { path: '/categories', label: 'Catégories', icon: <Shapes size={24} />, roles: [UserRole.ADMIN] },
    { path: '/settings', label: 'Paramètres', icon: <Settings size={24} />, roles: [UserRole.ADMIN] },
  ].filter(item => item.roles.includes(currentUser.role));

  const RoleBadge = () => {
    const labels = {
      [UserRole.ADMIN]: 'Administrateur',
      [UserRole.BARTENDER]: 'Barman',
      [UserRole.SERVER]: 'Serveur'
    };
    return (
      <div className="flex flex-col">
        <span className="text-white text-sm font-bold truncate">{currentUser.name}</span>
        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{labels[currentUser.role]}</span>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-20 lg:w-64 bg-slate-900 border-r border-slate-800 h-screen fixed left-0 top-0 z-50 shadow-2xl">
        <div className="p-6 flex items-center justify-center lg:justify-start">
          <div className="w-10 h-10 bg-gradient-to-tr from-bar-accent to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-bar-accent/30">
            <Beer className="text-white" size={24} />
          </div>
          <span className="hidden lg:block ml-3 font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            BARFLOW
          </span>
        </div>

        <div className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">
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
              <span className="hidden lg:block ml-3 font-bold text-sm">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 mt-auto bg-slate-950/50">
           <div className="flex items-center gap-3 mb-4 hidden lg:flex">
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-bar-accent border border-slate-700">
                <ShieldCheck size={20} />
              </div>
              <RoleBadge />
           </div>
           <button 
             onClick={onLogout}
             className="w-full flex items-center justify-center gap-2 p-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all font-bold text-sm"
           >
             <LogOut size={20} />
             <span className="hidden lg:block">Déconnexion</span>
           </button>
        </div>
      </nav>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-[100] px-2 pb-safe">
        <div className="flex justify-around items-center h-16 overflow-x-auto no-scrollbar">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center min-w-[60px] h-full space-y-1 ${
                isActive(item.path) ? 'text-bar-accent' : 'text-slate-500'
              }`}
            >
              <div className="transform scale-75">{item.icon}</div>
              <span className="text-[9px] font-bold uppercase tracking-tighter">{item.label}</span>
            </Link>
          ))}
          <button 
            onClick={onLogout}
            className="flex flex-col items-center justify-center min-w-[60px] h-full space-y-1 text-slate-500"
          >
            <LogOut size={20} className="transform scale-75" />
            <span className="text-[9px] font-bold uppercase tracking-tighter">Sortie</span>
          </button>
        </div>
      </nav>
    </>
  );
};
