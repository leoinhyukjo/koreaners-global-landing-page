/** @type {import('next').NextConfig} */
const nextConfig = {
  // 메타데이터(탭 제목 등)를 스트리밍 대신 초기 HTML에 포함시켜 'browser tab' 현상 방지
  htmlLimitedBots: /.*/,
  // Turbopack 설정 (Next.js 16 - 루트 레벨에 위치)
  turbopack: {},
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
