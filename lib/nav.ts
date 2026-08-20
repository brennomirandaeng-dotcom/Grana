import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  CreditCard,
  PieChart,
  Tags,
  Target,
  TrendingUp,
  Building2,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Lançamentos", href: "/lancamentos", icon: ArrowLeftRight },
  { label: "Contas", href: "/contas", icon: Landmark },
  { label: "Cartões", href: "/cartoes", icon: CreditCard },
  { label: "Orçamento", href: "/orcamento", icon: PieChart },
  { label: "Categorias", href: "/categorias", icon: Tags },
  { label: "Metas", href: "/metas", icon: Target },
  { label: "Investimentos", href: "/investimentos", icon: TrendingUp },
  { label: "Patrimônio", href: "/patrimonio", icon: Building2 },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
];

export const MOBILE_NAV_ITEMS: NavItem[] = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[3],
  NAV_ITEMS[10],
];
