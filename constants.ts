import { Category, Product } from './types';

export const INITIAL_MENU: Product[] = [
  { id: '1', name: 'Mojito', price: 10, category: Category.COCKTAIL, image: 'https://picsum.photos/200/200?random=1', description: 'Menthe fraîche, citron vert, rhum blanc, soda.' },
  { id: '2', name: 'Old Fashioned', price: 12, category: Category.COCKTAIL, image: 'https://picsum.photos/200/200?random=2', description: 'Bourbon, angostura bitters, sucre.' },
  { id: '3', name: 'Pinte Blonde', price: 7, category: Category.BEER, image: 'https://picsum.photos/200/200?random=3', description: 'Lager légère et rafraîchissante.' },
  { id: '4', name: 'IPA Artisanale', price: 9, category: Category.BEER, image: 'https://picsum.photos/200/200?random=4', description: 'Notes agrumes et amertume prononcée.' },
  { id: '5', name: 'Chardonnay', price: 8, category: Category.WINE, image: 'https://picsum.photos/200/200?random=5', description: 'Vin blanc sec et fruité.' },
  { id: '6', name: 'Coca Cola', price: 4, category: Category.SOFT, image: 'https://picsum.photos/200/200?random=6' },
  { id: '7', name: 'Nachos', price: 12, category: Category.FOOD, image: 'https://picsum.photos/200/200?random=7', description: 'Guacamole, salsa, fromage fondu.' },
  { id: '8', name: 'Planche Mixte', price: 18, category: Category.FOOD, image: 'https://picsum.photos/200/200?random=8', description: 'Charcuteries et fromages affinés.' },
  { id: '9', name: 'Espresso Martini', price: 13, category: Category.COCKTAIL, image: 'https://picsum.photos/200/200?random=9', description: 'Vodka, liqueur de café, espresso frais.' },
  { id: '10', name: 'Jus d\'Orange', price: 5, category: Category.SOFT, image: 'https://picsum.photos/200/200?random=10' },
];

export const MOCK_SALES_DATA_WEEK = [
  { name: 'Lun', value: 1200 },
  { name: 'Mar', value: 1500 },
  { name: 'Mer', value: 1800 },
  { name: 'Jeu', value: 2400 },
  { name: 'Ven', value: 4500 },
  { name: 'Sam', value: 5200 },
  { name: 'Dim', value: 3100 },
];

export const MOCK_SALES_DATA_MONTH = [
  { name: 'Sem 1', value: 12500 },
  { name: 'Sem 2', value: 14200 },
  { name: 'Sem 3', value: 13800 },
  { name: 'Sem 4', value: 16100 },
];

export const MOCK_SALES_DATA_YEAR = [
  { name: 'Jan', value: 45000 },
  { name: 'Fév', value: 42000 },
  { name: 'Mar', value: 48000 },
  { name: 'Avr', value: 51000 },
  { name: 'Mai', value: 55000 },
  { name: 'Juin', value: 62000 },
  { name: 'Juil', value: 68000 },
  { name: 'Août', value: 64000 },
  { name: 'Sep', value: 58000 },
  { name: 'Oct', value: 52000 },
  { name: 'Nov', value: 49000 },
  { name: 'Déc', value: 75000 },
];

// Alias pour compatibilité
export const MOCK_SALES_DATA = MOCK_SALES_DATA_WEEK;
