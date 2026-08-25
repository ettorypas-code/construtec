import { requireUser } from "@/lib/auth/guards";
import { ToastProvider } from "@/components/ui/toast";
import { SideNav } from "@/components/layout/side-nav";
import { TopBar } from "@/components/layout/top-bar";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";

/**
 * Shell do painel administrativo.
 *
 * O `pb-24` do conteúdo reserva o espaço da barra inferior no celular; sem ele,
 * o último item de qualquer lista fica embaixo da navegação.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <ToastProvider>
      <div className="flex min-h-dvh">
        <SideNav />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar userName={user.name} />

          <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 sm:pb-10 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>

        <MobileTabBar />
      </div>
    </ToastProvider>
  );
}
