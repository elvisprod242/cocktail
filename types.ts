export enum Category {
  COCKTAIL = 'Cocktails',
  BEER = 'Bières',
  WINE = 'Vins',
  SOFT = 'Softs',
  FOOD = 'Snacks'
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
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

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  timestamp: number;
  tableNumber?: number;
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
