"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type CSSProperties, useMemo, useRef } from "react";
import ProductCard from "./ProductCard";
import type { Product } from "@/types";

type Props = {
  products: Product[];
};

type Group = {
  category: string;
  items: Product[];
};

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function getSectionGradientStyle(
  category: string,
  index: number
): CSSProperties {
  // We avoid Math.random() to prevent SSR/CSR hydration mismatches.
  // Using the section index guarantees variety across sections.
  const h = hashString(category);

  const hueA = (index * 47 + (h % 47)) % 360;
  const hueB = (hueA + 70 + ((h >> 3) % 55)) % 360;

  return {
    backgroundColor: "rgba(0,0,0,0.25)",
    backgroundImage: [
      `linear-gradient(135deg, hsla(${hueA}, 92%, 62%, 0.16), hsla(${hueB}, 92%, 62%, 0.10))`,
      `radial-gradient(900px circle at 12% 10%, hsla(${hueB}, 92%, 62%, 0.18), transparent 55%)`,
      `radial-gradient(800px circle at 88% 28%, hsla(${hueA}, 92%, 62%, 0.14), transparent 58%)`,
    ].join(", "),
  };
}

function scrollByAmount(container: HTMLDivElement | null, direction: 1 | -1) {
  if (!container) return;
  const amount = Math.max(260, Math.floor(container.clientWidth * 0.85));
  container.scrollBy({ left: direction * amount, behavior: "smooth" });
}

export default function HomeCategorySections({ products }: Props) {
  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Product[]>();

    for (const product of products || []) {
      const category = (product?.category || "Other").trim() || "Other";
      map.set(category, [...(map.get(category) || []), product]);
    }

    return Array.from(map.entries())
      .map(([category, items]) => ({ category, items }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [products]);

  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  if (!groups || groups.length === 0) {
    return <p className="mt-6 text-white-100/70">No products found.</p>;
  }

  return (
    <div className="mt-8 flex flex-col gap-6 sm:gap-8">
      {groups.map((group, index) => {
        const gradientStyle = getSectionGradientStyle(group.category, index);
        const categoryHref = `/category/${encodeURIComponent(group.category)}`;

        return (
          <section
            key={group.category}
            className="relative overflow-hidden rounded-2xl border border-white-100/10"
            style={gradientStyle}
          >
            <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-white-100 text-lg sm:text-xl font-semibold">
                    {group.category}
                  </h3>
                  <p className="text-white-200 text-xs sm:text-sm">
                    {group.items.length} item
                    {group.items.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={categoryHref}
                    className="hidden sm:inline-flex items-center rounded-full border border-white-100/15 bg-black/20 px-4 py-2 text-sm text-white-100 hover:bg-white-100/10"
                  >
                    View all
                  </Link>

                  <button
                    type="button"
                    aria-label={`Previous ${group.category} products`}
                    onClick={() =>
                      scrollByAmount(refs.current[group.category], -1)
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white-100/15 bg-black/25 text-white-100 hover:bg-white-100/10"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Next ${group.category} products`}
                    onClick={() =>
                      scrollByAmount(refs.current[group.category], 1)
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white-100/15 bg-black/25 text-white-100 hover:bg-white-100/10"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/25 to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/25 to-transparent" />

              <div
                ref={(node) => {
                  refs.current[group.category] = node;
                }}
                className="flex gap-4 overflow-x-auto px-4 sm:px-6 pb-5 sm:pb-6 scroll-smooth snap-x snap-mandatory"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {group.items.map((product) => (
                  <div
                    key={String(product._id)}
                    className="snap-start shrink-0 w-[240px] sm:w-[280px]"
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 sm:px-6 pb-4 sm:pb-5">
              <Link
                href={categoryHref}
                className="inline-flex sm:hidden items-center rounded-full border border-white-100/15 bg-black/20 px-4 py-2 text-sm text-white-100 hover:bg-white-100/10"
              >
                View all
              </Link>
            </div>
          </section>
        );
      })}
    </div>
  );
}
