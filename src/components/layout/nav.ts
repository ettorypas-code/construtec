import type { LucideIcon } from "lucide-react";
import {
  BookMarked,
  Calendar,
  ClipboardCheck,
  Calculator,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Aparece na barra inferior do celular. Máximo de quatro, além de "Mais". */
  primary?: boolean;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

/**
 * Navegação do painel.
 *
 * A ordem segue o ciclo do trabalho — captar, vender, executar, cobrar — e não
 * a ordem alfabética nem a ordem em que os módulos foram construídos.
 */
export const navGroups: NavGroup[] = [
  {
    title: "Operação",
    items: [
      { href: "/dashboard", label: "Início", icon: LayoutDashboard, primary: true },
      { href: "/agenda", label: "Agenda", icon: Calendar, primary: true },
    ],
  },
  {
    title: "Comercial",
    items: [
      { href: "/crm", label: "CRM", icon: Users, primary: true },
      { href: "/clientes", label: "Clientes", icon: BookMarked },
      { href: "/propostas", label: "Propostas", icon: FileText },
      { href: "/orcamentos", label: "Orçamentos", icon: Calculator },
    ],
  },
  {
    title: "Execução",
    items: [
      { href: "/vistorias", label: "Vistorias", icon: ClipboardCheck, primary: true },
      // Obras/fiscalização é Fase 2 (ver ARQUITETURA.md). O schema já suporta,
      // mas não há tela — e link para rota inexistente é pior que ausência.
    ],
  },
  {
    title: "Gestão",
    items: [
      { href: "/financeiro", label: "Financeiro", icon: Wallet },
      { href: "/biblioteca", label: "Biblioteca", icon: BookMarked },
      { href: "/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
];

export const allNavItems: NavItem[] = navGroups.flatMap((group) => group.items);

export const primaryNavItems: NavItem[] = allNavItems.filter((item) => item.primary);

export const secondaryNavItems: NavItem[] = allNavItems.filter((item) => !item.primary);

/** Casa a rota atual com o item de navegação mais específico. */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
