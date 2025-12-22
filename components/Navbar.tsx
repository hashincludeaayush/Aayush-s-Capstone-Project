import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Searchbar from "./Searchbar";
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
      <div className="border-b-[1px]">
    <header className="w-full">
      <nav className="nav">
        <Link href="/" className="flex items-center gap-1">
          <Image
            src="/assets/icons/logo.jpg"
            width={150}
            height={150}
            alt="logo"
          />
        </Link>
       <Container>
       <Searchbar  />
       </Container>
        

        <div className="flex items-center gap-5">
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
    </div>
    <Categories />
    </div>
  );
};

export default Navbar;
