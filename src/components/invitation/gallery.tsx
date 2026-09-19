"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils/cn";
import type { GalleryStyle, ImageAsset } from "@/lib/wedding/types";
import { SmartImage } from "@/components/media/smart-image";
import { useMotionSettings } from "@/components/motion/motion-settings";
import { ClipReveal, Parallax } from "@/components/motion/primitives";

/**
 * Gallery layouts.
 *
 * Four genuinely different presentations rather than one grid with different
 * paddings. Each template names its own default; when the author picks a style
 * explicitly, that wins. All of them open the same shared lightbox.
 */

interface GalleryProps {
  images: ImageAsset[];
  /** The template's own default presentation. */
  fallback: Exclude<GalleryStyle, "auto">;
  /** The author's choice; `auto` defers to the template. */
  preference: GalleryStyle;
  className?: string;
}

export function Gallery({ images, fallback, preference, className }: GalleryProps) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const style = preference === "auto" ? fallback : preference;

  if (images.length === 0) return null;

  const open = (index: number) => setOpenAt(index);

  return (
    <div className={className}>
      {style === "filmstrip" && <Filmstrip images={images} onOpen={open} />}
      {style === "stack" && <Stack images={images} onOpen={open} />}
      {style === "marquee" && <Marquee images={images} onOpen={open} />}
      {style === "mosaic" && <Mosaic images={images} onOpen={open} />}

      <Lightbox
        images={images}
        index={openAt}
        onClose={() => setOpenAt(null)}
        onIndexChange={setOpenAt}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layouts                                                             */
/* ------------------------------------------------------------------ */

function OpenButton({
  image,
  index,
  onOpen,
  className,
  imageClassName,
  sizes,
  priority,
}: {
  image: ImageAsset;
  index: number;
  onOpen: (index: number) => void;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      aria-label={`Open photograph${image.caption ? `: ${image.caption}` : ""} in full screen`}
      className={cn(
        "group relative block overflow-hidden bg-[var(--t-bg-alt)]",
        "focus-visible:outline-2 focus-visible:outline-offset-4",
        className,
      )}
    >
      <SmartImage
        image={image}
        sizes={sizes}
        priority={priority}
        className={cn(
          "transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]",
          imageClassName,
        )}
      />
      {image.caption && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3 text-left text-fluid-xs tracking-label-tight text-white/90">
          {image.caption}
        </span>
      )}
    </button>
  );
}

/** Touch-first horizontal rail with snapping and a peek of the next frame. */
function Filmstrip({
  images,
  onOpen,
}: {
  images: ImageAsset[];
  onOpen: (index: number) => void;
}) {
  return (
    <div className="snap-rail -mx-[max(1.25rem,5vw)] gap-3 px-[max(1.25rem,5vw)] pb-2 sm:gap-5">
      {images.map((image, index) => (
        <div
          key={image.id}
          className="w-[76vw] shrink-0 snap-center sm:w-[42vw] lg:w-[30vw]"
        >
          <OpenButton
            image={image}
            index={index}
            onOpen={onOpen}
            className="aspect-[3/4] w-full"
            sizes="(max-width: 640px) 76vw, (max-width: 1024px) 42vw, 30vw"
            priority={index === 0}
          />
        </div>
      ))}
    </div>
  );
}

/** Offset vertical stack with parallax — reads like a scrapbook spread. */
function Stack({
  images,
  onOpen,
}: {
  images: ImageAsset[];
  onOpen: (index: number) => void;
}) {
  return (
    <div className="space-y-10 sm:space-y-16">
      {images.map((image, index) => {
        const offset = index % 3;
        return (
          <ClipReveal
            key={image.id}
            from={index % 2 === 0 ? "bottom" : "right"}
            className={cn(
              "w-[86%]",
              offset === 0 && "mr-auto",
              offset === 1 && "ml-auto",
              offset === 2 && "mx-auto w-[74%]",
            )}
          >
            <Parallax strength={index % 2 === 0 ? 26 : -18}>
              <OpenButton
                image={image}
                index={index}
                onOpen={onOpen}
                className={cn(
                  "w-full",
                  index % 3 === 1 ? "aspect-[4/5]" : "aspect-[3/4]",
                )}
                sizes="(max-width: 640px) 86vw, 46vw"
              />
            </Parallax>
          </ClipReveal>
        );
      })}
    </div>
  );
}

