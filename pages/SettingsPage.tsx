import React from 'react';
import { Settings, Download, Trash2, Info, Database, AlertTriangle, Coins } from 'lucide-react';
import { resetDatabase, getOrders } from '../services/db';
import { CURRENCIES } from '../constants';

interface SettingsPageProps {
  currentCurrency: string;
  onCurrencyChange: (symbol: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ currentCurrency, onCurrencyChange }) => {
  
  const handleExportOrders = () => {
    const orders = getOrders();
    const dataStr = JSON.stringify(orders, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `barflow_orders_${new Date().toISOString().split('T')[0]}.json`;
    link.href = url;
    link.click();
  };

  const handleReset = () => {
    if (window.confirm("ATTENTION : Toutes les données (commandes, produits, catégories) seront effacées. L'application reviendra à son état initial.\n\nVoulez-vous continuer ?")) {
      resetDatabase();
    }
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-950">
      <div className="max-w-4xl mx-auto pb-24 md:pb-0">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Settings className="text-bar-accent" />
          Paramètres
        </h1>
        <p className="text-slate-400 mb-8">Gérez la configuration et les données de votre établissement.</p>

        <div className="grid gap-6">
          
          {/* Section Préférences */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
              <div className="bg-green-500/10 p-2 rounded-lg text-green-500">
                <Coins size={24} />
              </div>
              <h2 className="text-xl font-bold text-white">Localisation & Devise</h2>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                   <h3 className="text-white font-medium mb-1">Devise principale</h3>
                   <p className="text-sm text-slate-400">Choisissez le symbole monétaire utilisé dans l'application.</p>
                </div>
                <div>
                   <select 
                    value={currentCurrency}
                    onChange={(e) => onCurrencyChange(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-bar-accent outline-none cursor-pointer"
                   >
                     {CURRENCIES.map(c => (
                       <option key={c.code} value={c.symbol}>
                         {c.name} ({c.code} - {c.symbol})
                       </option>
                     ))}
                   </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section Informations */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-lg text-blue-500">
                <Info size={24} />
              </div>
              <h2 className="text-xl font-bold text-white">À propos</h2>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                   <p className="text-sm text-slate-400 mb-1">Nom de l'application</p>
                   <p className="text-white font-medium">BarFlow AI</p>
                </div>
                <div>
                   <p className="text-sm text-slate-400 mb-1">Version</p>
                   <p className="text-white font-medium">1.0.1 (Bêta)</p>
                </div>
                <div>
                   <p className="text-sm text-slate-400 mb-1">Stockage</p>
                   <p className="text-white font-medium">SQLite (Local Browser Storage)</p>
                </div>
                <div>
                   <p className="text-sm text-slate-400 mb-1">Licence</p>
                   <p className="text-white font-medium">Standard</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section Gestion des Données */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
              <div className="bg-purple-500/10 p-2 rounded-lg text-purple-500">
                <Database size={24} />
              </div>
              <h2 className="text-xl font-bold text-white">Gestion des Données</h2>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-800/50">
                <div>
                  <h3 className="text-white font-medium mb-1">Exporter l'historique des commandes</h3>
                  <p className="text-sm text-slate-400">Téléchargez un fichier JSON contenant toutes les commandes passées.</p>
                </div>
                <button 
                  onClick={handleExportOrders}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700 font-medium"
                >
                  <Download size={18} />
                  Exporter JSON
                </button>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-red-400 font-medium mb-1 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    Zone de Danger
                  </h3>
                  <p className="text-sm text-slate-400">Réinitialiser l'application effacera toutes les catégories, produits et commandes.</p>
                </div>
                <button 
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-lg transition-all border border-red-500/20 font-medium"
                >
                  <Trash2 size={18} />
                  Réinitialiser tout
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};