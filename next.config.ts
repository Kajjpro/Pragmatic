import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Route-ууд fs-ээр уншдаг файлуудыг production build-д заавал оруулна
  outputFileTracingIncludes: {
    "/api/badges/**": ["./assets/fonts/**"], // тэмдгийн зурагт кирилл фонт
    "/api/staff/**": ["./data/*.json"], // санал хураалтын hook (Dev 2-ийн precomputed.json)
  },
};

export default nextConfig;
