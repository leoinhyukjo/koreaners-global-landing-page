"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { useLocale } from "@/contexts/locale-context";
import { getTranslation } from "@/lib/translations";
import { AuroraBackground } from "@/components/ui/aurora-background";

/**
 * 공통 푸터 — 로고 + 다국어(KR/JP) 대응
 */
export function Footer() {
  const { locale } = useLocale();
  const t = (key: Parameters<typeof getTranslation>[1]) =>
    getTranslation(locale, key);

  return (
    <footer className="py-8 border-t border-border bg-background w-full max-w-full overflow-hidden relative">
      <AuroraBackground
        blobs={[
          { color: 'rgba(255,69,0,0.06)', size: 300, top: '50%', left: '-5%', animation: 'aurora-float', duration: '20s' },
        ]}
        withDotPattern={false}
      />
      <div className="relative z-10 w-full max-w-full px-6 md:px-12 lg:px-24">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col items-start gap-4 leading-relaxed">
            <Link
              href="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Logo variant="footer" />
              <span className="font-display font-bold text-lg uppercase tracking-tight text-white">KOREANERS</span>
            </Link>
            <div className="text-xs sm:text-sm text-white/80 font-semibold break-keep">
              {t("companyName")}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-white/60 break-keep">
              <span className="break-keep">
                {t("ceo")}: {t("ceoName")}
              </span>
              <span className="text-white/30">|</span>
              <span className="break-keep">
                {t("bizNo")}: {t("bizNoValue")}
              </span>
              <span className="text-white/30">|</span>
              <span className="break-keep">
                {t("address")}: {t("addressValue")}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-white/60 break-keep">
              <span>{t("copyright")}</span>
              <Link
                href="/privacy"
                className="text-white/50 hover:text-[#FF4500] transition-colors duration-200"
              >
                {locale === "ja" ? "プライバシーポリシー" : "개인정보처리방침"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
