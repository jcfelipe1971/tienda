import React, { useState } from "react";
import { MessageSquare, Eye, AlertTriangle, Tag, ImageIcon } from "lucide-react";
import { Product, StoreSettings } from "../types";
import { formatCategoryName, getProductCode, getProductImages } from "../utils";


interface ProductCardProps {
  product: Product;
  settings: StoreSettings;
  onViewDetails: (product: Product) => void;
  onInstantBuy: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  settings,
  onViewDetails,
  onInstantBuy,
}) => {
  const images = getProductImages(product);
  const [isHovered, setIsHovered] = useState(false);
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;
  const productCode = getProductCode(product);

  // Show second image on hover if available
  const displayImage = isHovered && images.length > 1 ? images[1] : images[0];

  return (
    <div 
      className="group flex flex-col bg-white border border-neutral-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-neutral-200/80 transition-all duration-300"
      id={`product-card-${product.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image */}
      <div className="relative aspect-square w-full bg-neutral-50 overflow-hidden cursor-pointer" onClick={() => onViewDetails(product)}>
        <img
          src={displayImage || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600";
          }}
        />
        
        {/* Category & Featured Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[70%]">
          <span className={`px-2.5 py-0.5 text-[10px] font-bold font-mono tracking-wider uppercase rounded-full border shadow-xs ${
            product.category?.toLowerCase() === "ropa"
              ? "bg-emerald-100/95 text-emerald-950 border-emerald-200"
              : product.category?.toLowerCase() === "zapatos" || product.category?.toLowerCase() === "calzado"
              ? "bg-amber-100/95 text-amber-950 border-amber-200"
              : "bg-indigo-100/95 text-indigo-950 border-indigo-200"
          }`}>
            {formatCategoryName(product.category)}
          </span>
          
          {product.featured && (
            <span className="px-2 py-0.5 text-[10px] font-bold font-mono tracking-wider uppercase bg-rose-100/95 text-rose-950 rounded-full border border-rose-200 shadow-xs">
              Destacado
            </span>
          )}
        </div>

        {/* Top-Right Sales Code Badge */}
        <div className="absolute top-3 right-3">
          <span 
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-white/95 text-neutral-800 rounded-md border border-neutral-200/90 shadow-xs backdrop-blur-xs"
            title={`Código de venta: ${productCode}`}
          >
            <span className="text-neutral-400 font-normal">Cód:</span>
            <span className="text-neutral-950 font-black">{productCode}</span>
          </span>
        </div>

        {/* Multiple Images Indicator Badge */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-neutral-900/80 backdrop-blur-xs text-white text-[10px] font-mono font-bold rounded-md shadow-xs flex items-center gap-1">
            <ImageIcon className="w-3 h-3 text-neutral-300" />
            <span>{images.length} fotos</span>
          </div>
        )}

        {/* Stock Badges */}
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-black/45 flex items-center justify-center backdrop-blur-xs">
            <span className="px-4 py-2 text-xs font-semibold uppercase bg-neutral-900 text-white rounded-lg border border-neutral-700 tracking-wider">
              Agotado
            </span>
          </div>
        ) : (
          isLowStock && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium bg-rose-500/95 text-white rounded-full shadow-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Últimas {product.stock} unidades</span>
            </div>
          )
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-semibold text-neutral-900 text-sm sm:text-base line-clamp-1 group-hover:text-neutral-950">
              {product.name}
            </h3>
            <span className="font-mono font-bold text-neutral-950 text-base">
              ${product.price.toFixed(2)}
            </span>
          </div>

          {/* Subtitle with sales code and stock preview */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-100/90 text-neutral-600 text-[10px] font-mono border border-neutral-200/60">
              <Tag className="w-2.5 h-2.5 text-neutral-400" />
              <span>Ref: <strong className="text-neutral-900 font-bold">{productCode}</strong></span>
            </span>
            <span className="text-[10px] font-mono text-neutral-400">
              {product.stock > 0 ? `${product.stock} disp.` : "Agotado"}
            </span>
          </div>

          <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed mb-4">
            {product.description}
          </p>
        </div>

        {/* Interactive Buttons */}
        <div className="flex flex-col gap-2 mt-auto">
          <button
            onClick={() => onViewDetails(product)}
            className="flex items-center justify-center gap-2 w-full py-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 text-xs font-medium rounded-xl border border-neutral-200/70 transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Ver detalles</span>
          </button>
          
          <button
            onClick={() => onInstantBuy(product)}
            disabled={isOutOfStock}
            className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isOutOfStock
                ? "bg-neutral-100 text-neutral-400 border border-neutral-200/50 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/10"
            }`}
          >
            <MessageSquare className="w-4 h-4 fill-white text-emerald-600" />
            <span>Pedir por WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
