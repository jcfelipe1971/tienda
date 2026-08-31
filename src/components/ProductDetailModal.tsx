import React, { useState, useEffect, useRef } from "react";
import {
  X,
  MessageSquare,
  Heart,
  Ruler,
  Check,
  ArrowLeft,
  Tag,
  ChevronLeft,
  ChevronRight,
  ImageIcon
} from "lucide-react";
import { Product, StoreSettings } from "../types";
import { formatCategoryName, getProductCode, getProductImages } from "../utils";

interface ProductDetailModalProps {
  product: Product;
  settings: StoreSettings;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  settings,
  onClose,
}) => {
  const images = getProductImages(product);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || "");
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0] || "");
  const [liked, setLiked] = useState<boolean>(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const thumbnailsScrollRef = useRef<HTMLDivElement>(null);

  const isOutOfStock = product.stock === 0;
  const productCode = getProductCode(product);
  const isMercado = product.tipo_id === 2 || product.storeType === "mercado";

  // Keep selected image within bounds if images change
  useEffect(() => {
    if (selectedImageIndex >= images.length) {
      setSelectedImageIndex(0);
    }
  }, [images.length, selectedImageIndex]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (thumbnailsScrollRef.current) {
      const activeThumb = thumbnailsScrollRef.current.children[selectedImageIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [selectedImageIndex]);

  // Keyboard navigation for image gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      } else if (e.key === "ArrowRight") {
        setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      } else if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length]);

  // Prevent background body scrolling while modal is open & handle popstate (mobile back button)
  useEffect(() => {
    document.body.style.overflow = "hidden";

    // Push state into history so browser / mobile back button closes the modal
    const historyState = { modalOpen: true };
    window.history.pushState(historyState, "");

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("popstate", handlePopState);
    };
  }, [onClose]);

  const handleClose = () => {
    if (window.history.state && window.history.state.modalOpen) {
      window.history.back();
    } else {
      onClose();
    }
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const scrollThumbnails = (direction: "left" | "right") => {
    if (thumbnailsScrollRef.current) {
      const scrollAmount = direction === "left" ? -180 : 180;
      thumbnailsScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swiped left -> next
        handleNextImage();
      } else {
        // Swiped right -> prev
        handlePrevImage();
      }
    }
    setTouchStartX(null);
  };

  const handleWhatsAppRedirect = () => {
    let template =
      settings.whatsappTemplate ||
      "¡Hola! Me interesa comprar el producto *{name}* (Código: *{code}*, Precio: *{price}*, Talla: *{size}*, Color: *{color}*). ¿Está disponible?";

    let formattedMessage = template
      .replace("{name}", product.name)
      .replace("{code}", productCode)
      .replace("{price}", `$${product.price.toFixed(2)}`)
      .replace("{size}", selectedSize || "Cualquiera")
      .replace("{color}", selectedColor || "Cualquiera");

    // If custom template did not include {code}, append it explicitly to ensure the owner knows the exact product
    if (!template.includes("{code}")) {
      if (formattedMessage.includes(`*${product.name}*`)) {
        formattedMessage = formattedMessage.replace(
          `*${product.name}*`,
          `*${product.name}* [Cód: *${productCode}*]`
        );
      } else {
        formattedMessage = `${formattedMessage} (Cód. de venta: ${productCode})`;
      }
    }

    const cleanNumber = settings.whatsappNumber.replace(/[^0-9]/g, "");
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(formattedMessage)}`;

    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/70 backdrop-blur-xs transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] md:max-h-[88vh] overflow-y-auto rounded-2xl shadow-2xl border border-neutral-100 flex flex-col md:flex-row transform transition-all duration-300 animate-in fade-in zoom-in-95 my-auto">
        {/* Floating Fixed Close Button for Mobile/Desktop */}
        <button
          onClick={handleClose}
          type="button"
          aria-label="Cerrar modal"
          className="sticky md:absolute top-3 right-3 ml-auto z-50 p-2.5 bg-neutral-900/80 hover:bg-neutral-950 md:bg-white/90 md:hover:bg-white text-white md:text-neutral-800 rounded-full shadow-lg border border-white/20 md:border-neutral-200 transition-all cursor-pointer backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Stage (Interactive Horizontal Gallery) */}
        <div className="w-full md:w-1/2 bg-neutral-50 p-4 sm:p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-neutral-100 select-none">
          {/* Main Selected Image Stage */}
          <div
            className="relative w-full aspect-square max-h-[300px] sm:max-h-[360px] md:max-h-[380px] bg-white rounded-2xl flex items-center justify-center p-4 border border-neutral-200/70 shadow-xs overflow-hidden group"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              key={images[selectedImageIndex] || selectedImageIndex}
              src={images[selectedImageIndex] || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"}
              alt={`${product.name} - Foto ${selectedImageIndex + 1}`}
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full object-contain object-center drop-shadow-md transition-all duration-300 animate-in fade-in zoom-in-98"
              onError={(e) => {
                // Fallback image if broken
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600";
              }}
            />

            {/* Next / Prev Chevrons on Main Image (if multiple images exist) */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  type="button"
                  aria-label="Imagen anterior"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white text-neutral-900 rounded-full shadow-md border border-neutral-200/80 transition-all opacity-80 hover:opacity-100 hover:scale-110 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextImage}
                  type="button"
                  aria-label="Imagen siguiente"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white text-neutral-900 rounded-full shadow-md border border-neutral-200/80 transition-all opacity-80 hover:opacity-100 hover:scale-110 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Badges on Main Image */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none">
              <span
                className={`px-2.5 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wider rounded-full border shadow-xs ${
                  product.category?.toLowerCase() === "ropa"
                    ? "bg-emerald-100/95 text-emerald-950 border-emerald-200"
                    : product.category?.toLowerCase() === "zapatos" || product.category?.toLowerCase() === "calzado"
                    ? "bg-amber-100/95 text-amber-950 border-amber-200"
                    : "bg-indigo-100/95 text-indigo-950 border-indigo-200"
                }`}
              >
                {formatCategoryName(product.category)}
              </span>
            </div>

            {/* Image Counter Indicator */}
            {images.length > 1 && (
              <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-neutral-900/80 backdrop-blur-xs text-white text-[11px] font-mono font-bold rounded-full shadow-md flex items-center gap-1.5">
                <ImageIcon className="w-3 h-3 text-neutral-300" />
                <span>{selectedImageIndex + 1} / {images.length}</span>
              </div>
            )}
          </div>

          {/* Horizontal Scrollable Thumbnails Carousel (visible if multiple images exist) */}
          {images.length > 1 ? (
            <div className="mt-4 pt-3 border-t border-neutral-200/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Galería ({images.length} fotos)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => scrollThumbnails("left")}
                    type="button"
                    title="Desplazar a la izquierda"
                    className="p-1 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-200/60 rounded-md transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => scrollThumbnails("right")}
                    type="button"
                    title="Desplazar a la derecha"
                    className="p-1 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-200/60 rounded-md transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Scrollable container with snap */}
              <div
                ref={thumbnailsScrollRef}
                className="flex gap-2.5 overflow-x-auto pb-2 pt-1 px-1 scroll-smooth snap-x snap-mandatory focus:outline-none"
                style={{ scrollbarWidth: "thin" }}
              >
                {images.map((imgUrl, idx) => {
                  const isActive = selectedImageIndex === idx;
                  return (
                    <button
                      key={`${imgUrl}-${idx}`}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      aria-label={`Ver foto ${idx + 1}`}
                      className={`relative shrink-0 w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-white border-2 transition-all cursor-pointer snap-center ${
                        isActive
                          ? "border-neutral-950 ring-2 ring-neutral-950/20 shadow-md scale-105"
                          : "border-neutral-200/80 hover:border-neutral-400 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Miniatura ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600";
                        }}
                      />
                      <span className={`absolute bottom-0.5 right-0.5 px-1 py-0.2 text-[9px] font-mono font-bold rounded ${
                        isActive ? "bg-neutral-950 text-white" : "bg-neutral-900/60 text-white"
                      }`}>
                        #{idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-3 text-center">
              <span className="text-[11px] text-neutral-400 font-mono">
                Imagen 1 de 1
              </span>
            </div>
          )}
        </div>

        {/* Product Customizer Panel */}
        <div className="w-full md:w-1/2 p-5 sm:p-6 md:p-8 flex flex-col justify-between bg-white">
          <div>
            {/* Title & Heart Button */}
            <div className="flex justify-between items-start gap-4 mb-2">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mb-1.5 text-[11px] font-mono font-bold bg-neutral-100 text-neutral-700 rounded-md border border-neutral-200/80">
                  <Tag className="w-3 h-3 text-neutral-500" />
                  <span>Código de venta:</span>
                  <strong className="text-neutral-950 font-black">{productCode}</strong>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-neutral-950 leading-tight">
                  {product.name}
                </h2>
              </div>
              <button
                onClick={() => setLiked(!liked)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  liked
                    ? "bg-rose-50 text-rose-600 border-rose-200"
                    : "bg-white hover:bg-neutral-50 text-neutral-400 border-neutral-200"
                }`}
              >
                <Heart className={`w-5 h-5 ${liked ? "fill-rose-500" : ""}`} />
              </button>
            </div>

            {/* Price tag */}
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl font-mono font-black text-neutral-950">
                {isMercado ? "" : "$"}{product.price.toFixed(2)}
              </span>
              <span className="text-xs text-neutral-500 font-mono">
                {isMercado ? "Moneda Nacional CUP" : "USD"}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-neutral-600 leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <Ruler className="w-4 h-4 text-neutral-400" />
                  <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    {isMercado ? "Seleccionar Tamaño:" : "Seleccionar Talla:"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[42px] h-[42px] px-3 flex items-center justify-center border text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                        selectedSize === size
                          ? "bg-neutral-950 text-white border-neutral-950 font-black shadow-md shadow-neutral-900/10"
                          : "bg-white text-neutral-700 hover:bg-neutral-50 border-neutral-200"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <span className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  {isMercado ? "Seleccionar:" : "Seleccionar Color:"}
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => {
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 border text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-neutral-950 text-white border-neutral-950 font-black shadow-md shadow-neutral-900/10"
                            : "bg-white text-neutral-700 hover:bg-neutral-50 border-neutral-200"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{color}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action Section */}
          <div className="border-t border-neutral-100 pt-5 mt-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-500">Estado de inventario:</span>
              {isOutOfStock ? (
                <span className="text-rose-600 font-bold">Agotado</span>
              ) : product.stock <= 5 ? (
                <span className="text-rose-600 font-bold">¡Últimas {product.stock} unidades!</span>
              ) : (
                <span className="text-emerald-600 font-bold">Disponible en stock</span>
              )}
            </div>

            <button
              onClick={handleWhatsAppRedirect}
              disabled={isOutOfStock}
              className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-3 text-sm font-bold transition-all shadow-lg cursor-pointer ${
                isOutOfStock
                  ? "bg-neutral-100 text-neutral-400 border border-neutral-200/50 cursor-not-allowed shadow-none"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-600/15"
              }`}
            >
              <MessageSquare className="w-5 h-5 fill-white text-emerald-600" />
              <span>Preguntar por WhatsApp</span>
            </button>

            {/* Mobile friendly explicit Back/Close button */}
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-neutral-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la tienda</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
