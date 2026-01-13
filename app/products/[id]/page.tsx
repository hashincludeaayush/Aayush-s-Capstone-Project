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

type Props = {
  params: { id: string };
};

const ProductDetails = async ({ params: { id } }: Props) => {
  const MIN_LOADING_MS = 3200;
  const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

  const minDelayPromise = sleep(MIN_LOADING_MS);

  const product: Product = await getProductById(id);

  if (!product) redirect("/");

  const similarProductsPromise = getSimilarProducts(id);
  await minDelayPromise;
  const similarProducts = await similarProductsPromise;

  return (
    <div className="product-container">
      <div className="flex gap-10 sm:gap-16 xl:gap-28 xl:flex-row flex-col">
        <div className="product-image">
          <Image
            src={product.image}
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
                  product.currentPrice
                )}`}
              />
              <PriceInfoCard
                title="Average Price"
                iconSrc="/assets/icons/chart.svg"
                value={`${product.currency} ${formatNumber(
                  product.averagePrice
                )}`}
              />
              <PriceInfoCard
                title="Highest Price"
                iconSrc="/assets/icons/arrow-up.svg"
                value={`${product.currency} ${formatNumber(
                  product.highestPrice
                )}`}
              />
              <PriceInfoCard
                title="Lowest Price"
                iconSrc="/assets/icons/arrow-down.svg"
                value={`${product.currency} ${formatNumber(
                  product.lowestPrice
                )}`}
              />
            </div>
          </div>

          <Modal productId={id} />
          <AnalyzePricesButton productName={product.title} />
        </div>
      </div>

      <div className="flex flex-col gap-16">
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

        <button className="btn w-fit mx-auto flex items-center justify-center gap-3 min-w-[200px]">
          <Image
            src="/assets/icons/bag.svg"
            alt="check"
            width={22}
            height={22}
          />

          <Link href="/" className="text-base text-black-100">
            Buy Now
          </Link>
        </button>
      </div>

      {similarProducts && similarProducts?.length > 0 && (
        <div className="py-14 flex flex-col gap-2 w-full">
          <p className="section-text">Similar Products</p>

          <div className="flex flex-wrap gap-10 mt-7 w-full">
            {similarProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
