
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedRecipe } from '../types';

// Fix: Directly initialize GoogleGenAI with process.env.API_KEY as per coding guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
