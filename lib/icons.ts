import {
  Wallet,
  Briefcase,
  TrendingUp,
  Plus,
  UtensilsCrossed,
  Home,
  Car,
  HeartPulse,
  GraduationCap,
  PartyPopper,
  ShoppingBag,
  Repeat,
  Receipt,
  Plane,
  MoreHorizontal,
  Circle,
  Gift,
  Dumbbell,
  Baby,
  PawPrint,
  Smartphone,
  Fuel,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Wallet,
  Briefcase,
  TrendingUp,
  Plus,
  UtensilsCrossed,
  Home,
  Car,
  HeartPulse,
  GraduationCap,
  PartyPopper,
  ShoppingBag,
  Repeat,
  Receipt,
  Plane,
  MoreHorizontal,
  Circle,
  Gift,
  Dumbbell,
  Baby,
  PawPrint,
  Smartphone,
  Fuel,
  Wrench,
};

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS);

export function getCategoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[name] ?? Circle;
}
