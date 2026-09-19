import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import type { ImageAsset } from "@/lib/wedding/types";

/**
 * Image wrapper used by every template.
 *
 * - Raster images go through next/image: responsive `sizes`, AVIF/WebP, lazy
 *   loading below the fold, and a blur placeholder when the author's upload
 *   provided one.
 * - SVG art (the demo placeholders) bypasses the optimizer and renders as a
 *   plain element, so we never have to enable `dangerouslyAllowSVG`.
 * - A missing image returns null rather than a broken frame; callers decide what
 *   to show instead.
 */

export interface SmartImageProps {
  image: ImageAsset | null;
  className?: string;
  /** Responsive sizes hint. Defaults to full-width mobile, capped on desktop. */
  sizes?: string;
  priority?: boolean;
  /** Fill the positioned parent (default) or lay out intrinsically. */
  fill?: boolean;
  quality?: number;
  /** Extra alt context when the asset has a generic alt. */
  altFallback?: string;
}

function isVector(url: string) {
  return url.endsWith(".svg") || url.startsWith("data:image/svg");
}

export function SmartImage({
  image,
  className,
  sizes = "(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1100px",
  priority = false,
  fill = true,
  quality = 82,
  altFallback,
}: SmartImageProps) {
  if (!image) return null;

  const alt = image.alt || altFallback || "";

  if (isVector(image.url)) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={image.url}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        className={cn(fill ? "absolute inset-0 h-full w-full object-cover" : "w-full", className)}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={image.url}
        alt={alt}
        fill
        sizes={sizes}
        quality={quality}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        placeholder={image.blurDataURL ? "blur" : "empty"}
        blurDataURL={image.blurDataURL ?? undefined}
        className={cn("object-cover", className)}
      />
    );
  }

  return (
    <Image
      src={image.url}
      alt={alt}
      width={image.width ?? 1200}
      height={image.height ?? 1600}
      sizes={sizes}
      quality={quality}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      placeholder={image.blurDataURL ? "blur" : "empty"}
      blurDataURL={image.blurDataURL ?? undefined}
      className={cn("h-auto w-full", className)}
    />
  );
}
