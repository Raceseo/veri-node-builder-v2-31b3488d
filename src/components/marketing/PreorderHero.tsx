import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { GOOGLE_FORM_URL } from "@/config/constants";
import { GovMark, CounterLine } from "./atoms";
import { DataValueCard } from "./DataValueCard";

interface PreorderHeroProps {
  /** Headline size (compact for Auth, full for Landing) */
  size?: "full" | "compact";
  /** Secondary CTA — link/button rendered next to the primary "사전 신청하기" */
  secondaryCta?: ReactNode;
  /** Counter value for "이미 N명이 사전 신청했습니다" */
  counter?: number;
  /** Show counter line */
  showCounter?: boolean;
  /** Show "공공 마이데이터 API 기반 서비스 · 본인 인증 필수" top marker */
  showTopMarker?: boolean;
}

export function PreorderHero({
  size = "full",
  secondaryCta,
  counter = 47,
  showCounter = true,
  showTopMarker = true,
}: PreorderHeroProps) {
  const headlineClass = size === "compact" ? "text-[40px] md:text-[46px]" : "text-[40px] md:text-[52px]";
  const sectionPadY = size === "compact" ? "py-14 md:py-20" : "py-20 md:py-24";

  return (
    <section
      className={`border-b border-border bg-white px-6 md:px-12 ${sectionPadY}`}
    >
      {showTopMarker && (
        <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block h-2.5 w-2.5 bg-trust" />
          공공 마이데이터 API 기반 서비스 · 본인 인증 필수
        </div>
      )}

      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        {/* Left: headline + CTA */}
        <div>
          <div className="mb-[18px] text-[13px] font-semibold tracking-wide text-trust-dark">
            공공 마이데이터 기반 개인 데이터 마켓플레이스
          </div>

          <h1
            className={`m-0 font-serif font-extrabold leading-[1.2] tracking-[-0.03em] text-navy ${headlineClass}`}
          >
            내 데이터, 이제 내가 값을 매깁니다.
          </h1>

          <p className="mt-[18px] max-w-[500px] text-[16.5px] leading-relaxed text-muted-foreground md:text-[17px]">
            설문 한 건 5,000원. 정부24 인증으로 진짜 '나'만 응답합니다.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <a
              href={GOOGLE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[10px] bg-trust px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-trust-dark"
            >
              사전 신청하기
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
            {secondaryCta ?? (
              <a
                href="#about"
                className="border-b border-border px-4 py-3.5 text-[15px] font-medium text-foreground hover:text-trust"
              >
                서비스 소개
              </a>
            )}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-5">
            <GovMark tone="trust" />
            {showCounter && <CounterLine count={counter} tone="trust" />}
          </div>
        </div>

        {/* Right: DataValueCard */}
        <div>
          <DataValueCard />
        </div>
      </div>
    </section>
  );
}
