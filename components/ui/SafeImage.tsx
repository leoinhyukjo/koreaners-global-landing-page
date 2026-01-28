"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

type SafeImageProps = Omit<ImageProps, "onError" | "src"> & {
  src: ImageProps["src"];
  fallbackSrc?: ImageProps["src"];
};

/**
 * Client-only wrapper for next/image that safely swaps to a fallback image
 * when the original image fails to load. The onError handler must live here
 * to avoid passing event handlers from server components.
 */
export function SafeImage({
  src,
  fallbackSrc = "/placeholder.jpg",
  ...props
}: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState<ImageProps["src"]>(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setFailed(false);
  }, [src]);

  return (
    <Image
      {...props}
      src={currentSrc}
      onError={() => {
        if (failed) return;
        setFailed(true);
        setCurrentSrc(fallbackSrc);
      }}
    />
  );
}

