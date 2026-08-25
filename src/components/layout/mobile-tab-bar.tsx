"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Sheet } from "@/components/ui/sheet";
import { isActivePath, primaryNavItems, secondaryNavItems } from "./nav";

/**
 * Barra inferior do celular. Quatro destinos fixos e um botão "Mais".
 *
 * Quatro porque é o que cabe com alvo de toque confortável em telas de 360px, e
 * porque durante o trabalho de campo só quatro destinos importam de verdade:
 * o dia, a agenda, o funil e a vistoria em andamento.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = secondaryNavItems.some((item) => isActivePath(pathname, item.href));

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-surface/95 backdrop-blur pb-safe lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {primaryNavItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] transition-colors",
                    active ? "text-brand-700" : "text-ink-500",
                  )}
                >
                  <item.icon className={cn("size-5", active && "text-brand-600")} />
                  {item.label}
                </Link>
              </li>
            );
          })}

          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex h-16 w-full flex-col items-center justify-center gap-1 text-[0.6875rem] transition-colors",
                moreActive ? "text-brand-700" : "text-ink-500",
              )}
            >
              <MoreHorizontal className={cn("size-5", moreActive && "text-brand-600")} />
              Mais
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Mais">
        <ul className="space-y-1">
          {secondaryNavItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex h-touch-lg items-center gap-3 rounded-control px-3 text-sm transition-colors",
                    active
                      ? "bg-brand-50 font-medium text-brand-700"
                      : "text-ink-700 hover:bg-ink-50",
                  )}
                >
                  <item.icon className={cn("size-5", active ? "text-brand-600" : "text-ink-400")} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </>
  );
}
