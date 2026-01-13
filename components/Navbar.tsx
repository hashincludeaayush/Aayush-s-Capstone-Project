import Image from "next/image";
import Link from "next/link";
import ProductSearchbar from "./ProductSearchbar";
import Container from "./Container";
import Categories from "./Categories";
const navIcons = [
  { src: "/assets/icons/search.svg", alt: "search" },
  { src: "/assets/icons/black-heart.svg", alt: "heart" },
  { src: "/assets/icons/user.svg", alt: "user" },
];

const Navbar = () => {
  return (
    <div className="bg-[#151422] shadow-sm">
      <div className="border-b border-white-100/10">
        <Container>
          <header className="w-full py-2">
            <nav className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center justify-between gap-3">
                <Link href="/" className="flex items-center gap-2">
                  <Image
                    src="/assets/icons/logo.jpg"
                    width={120}
                    height={40}
                    alt="logo"
                    className="h-10 w-auto"
                    priority
                  />
                </Link>

                <div className="flex items-center gap-4 md:hidden">
                  {navIcons.map((icon) => (
                    <Image
                      key={icon.alt}
                      src={icon.src}
                      alt={icon.alt}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  ))}
                </div>
              </div>

              <div className="w-full md:flex-1 md:px-6">
                <ProductSearchbar />
              </div>

              <div className="hidden md:flex items-center gap-5">
                {navIcons.map((icon) => (
                  <Image
                    key={icon.alt}
                    src={icon.src}
                    alt={icon.alt}
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                ))}
              </div>
            </nav>
          </header>
        </Container>
      </div>
      <Categories />
    </div>
  );
};

export default Navbar;
