import type { World } from "@/lib/types/game";

export const DEFAULT_WORLDS: World[] = [
  {
    id: "world-1",
    name: "Neon Showfloor",
    worldIndex: 1,
    enemies: [
      { id: "w1-e1", name: "Static Gremlin", hp: 80, isBoss: false },
      { id: "w1-e2", name: "Remote Raider", hp: 100, isBoss: false },
      { id: "w1-boss", name: "Display Overlord", hp: 180, isBoss: true },
    ],
  },
  {
    id: "world-2",
    name: "Cable Catacombs",
    worldIndex: 2,
    enemies: [
      { id: "w2-e1", name: "Adapter Ghoul", hp: 110, isBoss: false },
      { id: "w2-e2", name: "Warranty Wisp", hp: 130, isBoss: false },
      { id: "w2-boss", name: "Protection Titan", hp: 220, isBoss: true },
    ],
  },
  {
    id: "world-3",
    name: "Service Keep",
    worldIndex: 3,
    enemies: [
      { id: "w3-e1", name: "Install Phantom", hp: 130, isBoss: false },
      { id: "w3-e2", name: "Membership Shade", hp: 155, isBoss: false },
      { id: "w3-boss", name: "Bundle Behemoth", hp: 250, isBoss: true },
    ],
  },
  {
    id: "world-4",
    name: "Audio Foundry",
    worldIndex: 4,
    enemies: [
      { id: "w4-e1", name: "Soundbar Sentinel", hp: 155, isBoss: false },
      { id: "w4-e2", name: "Subwoofer Specter", hp: 180, isBoss: false },
      { id: "w4-boss", name: "Dolby Dragon", hp: 290, isBoss: true },
    ],
  },
  {
    id: "world-5",
    name: "Boss Vault",
    worldIndex: 5,
    enemies: [
      { id: "w5-e1", name: "Card Crawler", hp: 180, isBoss: false },
      { id: "w5-e2", name: "Quota Warden", hp: 210, isBoss: false },
      { id: "w5-boss", name: "Final Floor Manager", hp: 340, isBoss: true },
    ],
  },
];

export function getWorldByIndex(index: number): World {
  return DEFAULT_WORLDS[Math.max(0, Math.min(DEFAULT_WORLDS.length - 1, index - 1))];
}
