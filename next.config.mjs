/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false, // 빌드 에러를 확인하기 위해 false로 변경 권장
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Vercel 배포 최적화
  experimental: {
    optimizePackageImports: ['@blocknote/react', 'lucide-react'],
    // Turbopack 설정 추가 (Next.js 16 호환)
    turbopack: {},
  },
  // BlockNote 관련 빌드 최적화
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 클라이언트 사이드에서만 BlockNote 사용
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },
}

export default nextConfig
