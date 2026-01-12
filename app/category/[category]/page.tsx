import ProductCard from "@/components/ProductCard";
import { getProductsByCategory } from "@/lib/actions";

type Props = {
  params: { category: string };
};

const CategoryPage = async ({ params }: Props) => {
  const categoryLabel = (() => {
    try {
      return decodeURIComponent(params.category);
    } catch {
      return params.category;
    }
  })();

  const products = await getProductsByCategory(categoryLabel);

  return (
    <section className="trending-section">
      <h2 className="section-text">Category: {categoryLabel}</h2>

      {products && products.length > 0 ? (
        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-16">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <p className="mt-6 text-white-100/70">No matching records</p>
      )}
    </section>
  );
};

export default CategoryPage;
