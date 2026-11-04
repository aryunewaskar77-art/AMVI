import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HomePage() {
  return (
    <div className="flex flex-col space-y-20 pb-24">
      {/* Editorial Hero Banner */}
      <section className="relative overflow-hidden border-b border-stone-200/80 bg-gradient-to-b from-white/90 via-stone-50/50 to-stone-100/30 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d97757]/20 bg-[#d97757]/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-[#d97757] uppercase backdrop-blur-xs">
                <Sparkles className="h-3.5 w-3.5 text-[#d97757]" />
                Direct Artist Lineage & Authenticated Provenance
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl font-normal tracking-tight text-stone-900 leading-tight">
                Curated Indian Contemporary &{" "}
                <span className="text-amvi-gradient italic font-serif">Traditional Masterpieces.</span>
              </h1>

              <p className="text-base sm:text-lg leading-relaxed text-stone-600 font-light max-w-2xl">
                AMVI presents original, museum-calibre paintings by master artisans
                and rising contemporary pioneers. Every artwork is an authentic 1-of-1
                treasure delivered with archival conservation and white-glove logistics.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href="/artworks"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#d97757] to-[#e8a86a] px-8 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-md hover:opacity-95 transition-all amvi-glow"
                >
                  <span>Explore Catalog</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#provenance"
                  className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-7 py-4 text-xs font-semibold uppercase tracking-widest text-stone-800 transition-all hover:border-[#78a98f] hover:text-[#78a98f] shadow-xs"
                >
                  Authentication Standard
                </a>
              </div>
            </div>

            {/* Right Hero Motif (Logo emblem illuminated) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative aspect-16/10 w-full max-w-md overflow-hidden rounded-2xl border border-stone-200/80 bg-white/70 p-6 shadow-xl backdrop-blur-md amvi-glow">
                <div className="relative h-full w-full">
                  <Image
                    src="/amvi-logo.png"
                    alt="AMVI Emblem"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Provenance & Guarantee Section */}
      <section id="provenance" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="rounded-2xl border border-stone-200/80 bg-white/80 p-8 sm:p-12 shadow-sm backdrop-blur-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d97757]/10 text-[#d97757]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-lg font-medium text-stone-900">
                Verified Provenance
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Direct consignment from established atelier masters and award-winning contemporary painters. Each acquisition includes a physical, seal-embossed Certificate of Authenticity.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8a86a]/15 text-[#d97757]">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-lg font-medium text-stone-900">
                Certified 1-of-1 Originals
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                No reproductions, lithographs, or digital prints. We celebrate unique, irreproducible masterworks crafted with authentic traditional mediums and archival oils.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#78a98f]/15 text-[#569172]">
                <ArrowRight className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-lg font-medium text-stone-900">
                Insured White-Glove Transit
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Climate-managed, custom wooden crating and transit insurance to ensure your artwork arrives in museum-grade condition at your residence or gallery.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
