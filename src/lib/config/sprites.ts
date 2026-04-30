/** Canonical pixel size for paper-doll assets (PNG). */
export const SPRITE_SIZE_PX = 48;

export function itemIconSrc(itemId: string): string {
  return `/sprites/items/${itemId}.png`;
}

export function avatarBodySrc(bodyId: string): string {
  return `/sprites/avatar/bodies/${bodyId}.png`;
}

export function avatarHairSrc(hairId: string): string {
  return `/sprites/avatar/hair/${hairId}.png`;
}

export function layerWeaponSrc(itemId: string): string {
  return `/sprites/layers/weapons/${itemId}.png`;
}

export function layerArmorSrc(itemId: string): string {
  return `/sprites/layers/armor/${itemId}.png`;
}

export function layerCosmeticSrc(itemId: string): string {
  return `/sprites/layers/cosmetics/${itemId}.png`;
}
