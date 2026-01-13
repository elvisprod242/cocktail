export enum Category {
  COCKTAIL = 'Cocktails',
  BEER = 'Bières',
  WINE = 'Vins',
  SOFT = 'Softs',
  FOOD = 'Snacks'
}

// Nouvelle interface pour les catégories dynamiques en DB
export interface CategoryDef {
  id: string;
  name: string;
  icon: string; // Nom de l'icône Lucide
}

export interface TableDef {
  id: string;
  name: string;
  zone: string; // 'Salle', 'Terrasse', 'Bar', etc.
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  loyaltyPoints: number;
  totalSpent: number;
  balance: number; // Nouveau: Positif = Crédit, Négatif = Dette (Ardoise)
  lastVisit?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string; // Changé de Category enum à string pour supporter les catégories dynamiques
  image?: string;
  description?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export enum OrderStatus {
  PENDING = 'En attente',
  READY = 'Prêt',
  SERVED = 'Servi',
  PAID = 'Payé'
}

export enum PaymentMethod {
  CASH = 'Espèces',
  CARD = 'Carte Bancaire',
  MOBILE_MONEY = 'Mobile Money',
  TAB = 'Ardoise'
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  timestamp: number;
  tableNumber?: number; 
  tableName?: string; 
  clientId?: string; 
  clientName?: string;
  paymentMethod?: PaymentMethod; // Nouveau
}

export interface SalesData {
  name: string;
  value: number;
}

export interface GeneratedRecipe {
  name: string;
  ingredients: string[];
  instructions: string;
  history: string;
}