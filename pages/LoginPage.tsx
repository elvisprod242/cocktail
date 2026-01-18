
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Beer, ShieldCheck, User as UserIcon, LogIn, Lock, ArrowLeft, Delete, X, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
  users: User[];
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, users }) => {
  const [step, setStep] = useState<'SELECT' | 'PIN'>('SELECT');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setPin('');
    setError(false);
    setStep('PIN');
  };

  const handleBack = () => {
    setStep('SELECT');
    setSelectedUser(null);
    setPin('');
    setError(false);
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const verifyPin = (inputPin: string) => {
    if (!selectedUser) return;
    
    // Si pas de PIN configuré, on laisse passer (ou on définit un PIN par défaut)
    const userPin = selectedUser.pin || '0000';

    if (inputPin === userPin) {
      setIsSuccess(true);
      setTimeout(() => {
        onLogin(selectedUser);
      }, 600);
    } else {
      setError(true);
      setTimeout(() => {
        setPin('');
        setError(false);
      }, 800);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return { label: 'Direction', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
      case UserRole.BARTENDER: return { label: 'Barman', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
      default: return { label: 'Service', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-bar-accent/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-4xl w-full z-10">
        {step === 'SELECT' ? (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-tr from-bar-accent to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-bar-accent/20 mx-auto mb-6 transform hover:rotate-12 transition-transform cursor-pointer">
                <Beer className="text-white" size={40} />
              </div>
              <h1 className="text-4xl font-black text-white italic tracking-tighter mb-2 uppercase">BARFLOW AI</h1>
              <p className="text-slate-500 font-medium tracking-wide">AUTHENTIFICATION PERSONNELLE</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto no-scrollbar p-2">
              {users.map((user) => {
                const badge = getRoleBadge(user.role);
                return (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-3xl flex flex-col items-center text-center hover:border-bar-accent/50 hover:bg-slate-900 transition-all hover:scale-[1.03] shadow-xl"
                  >
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <LogIn size={18} className="text-bar-accent" />
                    </div>
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 mb-4 transition-all group-hover:shadow-lg ${
                      user.role === UserRole.ADMIN ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 group-hover:shadow-purple-500/20' :
                      user.role === UserRole.BARTENDER ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 group-hover:shadow-blue-500/20' :
                      'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 group-hover:shadow-emerald-500/20'
                    }`}>
                      <span className="text-2xl font-black">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <h3 className="text-white font-black text-xl mb-2 italic">{user.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </button>
                );
              })}
              {users.length === 0 && (
                <div className="col-span-full text-center p-12 bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl text-slate-500 italic">
                  Aucun utilisateur configuré par l'administrateur.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto animate-in slide-in-from-bottom-10 fade-in duration-500">
            <button 
              onClick={handleBack}
              className="mb-6 flex items-center gap-2 text-slate-500 hover:text-white transition-all group"
            >
              <div className="p-2 bg-slate-900 rounded-xl group-hover:bg-slate-800 border border-slate-800 group-hover:border-slate-700">
                <ArrowLeft size={20} />
              </div>
              <span className="font-black text-xs uppercase tracking-[0.2em]">Retour au Login</span>
            </button>

            <div className={`bg-slate-900/80 backdrop-blur-xl border-2 p-8 rounded-[40px] shadow-3xl flex flex-col items-center transition-all ${error ? 'border-red-500/50 shake' : isSuccess ? 'border-green-500/50' : 'border-slate-800'}`}>
               <div className="text-center mb-8">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border-2 mx-auto mb-4 ${
                    selectedUser?.role === UserRole.ADMIN ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                    selectedUser?.role === UserRole.BARTENDER ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                    'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    <span className="text-3xl font-black">{selectedUser?.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <h2 className="text-2xl font-black text-white italic">{selectedUser?.name}</h2>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Saisissez votre code PIN</p>
               </div>

               {/* PIN Indicators */}
               <div className="flex gap-4 mb-10">
                  {[0, 1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                        i < pin.length 
                          ? (isSuccess ? 'bg-green-500 border-green-500' : error ? 'bg-red-500 border-red-500 scale-125' : 'bg-bar-accent border-bar-accent scale-110 shadow-[0_0_15px_rgba(233,69,96,0.5)]') 
                          : 'border-slate-700'
                      }`}
                    />
                  ))}
               </div>

               {/* Numeric Pad */}
               <div className="grid grid-cols-3 gap-4 w-full">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button 
                      key={num}
                      onClick={() => handleKeyPress(num.toString())}
                      disabled={isSuccess}
                      className="h-16 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xl font-black hover:bg-slate-800 active:scale-90 transition-all flex items-center justify-center shadow-lg"
                    >
                      {num}
                    </button>
                  ))}
                  <div className="flex items-center justify-center">
                     {isSuccess ? <CheckCircle2 className="text-green-500" size={32} /> : <Lock className="text-slate-800" size={24} />}
                  </div>
                  <button 
                    onClick={() => handleKeyPress('0')}
                    disabled={isSuccess}
                    className="h-16 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xl font-black hover:bg-slate-800 active:scale-90 transition-all flex items-center justify-center shadow-lg"
                  >
                    0
                  </button>
                  <button 
                    onClick={handleDelete}
                    disabled={isSuccess}
                    className="h-16 rounded-2xl bg-slate-800/30 text-slate-500 hover:text-white hover:bg-red-500/20 active:scale-90 transition-all flex items-center justify-center border border-transparent hover:border-red-500/30 shadow-lg"
                  >
                    <Delete size={24} />
                  </button>
               </div>
            </div>

            <p className="text-center mt-8 text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                <ShieldCheck size={14} className="text-slate-500" /> Authentification sécurisée
            </p>
          </div>
        )}
      </div>

      <style>{`
        .shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
};
