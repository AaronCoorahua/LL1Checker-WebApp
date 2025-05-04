import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignora errores de ESLint al construir
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ...otras opciones
};

export default nextConfig;
