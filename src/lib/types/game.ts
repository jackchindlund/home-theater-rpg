export type ItemCategory = "weapon" | "armor" | "potion" | "cosmetic";

export type Item = {
  id: string;
  name: string;
  category: ItemCategory;
  attackBonus?: number;
  defenseBonus?: number;
  xpMultiplier?: number;
  goldMultiplier?: number;
  cost: number;
};

export type Enemy = {
  id: string;
  name: string;
  hp: number;
  isBoss: boolean;
};

export type World = {
  id: string;
  name: string;
  worldIndex: number;
  enemies: Enemy[];
};

export type QuestCadence = "daily" | "weekly";

export type Quest = {
  id: string;
  title: string;
  cadence: QuestCadence;
  description: string;
  target: number;
  rewardXp: number;
  rewardGold: number;
};

export type QuestProgress = {
  id: string;
  playerId: string;
  questId: string;
  cadence: QuestCadence;
  progress: number;
  target: number;
  completed: boolean;
  lastUpdatedAt: string;
};

export type Player = {
  id: string;
  employeeNumber: string;
  displayName: string;
  level: number;
  xp: number;
  gold: number;
  equippedWeapon: string | null;
  equippedArmor: string | null;
  equippedCosmetic: string | null;
  activePotion: string | null;
  activePotionExpiresAt: string | null;
  currentWorld: number;
  currentEnemyIndex: number;
  currentEnemyHp: number;
  bossesCleared: number;
  totalSales: number;
  createdAt: string;
  updatedAt: string;
};

export type SaleInput = {
  tvPrice: number;
  basketAmount: number;
  audio: boolean;
  services: boolean;
  protection: boolean;
  membership: boolean;
  card: boolean;
};

export type Sale = SaleInput & {
  id: string;
  playerId: string;
  xpEarned: number;
  goldEarned: number;
  damageDealt: number;
  createdAt: string;
};

export type SaleResult = {
  saleId: string;
  xpEarned: number;
  goldEarned: number;
  damageDealt: number;
  enemyDefeated: boolean;
  advancedWorld: boolean;
  nextEnemyHp: number;
  nextEnemyIndex: number;
  nextWorld: number;
  nextLevel: number;
  totalXp: number;
  totalGold: number;
  completedQuestIds: string[];
};

export type InventoryEntry = {
  itemId: string;
  quantity: number;
  obtainedAt: string;
  updatedAt: string;
};
