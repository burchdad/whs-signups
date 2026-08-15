"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

type HeroImage = { src: string; alt: string };

export function HeroCarousel({ images }: { images: HeroImage[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || images.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % images.length), 5500);
    return () => window.clearInterval(timer);
  }, [images.length, paused]);

  if (images.length === 0) return null;
  const show = (index: number) => setActive((index + images.length) % images.length);

  return (
    <div className="absolute inset-0 -z-20" role="region" aria-roledescription="carousel" aria-label="Whitehouse teams and groups">
      {images.map((image, index) => (
        <Image
          key={`${image.src}-${index}`}
          src={image.src}
          alt={index === active ? image.alt : ""}
          fill
          priority={index === 0}
          loading={index === 0 ? "eager" : "lazy"}
          sizes="100vw"
          className={`object-cover object-center transition-opacity duration-1000 motion-reduce:transition-none ${index === active ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      {images.length > 1 ? (
        <div className="absolute bottom-5 right-5 z-10 flex items-center gap-2">
          <button type="button" onClick={() => show(active - 1)} aria-label="Previous team photo" className="grid h-11 w-11 place-items-center rounded-full border border-white/45 bg-black/55 text-white backdrop-blur-sm hover:bg-white hover:text-black"><ChevronLeft aria-hidden /></button>
          <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Play team photo carousel" : "Pause team photo carousel"} aria-pressed={paused} className="grid h-11 w-11 place-items-center rounded-full border border-white/45 bg-black/55 text-white backdrop-blur-sm hover:bg-white hover:text-black">{paused ? <Play size={18} aria-hidden /> : <Pause size={18} aria-hidden />}</button>
          <button type="button" onClick={() => show(active + 1)} aria-label="Next team photo" className="grid h-11 w-11 place-items-center rounded-full border border-white/45 bg-black/55 text-white backdrop-blur-sm hover:bg-white hover:text-black"><ChevronRight aria-hidden /></button>
        </div>
      ) : null}
    </div>
  );
}
