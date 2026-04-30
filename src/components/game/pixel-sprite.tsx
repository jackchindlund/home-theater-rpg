"use client";

import type { ImgHTMLAttributes } from "react";

type PixelSpriteProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "width" | "height"> & {
  /** Edge length in CSS pixels (sprite art is square). */
  size?: number;
};

/** Square PNG/WebP with crisp nearest-neighbor scaling. */
export function PixelSprite({ size = 48, className = "", alt, style, ...rest }: PixelSpriteProps) {
  return (
    <img
      alt={alt ?? ""}
      width={size}
      height={size}
      className={`inline-block max-h-none max-w-none select-none object-contain ${className}`}
      style={{
        imageRendering: "pixelated",
        ...style,
      }}
      draggable={false}
      {...rest}
    />
  );
}
