import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O renderizador de PDF traz binários de fonte e usa APIs de Node que não
  // sobrevivem ao empacotamento. Mantê-lo externo evita erro em tempo de build.
  serverExternalPackages: ["@react-pdf/renderer"],

  images: {
    // As fotos de vistoria são servidas por rota autenticada, não pelo
    // otimizador — que não tem como enviar o cookie de sessão.
    unoptimized: true,
  },

  experimental: {
    serverActions: {
      // Uploads passam por /api/upload; as actions só carregam texto.
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
