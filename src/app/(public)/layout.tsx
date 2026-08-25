import Link from "next/link";
import { LogIn } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { landings } from "@/content/landings";

/** Shell das páginas públicas. Sem sessão, sem navegação de aplicação. */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="sticky top-0 z-30 border-b border-ink-200 bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-5 sm:px-6">
          <Link href="/">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-5 md:flex">
            {landings.map((landing) => (
              <Link
                key={landing.slug}
                href={`/${landing.slug}`}
                className="text-sm text-ink-600 transition-colors hover:text-ink-900"
              >
                {landing.eyebrow}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Entrada do painel. Discreta de propósito: o visitante não precisa
                dela, mas quem opera o sistema abre esta tela todo dia e não deve
                ter que rolar até o rodapé. */}
            <Link
              href="/login"
              className="inline-flex h-9 items-center gap-1.5 rounded-control px-2.5 text-sm text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
            >
              <LogIn className="size-4" />
              <span className="hidden sm:inline">Entrar</span>
            </Link>

            <a
              href="#agendar"
              className="inline-flex h-9 items-center rounded-control bg-brand-600 px-3.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Agendar
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-ink-200 bg-surface">
        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
            <div>
              <Logo />
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-500">
                Vistoria, orçamento e gestão de obra para quem precisa de alguém que entenda de
                canteiro.
              </p>
            </div>

            <nav className="grid gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                Serviços
              </p>
              {landings.map((landing) => (
                <Link
                  key={landing.slug}
                  href={`/${landing.slug}`}
                  className="text-sm text-ink-600 transition-colors hover:text-ink-900"
                >
                  {landing.eyebrow}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-ink-100 pt-6 text-xs text-ink-400 sm:flex-row sm:justify-between">
            <p>© {new Date().getFullYear()} Construtec</p>
            <div className="flex gap-4">
              <Link href="/privacidade" className="transition-colors hover:text-ink-700">
                Política de privacidade
              </Link>
              <Link href="/login" className="transition-colors hover:text-ink-700">
                Área restrita
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
