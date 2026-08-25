import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

/**
 * Proxy (o antigo `middleware` — renomeado no Next.js 16).
 *
 * Faz apenas a triagem grosseira: quem não tem token válido não chega às rotas
 * internas, e quem já está autenticado não vê a tela de login. A autorização de
 * verdade — papel, propriedade do registro, usuário desativado — é decidida no
 * servidor por `requireUser`/`requireRole`, que consultam o banco.
 *
 * Isso é proposital: proxy não deve depender de banco, e uma checagem aqui não
 * é fronteira de segurança para requisições que não passam pela navegação.
 */

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/crm",
  "/clientes",
  "/vistorias",
  "/propostas",
  "/orcamentos",
  "/obras",
  "/agenda",
  "/financeiro",
  "/biblioteca",
  "/configuracoes",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Tudo, menos assets estáticos, imagens otimizadas e arquivos com extensão.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
