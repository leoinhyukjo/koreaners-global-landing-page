"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { useLocale } from "@/contexts/locale-context";
import { getTranslation } from "@/lib/translations";

/**
 * 공통 푸터 — 로고 + 다국어(KR/JP) 대응
 */
export function Footer() {
  const { locale } = useLocale();
  const t = (key: Parameters<typeof getTranslation>[1]) =>
    getTranslation(locale, key);

  return (
    <footer className="py-8 border-t border-white/10 bg-black w-full max-w-full overflow-visible">
      <div className="w-full max-w-full px-6 md:px-12 lg:px-24 overflow-visible">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col items-start gap-4 leading-relaxed">
            <Link
              href="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Logo variant="footer" />
              <span className="font-display font-bold text-lg uppercase tracking-tight text-white">KOREANERS</span>
            </Link>
            <div className="text-xs sm:text-sm text-zinc-200 font-semibold break-keep">
              {t("companyName")}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-zinc-300 break-keep">
              <span className="break-keep">
                {t("ceo")}: {t("ceoName")}
              </span>
              <span className="text-zinc-600">|</span>
              <span className="break-keep">
                {t("bizNo")}: {t("bizNoValue")}
              </span>
              <span className="text-zinc-600">|</span>
              <span className="break-keep">
                {t("address")}: {t("addressValue")}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-zinc-300 break-keep">
              <span>{t("copyright")}</span>
              <Link
                href="/privacy"
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
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
