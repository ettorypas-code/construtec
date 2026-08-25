import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const redirectParam = searchParams.redirect;
  const redirectTo = typeof redirectParam === "string" ? redirectParam : undefined;

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-paper px-5 py-12">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo markClassName="size-10" showWordmark={false} />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink-900">Construtec</h1>
            <p className="mt-1 text-sm text-ink-500">
              Captar, vender, executar, documentar e cobrar.
            </p>
          </div>
        </div>

        <div className="rounded-card border border-ink-200 bg-surface p-5 shadow-subtle sm:p-6">
          <LoginForm redirectTo={redirectTo} />
        </div>

        <p className="mt-6 text-center text-xs text-ink-400">
          <Link href="/" className="transition-colors hover:text-ink-700">
            Voltar ao site
          </Link>
        </p>
      </div>
    </main>
  );
}
