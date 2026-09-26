import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Route-ууд fs-ээр уншдаг файлуудыг production build-д заавал оруулна
  outputFileTracingIncludes: {
    "/api/badges/**": ["./assets/fonts/**"], // тэмдгийн зурагт кирилл фонт
    "/api/staff/**": ["./data/*.json"], // санал хураалтын hook (Dev 2-ийн precomputed.json)
    "/api/parliament/**": ["./data/snapshots/**"], // DB хоосон үеийн нөөц (npm run discover)
    "/api/drafts": ["./data/snapshots/**"],
  },

  // Питчийн слайд: /pitch гэж богино бичихэд public/pitch/index.html нээгдэнэ
  async rewrites() {
    return [{ source: "/pitch", destination: "/pitch/index.html" }];
  },
};

export default nextConfig;
