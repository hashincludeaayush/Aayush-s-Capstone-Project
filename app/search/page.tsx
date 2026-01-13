import ProductCard from "@/components/ProductCard";
import { getAllProducts } from "@/lib/actions";
import type { Product } from "@/types";

type Props = {
  searchParams?: { q?: string };
};

const SearchPage = async ({ searchParams }: Props) => {
  const query = (searchParams?.q ?? "").trim();
  const products = query ? ((await getAllProducts(query)) as Product[]) : [];

  return (
    <section className="trending-section">
      <div className="flex flex-col gap-2">
        <h2 className="section-text">Search</h2>
        {query ? (
          <p className="text-white-100/70 text-sm sm:text-base">
            Results for <span className="text-white-100">“{query}”</span>
          </p>
        ) : (
          <p className="text-white-100/70 text-sm sm:text-base">
            Type something in the header search to see results.
          </p>
        )}
      </div>

      {query ? (
        products && products.length > 0 ? (
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-16">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-white-100/70">No matching records</p>
        )
      ) : null}
    </section>
  );
};

export default SearchPage;
