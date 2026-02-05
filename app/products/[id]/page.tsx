import Modal from "@/components/Modal";
import PriceInfoCard from "@/components/PriceInfoCard";
import ProductCard from "@/components/ProductCard";
import { getProductById, getSimilarProducts } from "@/lib/actions";
import { formatNumber } from "@/lib/utility";
import { Product } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AnalyzePricesButton } from "@/components/AnalyzePrices";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import ProductAnalytics from "@/components/ProductAnalytics";

type Props = {
  params: { id: string };
};

const shuffleInPlace = <T,>(arr: T[]) => {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const getMerchantNameFromUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();

    const parts = hostname.split(".").filter(Boolean);
    const sld = parts.length >= 2 ? parts[parts.length - 2] : (parts[0] ?? "");

    const overrides: Record<string, string> = {
      amazon: "Amazon",
      amzn: "Amazon",
      steampowered: "Steam",
    };

    const base = overrides[sld];
    if (base) return base;
    if (!sld) return "Store";

    return sld.charAt(0).toUpperCase() + sld.slice(1);
  } catch {
    return "Store";
  }
};

const ProductDetails = async ({ params: { id } }: Props) => {
  const MIN_LOADING_MS = 3200;
  const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

  const minDelayPromise = sleep(MIN_LOADING_MS);

  const product: Product = await getProductById(id);

  if (!product) redirect("/");

  const imageSrc =
    typeof product.image === "string" && product.image.trim().length > 0
      ? product.image
      : "/assets/images/trending.svg";

  const similarProductsPromise = getSimilarProducts(id);
  await minDelayPromise;
  const similarProducts = (((await similarProductsPromise) as
    | Product[]
    | null) ?? []) satisfies Product[];

  const shuffledSimilarProducts = shuffleInPlace([...similarProducts]);

  return (
    <div className="product-container">
      <div className="flex gap-10 sm:gap-16 xl:gap-28 xl:flex-row flex-col">
        <div className="product-image">
          <Image
            src={imageSrc}
            alt={product.title}
            width={580}
            height={400}
            className="mx-auto max-w-full h-auto"
          />
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-start gap-5 flex-wrap pb-6">
            <div className="flex flex-col gap-3">
              <p className="text-xl sm:text-[28px] text-secondary font-semibold text-white-100">
                {product.title}
              </p>

              <Link
                href={product.url}
                target="_blank"
                className="text-base text-white-100"
              >
                Visit Product
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="product-hearts">
                <Image
                  src="/assets/icons/red-heart.svg"
                  alt="heart"
                  width={20}
                  height={20}
                />

                <p className="text-base font-semibold text-[#D46F77]">
                  {product.reviewsCount}
                </p>
              </div>

              <div className="p-2 bg-white-200 rounded-10">
                <Image
                  src="/assets/icons/bookmark.svg"
                  alt="bookmark"
                  width={20}
                  height={20}
                />
              </div>

              <div className="p-2 bg-white-200 rounded-10">
                <Image
                  src="/assets/icons/share.svg"
                  alt="share"
                  width={20}
                  height={20}
                />
              </div>
            </div>
          </div>

          <div className="product-info">
            <div className="flex flex-col gap-2">
              <p className="text-2xl sm:text-[34px] text-secondary font-bold text-white-100">
                {product.currency} {formatNumber(product.currentPrice)}
              </p>
              <p className="text-base sm:text-[21px] text-white-100 opacity-50 line-through">
                {product.currency} {formatNumber(product.originalPrice)}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                <div className="product-stars">
                  <Image
                    src="/assets/icons/star.svg"
                    alt="star"
                    width={16}
                    height={16}
                  />
                  <p className="text-sm text-primary-orange font-semibold">
                    {product.stars || "25"}
                  </p>
                </div>

                <div className="product-reviews">
                  <Image
                    src="/assets/icons/comment.svg"
                    alt="comment"
                    width={16}
                    height={16}
                  />
                  <p className="text-sm text-secondary font-semibold">
                    {product.reviewsCount} Reviews
                  </p>
                </div>
              </div>

              <p className="text-sm text-white-100 ">
                <span className="text-primary-green font-semibold">93% </span>{" "}
                of buyers have recommeded this.
              </p>
            </div>
          </div>

          <div className="my-7 flex flex-col gap-5 ">
            <div className="flex gap-5 flex-wrap ">
              <PriceInfoCard
                title="Current Price"
                iconSrc="/assets/icons/price-tag.svg"
                value={`${product.currency} ${formatNumber(
                  product.currentPrice,
                )}`}
              />
              <PriceInfoCard
                title="Average Price"
                iconSrc="/assets/icons/chart.svg"
                value={`${product.currency} ${formatNumber(
                  product.averagePrice,
                )}`}
              />
              <PriceInfoCard
                title="Highest Price"
                iconSrc="/assets/icons/arrow-up.svg"
                value={`${product.currency} ${formatNumber(
                  product.highestPrice,
                )}`}
              />
              <PriceInfoCard
                title="Lowest Price"
                iconSrc="/assets/icons/arrow-down.svg"
                value={`${product.currency} ${formatNumber(
                  product.lowestPrice,
                )}`}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-5">
            <div className="w-full">
              <div className="rounded-xl bg-gradient-to-r from-primary-orange/55 via-chart-1/55 to-primary-green/55 p-[1px] shadow-xs">
                <Button
                  asChild
                  className="h-11 w-full rounded-xl bg-neutral-black/70 text-white-100 border border-white-100/10 backdrop-blur-md px-5 font-semibold hover:bg-neutral-black/60 focus-visible:ring-2 focus-visible:ring-white-100/30"
                >
                  <Link
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    <span className="flex-1 text-left">
                      Buy now on {getMerchantNameFromUrl(product.url)}
                    </span>
                  </Link>
                </Button>
              </div>
            </div>

            <Modal productId={id} />
            <AnalyzePricesButton productName={product.title} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-16">
        <ProductAnalytics productId={id} />

        <div className="flex flex-col gap-5">
          <h3 className="text-3xl text-secondary font-bold text-white-100">
            Product Description
          </h3>

          {/* Modern description container with section splitting and separators */}
          <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/40 p-6 rounded-2xl shadow-md border border-white-200/10 text-white-200">
            {(() => {
              const raw = product?.description || "";
              // Split into sections by two or more line breaks so authors can create sections with blank lines
              const sections = raw
                .split(/\n{2,}/)
                .map((s) => s.trim())
                .filter(Boolean);

              if (sections.length === 0) {
                return (
                  <p className="text-sm leading-relaxed">
                    No description available.
                  </p>
                );
              }

              return sections.map((sec, idx) => {
                // Within a section, treat a first short line that ends with ':' as a subheading
                const lines = sec
                  .split("\n")
                  .map((l) => l.trim())
                  .filter(Boolean);
                let heading: string | null = null;
                let bodyLines: string[] = lines;

                if (lines.length > 1 && /^.{1,60}:$/.test(lines[0])) {
                  heading = lines[0].replace(/:$/, "");
                  bodyLines = lines.slice(1);
                }

                return (
                  <div
                    key={idx}
                    className={`${
                      idx > 0 ? "pt-6 border-t border-white-200/6" : ""
                    }`}
                  >
                    {heading && (
                      <h4 className="text-lg font-semibold text-white-100 mb-2">
                        {heading}
                      </h4>
                    )}

                    <p className="text-sm leading-relaxed text-white-200">
                      {bodyLines.map((line, i) => (
                        <span key={i}>
                          {line}
                          {i < bodyLines.length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {shuffledSimilarProducts.length > 0 && (
        <section className="py-14 w-full">
          <div className="rounded-3xl border border-white-100/10 bg-gradient-to-br from-primary-orange/10 via-neutral-black/55 to-primary-green/12 p-6 sm:p-7 shadow-xs overflow-hidden relative">
            <div
              className="pointer-events-none absolute inset-0 opacity-80"
              style={{
                background:
                  "radial-gradient(circle at 14% 18%, rgba(251,146,60,0.18), transparent 55%), radial-gradient(circle at 86% 70%, rgba(34,197,94,0.14), transparent 55%), radial-gradient(circle at 55% 25%, rgba(129,140,248,0.12), transparent 60%)",
              }}
              aria-hidden="true"
            />

            <div className="relative flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-white-100 font-semibold text-xl">
                  Similar Products
                </p>
                <p className="text-xs text-white-200 mt-1 max-w-[64ch]">
                  Quick alternatives in the same category.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center rounded-full border border-white-100/10 bg-white-100/5 px-3 py-1 font-semibold text-white-100">
                  {Math.min(6, shuffledSimilarProducts.length)} shown
                </span>
              </div>
            </div>

            <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-4">
              {shuffledSimilarProducts.slice(0, 6).map((p) => (
                <div
                  key={p._id}
                  className="rounded-2xl bg-gradient-to-br from-white-100/10 via-white-100/5 to-transparent p-[1px]"
                >
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetails;
