import Image from "next/image";
import Link from "next/link";
import ProductSearchbar from "./ProductSearchbar";
import Container from "./Container";
import Categories from "./Categories";
import { Home } from "lucide-react";
const navIcons = [
  { src: "/assets/icons/search.svg", alt: "search" },
  { src: "/assets/icons/black-heart.svg", alt: "heart" },
  { src: "/assets/icons/user.svg", alt: "user" },
];

const Navbar = () => {
  return (
    <div className="relative shadow-sm">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0b1220] via-[#151422] to-[#151422]" />
      <div className="border-b border-white-100/10 bg-gradient-to-r from-purple-500/10 via-cyan-400/10 to-pink-500/10">
        <Container>
          <header className="w-full py-1 sm:py-1.5">
            <nav className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center justify-between gap-3">
                <Link href="/" className="flex items-center gap-2">
                  <Image
                    src="/assets/icons/logo.png"
                    width={120}
                    height={42}
                    alt="logo"
                    className="h-auto w-[min(120px,92vw)] md:w-[120px]"
                    priority
                  />
                </Link>

                <div className="flex items-center gap-2 sm:gap-3 md:hidden">
                  <Link
                    href="/"
                    aria-label="Home"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white-100/15 bg-black/30 text-white-100 hover:bg-white-100/10"
                  >
                    <Home className="h-5 w-5" />
                  </Link>
                  {navIcons.map((icon) => (
                    <Image
                      key={icon.alt}
                      src={icon.src}
                      alt={icon.alt}
                      width={24}
                      height={24}
                      className="h-6 w-6 object-contain sm:h-7 sm:w-7"
                    />
                  ))}
                </div>
              </div>

              <div className="w-full md:flex-1 md:px-4">
                <ProductSearchbar />
              </div>

              <div className="hidden md:flex items-center gap-4">
                <Link
                  href="/"
                  aria-label="Home"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white-100/15 bg-black/30 text-white-100 hover:bg-white-100/10"
                >
                  <Home className="h-5 w-5" />
                </Link>
                {navIcons.map((icon) => (
                  <Image
                    key={icon.alt}
                    src={icon.src}
                    alt={icon.alt}
                    width={26}
                    height={26}
                    className="h-6.5 w-6.5 object-contain"
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
