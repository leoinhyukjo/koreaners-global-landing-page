"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { ConsentModal } from "@/components/consent-modal";
import { useLocale } from "@/contexts/locale-context";
import { getTranslation } from "@/lib/translations";
import { postWithCsrf } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";

export function FooterCTA() {
  const { locale } = useLocale();
  const t = (key: Parameters<typeof getTranslation>[1]) =>
    getTranslation(locale, key);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    position: "",
    email: "",
    phone: "",
    message: "",
    privacyConsent: false,
    marketingConsent: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [marketingModalOpen, setMarketingModalOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.privacyConsent) {
      toast({
        title: t("toastRequiredConsent"),
        description: t("toastRequiredConsentDesc"),
        variant: "destructive",
      });
      return;
    }

    if (!formData.name?.trim()) {
      toast({
        title: t("toastInputError"),
        description: t("toastNameRequired"),
        variant: "destructive",
      });
      return;
    }
    if (!formData.company?.trim()) {
      toast({
        title: t("toastInputError"),
        description: t("toastCompanyRequired"),
        variant: "destructive",
      });
      return;
    }
    if (!formData.position?.trim()) {
      toast({
        title: t("toastInputError"),
        description: t("toastPositionRequired"),
        variant: "destructive",
      });
      return;
    }
    if (!formData.email || !formData.email.trim()) {
      toast({
        title: t("toastInputError"),
        description: t("toastEmailRequired"),
        variant: "destructive",
      });
      return;
    }
    if (!formData.email.includes("@")) {
      toast({
        title: t("toastInputError"),
        description: t("toastEmailInvalid"),
        variant: "destructive",
      });
      return;
    }

    const cleanPhone = formData.phone.replace(/[^0-9]/g, "");
    if (!cleanPhone || cleanPhone.length === 0) {
      toast({
        title: t("toastInputError"),
        description: t("toastPhoneRequired"),
        variant: "destructive",
      });
      return;
    }
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      toast({
        title: t("toastInputError"),
        description: t("toastPhoneInvalid"),
        variant: "destructive",
      });
      return;
    }
    if (!formData.message?.trim()) {
      toast({
        title: t("toastInputError"),
        description: t("toastMessageRequired"),
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // DB에 저장할 데이터 준비
      // 필드명은 DB 스키마와 정확히 일치해야 합니다.
      const insertData: Record<string, any> = {
        name: formData.name.trim(),
        company: formData.company.trim(),
        position: formData.position.trim(),
        email: formData.email.trim(),
        phone: cleanPhone,
        message: formData.message.trim(),
        privacy_agreement: formData.privacyConsent,
        marketing_agreement: formData.marketingConsent,
      };

      const { data, error } = await supabase
        .from("inquiries")
        .insert(insertData);

      if (error) {
        if (process.env.NODE_ENV === "development") {
          console.error(
            "[Footer CTA] Error code:",
            error.code,
            "message:",
            error.message,
          );
        }
        throw error;
      }

      // Meta Pixel Lead 이벤트
      if (typeof window.fbq === "function") {
        window.fbq("track", "Lead");
      }

      // 성공 Dialog 표시
      setSuccessDialogOpen(true);

      sonnerToast.success(t("toastSuccessTitle"), {
        description: t("toastSuccessDesc"),
        duration: 5000,
      });

      // Notion에 데이터 저장 (비동기, 실패해도 사용자 경험에 영향 없음)
      // CSRF 토큰 자동 포함
      try {
        await postWithCsrf("/api/notion", insertData);
      } catch (notionError: any) {
        if (process.env.NODE_ENV === "development") {
          console.error(
            "[Footer CTA] Notion 요청 예외:",
            notionError?.message ?? "",
          );
        }
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("[Footer CTA] Submit error:", error?.message ?? "");
      }

      let errorMessage = t("toastErrorDefault");

      if (error) {
        if (error.message) {
          errorMessage = error.message;
        }

        // Supabase 에러의 경우 details와 hint 추가
        if (error.details) {
          errorMessage += `\n\n상세: ${error.details}`;
        }
        if (error.hint) {
          errorMessage += `\n\n힌트: ${error.hint}`;
        }
        if (error.code) {
          errorMessage += `\n\n에러 코드: ${error.code}`;
        }
      }

      toast({
        title: t("toastErrorTitle"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  return (
    <section className="bg-[#111] py-24 md:py-32 lg:py-40 px-6 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-16 items-start">
          {/* Left: heading + description */}
          <div>
            <h2 className="font-display font-black text-6xl lg:text-8xl uppercase text-white leading-[0.85]">
              LET&apos;S<br />
              <span className="font-accent italic text-[#FF4500]">TALK</span>
            </h2>
            <p className="text-base text-white/60 mt-8 leading-relaxed">
              {t("footerCtaDesc1")} {t("footerCtaDesc2")} {t("footerCtaDesc3")}
            </p>
            <p className="text-sm text-white/40 mt-4">leo@koreaners.com</p>
          </div>

          {/* Right: form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Name, Company, Position */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="footer-name"
                  className="block text-xs uppercase tracking-wider text-white/40 mb-2"
                >
                  {t("formName")} <span className="text-white/60">*</span>
                </label>
                <input
                  type="text"
                  id="footer-name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b border-white/20 text-white py-3 focus:border-white transition-colors duration-300 outline-none placeholder:text-white/20"
                  placeholder={t("formPlaceholderName")}
                />
              </div>

              <div>
                <label
                  htmlFor="footer-company"
                  className="block text-xs uppercase tracking-wider text-white/40 mb-2"
                >
                  {t("formCompany")} <span className="text-white/60">*</span>
                </label>
                <input
                  type="text"
                  id="footer-company"
                  name="company"
                  required
                  autoComplete="organization"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b border-white/20 text-white py-3 focus:border-white transition-colors duration-300 outline-none placeholder:text-white/20"
                  placeholder={t("formPlaceholderCompany")}
                />
              </div>

              <div>
                <label
                  htmlFor="footer-position"
                  className="block text-xs uppercase tracking-wider text-white/40 mb-2"
                >
                  {t("formPosition")} <span className="text-white/60">*</span>
                </label>
                <input
                  type="text"
                  id="footer-position"
                  name="position"
                  required
                  autoComplete="organization-title"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b border-white/20 text-white py-3 focus:border-white transition-colors duration-300 outline-none placeholder:text-white/20"
                  placeholder={t("formPlaceholderPosition")}
                />
              </div>
            </div>

            {/* Row 2: Email, Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="footer-email"
                  className="block text-xs uppercase tracking-wider text-white/40 mb-2"
                >
                  {t("formEmail")} <span className="text-white/60">*</span>
                </label>
                <input
                  type="email"
                  id="footer-email"
                  name="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b border-white/20 text-white py-3 focus:border-white transition-colors duration-300 outline-none placeholder:text-white/20"
                  placeholder="example@domain.com"
                />
              </div>

              <div>
                <label
                  htmlFor="footer-phone"
                  className="block text-xs uppercase tracking-wider text-white/40 mb-2"
                >
                  {t("formPhone")} <span className="text-white/60">*</span>
                </label>
                <input
                  type="tel"
                  id="footer-phone"
                  name="phone"
                  required
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setFormData({ ...formData, phone: value });
                  }}
                  className="w-full bg-transparent border-b border-white/20 text-white py-3 focus:border-white transition-colors duration-300 outline-none placeholder:text-white/20"
                  placeholder={t("formPlaceholderPhone")}
                />
                <p className="mt-1.5 text-xs text-white/30">
                  {t("formPhoneHint")}
                </p>
              </div>
            </div>

            {/* Row 3: Message */}
            <div>
              <label
                htmlFor="footer-message"
                className="block text-xs uppercase tracking-wider text-white/40 mb-2"
              >
                {t("formMessage")} <span className="text-white/60">*</span>
              </label>
              <textarea
                id="footer-message"
                name="message"
                required
                rows={4}
                value={formData.message}
                onChange={handleChange}
                className="w-full bg-transparent border-b border-white/20 text-white py-3 focus:border-white transition-colors duration-300 outline-none placeholder:text-white/20 resize-none"
                placeholder={t("formPlaceholderMessage")}
              />
            </div>

            {/* Row 4: Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="footer-privacyConsent"
                  name="privacyConsent"
                  checked={formData.privacyConsent}
                  onChange={handleChange}
                  className="w-5 h-5 rounded-none border-2 border-white/30 bg-transparent checked:bg-white checked:border-white focus:ring-2 focus:ring-white transition-all cursor-pointer shrink-0"
                />
                <label
                  htmlFor="footer-privacyConsent"
                  className="flex-1 cursor-pointer group"
                >
                  <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setPrivacyModalOpen(true);
                      }}
                      className="text-white/80 underline hover:no-underline focus:outline-none"
                    >
                      {t("formPrivacyLabel")}
                    </button>{" "}
                    <span className="text-white/60">*</span>
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="footer-marketingConsent"
                  name="marketingConsent"
                  checked={formData.marketingConsent}
                  onChange={handleChange}
                  className="w-5 h-5 rounded-none border-2 border-white/30 bg-transparent checked:bg-white checked:border-white focus:ring-2 focus:ring-white transition-all cursor-pointer shrink-0"
                />
                <label
                  htmlFor="footer-marketingConsent"
                  className="flex-1 cursor-pointer group"
                >
                  <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setMarketingModalOpen(true);
                      }}
                      className="text-white/80 underline hover:no-underline focus:outline-none"
                    >
                      {t("formMarketingLabel")}
                    </button>
                  </span>
                </label>
              </div>
            </div>

            {/* Consent Modals */}
            <ConsentModal
              open={privacyModalOpen}
              onOpenChange={setPrivacyModalOpen}
              type="privacy"
            />
            <ConsentModal
              open={marketingModalOpen}
              onOpenChange={setMarketingModalOpen}
              type="marketing"
            />

            {/* Success Dialog */}
            <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
              <DialogContent className="sm:max-w-md bg-[#111] backdrop-blur-md border border-white/10 rounded-none shadow-xl [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:hover:text-zinc-200">
                <DialogHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center bg-white/10 rounded-none">
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </div>
                  <DialogTitle className="text-2xl font-black text-white">
                    {t("dialogSuccessTitle")}
                  </DialogTitle>
                  <DialogDescription className="pt-4 text-base leading-relaxed text-white/60">
                    {t("dialogSuccessDesc")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-center">
                  <Button
                    onClick={() => {
                      setSuccessDialogOpen(false);
                      setFormData({
                        name: "",
                        company: "",
                        position: "",
                        email: "",
                        phone: "",
                        message: "",
                        privacyConsent: false,
                        marketingConsent: false,
                      });
                    }}
                    className="w-full sm:w-auto px-8 font-black rounded-none bg-white text-black hover:bg-zinc-200 hover:text-black"
                  >
                    {t("dialogConfirm")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Row 5: Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#FF4500] text-white py-4 text-sm font-bold uppercase tracking-wider hover:bg-[#FF4500]/80 transition-colors duration-300 cursor-pointer disabled:opacity-50"
            >
              {submitting ? t("formSubmitting") : t("formSubmit")}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
