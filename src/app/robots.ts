import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // O painel, os links de proposta por token e a API nunca devem ser indexados.
      disallow: ["/dashboard", "/crm", "/clientes", "/vistorias", "/propostas", "/orcamentos", "/agenda", "/financeiro", "/biblioteca", "/configuracoes", "/login", "/p/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
