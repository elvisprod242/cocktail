import { 
  Martini, Beer, Wine, GlassWater, Utensils, 
  Coffee, Pizza, Drumstick, Cake, IceCream, 
  Apple, Sandwich, Croissant, Soup, Cigarette, 
  Shapes 
} from 'lucide-react';

export const ICON_MAP: Record<string, any> = {
  Martini, Beer, Wine, GlassWater, Utensils,
  Coffee, Pizza, Drumstick, Cake, IceCream, 
  Apple, Sandwich, Croissant, Soup, Cigarette
};

export const getIconComponent = (iconName: string) => {
  return ICON_MAP[iconName] || Shapes;
};