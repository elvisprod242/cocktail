import React, { useState } from "react";
import {
  LayoutDashboard,
  Beer,
  ClipboardList,
  Package,
  Shapes,
  Settings,
  Armchair,
  Users,
  UserCheck,
  History,
  FileBarChart,
  LogOut,
  ShieldCheck,
  ShoppingCart,
  Menu as MenuIcon,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { UserRole, User } from "../types";

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  cartItemCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  cartItemCount = 0,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (!currentUser) return null;

  const isActive = (path: string) => location.pathname === path;

  // Définition des permissions par rôle
  const navItems = [
    {
      path: "/",
      label: "Tableau de bord",
      icon: <LayoutDashboard size={24} />,
      roles: [UserRole.ADMIN, UserRole.BARTENDER, UserRole.SERVER],
    },
    {
      path: "/pos",
      label: "Caisse",
      icon: <Beer size={24} />,
      roles: [UserRole.ADMIN, UserRole.BARTENDER, UserRole.SERVER],
    },
    {
      path: "/kitchen",
      label: "Cuisine",
      icon: <ClipboardList size={24} />,
      roles: [UserRole.ADMIN, UserRole.BARTENDER],
    },
    {
      path: "/history",
      label: "Historique",
      icon: <History size={24} />,
      roles: [UserRole.ADMIN, UserRole.BARTENDER, UserRole.SERVER],
    },
    {
      path: "/reports",
      label: "Rapports",
      icon: <FileBarChart size={24} />,
      roles: [UserRole.ADMIN],
    },
    {
      path: "/clients",
      label: "Clients",
      icon: <Users size={24} />,
      roles: [UserRole.ADMIN, UserRole.SERVER],
    },
    {
      path: "/staff",
      label: "Personnel",
      icon: <UserCheck size={24} />,
      roles: [UserRole.ADMIN],
    },
    {
      path: "/tables",
      label: "Tables",
      icon: <Armchair size={24} />,
      roles: [UserRole.ADMIN, UserRole.SERVER],
    },
    {
      path: "/products",
      label: "Stocks",
      icon: <Package size={24} />,
      roles: [UserRole.ADMIN, UserRole.BARTENDER],
    },
    {
      path: "/categories",
      label: "Catégories",
      icon: <Shapes size={24} />,
      roles: [UserRole.ADMIN],
    },
    {
      path: "/settings",
      label: "Paramètres",
      icon: <Settings size={24} />,
      roles: [UserRole.ADMIN],
    },
  ].filter((item) => item.roles.includes(currentUser.role));

  const RoleBadge = () => {
    const labels = {
      [UserRole.ADMIN]: "Administrateur",
      [UserRole.BARTENDER]: "Barman",
      [UserRole.SERVER]: "Serveur",
    };
    return (
      <div className="flex flex-col">
        <span className="text-white text-sm font-bold truncate">
          {currentUser.name}
        </span>
        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
          {labels[currentUser.role]}
        </span>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-20 xl:w-64 bg-slate-900 border-r border-slate-800 h-screen fixed left-0 top-0 z-50 shadow-2xl">
        <div className="p-6 flex items-center justify-center xl:justify-start">
          <div className="w-10 h-10 bg-gradient-to-tr from-bar-accent to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-bar-accent/30">
            <Beer className="text-white" size={24} />
          </div>
          <span className="hidden xl:block ml-3 font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
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
                  ? "bg-bar-accent text-white shadow-lg shadow-bar-accent/25"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="hidden xl:block ml-3 font-bold text-sm">
                {item.label}
              </span>
            </Link>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 mt-auto bg-slate-950/50">
          <div className="flex items-center gap-3 mb-4 hidden xl:flex">
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
            <span className="hidden xl:block">Déconnexion</span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-[100] px-2 pb-safe">
        <div className="flex justify-between items-center h-16 relative">
          {/* Left Items */}
          <div className="flex flex-1 justify-around">
            {navItems.slice(0, 2).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center min-w-[60px] h-full space-y-1 ${
                  isActive(item.path) ? "text-bar-accent" : "text-slate-500"
                }`}
              >
                <div className="transform scale-75">{item.icon}</div>
                <span className="text-[9px] font-bold uppercase tracking-tighter">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Center Cart Button */}
          <div className="flex-shrink-0 w-16 flex justify-center relative -top-5">
            <button
              onClick={() =>
                navigate("/pos", { state: { openCart: Date.now() } })
              }
              className="bg-bar-accent text-white p-4 rounded-full shadow-2xl shadow-bar-accent/50 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            >
              <div className="relative">
                <ShoppingCart size={24} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-bar-accent text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                    {cartItemCount}
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Right Items */}
          <div className="flex flex-1 justify-around">
            {navItems.slice(2, 3).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center min-w-[60px] h-full space-y-1 ${
                  isActive(item.path) ? "text-bar-accent" : "text-slate-500"
                }`}
              >
                <div className="transform scale-75">{item.icon}</div>
                <span className="text-[9px] font-bold uppercase tracking-tighter">
                  {item.label}
                </span>
              </Link>
            ))}

            {/* Menu Drawer Toggle */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex flex-col items-center justify-center min-w-[60px] h-full space-y-1 text-slate-500"
            >
              <MenuIcon size={20} className="transform scale-75" />
              <span className="text-[9px] font-bold uppercase tracking-tighter">
                Menu
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Drawer */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-[110] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          ></div>
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl relative z-10 animate-in slide-in-from-bottom-full duration-300">
            <div
              className="flex justify-center pt-3 pb-2"
              onClick={() => setIsDrawerOpen(false)}
            >
              <div className="w-12 h-1.5 bg-slate-700 rounded-full"></div>
            </div>
            <div className="p-6 pt-2">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-white italic">MENU</h3>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-slate-400 p-2 bg-slate-800 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-6">
                {navItems.slice(3).map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsDrawerOpen(false)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border ${
                      isActive(item.path)
                        ? "bg-bar-accent/10 border-bar-accent/30 text-bar-accent"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="mb-2">{item.icon}</div>
                    <span className="text-[9px] font-bold uppercase tracking-tighter text-center">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>

              <div className="border-t border-slate-800 pt-6 flex justify-between items-center">
                <RoleBadge />
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onLogout();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-xl font-bold text-sm"
                >
                  <LogOut size={18} />
                  Sortie
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
