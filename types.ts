export enum Category {
  COCKTAIL = 'Cocktails',
  BEER = 'Bières',
  WINE = 'Vins',
  SOFT = 'Softs',
  FOOD = 'Snacks'
}

export interface CategoryDef {
  id: string;
  name: string;
  icon: string;
}

export interface TableDef {
  id: string;
  name: string;
  zone: string;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  loyaltyPoints: number;
  totalSpent: number;
  balance: number;
  lastVisit?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  costPrice: number;
  stock: number;
  alertThreshold: number; // Nouveau: seuil d'alerte personnalisé
  category: string; 
  image?: string;
  description?: string;
  isAvailable?: boolean; 
}

export interface StockEntry {
  id: number;
  productId: string;
  quantity: number;
  timestamp: number;
  note: string;
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
  paymentMethod?: PaymentMethod; 
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