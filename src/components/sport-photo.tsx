"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type SportImage = { src: string; alt: string; label?: string };

export function SportPhoto({ images, compact = false, eager = false }: { images: SportImage[]; compact?: boolean; eager?: boolean }) {
  const [active, setActive] = useState(0);
  const hasCarousel = images.length > 1;

  useEffect(() => {
    if (!hasCarousel) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % images.length), 5000);
    return () => window.clearInterval(timer);
  }, [hasCarousel, images.length]);

  const show = (index: number) => setActive((index + images.length) % images.length);

  return (
    <div className={`group/photo relative overflow-hidden bg-[var(--maroon-dark)] ${compact ? "aspect-[16/10]" : "aspect-[16/7] min-h-64"}`} aria-roledescription={hasCarousel ? "carousel" : undefined} aria-label={hasCarousel ? "Wrestling team photos" : undefined} aria-live="off">
      {images.map((image, index) => (
        <Image
          key={image.src}
          src={image.src}
          alt={image.alt}
          fill
          priority={eager && index === 0}
          loading={eager && index === 0 ? "eager" : "lazy"}
          sizes={compact ? "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" : "(min-width: 1152px) 1120px, 100vw"}
          className={`${hasCarousel ? "object-contain" : "object-cover"} transition-opacity duration-500 ${index === active ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
      {hasCarousel && (
        <>
          <button type="button" onClick={() => show(active - 1)} aria-label="Previous wrestling team photo" className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/65 text-white transition hover:bg-[var(--gold)] hover:text-black"><ChevronLeft aria-hidden /></button>
          <button type="button" onClick={() => show(active + 1)} aria-label="Next wrestling team photo" className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/65 text-white transition hover:bg-[var(--gold)] hover:text-black"><ChevronRight aria-hidden /></button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2" aria-label="Choose wrestling team photo">
            {images.map((image, index) => <button key={image.src} type="button" onClick={() => show(index)} aria-label={`Show ${image.label ?? `photo ${index + 1}`}`} aria-current={index === active ? "true" : undefined} className={`min-h-8 rounded-full px-3 text-xs font-black uppercase tracking-wide ${index === active ? "bg-[var(--gold)] text-black" : "bg-black/65 text-white"}`}>{image.label ?? index + 1}</button>)}
          </div>
        </>
      )}
    </div>
  );
}
