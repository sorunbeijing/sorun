/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
  // 生产环境由 Vercel 自动处理，无需额外 CORS（前后端同域）
  poweredByHeader: false,
};

export default nextConfig;
