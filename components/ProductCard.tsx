"use client";

import { Product } from "@/types";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface Props {
  product: Product;
}

const ProductCard = ({ product }: Props) => {
  const imageSrc =
    typeof product?.image === "string" && product.image.trim().length > 0
      ? product.image
      : "/assets/images/trending.svg";

  return (
    <Link href={`/products/${product._id}`} className="product-card">
      <div className="product-card_img-container">
        <Image
          src={imageSrc}
          alt={product.title}
          width={200}
          height={200}
          className="product-card_img"
        />
      </div>

      <div className="product-card_body">
        <h3 className="product-title">{product.title}</h3>

        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-white-100 opacity-50 text-base sm:text-lg capitalize">
            {product.category}
          </p>

          <p className="shrink-0 text-white-100 text-base sm:text-lg font-semibold">
            <span>{product?.currency} </span>
            <span>{product?.currentPrice}</span>
          </p>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
