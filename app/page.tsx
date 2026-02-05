import HeroCarousel from "@/components/HeroCarousel";
import Searchbar from "@/components/Searchbar";
import Image from "next/image";
import { getAllProducts } from "@/lib/actions";
import HomeCategorySections from "@/components/HomeCategorySections";

const Home = async () => {
  const allProducts = await getAllProducts();

  return (
    <>
      <section className="px-4 sm:px-6 md:px-20 py-12 sm:py-24">
        <div className="flex max-xl:flex-col gap-8 sm:gap-16">
          <div className="flex flex-col justify-center">
            <p className="small-text">
              Smart Shoppings Starts Here:
              <Image
                src="/assets/icons/arrow-right.svg"
                alt="arrow-right"
                width={16}
                height={16}
              />
            </p>

            <h1 className="head-text">
              Unleash the Power of
              <span className="text-primary"> Jynx</span>
            </h1>

            <p className="paragraph-text">
              Powerful, self-serve product and growth analytics to help you
              convert, engage, and retain more.
            </p>

            <Searchbar />
          </div>

          <div className="max-xl:mx-auto w-full">
            <HeroCarousel />
          </div>
        </div>
      </section>

      <section className="trending-section">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="section-text">Trending</h2>

          {/* Keep this button unchanged */}
          <a
            className="trending-button"
            href="https://app.powerbi.com/reportEmbed?reportId=a529fe72-a2ea-40a6-87b5-78b334dda36e&autoAuth=true"
          >
            All
          </a>
        </div>

        <HomeCategorySections products={(allProducts as any) ?? []} />
      </section>
    </>
  );
};

export default Home;
