import React, { useState } from 'react';
import { generateCocktailRecipe } from '../services/geminiService';
import { GeneratedRecipe } from '../types';
import { Sparkles, Loader2, Wine, ScrollText, History } from 'lucide-react';

export const InventoryAI: React.FC = () => {
  const [ingredients, setIngredients] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!ingredients.trim()) return;
    setLoading(true);
    setError('');
    setRecipe(null);
    try {
      const result = await generateCocktailRecipe(ingredients);
      setRecipe(result);
    } catch (err) {
      setError("Oups, l'IA a un peu trop bu... Réessayez plus tard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-950 flex flex-col items-center pb-24 md:pb-8">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-bar-accent/20 rounded-full mb-4">
            <Sparkles className="text-bar-accent w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Mixologue IA</h1>
          <p className="text-slate-400">Entrez les ingrédients dont vous disposez, et laissez l'IA inventer votre prochain cocktail signature.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
          <label className="block text-slate-300 font-medium mb-2">Vos Ingrédients</label>
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="Ex: Rhum, Ananas, Lait de coco, Tabasco..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-bar-accent focus:border-transparent min-h-[100px] mb-4"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !ingredients.trim()}
            className="w-full py-4 bg-gradient-to-r from-bar-accent to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-bar-accent/25 hover:shadow-bar-accent/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Inventer un Cocktail
              </>
            )}
          </button>
          {error && <p className="text-red-400 mt-3 text-center text-sm">{error}</p>}
        </div>

        {recipe && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-500">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 border-b border-slate-700 flex items-center gap-4">
              <div className="bg-slate-700 p-3 rounded-xl">
                 <Wine className="text-bar-accent w-8 h-8" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">{recipe.name}</h2>
            </div>
            
            <div className="p-6 md:p-8 grid gap-8">
              <div>
                <h3 className="text-bar-accent font-bold uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
                  <ScrollText size={16} /> Ingrédients
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-300 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                      <span className="w-2 h-2 bg-bar-accent rounded-full"></span>
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                   <h3 className="text-bar-accent font-bold uppercase tracking-wider text-sm mb-4">Instructions</h3>
                   <p className="text-slate-300 leading-relaxed whitespace-pre-line">{recipe.instructions}</p>
                </div>
                <div className="bg-slate-950/30 p-6 rounded-xl border border-slate-800/50 italic">
                   <h3 className="text-bar-accent font-bold uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
                     <History size={16} /> L'Histoire (Fictive)
                   </h3>
                   <p className="text-slate-400 text-sm leading-relaxed">"{recipe.history}"</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};