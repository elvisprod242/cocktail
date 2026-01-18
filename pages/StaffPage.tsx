
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { addUser, updateUser, deleteUser } from '../services/db';
import { UserCheck, Plus, Trash2, Edit2, ShieldCheck, User as UserIcon, X, AlertTriangle, Key } from 'lucide-react';

interface StaffPageProps {
  staff: User[];
  refreshData: () => void;
}

export const StaffPage: React.FC<StaffPageProps> = ({ staff, refreshData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.SERVER);
  const [pin, setPin] = useState('');

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setName(user.name);
      setRole(user.role);
      setPin(user.pin || '');
    } else {
      setEditingUser(null);
      setName('');
      setRole(UserRole.SERVER);
      setPin('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingUser) {
      updateUser({ ...editingUser, name, role, pin });
    } else {
      addUser({ 
        id: `u_${Date.now()}`, 
        name, 
        role, 
        pin 
      });
    }
    refreshData();
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteUser(deleteConfirmId);
      refreshData();
      setDeleteConfirmId(null);
    }
  };

  const getRoleInfo = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return { label: 'Administrateur', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: <ShieldCheck size={18} /> };
      case UserRole.BARTENDER: return { label: 'Barman', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: <UserIcon size={18} /> };
      default: return { label: 'Serveur', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <UserIcon size={18} /> };
    }
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-950 no-scrollbar">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 italic tracking-tighter uppercase">
            <div className="p-2 bg-bar-accent/20 rounded-lg text-bar-accent">
               <UserCheck size={28} />
            </div>
            Gestion du Personnel
          </h1>
          <p className="text-slate-400 mt-1 font-medium">Configurez les comptes de vos collaborateurs et leurs accès</p>
        </div>
        <button onClick={() => openModal()} className="bg-bar-accent hover:bg-pink-600 text-white font-black py-4 px-8 rounded-2xl flex items-center gap-2 transition-all shadow-xl shadow-bar-accent/25 uppercase tracking-widest text-xs">
          <Plus size={20} /> Nouveau Collaborateur
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24 md:pb-0">
        {staff.map(user => {
          const roleInfo = getRoleInfo(user.role);
          return (
            <div key={user.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative group hover:border-slate-700 transition-all flex flex-col">
              <div className="flex justify-between items-start mb-6">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${roleInfo.color} shadow-lg shadow-black/20`}>
                    {roleInfo.icon}
                 </div>
                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(user)} className="p-2.5 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => setDeleteConfirmId(user.id)} className="p-2.5 bg-slate-800 text-slate-400 hover:text-red-500 rounded-xl transition-colors"><Trash2 size={16} /></button>
                 </div>
              </div>

              <div className="mb-6">
                 <h3 className="text-xl font-black text-white truncate italic">{user.name}</h3>
                 <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${roleInfo.color}`}>
                    {roleInfo.label}
                 </span>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-800/50 flex items-center justify-between text-slate-500">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-slate-300">
                     <Key size={14} className="text-bar-accent" />
                     <span className="text-slate-500 mr-1">Code:</span>
                     <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono text-bar-accent tracking-widest shadow-inner">
                        {user.pin || '----'}
                     </span>
                  </div>
                  <div className="text-[10px] font-black uppercase opacity-40">ID:{user.id.slice(-4)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-8 relative animate-in zoom-in duration-300">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 p-1 rounded-full"><X size={24} /></button>
            <h2 className="text-2xl font-black text-white mb-8 italic flex items-center gap-3">
                {editingUser ? <Edit2 className="text-bar-accent" /> : <Plus className="text-bar-accent" />}
                {editingUser ? 'MODIFIER PROFIL' : 'NOUVEAU COMPTE'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Nom du collaborateur</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-bar-accent outline-none font-bold" placeholder="Ex: Lucas B." autoFocus />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Rôle & Permissions</label>
                <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-bar-accent outline-none font-bold appearance-none">
                    <option value={UserRole.ADMIN}>Administrateur (Tout accès)</option>
                    <option value={UserRole.BARTENDER}>Barman (Caisse, Cuisine, Stocks)</option>
                    <option value={UserRole.SERVER}>Serveur (Caisse, Tables)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Code PIN (4 chiffres)</label>
                <input type="password" value={pin} onChange={e => setPin(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-bar-accent outline-none font-mono tracking-widest text-lg" placeholder="••••" maxLength={4} />
              </div>
              <div className="flex gap-4 pt-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-white transition-colors">Annuler</button>
                 <button type="submit" className="flex-1 py-4 bg-bar-accent hover:bg-pink-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-bar-accent/20 transition-all">
                    {editingUser ? 'Sauvegarder' : 'Créer le compte'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 backdrop-blur-lg p-4 animate-in fade-in duration-200">
           <div className="bg-slate-900 border border-red-500/30 w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in duration-300">
              <div className="bg-red-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20"><AlertTriangle size={40} className="text-red-500" /></div>
              <h2 className="text-2xl font-black text-white mb-3 italic">SUPPRIMER COMPTE ?</h2>
              <p className="text-slate-400 mb-8 text-sm leading-relaxed font-medium">Ce collaborateur ne pourra plus se connecter au système.</p>
              <div className="flex gap-4">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-4 rounded-2xl border border-slate-700 text-slate-300 font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors">Garder</button>
                <button onClick={confirmDelete} className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black uppercase text-xs tracking-widest hover:bg-red-500 transition-all shadow-lg shadow-red-600/20">Supprimer</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
