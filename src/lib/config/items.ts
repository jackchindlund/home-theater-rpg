import type { Item } from "@/lib/types/game";

/**
 * Single source of truth for shop prices, names, and item stats.
 * Changes ship with the app (redeploy). Firestore `items` is not read by this codebase.
 */
export const ITEM_CATALOG: Item[] = [
  { id: "weapon-training-sword", name: "Training Sword", category: "weapon", attackBonus: 2, cost: 60 },
  { id: "weapon-bronze-blade", name: "Bronze Blade", category: "weapon", attackBonus: 5, cost: 140 },
  { id: "weapon-neon-katana", name: "Neon Katana", category: "weapon", attackBonus: 9, cost: 320 },
  { id: "weapon-pixel-slayer", name: "Pixel Slayer", category: "weapon", attackBonus: 14, cost: 580 },
  { id: "armor-cloth-vest", name: "Cloth Vest", category: "armor", defenseBonus: 2, cost: 70 },
  { id: "armor-chain-vest", name: "Chain Vest", category: "armor", defenseBonus: 5, cost: 160 },
  { id: "armor-arcade-armor", name: "Arcade Armor", category: "armor", defenseBonus: 9, cost: 350 },
  { id: "armor-bossbreaker-plate", name: "Bossbreaker Plate", category: "armor", defenseBonus: 14, cost: 620 },
  { id: "potion-attack", name: "Attack Potion", category: "potion", cost: 90 },
  { id: "potion-gold", name: "Gold Potion", category: "potion", cost: 90, goldMultiplier: 1.25 },
  { id: "potion-xp", name: "XP Potion", category: "potion", cost: 90, xpMultiplier: 1.25 },
  { id: "cosmetic-neon-frame", name: "Neon Frame", category: "cosmetic", cost: 120 },
  { id: "cosmetic-victory-badge", name: "Victory Badge", category: "cosmetic", cost: 150 },
];

export function getItemById(itemId: string): Item | null {
  return ITEM_CATALOG.find((item) => item.id === itemId) ?? null;
}
