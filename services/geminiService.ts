import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedRecipe } from '../types';

// Access API Key safely to prevent crashes in environments where process is undefined
const getApiKey = () => {
  try {
    // Check if process exists before accessing env to avoid ReferenceError in browser
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY;
    }
    return undefined;
  } catch (e) {
    console.warn("API_KEY environment variable not found");
    return undefined;
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const generateCocktailRecipe = async (ingredients: string): Promise<GeneratedRecipe> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Crée une recette de cocktail unique et délicieuse (et si possible avec un nom amusant) en utilisant principalement ces ingrédients : ${ingredients}. Si les ingrédients sont incohérents, propose quelque chose de créatif quand même.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            ingredients: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            instructions: { type: Type.STRING },
            history: { type: Type.STRING, description: "Une courte histoire fictive ou réelle amusante sur ce cocktail" }
          },
          required: ["name", "ingredients", "instructions", "history"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as GeneratedRecipe;
  } catch (error) {
    console.error("Error generating recipe:", error);
    throw error;
  }
};