"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Plus } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils/cn";
import { allNavItems, isActivePath } from "./nav";
import { logoutAction } from "@/app/(auth)/login/actions";

/**
 * Atalhos de criação.
 *
 * Todos apontam para rotas que existem. Criações feitas por folha (compromisso,
 * recebimento) levam à tela do módulo, onde o botão de criar está visível.
 */
const quickActions = [
  { href: "/crm/novo", label: "Novo lead" },
  { href: "/vistorias/nova", label: "Nova vistoria" },
  { href: "/propostas/nova", label: "Nova proposta" },
  { href: "/clientes/novo", label: "Novo cliente" },
  { href: "/financeiro", label: "Lançar recebimento" },
];

export function TopBar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const current = allNavItems.find((item) => isActivePath(pathname, item.href));

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-ink-200 bg-surface/95 px-4 backdrop-blur sm:px-6">
        <Link href="/dashboard" className="lg:hidden">
          <Logo showWordmark={false} markClassName="size-7" />
        </Link>

        <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink-800 lg:text-base">
          {current?.label ?? "Construtec"}
        </p>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-control bg-brand-600 px-3 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Novo</span>
        </button>

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-control px-2 text-sm text-ink-600 transition-colors hover:bg-ink-100"
          aria-label="Menu da conta"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-ink-800 text-xs font-semibold text-white">
            {initials(userName)}
          </span>
          <ChevronDown className="size-4 text-ink-400" />
        </button>
      </header>

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Criar">
        <ul className="space-y-1">
          {quickActions.map((action) => (
            <li key={action.href}>
              <Link
                href={action.href}
                onClick={() => setCreateOpen(false)}
                className="flex h-touch-lg items-center gap-3 rounded-control px-3 text-sm text-ink-700 transition-colors hover:bg-ink-50"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <Plus className="size-4" />
                </span>
                {action.label}
              </Link>
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title={userName}>
        <ul className="space-y-1">
          <li>
            <Link
              href="/configuracoes"
              onClick={() => setMenuOpen(false)}
              className={cn(
                "flex h-touch-lg items-center gap-3 rounded-control px-3 text-sm transition-colors",
                "text-ink-700 hover:bg-ink-50",
              )}
            >
              Configurações da empresa
            </Link>
          </li>
          <li>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex h-touch-lg w-full items-center gap-3 rounded-control px-3 text-sm text-danger transition-colors hover:bg-danger-soft"
              >
                <LogOut className="size-4" />
                Sair
              </button>
            </form>
          </li>
        </ul>
      </Sheet>
    </>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
