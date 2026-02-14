import Image from "next/image";
import {
  COFFEE_ITEMS,
  TEA_ITEMS,
  PASTRY_ITEMS,
  ADDON_ITEMS,
  CUSTOMIZATION_OPTIONS,
  MENU_SIZES,
} from "@/data/menu";

export default function MenuContent() {
  return (
    <div className="space-y-8">
      <div className="relative h-28 md:h-36 rounded-2xl overflow-hidden border-2 border-[#e8e2d8] shadow-md">
        <Image
          src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900&q=80"
          alt="Coffee shop interior"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 896px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2a1f1a]/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h2 className="font-display text-xl md:text-2xl text-white drop-shadow">Menu</h2>
          <p className="text-sm text-white/90 mt-0.5">
            We&apos;ll ask for size, temperature, and customizations when you order.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <section className="bg-white/70 rounded-2xl p-5 shadow-sm border border-[#e8e2d8]/80">
          <h3 className="font-display text-lg text-[#4f3c33] border-b border-[#d4c9b8] pb-2 mb-4">Coffee</h3>
          <p className="text-xs text-[#8b6a51] uppercase tracking-wider mb-3">{MENU_SIZES}</p>
          <ul className="space-y-2">
            {COFFEE_ITEMS.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 py-1.5 border-b border-[#e8e2d8]/80 last:border-0"
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-medium text-[#2a1f1a]">{item.name}</span>
                  {item.temp && <span className="text-sm text-[#8b6a51]">({item.temp})</span>}
                </div>
                <span className="text-sm text-[#5f473b] tabular-nums shrink-0">
                  {item.priceSmall} / {item.priceLarge}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white/70 rounded-2xl p-5 shadow-sm border border-[#e8e2d8]/80">
          <h3 className="font-display text-lg text-[#4f3c33] border-b border-[#d4c9b8] pb-2 mb-4">Tea</h3>
          <p className="text-xs text-[#8b6a51] uppercase tracking-wider mb-3">{MENU_SIZES}</p>
          <ul className="space-y-2">
            {TEA_ITEMS.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 py-1.5 border-b border-[#e8e2d8]/80 last:border-0"
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-medium text-[#2a1f1a]">{item.name}</span>
                  {item.temp && <span className="text-sm text-[#8b6a51]">({item.temp})</span>}
                </div>
                <span className="text-sm text-[#5f473b] tabular-nums shrink-0">
                  {item.priceSmall} / {item.priceLarge}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white/70 rounded-2xl p-5 shadow-sm border border-[#e8e2d8]/80">
          <h3 className="font-display text-lg text-[#4f3c33] border-b border-[#d4c9b8] pb-2 mb-4">Pastries</h3>
          <ul className="space-y-2">
            {PASTRY_ITEMS.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 py-1.5 border-b border-[#e8e2d8]/80 last:border-0"
              >
                <span className="font-medium text-[#2a1f1a]">{item.name}</span>
                <span className="text-sm text-[#5f473b] tabular-nums shrink-0">{item.price}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white/70 rounded-2xl p-5 shadow-sm border border-[#e8e2d8]/80">
          <h3 className="font-display text-lg text-[#4f3c33] border-b border-[#d4c9b8] pb-2 mb-4">
            Add-Ons & Substitutions
          </h3>
          <ul className="space-y-2">
            {ADDON_ITEMS.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 py-1.5 border-b border-[#e8e2d8]/80 last:border-0"
              >
                <span className="font-medium text-[#2a1f1a]">{item.name}</span>
                <span className="text-sm text-[#5f473b] tabular-nums shrink-0">{item.price}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white/70 rounded-2xl p-5 shadow-sm border border-[#e8e2d8]/80">
          <h3 className="font-display text-lg text-[#4f3c33] border-b border-[#d4c9b8] pb-2 mb-4">
            Customization <span className="text-sm font-normal text-[#8b6a51]">(No Charge)</span>
          </h3>
          <ul className="space-y-3">
            {CUSTOMIZATION_OPTIONS.map((opt) => (
              <li key={opt.id} className="py-1">
                <span className="font-medium text-[#2a1f1a]">{opt.label}:</span>{" "}
                <span className="text-sm text-[#5f473b]">{opt.options.join(", ")}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