/** Two counter-scrolling rows. Pauses on hover and when reduced motion is on. */
function Marquee({
  images,
  onOpen,
}: {
  images: ImageAsset[];
  onOpen: (index: number) => void;
}) {
  const settings = useMotionSettings();

  if (!settings.ambient) {
    return <Filmstrip images={images} onOpen={onOpen} />;
  }

  const rows = [images, [...images].reverse()];

  return (
    <div className="space-y-4 overflow-hidden">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="group flex overflow-hidden">
          <motion.div
            className="flex shrink-0 gap-4"
            animate={{ x: rowIndex === 0 ? ["0%", "-50%"] : ["-50%", "0%"] }}
            transition={{
              duration: 42 + rowIndex * 8,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {[...row, ...row].map((image, index) => (
              <div key={`${image.id}-${index}`} className="w-[56vw] shrink-0 sm:w-[28vw]">
                <OpenButton
                  image={image}
                  index={images.findIndex((entry) => entry.id === image.id)}
                  onOpen={onOpen}
                  className="aspect-[4/5] w-full"
                  sizes="(max-width: 640px) 56vw, 28vw"
                />
              </div>
            ))}
          </motion.div>
        </div>
      ))}
    </div>
  );
}

/** Asymmetric editorial grid: one tall lead frame, then a deliberate rhythm. */
function Mosaic({
  images,
  onOpen,
}: {
  images: ImageAsset[];
  onOpen: (index: number) => void;
}) {
  const spans = [
    "col-span-2 row-span-2 aspect-[4/5]",
    "col-span-1 aspect-square",
    "col-span-1 aspect-square",
    "col-span-1 row-span-2 aspect-[3/5]",
    "col-span-1 aspect-square",
    "col-span-1 aspect-square",
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      {images.map((image, index) => (
        <ClipReveal
          key={image.id}
          delay={(index % 3) * 0.08}
          className={cn(spans[index % spans.length])}
        >
          <OpenButton
            image={image}
            index={index}
            onOpen={onOpen}
            className="h-full w-full"
            sizes="(max-width: 640px) 50vw, 33vw"
            priority={index === 0}
          />
        </ClipReveal>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lightbox                                                            */
/* ------------------------------------------------------------------ */

function Lightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: {
  images: ImageAsset[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const settings = useMotionSettings();
  const closeRef = useRef<HTMLButtonElement>(null);
  const isOpen = index !== null;

  const step = useCallback(
    (direction: 1 | -1) => {
      if (index === null) return;
      const next = (index + direction + images.length) % images.length;
      onIndexChange(next);
    },
    [index, images.length, onIndexChange],
  );

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose, step]);

  const current = index === null ? null : images[index];

  return (
    <AnimatePresence>
      {isOpen && current && (
        <motion.div
          className="fixed inset-0 z-[80] flex flex-col bg-black/94 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: settings.enabled ? 0.35 : 0.001 }}
          role="dialog"
          aria-modal="true"
          aria-label="Photograph viewer"
        >
          <div className="flex items-center justify-between px-4 py-4 text-white/70">
            <span className="text-fluid-xs tracking-label">
              {(index ?? 0) + 1} / {images.length}
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close viewer"
              className="tap-target grid place-items-center rounded-full border border-white/25 px-4 text-fluid-xs tracking-label hover:bg-white/10"
            >
              Close
            </button>
          </div>

          <motion.div
            key={current.id}
            className="relative flex-1 touch-pan-y"
            drag={images.length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70) step(1);
              if (info.offset.x > 70) step(-1);
            }}
            initial={{ opacity: 0, scale: settings.enabled ? 0.98 : 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: settings.enabled ? 0.45 : 0.001 }}
          >
            <SmartImage
              image={current}
              priority
              sizes="100vw"
              className="object-contain"
            />
          </motion.div>

          <div className="flex items-center justify-between gap-4 px-4 py-5 safe-bottom">
            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous photograph"
                  className="tap-target rounded-full border border-white/25 px-5 text-fluid-xs tracking-label text-white/80 hover:bg-white/10"
                >
                  Prev
                </button>
                <p className="min-w-0 flex-1 truncate text-center text-fluid-xs text-white/60">
                  {current.caption ?? current.alt}
                </p>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next photograph"
                  className="tap-target rounded-full border border-white/25 px-5 text-fluid-xs tracking-label text-white/80 hover:bg-white/10"
                >
                  Next
                </button>
              </>
            ) : (
              <p className="flex-1 text-center text-fluid-xs text-white/60">
                {current.caption ?? current.alt}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
