"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { transformationImages } from "../data/transformations";
import { JCVLogoMini } from "@/shared/components/JCVLogo";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { useLanguage } from "@/features/shared/hooks/useLanguage";
import { LANDING_STRINGS } from "../i18n";
import { buildWhatsAppUrl } from "../utils/whatsapp";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export function TransformationGallery() {
  const { lang } = useLanguage();
  const t = LANDING_STRINGS[lang].gallery;
  const tw = LANDING_STRINGS[lang].whatsapp;

  return (
    <section className="py-20 px-4 bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 via-black to-gray-900/50" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <JCVLogoMini variant="cyan" size="md" />
            <span className="text-accent-cyan font-bold text-xl">24 FITNESS</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            <span className="text-white">{t.title1}</span>{" "}
            <span className="text-accent-cyan">{t.title2}</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            {t.introPre}
            <span className="font-extrabold underline text-white">{t.introHighlight}</span>
            {t.introPost}
          </p>
        </div>

        <div className="relative">
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            grabCursor={true}
            slidesPerView={1}
            spaceBetween={20}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 24 },
              1024: { slidesPerView: 2, spaceBetween: 32 },
            }}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            pagination={{
              clickable: true,
            }}
            navigation={true}
            loop={true}
            className="transformation-swiper"
          >
            {transformationImages.map((image) => (
              <SwiperSlide key={image.id}>
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden group border border-gray-800">
                  <Image
                    src={image.url}
                    alt={t.imageAlts[image.id] ?? image.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Caption bar: real identity (name + result) when available */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                    {image.personName ? (
                      <>
                        <p className="text-white font-bold text-base">{image.personName}</p>
                        {image.result && (
                          <p className="text-gray-300 text-sm">{image.result[lang]}</p>
                        )}
                        {image.quote && (
                          <p className="text-gray-400 text-xs italic mt-1">
                            &ldquo;{image.quote[lang]}&rdquo;
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-white text-sm font-medium">
                        {t.imageAlts[image.id] ?? image.alt}
                      </p>
                    )}
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <p className="mt-4 text-center text-xs text-gray-500">{t.legalNote}</p>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-8 flex-wrap justify-center">
            <div className="text-center">
              <div className="text-4xl font-black text-accent-cyan">500+</div>
              <div className="text-sm text-gray-500">{t.statClients}</div>
            </div>
            <div className="w-px h-12 bg-gray-800 hidden sm:block" />
            <div className="text-center">
              <div className="text-4xl font-black text-accent-success">40</div>
              <div className="text-sm text-gray-500">{t.statDays}</div>
            </div>
            <div className="w-px h-12 bg-gray-800 hidden sm:block" />
            <div className="text-center">
              <div className="text-4xl font-black text-accent-cyan">100%</div>
              <div className="text-sm text-gray-500">{t.statCommitment}</div>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-gradient-to-r from-gray-900/50 to-gray-800/50 rounded-2xl p-8 border border-gray-800">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 ring-4 ring-accent-cyan">
              <Image
                src="/images/transformations/result-3.jpg"
                alt={t.trainerAlt}
                width={80}
                height={80}
                className="object-cover w-full h-full"
                unoptimized
              />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <JCVLogoMini variant="cyan" size="sm" />
                {t.trainerTitle}
              </h3>
              <p className="text-gray-400 mb-4">{t.trainerText}</p>
              <div className="flex flex-col items-center md:items-start gap-2">
                <a
                  href={buildWhatsAppUrl(tw.genericMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all"
                >
                  <WhatsAppIcon className="w-5 h-5" />
                  WhatsApp
                </a>
                <p className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-success animate-pulse" />
                  {tw.sla}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
