// app/consult/page.tsx
import type { Metadata } from "next";
import { ConsultContent } from "@/components/consult/consult-content";

export const metadata: Metadata = {
  title: "코리너스 | 일본 진출 인플루언서 마케팅 무료 상담",
  description:
    "일본 진출은 코리너스입니다. 크리에이터 섭외부터 콘텐츠 제작, 성과 리포트까지 일본 인플루언서 마케팅 전 과정을 직접 운영합니다. 무료 상담을 신청하실 수 있습니다.",
  robots: { index: false, follow: false },
};

export default function ConsultPage() {
  return <ConsultContent />;
}
