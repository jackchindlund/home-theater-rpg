"use client";

import { itemIconSrc } from "@/lib/config/sprites";
import { PixelSprite } from "@/components/game/pixel-sprite";

type ItemIconProps = {
  itemId: string;
  size?: number;
  title?: string;
};

export function ItemIcon({ itemId, size = 32, title }: ItemIconProps) {
  return (
    <PixelSprite
      src={itemIconSrc(itemId)}
      size={size}
      alt={title ?? itemId}
      title={title}
      onError={(event) => {
        event.currentTarget.style.visibility = "hidden";
      }}
    />
  );
}
