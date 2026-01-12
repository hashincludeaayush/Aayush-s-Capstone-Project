"use client";

import Container from "./Container";
import { TbDeviceLaptop, TbDeviceMobile } from "react-icons/tb";
import CategoryBox from "./CategoryBox";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { IconType } from "react-icons/lib";

type CategoryItem = {
  label: string;
  icon: IconType;
};

const Categories = () => {
  const pathname = usePathname();
  const [dbCategories, setDbCategories] = useState<string[]>([]);

  const activeCategory = (() => {
    if (!pathname) return null;
    const parts = pathname.split("/").filter(Boolean);
    if (parts[0] !== "category") return null;
    try {
      return decodeURIComponent(parts[1] || "");
    } catch {
      return parts[1] || null;
    }
  })();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/categories", { cache: "no-store" });
        const data = (await res.json()) as { categories?: string[] };
        if (!mounted) return;
        setDbCategories(Array.isArray(data.categories) ? data.categories : []);
      } catch {
        if (!mounted) return;
        setDbCategories([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const items: CategoryItem[] = useMemo(() => {
    const iconByLabel: Record<string, IconType> = {
      Laptops: TbDeviceLaptop,
      Mobiles: TbDeviceMobile,
      Tablets: TbDeviceLaptop,
      "Smart Watches": TbDeviceLaptop,
      Cameras: TbDeviceMobile,
      Headphones: TbDeviceLaptop,
      Speakers: TbDeviceMobile,
      Gaming: TbDeviceLaptop,
      "TV & Home Theater": TbDeviceMobile,
      Drones: TbDeviceMobile,
      "Printers & Scanners": TbDeviceLaptop,
      Storage: TbDeviceMobile,
    };

    return dbCategories.map((label) => ({
      label,
      icon: iconByLabel[label] ?? TbDeviceLaptop,
    }));
  }, [dbCategories]);

  return (
    <Container>
      <div className="categories">
        {items.map((item) => (
          <CategoryBox
            key={item.label}
            label={item.label}
            icon={item.icon}
            selected={
              Boolean(activeCategory) &&
              activeCategory?.toLowerCase() === item.label.toLowerCase()
            }
          />
        ))}
      </div>
    </Container>
  );
};

export default Categories;
