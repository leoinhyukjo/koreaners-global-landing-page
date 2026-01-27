export function Footer() {
  return (
    <footer className="py-8 border-t border-zinc-700/50 bg-zinc-900">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Left-aligned Layout */}
          <div className="flex flex-col items-start gap-4">
            {/* Brand Logo */}
            <div className="text-2xl font-black">
              <span className="text-white">KOREANERS GLOBAL</span>
            </div>

            {/* Business Information */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-zinc-300 break-keep">
              <span className="break-keep">대표: 정태원</span>
              <span className="text-zinc-600">|</span>
              <span className="break-keep">사업자등록번호: 549-07-00178</span>
              <span className="text-zinc-600">|</span>
              <span className="break-keep">주소: 서울 강남구 논현로36길 31, B1, 4F, 5F</span>
            </div>

            {/* Copyright */}
            <div className="text-xs sm:text-sm text-zinc-300 break-keep">
              © 2025 Koreaners Global. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
