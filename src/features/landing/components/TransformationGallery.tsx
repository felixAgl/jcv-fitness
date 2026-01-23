"use client";

import Image from "next/image";
import { transformationImages } from "../data/transformations";

export function TransformationGallery() {
  return (
    <section className="py-20 px-4 bg-black relative overflow-hidden">
      <div className="bg-pattern opacity-30" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            <span className="text-white">RESULTADOS</span>{" "}
            <span className="text-accent-red glow-red">REALES</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Transformaciones comprobadas. No promesas vacias, resultados que hablan por si solos.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {transformationImages.map((image, index) => (
            <div
              key={image.id}
              className={`relative rounded-2xl overflow-hidden group ${
                index === 0 ? "col-span-2 row-span-2" : ""
              }`}
            >
              <div className={`relative ${index === 0 ? "aspect-square" : "aspect-[3/4]"}`}>
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes={index === 0 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white text-sm font-medium">{image.alt}</p>
                </div>
              </div>

              {image.type === "promo" && (
                <div className="absolute top-3 right-3 bg-accent-red text-white text-xs font-bold px-3 py-1 rounded-full">
                  PROMO
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-8 flex-wrap justify-center">
            <div className="text-center">
              <div className="text-4xl font-black text-accent-cyan">500+</div>
              <div className="text-sm text-gray-500">Clientes transformados</div>
            </div>
            <div className="w-px h-12 bg-gray-800 hidden sm:block" />
            <div className="text-center">
              <div className="text-4xl font-black text-accent-green">40</div>
              <div className="text-sm text-gray-500">Dias de programa</div>
            </div>
            <div className="w-px h-12 bg-gray-800 hidden sm:block" />
            <div className="text-center">
              <div className="text-4xl font-black text-accent-red">100%</div>
              <div className="text-sm text-gray-500">Compromiso</div>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-gradient-to-r from-gray-900/50 to-gray-800/50 rounded-2xl p-8 border border-gray-800">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 ring-4 ring-accent-cyan">
              <Image
                src={transformationImages[2].url}
                alt="JCV - Entrenador Personal"
                width={80}
                height={80}
                className="object-cover w-full h-full"
                unoptimized
              />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-white mb-2">
                Entrena conmigo por 40 dias
              </h3>
              <p className="text-gray-400 mb-4">
                Cupos limitados para quienes realmente quieren un cambio.
                No busco clientes, busco guerreros dispuestos a transformar su vida.
              </p>
              <div className="flex items-center gap-4 justify-center md:justify-start">
                <a
                  href="https://wa.me/573143826430"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
                <span className="text-gray-500 text-sm">314 382 64 30</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
