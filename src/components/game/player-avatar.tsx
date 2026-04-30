"use client";

import { useMemo } from "react";
import {
  avatarBodySrc,
  avatarHairSrc,
  layerArmorSrc,
  layerCosmeticSrc,
  layerWeaponSrc,
} from "@/lib/config/sprites";
import type { Player } from "@/lib/types/game";
import { PixelSprite } from "@/components/game/pixel-sprite";

export type PlayerAvatarProps = {
  player: Player;
  /** Edge length in CSS pixels. */
  size?: number;
  className?: string;
};

/**
 * Paper-doll stack (bottom → top): body, armor, weapon, hair, cosmetic frame.
 * Missing PNGs hide via onError so partial uploads still look okay.
 */
export function PlayerAvatar({ player, size = 48, className = "" }: PlayerAvatarProps) {
  const layers = useMemo(() => {
    const stack: { src: string; alt: string }[] = [];
    stack.push({ src: avatarBodySrc(player.appearanceBodyId), alt: "Body" });
    if (player.equippedArmor) {
      stack.push({ src: layerArmorSrc(player.equippedArmor), alt: "Armor" });
    }
    if (player.equippedWeapon) {
      stack.push({ src: layerWeaponSrc(player.equippedWeapon), alt: "Weapon" });
    }
    stack.push({ src: avatarHairSrc(player.appearanceHairId), alt: "Hair" });
    if (player.equippedCosmetic) {
      stack.push({ src: layerCosmeticSrc(player.equippedCosmetic), alt: "Cosmetic" });
    }
    return stack;
  }, [
    player.appearanceBodyId,
    player.appearanceHairId,
    player.equippedArmor,
    player.equippedCosmetic,
    player.equippedWeapon,
  ]);

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-sm bg-[#0c1327] ${className}`}
      style={{ width: size, height: size }}
    >
      {layers.map((layer) => (
        <PixelSprite
          key={layer.src}
          src={layer.src}
          alt={layer.alt}
          size={size}
          className="pointer-events-none absolute left-0 top-0 h-full w-full"
          onError={(event) => {
            event.currentTarget.style.visibility = "hidden";
          }}
        />
      ))}
    </div>
  );
}
