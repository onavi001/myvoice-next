import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  webpack: (config) => {
    config.module.rules.push({
      test: /\.html$/,
      issuer: /node_modules/,
      type: "asset/resource",
      generator: {
        emit: false, // Evita que Next.js emita estos archivos
      },
    });
    return config;
  },
};

export default nextConfig;
